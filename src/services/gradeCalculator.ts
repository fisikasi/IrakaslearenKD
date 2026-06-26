import type {
  Competency,
  Criterion,
  StudentIndicatorGrade,
  AssessmentToolIndicator,
  LiteralGradeValues,
} from '../types/database';
import { literalToNumeric } from './settings';

export function gradeClass(value: number | null | undefined) {
  if (value === null || value === undefined) return 'grade-empty';
  if (value < 5) return 'grade-red';
  if (value < 6) return 'grade-yellow';
  if (value < 7) return 'grade-purple';
  if (value < 9) return 'grade-blue';
  return 'grade-green';
}

export function formatGrade(value: number | null | undefined) {
  return value === null || value === undefined ? '-' : value.toFixed(2);
}

export function calculateStudentGrades(
  competencies: Competency[],
  criteria: Criterion[],
  indicators: AssessmentToolIndicator[],
  indicatorGrades: StudentIndicatorGrade[],
  literalValues: Partial<LiteralGradeValues>
) {
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
            : literalToNumeric(
                grade.literal_value,
                literalValues as Record<string, number>
              );

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
        ? weightedValues.reduce((sum, item) => sum + item.value * item.weight, 0) /
            totalWeight
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
        ? weighted.reduce((sum, item) => sum + item.value * item.weight, 0) /
            totalWeight
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
    ? weightedCompetencies.reduce((sum, item) => sum + item.value * item.weight, 0) /
        totalWeight
    : null;

  return {
    criterionGrades,
    competencyGrades,
    finalGrade,
  };
}