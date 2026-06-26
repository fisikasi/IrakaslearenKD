import { useEffect, useState } from 'react';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';
import {
  getGradingStructure,
  upsertCompetencyWeights,
  upsertCriterionWeights,
} from '../services/grading';
import type { Competency, Criterion } from '../types/database';


export function GradingRulesPage({
  classId,
  onBack,
}: {
  classId: string;
  onBack: () => void;
}) {
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [saved, setSaved] = useState(false);
  const [showHidden, setShowHidden] = useState(false);

  useEffect(() => {
    getGradingStructure(classId).then((data) => {
      setCompetencies(data.competencies);
      setCriteria(data.criteria);
    });
  }, [classId]);

  function round(value: number) {
    return Math.round(value);
  }

  function buildWarnings() {
    const warnings: string[] = [];

    const competencyTotal = round(
      competencies.reduce((sum, item) => sum + Number(item.weight || 0), 0)
    );

    if (competencyTotal !== 100) {
      warnings.push(`KE guztien pisuen batura ${competencyTotal}% da, eta ez 100%.`);
    }

    competencies.forEach((competency) => {
      const relatedCriteria = criteria.filter(
        (criterion) =>
          criterion.competency_id === competency.id &&
          (showHidden || !criterion.hidden)
      );

      const criteriaTotal = round(
        relatedCriteria.reduce((sum, item) => sum + Number(item.weight || 0), 0)
      );

      if (relatedCriteria.length > 0 && criteriaTotal !== 100) {
        warnings.push(
          `${competency.code} barruko EI pisuen batura ${criteriaTotal}% da, eta ez 100%.`
        );
      }
    });

    return warnings;
  }

  async function saveConfirmed() {
    await upsertCompetencyWeights(
      competencies.map(({ id, weight, title, hidden }) => ({
        id,
        weight: Number(weight || 0),
        title: title ?? '',
        hidden,
      }))
    );

    await upsertCriterionWeights(
      criteria.map(({ id, weight, title, hidden }) => ({
        id,
        weight: Number(weight || 0),
        title: title ?? '',
        hidden,
      }))
    );

    onBack();
  }

  async function save() {
    const warnings = buildWarnings();

    if (warnings.length > 0) {
      const ok = confirm(
        `${warnings.join('\n')}\n\nZiur zaude hala ere gorde nahi duzula?`
      );

      if (!ok) return;
    }

    await saveConfirmed();
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="secondary" onClick={onBack}>
          <ArrowLeft size={18} /> Atzera
        </button>

        <div>
          <h1>Kalifikazio irizpideak</h1>
          <p>KE eta irizpideen ponderazioak eta laburpenak.</p>
        </div>

        <button onClick={save}>
          <Save size={18} /> Gorde
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => setShowHidden((value) => !value)}
        >
          {showHidden ? 'Ezkutatutakoak ezkutatu' : 'Ezkutatutako elementuak erakutsi'}
        </button>
      </header>

      <section className="student-competency-grid">
        {competencies
          .filter((competency) => showHidden || !competency.hidden)
          .map((competency) => {
          const relatedCriteria = criteria.filter(
            (criterion) =>
              criterion.competency_id === competency.id &&
              (showHidden || !criterion.hidden)
          );

          const criteriaTotal = round(
            relatedCriteria.reduce((sum, item) => sum + Number(item.weight || 0), 0)
          );

          return (
            <article className="competency-card" key={competency.id}>
              <header>
                <div>
                  <h2>{competency.code}</h2>
                </div>

                <div className="competency-header-actions">
                  {Number(competency.weight || 0) === 0 && (
                    <button
                      type="button"
                      className="visibility-btn"
                      title={competency.hidden ? 'Erakutsi' : 'Ezkutatu'}
                      onClick={() =>
                        setCompetencies((items) =>
                          items.map((item) =>
                            item.id === competency.id
                              ? { ...item, hidden: !item.hidden }
                              : item
                          )
                        )
                      }
                    >
                      {competency.hidden ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  )}

                  <label className="weight-input">
                    KE pisua
                    <input
                      type="number"
                      step="0.01"
                      value={competency.weight}
                      onChange={(e) =>
                        setCompetencies((items) =>
                          items.map((item) =>
                            item.id === competency.id
                              ? { ...item, weight: Number(e.target.value) }
                              : item
                          )
                        )
                      }
                    />
                    %
                  </label>
                </div>
              </header>

              <input
                className="wide-input"
                placeholder="KE laburpena"
                value={competency.title ?? ''}
                onChange={(e) =>
                  setCompetencies((items) =>
                    items.map((item) =>
                      item.id === competency.id
                        ? { ...item, title: e.target.value }
                        : item
                    )
                  )
                }
              />

              <p className={criteriaTotal === 100 ? 'mini-ok' : 'mini-warning'}>
                EI pisuen batura: {criteriaTotal}%
              </p>

              <table>
                <thead>
                  <tr>
                    <th>Irizpidea</th>
                    <th>Laburpena</th>
                    <th>Pisua</th>
                  </tr>
                </thead>

                <tbody>
                  {relatedCriteria.map((criterion) => (
                    <tr key={criterion.id}>
                      <td>{criterion.code}</td>

                      <td>
                        <input
                          value={criterion.title ?? ''}
                          onChange={(e) =>
                            setCriteria((items) =>
                              items.map((item) =>
                                item.id === criterion.id
                                  ? { ...item, title: e.target.value }
                                  : item
                              )
                            )
                          }
                        />
                      </td>

                      <td>
                        <div className="criterion-weight-cell">
                          <input
                            type="number"
                            step="0.01"
                            value={criterion.weight}
                            onChange={(e) =>
                              setCriteria((items) =>
                                items.map((item) =>
                                  item.id === criterion.id
                                    ? { ...item, weight: Number(e.target.value) }
                                    : item
                                )
                              )
                            }
                          />
                          %

                          {Number(criterion.weight || 0) === 0 && (
                            <button
                              type="button"
                              className="visibility-btn"
                              title={criterion.hidden ? 'Erakutsi' : 'Ezkutatu'}
                              onClick={() =>
                                setCriteria((items) =>
                                  items.map((item) =>
                                    item.id === criterion.id
                                      ? { ...item, hidden: !item.hidden }
                                      : item
                                  )
                                )
                              }
                            >
                              {criterion.hidden ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
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