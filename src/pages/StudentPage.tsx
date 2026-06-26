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

import {
  calculateStudentGrades,
  gradeClass,
  formatGrade,
} from '../services/gradeCalculator';



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
    return calculateStudentGrades(
      competencies,
      criteria,
      indicators,
      indicatorGrades,
      literalValues
    );
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
                                            {grade?.numeric_value !== null && grade?.numeric_value !== undefined ? (
                                              grade.numeric_value
                                            ) : (
                                              <>
                                                <span className="literal-name">
                                                  {grade?.literal_value?.replace(/\s+[↑↓]+$/, '')}
                                                </span>

                                                <span className="literal-arrows">
                                                  {grade?.literal_value
                                                    ?.replace('Oso Ondo', '')
                                                    ?.replace('Bikain', '')
                                                    ?.replace('Nahiko', '')
                                                    ?.replace('Gutxi', '')
                                                    ?.replace('Ondo', '')
                                                    .trim()}
                                                </span>

                                                <small className="literal-equivalence">
                                                  {numericEquivalent?.toFixed(2)}
                                                </small>
                                              </>
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
