import { FormEvent, useEffect, useState } from 'react';
import { LogOut, Plus, Scale } from 'lucide-react';
import { createClass, duplicateClassStructure, getClasses, deleteClass } from '../services/classes';
import { supabase } from '../lib/supabase';
import type { ClassRow } from '../types/database';
import { getLevelsForSubject, getSubjects } from '../data/curriculum';

export function DashboardPage({
      onOpenClass,
      onOpenLegal,
      onOpenSettings,
    }: {
      onOpenClass: (id: string) => void;
      onOpenLegal: () => void;
      onOpenSettings: () => void;
    }) {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [name, setName] = useState('');

  const subjects = getSubjects();
  const [subject, setSubject] = useState(subjects[0] ?? 'Fisika eta Kimika');

  const availableLevels = getLevelsForSubject(subject);
  const [level, setLevel] = useState(availableLevels[0] ?? '3.DBH');

  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setClasses(await getClasses());
    setLoading(false);
  }

  useEffect(() => {
    if (availableLevels.length > 0 && !availableLevels.includes(level)) {
      setLevel(availableLevels[0]);
    }
  }, [subject, availableLevels, level]);

  useEffect(() => { load(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    await createClass({ name, subject, level });
    setName('');
    await load();
  }

  async function duplicate(item: ClassRow) {
    const newName = prompt('Klase berriaren izena:', `${item.name} kopia`);
    if (!newName) return;
    await duplicateClassStructure(item.id, newName);
    await load();
  }

  async function handleDeleteClass(id: string, name: string) {
    const ok = confirm(
      `"${name}" klasea ezabatu nahi duzu?\n\nKlase honekin lotutako ikasleak, ebaluazio tresnak eta kalifikazio datuak ere ezabatuko dira.`
    );

    if (!ok) return;

    await deleteClass(id);
    await load();
  }


  return (
    <main className="app-shell">
      <header className="topbar">
        <div><h1>Nire klaseak</h1><p>Ongi etorri irakaslearen panelera.</p></div>
        <div className="topbar-actions">
          <button className="secondary" onClick={onOpenSettings}>Ezarpenak</button>
          <button className="secondary" onClick={onOpenLegal}><Scale size={18}/> Oinarri legala</button>
          <button className="secondary" onClick={() => supabase.auth.signOut()}><LogOut size={18}/> Irten</button>
        </div>
      </header>

      <section className="panel">
        <h2>Klase berria sortu</h2>
        <form className="class-form" onSubmit={submit}>
          <input placeholder="Klasearen izena" value={name} onChange={(e) => setName(e.target.value)} required />
          <select value={subject} onChange={(e) => setSubject(e.target.value)} required>
            {subjects.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <select value={level} onChange={(e) => setLevel(e.target.value)} required>
            {availableLevels.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <button><Plus size={18}/> Sortu</button>
        </form>
      </section>

      <section className="grid-list">
        {loading && <p>Kargatzen...</p>}
        {classes.map((item) => (
          <article className="class-card" key={item.id}>
            <h3>{item.name}</h3>
            <p>{item.subject} {item.level ? `· ${item.level}` : ''}</p>
            <div className="card-actions">
              <button onClick={() => onOpenClass(item.id)}>Ireki</button>
              <button className="secondary" onClick={() => duplicate(item)}>Egitura bikoiztu</button>
              <button className="danger" onClick={() => handleDeleteClass(item.id, item.name)}>
                Ezabatu
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
