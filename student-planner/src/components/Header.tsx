import { useState } from 'react';
import { Sun, Moon, LogOut, Check } from 'lucide-react';
import type { UserProfile } from '../types';
import { PALETTES, type ActiveTab } from './Sidebar';

interface Props {
  activeTab: ActiveTab;
  palette: string;
  setPalette: (palette: string) => void;
  mode: string;
  setMode: (mode: string) => void;
  user: UserProfile;
  onLogout: () => void;
}

const TAB_TITLES: Record<ActiveTab, string> = {
  dashboard: 'Главная',
  subjects: 'Предметы и лабы',
  schedule: 'Расписание',
  tasks: 'Мои задачи'
};

export function Header({
  activeTab,
  palette,
  setPalette,
  mode,
  setMode,
  user,
  onLogout
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const currentPalette = PALETTES.find(item => item.id === palette) || PALETTES[0];

  return (
    <header className="topbar" style={{ position: 'relative' }}>
      <div>
        <span className="breadcrumb">Мой кабинет / {TAB_TITLES[activeTab]}</span>
      </div>

      <div className="top-actions">
        <span className="theme-name">{currentPalette.name}</span>

        <button
          type="button"
          className="icon-button"
          onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
          title="Сменить тему"
        >
          {mode === 'light' ? <Moon size={19} /> : <Sun size={19} />}
        </button>

        {/* Кнопка профиля с открытием меню настроек */}
        <button
          type="button"
          className="avatar"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ border: 'none', cursor: 'pointer' }}
          title="Настройки профиля и темы"
        >
          {user.name?.[0]?.toUpperCase() || 'С'}
        </button>
      </div>

      {/* Выпадающее окно профиля и смены цветов */}
      {menuOpen && (
        <div className="profile-popover">
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '12px' }}>
            <strong style={{ display: 'block', fontSize: '15px' }}>{user.name}</strong>
            <small style={{ color: 'var(--muted)', display: 'block', marginTop: '2px' }}>
              {user.email}
            </small>
            <small style={{ color: 'var(--accent-dark)', display: 'block', marginTop: '4px', fontWeight: 600 }}>
              {user.group ? `Группа ${user.group}` : 'Личный планер'}
            </small>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>
              ЦВЕТОВАЯ ПАЛИТРА
            </span>
            <div className="palette-list">
              {PALETTES.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className={`palette-button ${palette === item.id ? 'selected' : ''}`}
                  onClick={() => setPalette(item.id)}
                >
                  <span className="palette-dot" style={{ background: item.color }} />
                  <span>{item.name}</span>
                  {palette === item.id && <Check size={13} style={{ marginLeft: 'auto' }} />}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onLogout();
            }}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '9px',
              border: '1px solid var(--border)',
              background: 'var(--soft-bg)',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            <LogOut size={16} />
            Выйти из аккаунта
          </button>
        </div>
      )}
    </header>
  );
}
