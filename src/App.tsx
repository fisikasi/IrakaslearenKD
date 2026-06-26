import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClassPage } from './pages/ClassPage';
import { StudentPage } from './pages/StudentPage';
import { GradingRulesPage } from './pages/GradingRulesPage';
import { LegalPage } from './pages/LegalPage';
import { ToolEditorPage } from './pages/ToolEditorPage';
import { SettingsPage } from './pages/SettingsPage';

type Route =
  | { name: 'dashboard' }
  | { name: 'class'; classId: string }
  | { name: 'student'; classId: string; studentId: string }
  | { name: 'grading-rules'; classId: string }
  | { name: 'tool-editor'; classId: string; toolId?: string }
  | { name: 'settings' }
  | { name: 'legal' };

export default function App() {
  const [sessionReady, setSessionReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [route, setRoute] = useState<Route>({ name: 'dashboard' });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(Boolean(data.session));
      setSessionReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(Boolean(session));
      if (!session) setRoute({ name: 'dashboard' });
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!sessionReady) return <main className="center-card">Kargatzen...</main>;
  if (!loggedIn) return <LoginPage />;

  if (route.name === 'legal') {
    return <LegalPage onBack={() => setRoute({ name: 'dashboard' })} />;
  }

  if (route.name === 'class') {
    return (
      <ClassPage
        classId={route.classId}
        onBack={() => setRoute({ name: 'dashboard' })}
        onOpenStudent={(studentId) =>
          setRoute({ name: 'student', classId: route.classId, studentId })
        }
        onOpenGradingRules={() =>
          setRoute({ name: 'grading-rules', classId: route.classId })
        }
        onOpenTool={(toolId) =>
          setRoute({ name: 'tool-editor', classId: route.classId, toolId })
        }
        onCreateTool={() =>
          setRoute({
            name: 'tool-editor',
            classId: route.classId,
          })
        }
        
      />
    );
  }

  if (route.name === 'student') {
    return <StudentPage classId={route.classId} studentId={route.studentId} onBack={() => setRoute({ name: 'class', classId: route.classId })} />;
  }

  if (route.name === 'grading-rules') {
    return <GradingRulesPage classId={route.classId} onBack={() => setRoute({ name: 'class', classId: route.classId })} />;
  }


  if (route.name === 'tool-editor') {
    return (
      <ToolEditorPage
        classId={route.classId}
        toolId={route.toolId}
        onBack={() => setRoute({ name: 'class', classId: route.classId })}
      />
    );
  }

  if (route.name === 'settings') {
    return <SettingsPage onBack={() => setRoute({ name: 'dashboard' })} />;
  }

  return (
    <DashboardPage
      onOpenClass={(classId) => setRoute({ name: 'class', classId })}
      onOpenLegal={() => setRoute({ name: 'legal' })}
      onOpenSettings={() => setRoute({ name: 'settings' })}
    />
  );
}
