import {
  LayoutDashboard, Layers, CalendarDays,
  CheckSquare, GraduationCap, Sun, Moon, LogOut
} from 'lucide-react';
import type { UserProfile } from '../types';

export type ActiveTab = 'dashboard' | 'subjects' | 'schedule' | 'tasks';

export const PALETTES = [
  { id: 'lavender', name: 'Lavender', color: '#8271D9' },
  { id: 'rose', name: 'Rose', color: '#D77EAA' },
  { id: 'ocean', name: 'Ocean', color: '#548BCB' },
  { id: 'sage', name: 'Sage', color: '#6D9C83' },
  { id: 'peach', name: 'Peach', color: '#D58B68' },
  { id: 'graphite', name: 'Graphite', color: '#85858D' }
];

interface Props {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  palette: string;
  setPalette: (palette: string) => void;
  mode: string;
  setMode: (mode: string) => void;
  user: UserProfile;
  onLogout: () => void;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  palette,
  setPalette,
  mode,
  setMode,
  user,
  onLogout
}: Props) {
  return (
    <>
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">
            <GraduationCap size={23} />
          </div>
          <span>studyflow</span>
        </div>

        <div className="menu-label">МЕНЮ</div>

        <nav className="navigation">
          <div
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            style={{ cursor: 'pointer' }}
          >
            <LayoutDashboard size={19} />
            <span>Главная</span>
          </div>

          <div
            className={`nav-item ${activeTab === 'subjects' ? 'active' : ''}`}
            onClick={() => setActiveTab('subjects')}
            style={{ cursor: 'pointer' }}
          >
            <Layers size={19} />
            <span>Предметы и лабы</span>
          </div>

          <div
            className={`nav-item ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
            style={{ cursor: 'pointer' }}
          >
            <CalendarDays size={19} />
            <span>Расписание</span>
          </div>

          <div
            className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
            style={{ cursor: 'pointer' }}
          >
            <CheckSquare size={19} />
            <span>Мои задачи</span>
          </div>
        </nav>

        <div className="sidebar-bottom">
          <div className="menu-label">ОФОРМЛЕНИЕ</div>

          <div className="palette-list">
            {PALETTES.map(item => (
              <button
                key={item.id}
                className={`palette-button ${palette === item.id ? 'selected' : ''}`}
                onClick={() => setPalette(item.id)}
              >
                <span className="palette-dot" style={{ background: item.color }} />
                <span>{item.name}</span>
              </button>
            ))}
          </div>

          <button className="mode-button" onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>
            {mode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            <span>{mode === 'light' ? 'Тёмная тема' : 'Светлая тема'}</span>
          </button>

          <div className="profile">
            <div className="avatar">{user.name?.[0]?.toUpperCase()}</div>
            <div>
              <strong>{user.name}</strong>
              <small>{user.group ? `Группа ${user.group}` : 'Личный планер'}</small>

            </div>
            <button
              onClick={onLogout}
              title="Выйти из аккаунта"
              style={{ marginLeft: 'auto', background: 'transparent', border: 0, color: 'var(--muted)' }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Нижняя панель навигации специально для iPhone */}
      <nav className="mobile-bottom-nav">
        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={20} />
          <span>Главная</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'subjects' ? 'active' : ''}`}
          onClick={() => setActiveTab('subjects')}
        >
          <Layers size={20} />
          <span>Предметы</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <CalendarDays size={20} />
          <span>Расписание</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <CheckSquare size={20} />
          <span>Задачи</span>
        </button>
      </nav>
    </>
  );
}
