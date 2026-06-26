import { supabase } from '../lib/supabase';
import type {
  AssessmentTool,
  AssessmentToolIndicator,
  ClassRow,
  Criterion,
  IndicatorBankItem,
  StudentIndicatorGrade,
  Student,
} from '../types/database';
import { getCurriculumStructure } from '../data/curriculum';

export async function getClasses() {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as ClassRow[];
}

export async function createClass(input: { name: string; subject: string; level?: string }) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const user = userData.user;
  if (!user) throw new Error('Ez dago saiorik hasita.');

  const { data, error } = await supabase
    .from('classes')
    .insert({ teacher_id: user.id, name: input.name, subject: input.subject, level: input.level ?? null })
    .select('*')
    .single();
  if (error) throw error;
  const createdClass = data as ClassRow;
  await createDefaultGradingStructure(createdClass.id, input.subject, input.level ?? '');
  return createdClass;
}

async function createDefaultGradingStructure(classId: string, subject: string, level: string) {
  const structure = getCurriculumStructure(subject, level);
  if (!structure) return;

  const competencyCodes = Object.keys(structure).sort(
    (a, b) => Number(a.replace('KE', '')) - Number(b.replace('KE', ''))
  );

  const competencyWeight =
    competencyCodes.length > 0 ? Number((100 / competencyCodes.length).toFixed(2)) : 0;

  for (const competencyCode of competencyCodes) {
    const { data: competency, error: competencyError } = await supabase
      .from('competencies')
      .insert({
        class_id: classId,
        code: competencyCode,
        title: '',
        weight: competencyWeight,
      })
      .select('*')
      .single();

    if (competencyError) throw competencyError;

    const criterionCodes = structure[competencyCode] ?? [];
    const criterionWeight =
      criterionCodes.length > 0 ? Number((100 / criterionCodes.length).toFixed(2)) : 0;

    const criteria = criterionCodes.map((criterionCode) => ({
      class_id: classId,
      competency_id: competency.id,
      code: criterionCode,
      title: '',
      weight: criterionWeight,
    }));

    if (criteria.length > 0) {
      const { error: criteriaError } = await supabase.from('criteria').insert(criteria);
      if (criteriaError) throw criteriaError;
    }
  }
}

export async function duplicateClassStructure(classId: string, newName: string) {
  const { data, error } = await supabase.rpc('duplicate_class_structure', {
    source_class_id: classId,
    new_class_name: newName,
  });
  if (error) throw error;
  return data as string;
}

export async function getClassById(classId: string) {
  const { data, error } = await supabase.from('classes').select('*').eq('id', classId).single();
  if (error) throw error;
  return data as ClassRow;
}

export async function getStudents(classId: string) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('class_id', classId)
    .order('surname', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw error;
  return data as Student[];
}

export async function createStudent(classId: string, input: { surname: string; name: string }) {
  const { data, error } = await supabase
    .from('students')
    .insert({ class_id: classId, surname: input.surname, name: input.name })
    .select('*')
    .single();
  if (error) throw error;
  return data as Student;
}

export async function bulkCreateStudents(classId: string, students: Array<{ surname: string; name: string }>) {
  if (students.length === 0) return [];
  const { data, error } = await supabase
    .from('students')
    .insert(students.map((student) => ({ ...student, class_id: classId })))
    .select('*');
  if (error) throw error;
  return data as Student[];
}

export async function createAssessmentTool(
  classId: string,
  input: {
    name: string;
    code: string;
    grading_type: 'numeric' | 'literal';
  }
) {
  const { data, error } = await supabase
    .from('assessment_tools')
    .insert({
      class_id: classId,
      name: input.name,
      code: input.code,
      grading_type: input.grading_type,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteClass(id: string) {
  const { error } = await supabase.from('classes').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteStudent(id: string) {
  const { error } = await supabase.from('students').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteAssessmentTool(id: string) {
  const { error } = await supabase.from('assessment_tools').delete().eq('id', id);
  if (error) throw error;
}

export async function updateStudent(
  id: string,
  input: {
    surname: string;
    name: string;
  }
) {
  const { error } = await supabase
    .from('students')
    .update({
      surname: input.surname,
      name: input.name,
    })
    .eq('id', id);

  if (error) throw error;
}

export async function updateAssessmentTool(
  id: string,
  input: {
    name: string;
    code: string;
    grading_type: 'numeric' | 'literal';
  }
) {
  const { error } = await supabase
    .from('assessment_tools')
    .update({
      name: input.name,
      code: input.code,
      grading_type: input.grading_type,
    })
    .eq('id', id);

  if (error) throw error;
}

export async function getAssessmentTools(classId: string) {
  const { data, error } = await supabase
    .from('assessment_tools')
    .select('*')
    .eq('class_id', classId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as AssessmentTool[];
}

export async function getAssessmentToolById(toolId: string) {
  const { data, error } = await supabase
    .from('assessment_tools')
    .select('*')
    .eq('id', toolId)
    .single();

  if (error) throw error;
  return data as AssessmentTool;
}

export async function getCriteriaByClass(classId: string) {
  const { data, error } = await supabase
    .from('criteria')
    .select('*')
    .eq('class_id', classId)
    .order('code', { ascending: true });

  if (error) throw error;
  return data as Criterion[];
}

export async function getIndicatorBank(classId: string) {
  const { data, error } = await supabase
    .from('indicator_bank')
    .select('*')
    .eq('class_id', classId)
    .order('text', { ascending: true });

  if (error) throw error;
  return data as IndicatorBankItem[];
}

export async function getAssessmentToolIndicators(toolId: string) {
  const { data, error } = await supabase
    .from('assessment_tool_indicators')
    .select(`
      *,
      indicator_bank (*),
      criteria (*)
    `)
    .eq('assessment_tool_id', toolId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as AssessmentToolIndicator[];
}

export async function createToolIndicator(input: {
  classId: string;
  toolId: string;
  indicatorText: string;
  criterionId: string;
  weight: number;
  isGraded: boolean;
}) {
  const cleanText = input.indicatorText.trim();

  if (!cleanText) {
    throw new Error('Lorpen adierazlea ezin da hutsik egon.');
  }

  const { data: bankItem, error: bankError } = await supabase
    .from('indicator_bank')
    .upsert(
      {
        class_id: input.classId,
        text: cleanText,
      },
      {
        onConflict: 'class_id,text',
      }
    )
    .select('*')
    .single();

  if (bankError) throw bankError;

  const { data, error } = await supabase
    .from('assessment_tool_indicators')
    .insert({
      assessment_tool_id: input.toolId,
      criterion_id: input.criterionId,
      indicator_bank_id: bankItem.id,
      weight: input.weight,
      is_graded: input.isGraded,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as AssessmentToolIndicator;
}

export async function deleteToolIndicator(id: string) {
  const { error } = await supabase
    .from('assessment_tool_indicators')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getGradesForStudentAndTool(studentId: string, toolId: string) {
  const { data: indicators, error: indicatorsError } = await supabase
    .from('assessment_tool_indicators')
    .select('id')
    .eq('assessment_tool_id', toolId);

  if (indicatorsError) throw indicatorsError;

  const ids = indicators.map((item) => item.id);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('student_indicator_grades')
    .select('*')
    .eq('student_id', studentId)
    .in('assessment_tool_indicator_id', ids);

  if (error) throw error;
  return data;
}

export async function saveStudentIndicatorGrade(input: {
  studentId: string;
  assessmentToolIndicatorId: string;
  numericValue: number | null;
  literalValue: string | null;
}) {
  const { error } = await supabase
    .from('student_indicator_grades')
    .upsert(
      {
        student_id: input.studentId,
        assessment_tool_indicator_id: input.assessmentToolIndicatorId,
        numeric_value: input.numericValue,
        literal_value: input.literalValue,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'student_id,assessment_tool_indicator_id',
      }
    );

  if (error) throw error;
}

export async function getAssessmentStatusForClass(classId: string) {
  const { data: tools, error: toolsError } = await supabase
    .from('assessment_tools')
    .select('id')
    .eq('class_id', classId);

  if (toolsError) throw toolsError;

  const toolIds = tools.map((tool) => tool.id);
  if (toolIds.length === 0) return { indicators: [], grades: [] };

  const { data: indicators, error: indicatorsError } = await supabase
    .from('assessment_tool_indicators')
    .select('id, assessment_tool_id')
    .in('assessment_tool_id', toolIds);

  if (indicatorsError) throw indicatorsError;

  const indicatorIds = indicators.map((indicator) => indicator.id);
  if (indicatorIds.length === 0) return { indicators, grades: [] };

  const { data: grades, error: gradesError } = await supabase
    .from('student_indicator_grades')
    .select('student_id, assessment_tool_indicator_id, numeric_value, literal_value')
    .in('assessment_tool_indicator_id', indicatorIds);

  if (gradesError) throw gradesError;

  return { indicators, grades };
}

export async function deleteStudentIndicatorGrade(input: {
  studentId: string;
  assessmentToolIndicatorId: string;
}) {
  const { error } = await supabase
    .from('student_indicator_grades')
    .delete()
    .eq('student_id', input.studentId)
    .eq('assessment_tool_indicator_id', input.assessmentToolIndicatorId);

  if (error) throw error;
}

export async function updateToolIndicator(input: {
  id: string;
  classId: string;
  indicatorText: string;
  criterionId: string;
  weight: number;
  isGraded: boolean;
}) {
  const cleanText = input.indicatorText.trim();

  if (!cleanText) {
    throw new Error('Lorpen adierazlea ezin da hutsik egon.');
  }

  const { data: bankItem, error: bankError } = await supabase
    .from('indicator_bank')
    .upsert(
      {
        class_id: input.classId,
        text: cleanText,
      },
      {
        onConflict: 'class_id,text',
      }
    )
    .select('*')
    .single();

  if (bankError) throw bankError;

  const { error } = await supabase
    .from('assessment_tool_indicators')
    .update({
      criterion_id: input.criterionId,
      indicator_bank_id: bankItem.id,
      weight: input.weight,
      is_graded: input.isGraded,
    })
    .eq('id', input.id);

  if (error) throw error;
}

export async function updateToolIndicatorPositions(
  items: Array<{ id: string; position: number }>
) {
  for (const item of items) {
    const { error } = await supabase
      .from('assessment_tool_indicators')
      .update({ position: item.position })
      .eq('id', item.id);

    if (error) throw error;
  }
}

export async function duplicateAssessmentTool(toolId: string) {
  const { data: sourceTool, error: toolError } = await supabase
    .from('assessment_tools')
    .select('*')
    .eq('id', toolId)
    .single();

  if (toolError) throw toolError;

  const { data: newTool, error: newToolError } = await supabase
    .from('assessment_tools')
    .insert({
      class_id: sourceTool.class_id,
      name: `${sourceTool.name} (Kopia)`,
      code: `${sourceTool.code || sourceTool.name}-K`,
      grading_type: sourceTool.grading_type,
    })
    .select('*')
    .single();

  if (newToolError) throw newToolError;

  const { data: sourceIndicators, error: indicatorsError } = await supabase
    .from('assessment_tool_indicators')
    .select('*')
    .eq('assessment_tool_id', toolId);

  if (indicatorsError) throw indicatorsError;

  if (sourceIndicators.length > 0) {
    const copiedIndicators = sourceIndicators.map((indicator) => ({
      assessment_tool_id: newTool.id,
      criterion_id: indicator.criterion_id,
      indicator_bank_id: indicator.indicator_bank_id,
      weight: indicator.weight,
      is_graded: indicator.is_graded,
      position: indicator.position ?? 0,
    }));

    const { error: copyError } = await supabase
      .from('assessment_tool_indicators')
      .insert(copiedIndicators);

    if (copyError) throw copyError;
  }

  return newTool as AssessmentTool;
}

export async function getStudentEvaluationData(
  classId: string,
  studentId: string
) {
  const { data: indicators, error: indicatorsError } = await supabase
    .from('assessment_tool_indicators')
    .select(`
      *,
      criteria (*),
      indicator_bank (*),
      assessment_tools (*)
    `)
    .in(
      'assessment_tool_id',
      (
        await supabase
          .from('assessment_tools')
          .select('id')
          .eq('class_id', classId)
      ).data?.map((t) => t.id) ?? []
    );

  if (indicatorsError) throw indicatorsError;

  const { data: grades, error: gradesError } = await supabase
    .from('student_indicator_grades')
    .select('*')
    .eq('student_id', studentId);

  if (gradesError) throw gradesError;

  return {
    indicators,
    grades,
  };
}

