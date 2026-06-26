import { supabase } from '../lib/supabase';
import { LITERAL_GRADES } from '../types/database';
import type { LiteralGradeValues } from '../types/database';

const DEFAULT_VISIBLE_LITERAL_GRADES = [
  'Gutxi',
  'Nahiko',
  'Ondo',
  'Oso Ondo',
  'Bikain',
];



export async function getTeacherSettings() {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    return {
      literal_grade_values: {},
      visible_literal_grades: DEFAULT_VISIBLE_LITERAL_GRADES,
    };
  }

  const { data } = await supabase
    .from('teacher_settings')
    .select('literal_grade_values, visible_literal_grades')
    .eq('teacher_id', userId)
    .single();

  return {
    literal_grade_values: data?.literal_grade_values ?? {},
    visible_literal_grades:
      data?.visible_literal_grades?.length
        ? data.visible_literal_grades
        : DEFAULT_VISIBLE_LITERAL_GRADES,
  };
}

export async function saveLiteralGradeValues(
  values: Partial<LiteralGradeValues>,
  visibleLiteralGrades?: string[]
) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) return;

  await supabase.from('teacher_settings').upsert({
    teacher_id: userId,
    literal_grade_values: values,
    visible_literal_grades: visibleLiteralGrades ?? DEFAULT_VISIBLE_LITERAL_GRADES,
  });
}

export function literalToNumeric(
  literalValue: string | null,
  values: Record<string, number>
): number | null {
  if (!literalValue) return null;

  const value = values[literalValue];

  return value === undefined ? null : Number(value);
}

export { DEFAULT_VISIBLE_LITERAL_GRADES };




// export const DEFAULT_LITERAL_VALUES = {
//   'Gutxi ↓↓': 1,
//   'Gutxi ↓': 2,
//   'Gutxi': 3,
//   'Gutxi ↑': 3.5,
//   'Gutxi ↑↑': 4,

//   'Nahiko ↓↓': 5,
//   'Nahiko ↓': 5.25,
//   'Nahiko': 5.5,
//   'Nahiko ↑': 5.75,
//   'Nahiko ↑↑': 5.9,

//   'Ondo ↓↓': 6,
//   'Ondo ↓': 6.25,
//   'Ondo': 6.5,
//   'Ondo ↑': 6.75,
//   'Ondo ↑↑': 6.9,

//   'Oso Ondo ↓↓': 7.25,
//   'Oso Ondo ↓': 7.5,
//   'Oso Ondo': 8,
//   'Oso Ondo ↑': 8.5,
//   'Oso Ondo ↑↑': 8.75,

//   'Bikain ↓↓': 9,
//   'Bikain ↓': 9.25,
//   'Bikain': 9.5,
//   'Bikain ↑': 9.75,
//   'Bikain ↑↑': 10,
// };








