import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
  getClassById,
  getStudents,
  getStudentEvaluationData,
} from '../services/classes';
import { getGradingStructure } from '../services/grading';
import { getTeacherSettings } from '../services/settings';
import {
  calculateStudentGrades,
  formatGrade,
  gradeClass,
} from '../services/gradeCalculator';
import type {
  ClassRow,
  Competency,
  Criterion,
  Student,
  AssessmentToolIndicator,
  StudentIndicatorGrade,
  LiteralGradeValues,
} from '../types/database';

type StudentSummary = {
  student: Student;
  competencyGrades: Map<string, number | null>;
  finalGrade: number | null;
};

export function ClassCompetenciesPage({
  classId,
  onBack,
}: {
  classId: string;
  onBack: () => void;
}) {
  const [classInfo, setClassInfo] = useState<ClassRow | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [studentData, setStudentData] = useState<
    Record<string, {
      indicators: AssessmentToolIndicator[];
      grades: StudentIndicatorGrade[];
    }>
  >({});
  const [literalValues, setLiteralValues] = useState<Partial<LiteralGradeValues>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const [info, loadedStudents, structure, settings] = await Promise.all([
        getClassById(classId),
        getStudents(classId),
        getGradingStructure(classId),
        getTeacherSettings(),
      ]);

      const entries = await Promise.all(
        loadedStudents.map(async (student) => {
          const evaluationData = await getStudentEvaluationData(classId, student.id);
          return [
            student.id,
            {
              indicators: evaluationData.indicators,
              grades: evaluationData.grades,
            },
          ] as const;
        })
      );

      setClassInfo(info);
      setStudents(loadedStudents);
      setCompetencies(structure.competencies);
      setCriteria(structure.criteria);
      setLiteralValues(settings.literal_grade_values);
      setStudentData(Object.fromEntries(entries));
      setLoading(false);
    }

    load();
  }, [classId]);

  const visibleCompetencies = useMemo(
    () => competencies.filter((competency) => !competency.hidden),
    [competencies]
  );

  const summaries = useMemo<StudentSummary[]>(() => {
    return students.map((student) => {
      const data = studentData[student.id] ?? {
        indicators: [],
        grades: [],
      };

      const calculations = calculateStudentGrades(
        competencies,
        criteria,
        data.indicators,
        data.grades,
        literalValues
      );

      return {
        student,
        competencyGrades: calculations.competencyGrades,
        finalGrade: calculations.finalGrade,
      };
    });
  }, [students, studentData, competencies, criteria, literalValues]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="secondary" onClick={onBack}>
          <ArrowLeft size={18} /> Klaseara itzuli
        </button>

        <div>
          <h1>Konpetentzien laburpena</h1>
          <p>
            {classInfo?.name} · {classInfo?.subject} {classInfo?.level}
          </p>
        </div>
      </header>

      <section className="panel">
        {loading ? (
          <p>Kargatzen...</p>
        ) : (
          <div className="class-table-wrapper">
            <table className="class-table competency-summary-table">
              <thead>
                <tr>
                  <th className="student-header">Ikaslea</th>

                  {visibleCompetencies.map((competency) => (
                    <th key={competency.id}>{competency.code}</th>
                  ))}

                  <th>Azken nota</th>
                </tr>
              </thead>

              <tbody>
                {summaries.map((summary) => (
                  <tr key={summary.student.id}>
                    <td>
                      <strong>{summary.student.surname}</strong>
                      {summary.student.surname && summary.student.name ? ', ' : ''}
                      {summary.student.name}
                    </td>

                    {visibleCompetencies.map((competency) => {
                      const value = summary.competencyGrades.get(competency.id);

                      return (
                        <td key={competency.id}>
                          <span className={`grade-pill ${gradeClass(value)}`}>
                            {formatGrade(value)}
                          </span>
                        </td>
                      );
                    })}

                    <td>
                      <span className={`grade-pill final-grade-cell ${gradeClass(summary.finalGrade)}`}>
                        {formatGrade(summary.finalGrade)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}