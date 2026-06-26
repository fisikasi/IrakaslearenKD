import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { ArrowLeft, Plus, Upload } from 'lucide-react';
import {
  bulkCreateStudents,
  createAssessmentTool,
  createStudent,
  getAssessmentTools,
  getClassById,
  getStudents,
  deleteStudent,
  deleteAssessmentTool,
  updateStudent,
  updateAssessmentTool,
  getAssessmentToolIndicators,
  deleteStudentIndicatorGrade,
  duplicateAssessmentTool,
  getGradesForStudentAndTool,
  saveStudentIndicatorGrade,
  getAssessmentStatusForClass
} from '../services/classes';
import type { 
  AssessmentTool, 
  ClassRow, 
  Student,
  AssessmentToolIndicator,
  StudentIndicatorGrade
} from '../types/database';

import { LITERAL_GRADES } from '../types/database';

export function ClassPage({
  classId,
  onBack,
  onOpenStudent,
  onOpenGradingRules,
  onOpenTool,
  onCreateTool,
}: {
  classId: string;
  onBack: () => void;
  onOpenStudent: (studentId: string) => void;
  onOpenGradingRules: () => void;
  onOpenTool: (toolId: string) => void;
  onCreateTool: () => void;
}) {
  const [classInfo, setClassInfo] = useState<ClassRow | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [tools, setTools] = useState<AssessmentTool[]>([]);
  const [studentText, setStudentText] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedTool, setSelectedTool] = useState<AssessmentTool | null>(null);
  const [assessmentStatus, setAssessmentStatus] = useState<Record<string, string>>({});
  const [modalIndicators, setModalIndicators] = useState<AssessmentToolIndicator[]>([]);
  const [modalGrades, setModalGrades] = useState<Record<string, string>>({});
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentSurname, setNewStudentSurname] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);


  async function load() {
    const [
      info,
      loadedStudents,
      loadedTools,
      statusRows
    ] = await Promise.all([
      getClassById(classId),
      getStudents(classId),
      getAssessmentTools(classId),
      getAssessmentStatusForClass(classId),
    ]);
    setClassInfo(info);
    setStudents(loadedStudents);
    setTools(loadedTools);

    const statusMap: Record<string, string> = {};

    for (const student of loadedStudents) {
      for (const tool of loadedTools) {
        const toolIndicators = statusRows.indicators.filter(
          (indicator: any) => indicator.assessment_tool_id === tool.id
        );

        const total = toolIndicators.length;

        const completed = toolIndicators.filter((indicator: any) =>
          statusRows.grades.some(
            (grade: any) =>
              grade.student_id === student.id &&
              grade.assessment_tool_indicator_id === indicator.id &&
              (grade.numeric_value !== null || grade.literal_value !== null)
          )
        ).length;

        const key = `${student.id}_${tool.id}`;

        if (total === 0 || completed === 0) {
          statusMap[key] = '-';
        } else if (completed === total) {
          statusMap[key] = '✓';
        } else {
          statusMap[key] = `${completed}/${total}`;
        }
      }
    }

    setAssessmentStatus(statusMap);
  }

  useEffect(() => {
    load();
  }, [classId]);

  async function addStudent(event: FormEvent) {
    event.preventDefault();

    const [surnameRaw, nameRaw] = studentText.includes(',')
      ? studentText.split(',')
      : ['', studentText];

    await createStudent(classId, {
      surname: surnameRaw.trim(),
      name: nameRaw.trim(),
    });

    setStudentText('');
    await load();
  }



  async function handleDeleteStudent(student: Student) {
    const studentName = `${student.surname}${student.surname && student.name ? ', ' : ''}${student.name}`;

    const ok = confirm(
      `"${studentName}" ikaslea ezabatu nahi duzu?\n\nIkasle honen kalifikazio guztiak ere ezabatuko dira.`
    );

    if (!ok) return;

    await deleteStudent(student.id);
    await load();
  }

  async function handleDeleteTool(tool: AssessmentTool) {
    const ok = confirm(
      `"${tool.code || tool.name}" ebaluazio tresna ezabatu nahi duzu?\n\nTresna honi lotutako adierazleak eta kalifikazioak ere ezabatuko dira.`
    );

    if (!ok) return;

    await deleteAssessmentTool(tool.id);
    await load();
  }

  async function handleDuplicateTool(tool: AssessmentTool) {
    const ok = confirm(
      `"${tool.name}" ebaluazio tresna bikoiztu nahi duzu?\n\nLorpen adierazleak kopiatuko dira, baina kalifikazioak ez.`
    );

    if (!ok) return;

    await duplicateAssessmentTool(tool.id);
    await load();
  }

  async function importExcel(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
      defval: '',
    });

    const parsed = rows
      .map((row) => {
        const surname =
          row.Abizena || row.ABIZENA || row.surname || row.Apellidos || '';
        const name = row.Izena || row.IZENA || row.name || row.Nombre || '';

        return {
          surname: String(surname).trim(),
          name: String(name).trim(),
        };
      })
      .filter((row) => row.name || row.surname);

    await bulkCreateStudents(classId, parsed);

    event.target.value = '';
    await load();
  }

  async function handleEditStudent(student: Student) {
  const currentValue = `${student.surname}${student.surname && student.name ? ', ' : ''}${student.name}`;

  const newValue = prompt(
    'Ikaslearen izen-abizenak aldatu. Formatua: ABIZENA, IZENA',
    currentValue
  );

  if (!newValue) return;

  const [surnameRaw, nameRaw] = newValue.includes(',')
    ? newValue.split(',')
    : ['', newValue];

  await updateStudent(student.id, {
    surname: surnameRaw.trim(),
    name: nameRaw.trim(),
  });

  await load();
}

  async function handleEditTool(tool: AssessmentTool) {
    const newName = prompt('Ebaluazio tresnaren izena:', tool.name);
    if (!newName) return;

    const newCode = prompt('Ebaluazio tresnaren kodea:', tool.code || tool.name);
    if (!newCode) return;

    const newType = prompt(
      'Kalifikazio mota idatzi: numeric edo literal',
      tool.grading_type
    );

    if (newType !== 'numeric' && newType !== 'literal') {
      alert('Kalifikazio mota baliogabea. Idatzi numeric edo literal.');
      return;
    }

    await updateAssessmentTool(tool.id, {
      name: newName.trim(),
      code: newCode.trim().toUpperCase(),
      grading_type: newType,
    });

    await load();
  }

  async function openAssessment(student: Student, tool: AssessmentTool) {
    setSelectedStudent(student);
    setSelectedTool(tool);

    const [indicators, grades] = await Promise.all([
      getAssessmentToolIndicators(tool.id),
      getGradesForStudentAndTool(student.id, tool.id),
    ]);

    setModalIndicators(indicators);

    const gradeMap: Record<string, string> = {};

    grades.forEach((grade: StudentIndicatorGrade) => {
      if (tool.grading_type === 'literal') {
        gradeMap[grade.assessment_tool_indicator_id] = grade.literal_value ?? '';
      } else {
        gradeMap[grade.assessment_tool_indicator_id] =
          grade.numeric_value !== null && grade.numeric_value !== undefined
            ? String(grade.numeric_value)
            : '';
      }
    });

    setModalGrades(gradeMap);
  }

  async function saveAssessmentModal() {
    if (!selectedStudent || !selectedTool) return;

    for (const indicator of modalIndicators) {
      const value = modalGrades[indicator.id] ?? '';

      if (value === '') {
        await deleteStudentIndicatorGrade({
          studentId: selectedStudent.id,
          assessmentToolIndicatorId: indicator.id,
        });
        continue;
      }

      if (selectedTool.grading_type === 'literal') {
        await saveStudentIndicatorGrade({
          studentId: selectedStudent.id,
          assessmentToolIndicatorId: indicator.id,
          numericValue: null,
          literalValue: value || null,
        });
      } else {
        await saveStudentIndicatorGrade({
          studentId: selectedStudent.id,
          assessmentToolIndicatorId: indicator.id,
          numericValue: value === '' ? null : Number(value.replace(',', '.')),
          literalValue: null,
        });
      }
    }

    await load();

    setSelectedStudent(null);
    setSelectedTool(null);
    setModalIndicators([]);
    setModalGrades({});
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="secondary" onClick={onBack}>
          <ArrowLeft size={18} /> Atzera
        </button>

        <div>
          <h1>{classInfo?.name ?? 'Klasea'}</h1>
          <p>
            {classInfo?.subject} {classInfo?.level}
          </p>
        </div>

        <button onClick={onOpenGradingRules}>Kalifikazio irizpideak</button>
      </header>

      <section className="class-actions-panel">
          <button
            type="button"
            onClick={() => setShowStudentModal(true)}
          >
            <Plus size={18}/>
            Ikaslea
          </button>

        <button type="button" onClick={onCreateTool}>
          <Plus size={18} /> Ebaluazio tresna
        </button>

        <label className="file-button">
          <Upload size={25} /> Excel bidez gehitu
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={importExcel}
          />
        </label>
      </section>

      <section className="panel">
        <div className="section-title-row">
          <div>
            <h2>Klaseko taula</h2>
            <p>Ikasleak eta ebaluazio tresnak.</p>
          </div>
        </div>

        <div className="class-table-wrapper">
          <table className="class-table">
            <thead>
              <tr>
                <th className="student-header">Ikaslea</th>

                {tools.map((tool) => (
                  <th key={tool.id} title={tool.name}>
                    <div className="tool-header">
                      <span>{tool.code || tool.name}</span>

                      <div className="tool-actions">
                        <button
                          type="button"
                          className="icon-soft"
                          onClick={() => onOpenTool(tool.id)}
                          title="Ebaluazio tresna editatu"
                        >
                          ✏️
                        </button>

                        <button
                          type="button"
                          className="icon-soft"
                          onClick={() => handleDuplicateTool(tool)}
                          title="Ebaluazio tresna bikoiztu"
                        >
                          📄
                        </button>

                        <button
                          type="button"
                          className="icon-danger"
                          onClick={() => handleDeleteTool(tool)}
                          title="Ebaluazio tresna ezabatu"
                        >
                          🗑
                        </button>
                      </div>

                      
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {students.length === 0 && (
                <tr>
                  <td
                    colSpan={Math.max(tools.length + 1, 1)}
                    className="empty-cell"
                  >
                    Oraindik ez dago ikaslerik.
                  </td>
                </tr>
              )}

              {students.map((student) => (
                <tr key={student.id}>
                  <td>
                    <div className="student-cell">
                      <div className="student-actions">
                        <button
                          type="button"
                          className="icon-danger"
                          onClick={() => handleDeleteStudent(student)}
                          title="Ikaslea ezabatu"
                        >
                          🗑
                        </button>

                        <button
                          type="button"
                          className="icon-soft"
                          onClick={() => {
                            setEditingStudent(student);
                            setNewStudentSurname(student.surname);
                            setNewStudentName(student.name);
                            setShowStudentModal(true);
                          }}
                          title="Ikaslea editatu"
                        >
                          ✏️
                        </button>
                      </div>

                      <button
                        type="button"
                        className="student-table-button"
                        onClick={() => onOpenStudent(student.id)}
                      >
                        <strong>{student.surname}</strong>
                        {student.surname && student.name ? ', ' : ''}
                        {student.name}
                      </button>
                    </div>
                  </td>

                  {tools.map((tool) => (
                    <td key={tool.id} className="assessment-cell">
                      <button
                          type="button"
                          className="assessment-button"
                          onClick={() => openAssessment(student, tool)}
                        >
                          <span
                            className={
                              assessmentStatus[`${student.id}_${tool.id}`] === '✓'
                                ? 'status-complete'
                                : assessmentStatus[`${student.id}_${tool.id}`]?.includes('/')
                                  ? 'status-partial'
                                  : 'status-empty'
                            }
                          >
                            {assessmentStatus[`${student.id}_${tool.id}`] ?? '-'}
                          </span>
                        </button>
                    </td>
                  ))}

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {selectedStudent && selectedTool && (
        <div className="modal-overlay">
          <div className="modal-card">

            <div className="modal-header">
              <h2>
                {selectedStudent.surname}, {selectedStudent.name}
              </h2>

              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setSelectedStudent(null);
                  setSelectedTool(null);
                }}
              >
                Itxi
              </button>
            </div>

            <p>
              <strong>{selectedTool.code}</strong> · {selectedTool.name}
            </p>

            {modalIndicators.length === 0 ? (
              <div className="placeholder-panel">
                Tresna honek oraindik ez du lorpen adierazlerik.
              </div>
            ) : (
              <div className="modal-indicator-list">
                {modalIndicators.map((indicator) => (
                  <div key={indicator.id} className="modal-indicator-row">
                    <div>
                      <strong>{indicator.indicator_bank?.text}</strong>
                      <p>
                        EI: {indicator.criteria?.code} · Pisua: {indicator.weight}
                        {!indicator.is_graded ? ' · Ez kalifikatu' : ''}
                      </p>
                    </div>

                    {selectedTool?.grading_type === 'literal' ? (
                      <select
                        value={modalGrades[indicator.id] ?? ''}
                        onChange={(e) =>
                          setModalGrades((current) => ({
                            ...current,
                            [indicator.id]: e.target.value,
                          }))
                        }
                      >
                        <option value="">Aukeratu</option>
                        {LITERAL_GRADES.map((grade) => (
                          <option key={grade} value={grade}>
                            {grade}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.01"
                        value={modalGrades[indicator.id] ?? ''}
                        onChange={(e) =>
                          setModalGrades((current) => ({
                            ...current,
                            [indicator.id]: e.target.value,
                          }))
                        }
                        placeholder="0-10"
                      />
                    )}
                  </div>
                ))}

                <div className="modal-footer">
                  <button type="button" className="secondary" onClick={() => {
                    setSelectedStudent(null);
                    setSelectedTool(null);
                    setModalIndicators([]);
                    setModalGrades({});
                  }}>
                    Utzi
                  </button>

                  <button type="button" onClick={saveAssessmentModal}>
                    Gorde
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {showStudentModal && (
        <div className="modal-overlay">
          <div className="modal-card small-modal">
            <div className="modal-header">
              <h2>{editingStudent ? 'Ikaslea editatu' : 'Ikasle berria'}</h2>

              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setEditingStudent(null);
                  setNewStudentSurname('');
                  setNewStudentName('');
                  setShowStudentModal(false);
                }}
              >
                Itxi
              </button>
            </div>

            <div className="modal-form">
              <label>
                Abizena
                <input
                  value={newStudentSurname}
                  onChange={(e) => setNewStudentSurname(e.target.value)}
                  placeholder="Adibidez: Agirre"
                />
              </label>

              <label>
                Izena
                <input
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Adibidez: Miren"
                />
              </label>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setEditingStudent(null);
                  setNewStudentSurname('');
                  setNewStudentName('');
                  setShowStudentModal(false);
                }}
              >
                Utzi
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (editingStudent) {
                    await updateStudent(editingStudent.id, {
                      surname: newStudentSurname.trim(),
                      name: newStudentName.trim(),
                    });
                  } else {
                    await createStudent(classId, {
                      surname: newStudentSurname.trim(),
                      name: newStudentName.trim(),
                    });
                  }

                  setEditingStudent(null);
                  setNewStudentSurname('');
                  setNewStudentName('');
                  setShowStudentModal(false);
                  await load();
                }}
              >
                Gorde
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
