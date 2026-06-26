import { supabase } from '../lib/supabase';
import { LITERAL_GRADES } from '../types/database';
import type { LiteralGrade, LiteralGradeValues, TeacherSettings } from '../types/database';

export const DEFAULT_LITERAL_VALUES = {
  'Gutxi ↓↓': 1,
  'Gutxi ↓': 2,
  'Gutxi': 3,
  'Gutxi ↑': 3.5,
  'Gutxi ↑↑': 4,

  'Nahiko ↓↓': 5,
  'Nahiko ↓': 5.25,
  'Nahiko': 5.5,
  'Nahiko ↑': 5.75,
  'Nahiko ↑↑': 5.9,

  'Ondo ↓↓': 6,
  'Ondo ↓': 6.25,
  'Ondo': 6.5,
  'Ondo ↑': 6.75,
  'Ondo ↑↑': 6.9,

  'Oso Ondo ↓↓': 7.25,
  'Oso Ondo ↓': 7.5,
  'Oso Ondo': 8,
  'Oso Ondo ↑': 8.5,
  'Oso Ondo ↑↑': 8.75,

  'Bikain ↓↓': 9,
  'Bikain ↓': 9.25,
  'Bikain': 9.5,
  'Bikain ↑': 9.75,
  'Bikain ↑↑': 10,
};

export async function getTeacherSettings() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const user = userData.user;
  if (!user) throw new Error('Ez dago saiorik hasita.');

  const { data, error } = await supabase
    .from('teacher_settings')
    .select('*')
    .eq('teacher_id', user.id)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return {
      teacher_id: user.id,
      literal_grade_values: DEFAULT_LITERAL_VALUES,
    };
  }

  const settings = data as TeacherSettings;

  return {
    ...settings,
    literal_grade_values: {
      ...DEFAULT_LITERAL_VALUES,
      ...settings.literal_grade_values,
    },
  };
}

export async function saveLiteralGradeValues(values: Partial<LiteralGradeValues>) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const user = userData.user;
  if (!user) throw new Error('Ez dago saiorik hasita.');

  const cleanValues = Object.fromEntries(
    LITERAL_GRADES.map((grade) => [grade, Number(values[grade as LiteralGrade] ?? 0)])
  );

  const { error } = await supabase
    .from('teacher_settings')
    .upsert(
      {
        teacher_id: user.id,
        literal_grade_values: cleanValues,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'teacher_id' }
    );

  if (error) throw error;
}

export function literalToNumeric(
  literalValue: string | null,
  values: Record<string, number>
): number | null {
  if (!literalValue) return null;

  const value = values[literalValue];

  return value === undefined ? null : Number(value);
}