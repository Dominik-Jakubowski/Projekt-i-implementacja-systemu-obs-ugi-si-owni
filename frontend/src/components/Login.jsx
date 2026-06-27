import { useState } from 'react';
import api from '../api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('test3@test.pl');
  const [password, setPassword] = useState('Haslo123!');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      const response = await api.post('/api/auth/login', {
        email,
        password,
      });

      const token = response.data.token;
      const mustChangePassword = Boolean(response.data.mustChangePassword);
      const user = response.data.user;

      localStorage.setItem('token', token);
      localStorage.setItem('mustChangePassword', String(mustChangePassword));
      localStorage.setItem('user', JSON.stringify(user));

      onLogin({
        token,
        mustChangePassword,
        user,
      });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Nie udało się zalogować');
    }
  }

  return (
      <div className="card">
        <h2>Logowanie</h2>

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />

          <label>Hasło</label>
          <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">Zaloguj</button>
        </form>

        {error && <p className="error">{error}</p>}
      </div>
  );
}
