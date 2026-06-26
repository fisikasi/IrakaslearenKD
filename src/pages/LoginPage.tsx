import { FormEvent, useState } from 'react';
import { supabase } from '../lib/supabase';
import { usernameToLocalEmail } from '../utils/auth';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const email = usernameToLocalEmail(username);

    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { username } } });

    if (result.error) setError(result.error.message);
    setLoading(false);
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Irakaslearen Kuadernoa</h1>
        <p>Saioa hasi zure klaseak, ikasleak eta kalifikazioak kudeatzeko.</p>
        <form onSubmit={handleSubmit} className="form-stack">
          <label>
            Erabiltzailea
            <input value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
          </label>
          <label>
            Pasahitza
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} />
          </label>
          {error && <p className="error">{error}</p>}
          <button disabled={loading}>{loading ? 'Bidaltzen...' : mode === 'login' ? 'Sartu' : 'Kontua sortu'}</button>
        </form>
        <button className="link-button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Kontu berria sortu' : 'Badut kontua'}
        </button>
      </section>
    </main>
  );
}
