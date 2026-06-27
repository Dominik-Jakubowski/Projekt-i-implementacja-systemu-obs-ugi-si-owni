import { useEffect, useState } from 'react';
import api from '../api';

export default function AdminUsersPanel() {
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState('pierwsze.logowanie@test.pl');
  const [fullName, setFullName] = useState('Pierwsze Logowanie');
  const [roleName, setRoleName] = useState('user');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [createdUserEmail, setCreatedUserEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadUsers() {
    setError('');

    try {
      const response = await api.get('/api/admin/users');
      setUsers(response.data.users || response.data || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Nie udało się pobrać użytkowników');
    }
  }

  async function createUser(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setTemporaryPassword('');
    setCreatedUserEmail('');

    if (!email.trim() || !fullName.trim()) {
      setError('Email i imię oraz nazwisko są wymagane');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/api/admin/users', {
        email,
        fullName,
        roleName,
      });

      setTemporaryPassword(response.data.temporaryPassword);
      setCreatedUserEmail(response.data.user?.Email || response.data.user?.email || email);
      setMessage('Użytkownik został utworzony');
      setEmail('');
      setFullName('');
      setRoleName('user');

      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Nie udało się utworzyć użytkownika');
    } finally {
      setLoading(false);
    }
  }

  async function deactivateUser(userId, userEmail) {
    setError('');
    setMessage('');

    const confirmed = window.confirm(
        `Czy na pewno chcesz dezaktywować użytkownika ${userEmail}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.patch(`/api/admin/users/${userId}/deactivate`);
      setMessage('Użytkownik został zdezaktywowany');
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Nie udało się dezaktywować użytkownika');
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  return (
      <div className="card">
        <h2>Panel administratora — użytkownicy</h2>

        <div className="reservation-box">
          <h3>Dodaj użytkownika</h3>

          <form onSubmit={createUser}>
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} />

            <label>Imię i nazwisko</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} />

            <label>Rola</label>
            <select value={roleName} onChange={(e) => setRoleName(e.target.value)}>
              <option value="user">Użytkownik</option>
              <option value="admin">Administrator</option>
            </select>

            <button type="submit" disabled={loading}>
              {loading ? 'Tworzenie...' : 'Utwórz użytkownika'}
            </button>
          </form>
        </div>

        {temporaryPassword && (
            <div className="reservation-box">
              <h3>Hasło tymczasowe</h3>

              <p>
                Utworzono konto:
                {' '}
                <strong>{createdUserEmail}</strong>
              </p>

              <p>
                Przekaż użytkownikowi poniższe hasło tymczasowe. Po pierwszym logowaniu
                system wymusi ustawienie własnego hasła.
              </p>

              <p className="success">
                Hasło tymczasowe:
                {' '}
                <strong>{temporaryPassword}</strong>
              </p>
            </div>
        )}

        <div className="reservation-box">
          <div className="section-heading">
            <h3>Lista użytkowników</h3>
            <button className="secondary" type="button" onClick={loadUsers}>
              Odśwież
            </button>
          </div>

          {users.length === 0 && <p>Brak użytkowników do wyświetlenia.</p>}

          <div className="timeline">
            {users.map((user) => {
              const userId = user.UserId || user.id || user.userId;
              const userEmail = user.Email || user.email;
              const userFullName = user.FullName || user.fullName;
              const userRoleName = user.RoleName || user.roleName;
              const isActive = Boolean(user.IsActive ?? user.isActive);
              const mustChange = Boolean(user.MustChangePassword ?? user.mustChangePassword);

              return (
                  <div key={userId} className="timeline-item">
                    <strong>{userFullName}</strong>
                    <span>{userEmail}</span>

                    <small>
                      Rola:
                      {' '}
                      {userRoleName}
                    </small>

                    <small>
                      Status:
                      {' '}
                      {isActive ? 'aktywny' : 'nieaktywny'}
                    </small>

                    <small>
                      Wymagana zmiana hasła:
                      {' '}
                      {mustChange ? 'tak' : 'nie'}
                    </small>

                    {isActive && (
                        <button
                            type="button"
                            className="danger"
                            onClick={() => deactivateUser(userId, userEmail)}
                        >
                          Dezaktywuj
                        </button>
                    )}
                  </div>
              );
            })}
          </div>
        </div>

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </div>
  );
}
