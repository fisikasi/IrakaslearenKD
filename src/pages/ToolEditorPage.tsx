import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, Plus, Save } from 'lucide-react';
import {
  createAssessmentTool,
  createToolIndicator,
  deleteToolIndicator,
  getAssessmentToolById,
  getAssessmentToolIndicators,
  getCriteriaByClass,
  getIndicatorBank,
  updateToolIndicator,
  updateAssessmentTool,
} from '../services/classes';
import type {
  AssessmentTool,
  AssessmentToolIndicator,
  Criterion,
  IndicatorBankItem,
} from '../types/database';

export function ToolEditorPage({
  classId,
  toolId,
  onBack,
}: {
  classId: string;
  toolId?: string;
  onBack: () => void;
}) {
  const [activeToolId, setActiveToolId] = useState<string | undefined>(toolId);
  const [tool, setTool] = useState<AssessmentTool | null>(null);

  const [toolName, setToolName] = useState('');
  const [toolCode, setToolCode] = useState('');
  const [gradingType, setGradingType] = useState<'numeric' | 'literal'>('numeric');

  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [bank, setBank] = useState<IndicatorBankItem[]>([]);
  const [indicators, setIndicators] = useState<AssessmentToolIndicator[]>([]);

  const [indicatorText, setIndicatorText] = useState('');
  const [criterionId, setCriterionId] = useState('');
  const [weight, setWeight] = useState('1');
  const [isGraded, setIsGraded] = useState(true);
  const [editingIndicatorId, setEditingIndicatorId] = useState<string | null>(null);

  async function load() {
    const [loadedCriteria, loadedBank] = await Promise.all([
      getCriteriaByClass(classId),
      getIndicatorBank(classId),
    ]);

    setCriteria(loadedCriteria);
    setBank(loadedBank);

    if (!criterionId && loadedCriteria.length > 0) {
      setCriterionId(loadedCriteria[0].id);
    }

    if (!activeToolId) return;

    const [loadedTool, loadedIndicators] = await Promise.all([
      getAssessmentToolById(activeToolId),
      getAssessmentToolIndicators(activeToolId),
    ]);

    setTool(loadedTool);
    setToolName(loadedTool.name);
    setToolCode(loadedTool.code || '');
    setGradingType(loadedTool.grading_type);
    setIndicators(loadedIndicators);
  }

  useEffect(() => {
    load();
  }, [classId, activeToolId]);

  async function saveTool(event: FormEvent) {
    event.preventDefault();

    if (!toolName.trim() || !toolCode.trim()) {
      alert('Tresnaren izena eta kodea bete behar dira.');
      return;
    }

    if (activeToolId) {
      await updateAssessmentTool(activeToolId, {
        name: toolName.trim(),
        code: toolCode.trim().toUpperCase(),
        grading_type: gradingType,
      });
    } else {
      const createdTool = await createAssessmentTool(classId, {
        name: toolName.trim(),
        code: toolCode.trim().toUpperCase(),
        grading_type: gradingType,
      });

      setActiveToolId(createdTool.id);
    }

    await load();
  }

  async function addIndicator(event: FormEvent) {
    event.preventDefault();

    if (!activeToolId) {
      alert('Lehenik ebaluazio tresna gorde behar da.');
      return;
    }

    const duplicated = indicators.some(
      (item) =>
        item.indicator_bank?.text.trim().toLowerCase() ===
          indicatorText.trim().toLowerCase() && item.criterion_id === criterionId
    );

    if (duplicated) {
      const ok = confirm(
        'Kontuz: lorpen adierazle bera EI berarekin dagoeneko erabili da.\n\nZiur zaude hala ere gehitu nahi duzula?'
      );
      if (!ok) return;
    }

    if (editingIndicatorId) {
        await updateToolIndicator({
            id: editingIndicatorId,
            classId,
            indicatorText,
            criterionId,
            weight: Number(weight.replace(',', '.')),
            isGraded,
        });
        } else {
        await createToolIndicator({
            classId,
            toolId: activeToolId,
            indicatorText,
            criterionId,
            weight: Number(weight.replace(',', '.')),
            isGraded,
        });
        }

    setIndicatorText('');
    setWeight('1');
    setIsGraded(true);
    setEditingIndicatorId(null);
    await load();
  }


function startEditIndicator(indicator: AssessmentToolIndicator) {
  setEditingIndicatorId(indicator.id);
  setIndicatorText(indicator.indicator_bank?.text ?? '');
  setCriterionId(indicator.criterion_id);
  setWeight(String(indicator.weight));
  setIsGraded(indicator.is_graded);
}

  async function removeIndicator(indicator: AssessmentToolIndicator) {
    const ok = confirm(
      'Lorpen adierazle hau tresnatik kendu nahi duzu?\n\nHoni lotutako kalifikazioak ere ezabatuko dira.'
    );

    if (!ok) return;

    await deleteToolIndicator(indicator.id);
    await load();
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="secondary" onClick={onBack}>
          <ArrowLeft size={18} /> Atzera
        </button>

        <div>
          <h1>{activeToolId ? toolCode || 'Ebaluazio tresna' : 'Ebaluazio tresna berria'}</h1>
          <p>{toolName || 'Tresnaren datuak eta lorpen adierazleak.'}</p>
        </div>

        <span className="badge">{gradingType === 'literal' ? 'Literala' : 'Numerikoa'}</span>
      </header>

      <section className="panel">
        <h2>Tresnaren datuak</h2>

        <form onSubmit={saveTool} className="tool-main-form">
          <div className="form-field">
            <label>Izena</label>
            <input
              value={toolName}
              onChange={(e) => setToolName(e.target.value)}
              placeholder="Adibidez: 1. Froga"
              required
            />
          </div>

          <div className="form-field">
            <label>Kodea</label>
            <input
              value={toolCode}
              onChange={(e) => setToolCode(e.target.value)}
              placeholder="Adibidez: 1F"
              required
            />
          </div>

          <div className="form-field">
            <label>Kalifikazio mota</label>
            <select
              value={gradingType}
              onChange={(e) => setGradingType(e.target.value as 'numeric' | 'literal')}
            >
              <option value="numeric">Numerikoa</option>
              <option value="literal">Literala</option>
            </select>
          </div>

          <button type="submit">
            <Save size={18} /> Gorde tresna
          </button>
        </form>
      </section>

      {activeToolId ? (
        <>
          <section className="panel">
            <h2>{editingIndicatorId ? 'Lorpen adierazlea editatu' : '+ Lorpen adierazle berria'}</h2>

            <form onSubmit={addIndicator} className="tool-indicator-form">
              <div className="form-field wide">
                <label>Lorpen adierazlea</label>
                <input
                  list="indicator-bank"
                  placeholder="Adibidez: Magnitudeak eta unitateak zuzen erabiltzen ditu"
                  value={indicatorText}
                  onChange={(e) => setIndicatorText(e.target.value)}
                  required
                />

                <datalist id="indicator-bank">
                  {bank.map((item) => (
                    <option key={item.id} value={item.text} />
                  ))}
                </datalist>
              </div>

              <div className="form-field">
                <label>Ebaluazio irizpidea</label>
                <select
                  value={criterionId}
                  onChange={(e) => setCriterionId(e.target.value)}
                  required
                >
                  {criteria
                    .filter((criterion) => !criterion.hidden)
                    .map((criterion) => {
                      const text = criterion.title ?? '';

                      return (
                        <option key={criterion.id} value={criterion.id}>
                          {criterion.code}
                          {text ? ` - ${text.slice(0, 60)}${text.length > 60 ? '…' : ''}` : ''}
                        </option>
                      );
                    })}
                </select>
              </div>

              <div className="form-field small">
                <label>
                  Pisua
                  <button
                    type="button"
                    className="info-button"
                    onClick={() =>
                      alert(
                        'Pisu honek adierazten du Lorpen Adierazlearen pisua ebaluazio irizpidearen barruan; zenbat eta pisu handiagoa, garrantzi handiagoa izango du Ebaluazio Irizpide berdinean ebaluatu diren beste lorpen adierazleekin alderatuz.'
                      )
                    }
                  >
                    ?
                  </button>
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  required
                />
              </div>

              <label className={`toggle-pill ${!isGraded ? 'active' : ''}`}>
                <input
                  type="checkbox"
                  checked={!isGraded}
                  onChange={(e) => setIsGraded(!e.target.checked)}
                />
                Ez kalifikatu
              </label>

              <button>
                <Plus size={18} /> {editingIndicatorId ? 'Gorde aldaketak' : 'Gehitu'}
              </button>
            </form>
          </section>

          <section className="panel">
            <h2>Tresna honetako lorpen adierazleak</h2>

            {indicators.length === 0 ? (
              <p className="muted-text">Oraindik ez dago lorpen adierazlerik.</p>
            ) : (
              <div className="indicator-list">
                {[...indicators]
                    .sort((a, b) => {
                        const codeA = a.criteria?.code ?? '';
                        const codeB = b.criteria?.code ?? '';
                        if (codeA !== codeB) {
                        return codeA.localeCompare(codeB, 'eu', { numeric: true });
                        }
                        return (a.position ?? 0) - (b.position ?? 0);
                    })
                    .map((indicator) => (
                  <div key={indicator.id} className="indicator-card">
                    <div>
                      <strong>{indicator.indicator_bank?.text}</strong>
                      <p>
                        EI: {indicator.criteria?.code} · Pisua: {indicator.weight}
                        {!indicator.is_graded ? ' · Ez kalifikatu' : ''}
                      </p>
                    </div>

                    <div className="student-actions">
                    <button
                        type="button"
                        className="icon-soft"
                        onClick={() => startEditIndicator(indicator)}
                        title="Lorpen adierazlea editatu"
                    >
                        ✏️
                    </button>

                    <button
                        type="button"
                        className="icon-danger"
                        onClick={() => removeIndicator(indicator)}
                        title="Lorpen adierazlea kendu"
                    >
                        🗑
                    </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="panel">
          <p className="muted-text">
            Lorpen adierazleak gehitzeko, lehenik tresna gorde behar da.
          </p>
        </section>
      )}
    </main>
  );
}