import { useState } from 'react';
import { GraduationCap, UserCheck } from 'lucide-react';
import type { UserProfile } from '../types';

interface Props {
  onLogin: (user: UserProfile) => void;
}

export function Auth({ onLogin }: Props) {
  const [isRegister, setIsRegister] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [group, setGroup] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() && isRegister) return;

    const user: UserProfile = {
      name: name.trim() || 'Даша',
      email: email.trim() || 'student@university.ru',
      group: group.trim() || 'ИВТ-31',
    };

    onLogin(user);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      padding: '20px',
      background: 'var(--bg)'
    }}>
      <form className="form-card" onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '400px' }}>
        <div className="logo" style={{ marginBottom: '20px', padding: 0 }}>
          <div className="logo-icon">
            <GraduationCap size={23} />
          </div>
          <span>studyflow</span>
        </div>

        <h2 style={{ margin: '0 0 6px' }}>
          {isRegister ? 'Регистрация студента' : 'Вход в кабинет'}
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: '12px', color: 'var(--muted)' }}>
          {isRegister
            ? 'Создай профиль, чтобы отслеживать пары и дедлайны'
            : 'Войди в свой учебный планер'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          {isRegister && (
            <>
              <div className="input-group">
                <label>Твоё имя</label>
                <input
                  type="text"
                  placeholder="Например: Даша"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label>Учебная группа</label>
                <input
                  type="text"
                  placeholder="Например: ИВТ-301"
                  value={group}
                  onChange={e => setGroup(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div className="input-group">
            <label>Университетская почта или логин</label>
            <input
              type="email"
              placeholder="student@edu.ru"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Пароль</label>
            <input type="password" placeholder="••••••••" required />
          </div>
        </div>

        <button type="submit" className="add-button" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
          <UserCheck size={17} />
          {isRegister ? 'Создать аккаунт' : 'Войти'}
        </button>

        <button
          type="button"
          onClick={() => setIsRegister(!isRegister)}
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
