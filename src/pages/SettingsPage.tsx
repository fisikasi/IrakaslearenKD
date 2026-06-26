import { useEffect, useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { LITERAL_GRADES } from '../types/database';
import type { LiteralGradeValues } from '../types/database';
import { getTeacherSettings, saveLiteralGradeValues } from '../services/settings';

export function SettingsPage({ onBack }: { onBack: () => void }) {
  const [values, setValues] = useState<Partial<LiteralGradeValues>>({});
  const [visibleGrades, setVisibleGrades] = useState<string[]>([]);

  useEffect(() => {
    getTeacherSettings().then((settings) => {
      setValues(settings.literal_grade_values);
      setVisibleGrades(settings.visible_literal_grades);
    });
  }, []);

  async function save() {
    await saveLiteralGradeValues(values, visibleGrades);
    onBack();
  }

  function gradeClass(value: number) {
    if (value < 5) return 'grade-red';
    if (value < 6) return 'grade-yellow';
    if (value < 7) return 'grade-purple';
    if (value < 9) return 'grade-blue';
    return 'grade-green';
  }

  function toggleGrade(grade: string) {
    setVisibleGrades((current) =>
      current.includes(grade)
        ? current.filter((item) => item !== grade)
        : [...current, grade]
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="secondary" onClick={onBack}>
          <ArrowLeft size={18} /> Atzera
        </button>

        <div>
          <h1>Ezarpenak</h1>
          <p>Kalifikazio literalak eta desplegableetan agertuko diren aukerak.</p>
        </div>

        <button onClick={save}>
          <Save size={18} /> Gorde
        </button>
      </header>

      <section className="panel">
        <h2>Kalifikazio literalak</h2>
        <p>
          Markatutako aukerak bakarrik agertuko dira kalifikazio literaleko
          desplegableetan.
        </p>

        <div className="literal-columns">
          {['Gutxi', 'Nahiko', 'Ondo', 'Oso Ondo', 'Bikain'].map((base) => {
            const grades = LITERAL_GRADES.filter((grade) => grade.startsWith(base));

            return (
              <div key={base} className="literal-column">
                <h3>{base}</h3>

                {grades.map((grade) => {
                  const suffix = grade.replace(base, '').trim() || '·';

                  return (
                    <label key={grade} className="literal-row">
                      <input
                        type="checkbox"
                        checked={visibleGrades.includes(grade)}
                        onChange={() => toggleGrade(grade)}
                        title="Desplegableetan erakutsi"
                      />

                      <span>{suffix}</span>

                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.01"
                        className={`grade-pill ${gradeClass(Number(values[grade] ?? 0))}`}
                        value={values[grade] ?? ''}
                        onChange={(e) =>
                          setValues((current) => ({
                            ...current,
                            [grade]: Number(e.target.value),
                          }))
                        }
                      />
                    </label>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}