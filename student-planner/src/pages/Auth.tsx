import { useState } from 'react';
import { GraduationCap, UserCheck } from 'lucide-react';
import type { UserProfile } from '../types';
import { API_URL } from '../utils/api';

interface Props {
  onLogin: (user: UserProfile) => void;
}

export function Auth({ onLogin }: Props) {
  const [isRegister, setIsRegister] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isRegister && !name.trim()) return;

    setLoading(true);
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister
        ? { name: name.trim(), email: email.trim(), password }
        : { email: email.trim(), password };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Ошибка авторизации');
        setLoading(false);
        return;
      }

      localStorage.setItem('studyflow_token', data.token);
      onLogin(data.user);
    } catch {
      setError('Не удалось подключиться к серверу (порт 4000)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '20px',
        background: 'var(--bg)'
      }}
    >
      <form className="form-card" onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '400px' }}>
        <div className="logo" style={{ marginBottom: '20px', padding: 0 }}>
          <div className="logo-icon">
            <GraduationCap size={23} />
          </div>
          <span>studyflow</span>
        </div>

        <h2 style={{ margin: '0 0 6px' }}>
          {isRegister ? 'Регистрация' : 'Вход в аккаунт'}
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: '12px', color: 'var(--muted)' }}>
          {isRegister
            ? 'Создайте профиль для планирования учебы и личных задач'
            : 'Войдите в свое рабочее пространство'}
        </p>

        {error && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: '#FEE2E2',
              color: '#DC2626',
              fontSize: '12px',
              marginBottom: '14px'
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          {isRegister && (
            <div className="input-group">
              <label>Ваше имя</label>
              <input
                type="text"
                placeholder="Введите ваше имя"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="input-group">
            <label>Электронная почта</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Пароль</label>
            <input
              type="password"
              placeholder="Введите пароль"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="add-button"
          disabled={loading}
          style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
        >
          <UserCheck size={17} />
          {loading ? 'Подождите...' : isRegister ? 'Создать аккаунт' : 'Войти'}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsRegister(!isRegister);
            setError('');
          }}
          style={{
            marginTop: '14px',
            width: '100%',
            background: 'transparent',
            border: 0,
            color: 'var(--accent-dark)',
            fontSize: '12px'
          }}
        >
          {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
        </button>
      </form>
    </div>
  );
}
