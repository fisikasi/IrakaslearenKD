import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
  getStudents,
  getStudentEvaluationData
} from '../services/classes';

import { getGradingStructure } from '../services/grading';
import type { Competency, Criterion, Student,StudentIndicatorGrade, AssessmentToolIndicator } from '../types/database';
import { getTeacherSettings, literalToNumeric } from '../services/settings';
import type { LiteralGradeValues } from '../types/database';

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function gradeClass(value: number | null | undefined) {
  if (value === null || value === undefined) return 'grade-empty';
  if (value < 5) return 'grade-red';
  if (value < 6) return 'grade-yellow';
  if (value < 7) return 'grade-purple';
  if (value < 9) return 'grade-blue';
  return 'grade-green';
}

function formatGrade(value: number | null | undefined) {
  return value === null || value === undefined ? '-' : value.toFixed(2);
}

export function StudentPage({ classId, studentId, onBack }: { classId: string; studentId: string; onBack: () => void }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [indicators, setIndicators] = useState<AssessmentToolIndicator[]>([]);
  const [indicatorGrades, setIndicatorGrades] = useState<StudentIndicatorGrade[]>([]);
  const [openCriteria, setOpenCriteria] = useState<Record<string, boolean>>({});
  const [openCompetencies, setOpenCompetencies] = useState<Record<string, boolean>>({});
  const [showFinalDetail, setShowFinalDetail] = useState(false);
  const [literalValues, setLiteralValues] = useState<Partial<LiteralGradeValues>>({});

  useEffect(() => {
    async function load() {
      const [students, structure, evaluationData, settings] = await Promise.all([
        getStudents(classId),
        getGradingStructure(classId),
        getStudentEvaluationData(classId, studentId),
        getTeacherSettings(),
      ]);

      setStudent(students.find((item) => item.id === studentId) ?? null);
      setCompetencies(structure.competencies);
      setCriteria(structure.criteria);
      setIndicators(evaluationData.indicators);
      setIndicatorGrades(evaluationData.grades);
      setLiteralValues(settings.literal_grade_values);
    }

    load();
  }, [classId, studentId]);

  const calculations = useMemo(() => {
    const criterionGrades = new Map<string, number | null>();
    const visibleCriteria = criteria.filter((criterion) => !criterion.hidden);
    const visibleCompetencies = competencies.filter((competency) => !competency.hidden);

    visibleCriteria.forEach((criterion) => {
      const relatedIndicators = indicators.filter(
        (indicator) =>
          indicator.criterion_id === criterion.id &&
          indicator.is_graded
      );

      const weightedValues = relatedIndicators
        .map((indicator) => {
          const grade = indicatorGrades.find(
            (item) => item.assessment_tool_indicator_id === indicator.id
          );

          if (!grade) return null;

            const value =
              grade.numeric_value !== null
                ? Number(grade.numeric_value)
                : literalToNumeric(grade.literal_value, literalValues as Record<string, number>);

            if (value === null) return null;

            return {
              value,
              weight: Number(indicator.weight || 0),
            };
        })
        .filter(Boolean) as Array<{ value: number; weight: number }>;

      const totalWeight = weightedValues.reduce((sum, item) => sum + item.weight, 0);

      criterionGrades.set(
        criterion.id,
        totalWeight
          ? weightedValues.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight
          : null
      );
    });

    const competencyGrades = new Map<string, number | null>();

    visibleCompetencies.forEach((competency) => {
      const ownCriteria = criteria.filter(
        (criterion) =>
          criterion.competency_id === competency.id &&
          !criterion.hidden
      );

      const weighted = ownCriteria
        .map((criterion) => {
          const value = criterionGrades.get(criterion.id);
          return value === null || value === undefined
            ? null
            : { value, weight: Number(criterion.weight || 0) };
        })
        .filter(Boolean) as Array<{ value: number; weight: number }>;

      const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);

      competencyGrades.set(
        competency.id,
        totalWeight
          ? weighted.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight
          : null
      );
    });

    const weightedCompetencies = visibleCompetencies
      .map((competency) => {
        const value = competencyGrades.get(competency.id);
        return value === null || value === undefined
          ? null
          : { value, weight: Number(competency.weight || 0) };
      })
      .filter(Boolean) as Array<{ value: number; weight: number }>;

    const totalWeight = weightedCompetencies.reduce((sum, item) => sum + item.weight, 0);

    const finalGrade = totalWeight
      ? weightedCompetencies.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight
      : null;

    return { criterionGrades, competencyGrades, finalGrade };
  }, [competencies, criteria, indicators, indicatorGrades, literalValues]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="secondary" onClick={onBack}>
          <ArrowLeft size={18} />
          Klaseara itzuli
        </button>

        <div>
          <h1>{student?.surname}, {student?.name}</h1>
          <p>Ikaslearen fitxa</p>
        </div>

        <button
          type="button"
          className={`final-grade final-grade-big ${gradeClass(calculations.finalGrade)}`}
          onClick={() => setShowFinalDetail((value) => !value)}
        >
          <span>Nota osoa</span>
          <strong>{formatGrade(calculations.finalGrade)}</strong>
        </button>
      </header>

      {showFinalDetail && (
        <section className="panel">
          <h3>Nota osoaren kalkulua</h3>

          {competencies
            .filter((competency) => !competency.hidden)
            .map((competency) => (
            <p key={competency.id}>
              <strong>{competency.code}</strong> · Pisua: {competency.weight}% · Nota:{' '}
              {formatGrade(calculations.competencyGrades.get(competency.id))}
            </p>
          ))}
        </section>
      )}

      <section className="student-competency-grid">
        {competencies
          .filter((competency) => !competency.hidden)
          .map((competency) => {
          const ownCriteria = criteria.filter(
            (criterion) =>
              criterion.competency_id === competency.id &&
              !criterion.hidden
          );
          return (
            <article className="competency-card" key={competency.id}>
              <header>
                <h2>{competency.code}</h2>

                <button
                  type="button"
                  className={`grade-pill competency-grade ${gradeClass(calculations.competencyGrades.get(competency.id))}`}
                  onClick={() =>
                    setOpenCompetencies((current) => ({
                      ...current,
                      [competency.id]: !current[competency.id],
                    }))
                  }
                >
                  {formatGrade(calculations.competencyGrades.get(competency.id))}
                </button>
              </header>

              {competency.title && <p>{competency.title}</p>}

              {openCompetencies[competency.id] && (
                <div className="detail-box">
                  {ownCriteria.map((criterion) => (
                    <p key={criterion.id}>
                      <strong>{criterion.code}</strong> · Pisua: {criterion.weight}% · Nota:{' '}
                      {formatGrade(calculations.criterionGrades.get(criterion.id))}
                    </p>
                  ))}
                </div>
              )}

              <table>
                <thead>
                  <tr>
                    <th>Irizpidea</th>
                    <th>Nota</th>
                  </tr>
                </thead>

                <tbody>
                  {ownCriteria.map((criterion) => (
                    <>
                      <tr key={criterion.id}>
                        <td>
                          <strong>{criterion.code}</strong> {criterion.title}
                        </td>

                        <td>
                          <button
                            type="button"
                            className={`grade-pill ${gradeClass(calculations.criterionGrades.get(criterion.id))}`}
                            onClick={() =>
                              setOpenCriteria((current) => ({
                                ...current,
                                [criterion.id]: !current[criterion.id],
                              }))
                            }
                          >
                            {formatGrade(calculations.criterionGrades.get(criterion.id))}
                          </button>
                        </td>
                      </tr>

                      {openCriteria[criterion.id] && (
                        <tr>
                          <td colSpan={2}>
                            <div className="detail-box">
                              {indicators
                                .filter((indicator) => indicator.criterion_id === criterion.id)
                                .sort((a, b) => {
                                  const textA = a.indicator_bank?.text ?? '';
                                  const textB = b.indicator_bank?.text ?? '';
                                  return textA.localeCompare(textB, 'eu', { numeric: true });
                                })
                                .map((indicator) => {
                                  const grade = indicatorGrades.find(
                                    (item) => item.assessment_tool_indicator_id === indicator.id
                                  );

                                  return (
                                    <div key={indicator.id} className="indicator-grade-card">
                                      <div>
                                        <strong>{indicator.indicator_bank?.text}</strong>

                                        <p>
                                          {indicator.assessment_tools?.name} · Pisua: {indicator.weight}
                                          {!indicator.is_graded ? ' · Ez kalifikatu' : ''}
                                        </p>
                                      </div>

                                      {(() => {
                                        const numericEquivalent =
                                          grade?.numeric_value !== null && grade?.numeric_value !== undefined
                                            ? Number(grade.numeric_value)
                                            : literalToNumeric(
                                                grade?.literal_value ?? null,
                                                literalValues as Record<string, number>
                                              );

                                        return (
                                          <span className={`grade-pill ${gradeClass(numericEquivalent)}`}>
                                            {grade?.numeric_value ?? grade?.literal_value ?? '-'}
                                            {grade?.literal_value && numericEquivalent !== null && (
                                              <small className="literal-equivalence">
                                                {numericEquivalent.toFixed(2)}
                                              </small>
                                            )}
                                          </span>
                                        );
                                      })()}
                                    </div>
                                  );
                                })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </article>
          );
        })}
      </section>
    </main>
  );
}
