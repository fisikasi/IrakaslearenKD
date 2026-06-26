import { supabase } from '../lib/supabase';
import type { Competency, Criterion, Grade } from '../types/database';

export async function getGradingStructure(classId: string) {
  const { data: competencies, error: compError } = await supabase
    .from('competencies')
    .select('*')
    .eq('class_id', classId)
    .order('code', { ascending: true });
  if (compError) throw compError;

  const { data: criteria, error: critError } = await supabase
    .from('criteria')
    .select('*')
    .eq('class_id', classId)
    .order('code', { ascending: true });
  if (critError) throw critError;

  return { competencies: competencies as Competency[], criteria: criteria as Criterion[] };
}

export async function getStudentGrades(studentId: string) {
  const { data, error } = await supabase.from('grades').select('*').eq('student_id', studentId);
  if (error) throw error;
  return data as Grade[];
}

export async function upsertCompetencyWeights(
  items: Array<Pick<Competency, 'id' | 'weight' | 'title' | 'hidden'>>
) {
  for (const item of items) {
    const { error } = await supabase
      .from('competencies')
      .update({
        weight: item.weight,
        title: item.title,
        hidden: item.hidden,
      })
      .eq('id', item.id);

    if (error) throw error;
  }
}

export async function upsertCriterionWeights(
  items: Array<Pick<Criterion, 'id' | 'weight' | 'title' | 'hidden'>>
) {
  for (const item of items) {
    const { error } = await supabase
      .from('criteria')
      .update({
        weight: item.weight,
        title: item.title,
        hidden: item.hidden,
      })
      .eq('id', item.id);

    if (error) throw error;
  }
}
