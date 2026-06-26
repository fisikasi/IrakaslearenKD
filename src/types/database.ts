export type AppRole = 'teacher' | 'tutor';

export type Profile = {
  id: string;
  username: string;
  role: AppRole;
  created_at: string;
};

export type ClassRow = {
  id: string;
  teacher_id: string;
  name: string;
  subject: string;
  level: string | null;
  created_at: string;
};

export type Student = {
  id: string;
  class_id: string;
  surname: string;
  name: string;
  created_at: string;
};

export type Competency = {
  id: string;
  class_id: string;
  code: string;
  title: string | null;
  weight: number;
  hidden: boolean;
};

export type Criterion = {
  id: string;
  class_id: string;
  competency_id: string;
  code: string;
  title: string | null;
  weight: number;
  hidden: boolean;
};

export type AssessmentTool = {
  id: string;
  class_id: string;
  name: string;
  code: string | null;
  grading_type: 'numeric' | 'literal';
  created_at: string;
};

export type Grade = {
  id: string;
  student_id: string;
  assessment_tool_id: string;
  criterion_id: string;
  value: number | null;
};

export type IndicatorBankItem = {
  id: string;
  class_id: string;
  text: string;
  created_at: string;
};

export type AssessmentToolIndicator = {
  id: string;
  assessment_tool_id: string;
  criterion_id: string;
  indicator_bank_id: string;
  weight: number;
  is_graded: boolean;
  created_at: string;
  indicator_bank?: IndicatorBankItem;
  criteria?: Criterion;
  assessment_tools?: AssessmentTool;
  position: number;
};

export type StudentIndicatorGrade = {
  id: string;
  student_id: string;
  assessment_tool_indicator_id: string;
  numeric_value: number | null;
  literal_value: string | null;
  created_at: string;
  updated_at: string;
};

export const LITERAL_GRADES = [
  'Gutxi ↓↓',
  'Gutxi ↓',
  'Gutxi',
  'Gutxi ↑',
  'Gutxi ↑↑',
  'Nahiko ↓↓',
  'Nahiko ↓',
  'Nahiko',
  'Nahiko ↑',
  'Nahiko ↑↑',
  'Ondo ↓↓',
  'Ondo ↓',
  'Ondo',
  'Ondo ↑',
  'Ondo ↑↑',
  'Oso Ondo ↓↓',
  'Oso Ondo ↓',
  'Oso Ondo',
  'Oso Ondo ↑',
  'Oso Ondo ↑↑',
  'Bikain ↓↓',
  'Bikain ↓',
  'Bikain',
  'Bikain ↑',
  'Bikain ↑↑',
] as const;

export type LiteralGrade = typeof LITERAL_GRADES[number];

export type LiteralGradeValues = Record<LiteralGrade, number>;

export type TeacherSettings = {
  teacher_id: string;
  literal_grade_values: Partial<LiteralGradeValues>;
  created_at: string;
  updated_at: string;
};






