import { useState } from 'react';
import './App.css';
import ChangeInitialPassword from './components/ChangeInitialPassword';
import Login from './components/Login';
import WorkoutSession from './components/WorkoutSession';
import Dashboard from './views/Dashboard';

function parseStoredUser() {
  try {
    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
      return null;
    }

    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem('user');
    return null;
  }
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(() => parseStoredUser());
  const [mustChangePassword, setMustChangePassword] = useState(
      localStorage.getItem('mustChangePassword') === 'true'
  );
  const [selectedSession, setSelectedSession] = useState(null);

  function handleLogin(loginData) {
    setToken(loginData.token);
    setUser(loginData.user);
    setMustChangePassword(loginData.mustChangePassword);
    setSelectedSession(null);
  }

  function handlePasswordChanged() {
    setMustChangePassword(false);
    setSelectedSession(null);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('mustChangePassword');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setMustChangePassword(false);
    setSelectedSession(null);
  }

  if (!token) {
    return (
        <main>
          <Login onLogin={handleLogin} />
        </main>
    );
  }

  if (mustChangePassword) {
    return (
        <main>
          <header className="topbar">
            <h1>System obsługi siłowni</h1>
          </header>

          <ChangeInitialPassword
              onPasswordChanged={handlePasswordChanged}
              onLogout={logout}
          />
        </main>
    );
  }

  return (
      <main>
        <header className="topbar">
          <h1>System obsługi siłowni</h1>

          {user && (
              <span className="hint">
                Zalogowano jako: {user.fullName} ({user.roleName})
              </span>
          )}

          <button className="secondary" onClick={logout}>
            Wyloguj
          </button>
        </header>

        {selectedSession ? (
            <WorkoutSession
                initialSession={selectedSession}
                onBack={() => setSelectedSession(null)}
            />
        ) : (
            <Dashboard
                user={user}
                onSessionCreated={setSelectedSession}
            />
        )}
      </main>
  );
}

