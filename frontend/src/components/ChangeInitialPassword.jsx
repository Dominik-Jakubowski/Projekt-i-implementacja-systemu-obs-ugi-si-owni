import { useState } from 'react';
import api from '../api';

export default function ChangeInitialPassword({ onPasswordChanged, onLogout }) {
  const [newPassword, setNewPassword] = useState('');
  const [repeatedPassword, setRepeatedPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!newPassword || newPassword.length < 8) {
      setError('Nowe hasło musi mieć co najmniej 8 znaków');
      return;
    }

    if (newPassword !== repeatedPassword) {
      setError('Podane hasła nie są takie same');
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/auth/change-initial-password', {
        newPassword,
      });

      localStorage.setItem('mustChangePassword', 'false');
      setMessage('Hasło zostało zmienione. Możesz korzystać z aplikacji.');

      onPasswordChanged();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Nie udało się zmienić hasła');
    } finally {
      setLoading(false);
    }
  }

  return (
      <div className="card">
        <h2>Ustaw nowe hasło</h2>

        <p>
          Konto zostało utworzone przez administratora. Przed rozpoczęciem korzystania
          z systemu ustaw własne hasło.
        </p>

        <form onSubmit={handleSubmit}>
          <label>Nowe hasło</label>
          <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
          />

          <label>Powtórz nowe hasło</label>
          <input
              type="password"
              value={repeatedPassword}
              onChange={(e) => setRepeatedPassword(e.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Zapisywanie...' : 'Ustaw nowe hasło'}
          </button>
        </form>

        <button className="secondary" onClick={onLogout}>
          Wyloguj
        </button>

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </div>
  );
}
