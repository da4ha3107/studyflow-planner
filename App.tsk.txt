import { useEffect, useState } from 'react';
import {
  BookOpen, CalendarDays, CheckSquare, Layers,
  LogOut, Sun, Moon, Clock, AlertTriangle,
  GraduationCap, Plus, FileText, LayoutDashboard,Trash2
} from 'lucide-react';
import './App.css';
import { Subjects } from './pages/Subjects';
import { Auth } from './pages/Auth';
import type { Subject, UserProfile, Task, ScheduleItem, DayOfWeek } from './types';
import { Schedule } from './pages/Schedule';
import { getTaskDeadlineInfo } from './utils/taskDeadline';


const palettes = [
  { id: 'lavender', name: 'Lavender', color: '#8271D9' },
  { id: 'rose', name: 'Rose', color: '#D77EAA' },
  { id: 'ocean', name: 'Ocean', color: '#548BCB' },
  { id: 'sage', name: 'Sage', color: '#6D9C83' },
  { id: 'peach', name: 'Peach', color: '#D58B68' },
  { id: 'graphite', name: 'Graphite', color: '#85858D' }
];

function App() {
  const [palette, setPalette] = useState(() => localStorage.getItem('palette') || 'lavender');
  const [mode, setMode] = useState(() => localStorage.getItem('mode') || 'light');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'subjects' | 'schedule' | 'tasks'>('dashboard');

  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('studyflow_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('studyflow_subjects');
    return saved ? JSON.parse(saved) : [];
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('studyflow_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem('studyflow_schedule');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('studyflow_schedule', JSON.stringify(schedule));
  }, [schedule]);


    const [taskMode, setTaskMode] = useState<'subject' | 'personal'>('subject');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubjectId, setNewTaskSubjectId] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');


  useEffect(() => {
    document.documentElement.dataset.palette = palette;
    document.documentElement.dataset.mode = mode;
    localStorage.setItem('palette', palette);
    localStorage.setItem('mode', mode);
  }, [palette, mode]);

  useEffect(() => {
    localStorage.setItem('studyflow_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('studyflow_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const checkCompletedLessons = () => {
      const now = new Date();
      const daysMap: DayOfWeek[] = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
      const currentDayName = daysMap[now.getDay()];
      const todayKey = now.toISOString().slice(0, 10); // Например: "2026-11-14"
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const countedRaw = localStorage.getItem('studyflow_counted_lessons');
      const countedIds: string[] = countedRaw ? JSON.parse(countedRaw) : [];
      let updatedCounted = [...countedIds];
      const subjectsToIncrement: string[] = [];

      schedule.forEach(item => {
        if (item.day !== currentDayName || !item.subjectId || item.isOneTime) return;

        const [hours, mins] = item.time.split(':').map(Number);
        if (isNaN(hours) || isNaN(mins)) return;

        // Стандартная пара длится 85 минут (1 час 25 мин)
        const endMinutes = hours * 60 + mins + 85;
        const uniqueOccurrenceKey = `${todayKey}_${item.id}`;

        // Если текущее время больше времени окончания пары и мы её ещё не засчитывали сегодня
        if (currentMinutes >= endMinutes && !updatedCounted.includes(uniqueOccurrenceKey)) {
          subjectsToIncrement.push(item.subjectId);
          updatedCounted.push(uniqueOccurrenceKey);
        }
      });

      if (subjectsToIncrement.length > 0) {
        localStorage.setItem('studyflow_counted_lessons', JSON.stringify(updatedCounted));
        setSubjects(prevSubjects =>
          prevSubjects.map(sub => {
            const addCount = subjectsToIncrement.filter(id => id === sub.id).length;
            if (addCount === 0) return sub;
            return {
              ...sub,
              completedLessons: Math.min(sub.totalLessons, sub.completedLessons + addCount)
            };
          })
        );
      }
    };

    checkCompletedLessons();
    const timer = setInterval(checkCompletedLessons, 60000); // Проверка каждую минуту
    return () => clearInterval(timer);
  }, [schedule]);

  const handleLogin = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('studyflow_user', JSON.stringify(profile));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('studyflow_user');
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  const currentPalette = palettes.find(item => item.id === palette)!;

  const urgentSubjects = subjects.filter(sub => {
    const lessonsLeft = sub.totalLessons - sub.completedLessons;
    const labsLeft = sub.totalLabs - sub.completedLabs;
    return labsLeft > 0 && labsLeft >= lessonsLeft;
  });

  const completedTasksCount = tasks.filter(t => t.done).length;
  const activeTasksCount = tasks.length - completedTasksCount;
  const progressPercent = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  const toggleTask = (id: string) => {
    const target = tasks.find(t => t.id === id);
    if (!target) return;

    const nextDone = !target.done;
    setTasks(tasks.map(t => (t.id === id ? { ...t, done: nextDone } : t)));

    // Если это задача по предмету и мы отметили её выполненной — обновляем счётчик сданных работ
    if (target.subjectId) {
      setSubjects(prev =>
        prev.map(sub => {
          if (sub.id !== target.subjectId) return sub;
          const delta = nextDone ? 1 : -1;
          const nextLabs = Math.max(0, sub.completedLabs + delta);
          return {
            ...sub,
            completedLabs: sub.totalLabs > 0 ? Math.min(sub.totalLabs, nextLabs) : nextLabs
          };
        })
      );
    }
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    if (taskMode === 'subject') {
      const chosenSub = subjects.find(s => s.id === newTaskSubjectId) || subjects[0];
      if (!chosenSub) return;

      setTasks([
        ...tasks,
        {
          id: Date.now().toString(),
          title: newTaskTitle.trim(),
          subject: `${chosenSub.name} (${chosenSub.lessonType || 'Занятие'})`,
          subjectId: chosenSub.id,
          done: false
        }
      ]);
    } else {
      setTasks([
        ...tasks,
        {
          id: Date.now().toString(),
          title: newTaskTitle.trim(),
          subject: 'Личный план',
          dueDate: newTaskDate || undefined,
          done: false
        }
      ]);
    }

    setNewTaskTitle('');
    setNewTaskDate('');
  };

    const deleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks(tasks.filter(t => t.id !== id));
  };



  const tabTitles = {
    dashboard: 'Главная',
    subjects: 'Предметы и лабы',
    schedule: 'Расписание',
    tasks: 'Мои задачи'
  };

  const daysMap: DayOfWeek[] = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const todayName = daysMap[new Date().getDay()];
  const todaySchedule = schedule
    .filter(item => item.day === todayName)
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="app">
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
            {palettes.map(item => (
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
            <div className="avatar">{user.name?.toUpperCase()}</div>
            <div>
              <strong>{user.name}</strong>
              <small>Группа {user.group}</small>
            </div>
            <button
              onClick={handleLogout}
              title="Выйти из аккаунта"
              style={{ marginLeft: 'auto', background: 'transparent', border: 0, color: 'var(--muted)' }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Мой кабинет / {tabTitles[activeTab]}</span>
          </div>

          <div className="top-actions">
            <span className="theme-name">{currentPalette.name}</span>
            <button className="icon-button" onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>
              {mode === 'light' ? <Moon size={19} /> : <Sun size={19} />}
            </button>
            <div className="avatar">{user.name?.toUpperCase()}</div>
          </div>
        </header>

        <div className="content">
          {activeTab === 'subjects' && (
            <Subjects subjects={subjects} setSubjects={setSubjects} />
          )}

          {activeTab === 'dashboard' && (
            <>
              <section className="welcome">
                <div>
                  <span className="date-label">ТВОЁ УЧЕБНОЕ ПРОСТРАНСТВО</span>
                  <h1>Привет, {user.name}!</h1>
                  <p>Вот что происходит в твоей учёбе сегодня.</p>
                </div>

                <div className="welcome-date">
                  <CalendarDays size={19} />
                  {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                </div>
              </section>

              {urgentSubjects.map(sub => {
                const lessonsLeft = sub.totalLessons - sub.completedLessons;
                const labsLeft = sub.totalLabs - sub.completedLabs;
                return (
                  <div className="warning-banner" key={sub.id}>
                    <AlertTriangle size={20} />
                    <span>
                      <strong>Поторопись!</strong> По предмету <b>«{sub.name}»</b> осталось всего{' '}
                      <b>{lessonsLeft}</b> {lessonsLeft === 1 ? 'занятие' : 'занятий'}, а сдать нужно ещё{' '}
                      <b>{labsLeft}</b> работа!
                    </span>
                    <button
                      className="mini-btn"
                      style={{ marginLeft: 'auto', width: 'auto', padding: '0 10px' }}
                      onClick={() => setActiveTab('subjects')}
                    >
                      Открыть
                    </button>
                  </div>
                );
              })}
                            <section className="stats-grid">
                                <div className="stat-card">
                  <div className="stat-top">
                    <span>Занятия сегодня</span>
                    <BookOpen size={20} />
                  </div>
                  <strong>{todaySchedule.length}</strong>
                  <small>По расписанию на {todayName}</small>
                </div>


                <div className="stat-card">
                  <div className="stat-top">
                    <span>Активные задачи</span>
                    <FileText size={20} />
                  </div>
                  <strong>{activeTasksCount}</strong>
                  <small>Требуют выполнения</small>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Выполнено</span>
                    <CheckSquare size={20} />
                  </div>
                  <strong>{completedTasksCount}</strong>
                  <small>Отмечено в планере</small>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Горящих предметов</span>
                    <Clock size={20} />
                  </div>
                  <strong>{urgentSubjects.length}</strong>
                  <small>Где мало пар до сдачи</small>
                </div>
              </section>

                           <section className="dashboard-grid">
                <div className="panel progress-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Учебный прогресс</h2>
                      <p>Общая статистика твоих задач</p>
                    </div>
                  </div>

                  <div className="progress-number">
                    <strong>{progressPercent}%</strong>
                    <span>выполнено</span>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-value"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="progress-footer">
                    <span>{completedTasksCount} выполнено</span>
                    <span>{activeTasksCount} осталось</span>
                  </div>
                </div>

                <div className="panel schedule-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Сегодня ({todayName})</h2>
                      <p>Твоё расписание (счётчик пар)</p>
                    </div>
                    <CalendarDays size={20} />
                  </div>

                  {todaySchedule.length === 0 ? (
                    <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
                      На сегодня ({todayName}) пар и планов нет.
                    </p>
                  ) : (
                    todaySchedule.map(item => {
                      const sub = subjects.find(s => s.id === item.subjectId);
                      return (
                        <div className="lesson" key={item.id}>
                          <div className="lesson-time">{item.time}</div>
                          <div className="lesson-info">
                            <strong>{item.title}</strong>
                            <small>
                              {item.room ? `${item.room} · ` : ''}
                              {sub
                                ? `Занятие ${sub.completedLessons} из ${sub.totalLessons}`
                                : 'Личный план'}
                            </small>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

            </>
          )}

                    {(activeTab === 'tasks' || activeTab === 'dashboard') && (
            <section className="panel tasks-panel">
              <div className="panel-heading">
                <div>
                  <h2>Личные планы и дедлайны</h2>
                  <p>Для работ по предметам дедлайн считается до ближайшей пары и сам переносится, если не успела сдать.</p>
                </div>

                <div style={{ display: 'flex', gap: '6px', background: 'var(--soft-bg)', padding: '4px', borderRadius: '9px' }}>
                  <button
                    type="button"
                    onClick={() => setTaskMode('subject')}
                    style={{
                      border: 0,
                      padding: '6px 12px',
                      borderRadius: '7px',
                      fontSize: '12px',
                      background: taskMode === 'subject' ? 'var(--surface)' : 'transparent',
                      color: 'var(--text)',
                      fontWeight: taskMode === 'subject' ? 600 : 400
                    }}
                  >
                    По предмету
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskMode('personal')}
                    style={{
                      border: 0,
                      padding: '6px 12px',
                      borderRadius: '7px',
                      fontSize: '12px',
                      background: taskMode === 'personal' ? 'var(--surface)' : 'transparent',
                      color: 'var(--text)',
                      fontWeight: taskMode === 'personal' ? 600 : 400
                    }}
                  >
                    Личный план
                  </button>
                </div>
              </div>

              <form
                onSubmit={addTask}
                style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}
              >
                <input
                  type="text"
                  placeholder={taskMode === 'subject' ? 'Например: Сдать лабу №6' : 'Например: Дописать реферат'}
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  style={{
                    flex: 2,
                    minWidth: '200px',
                    padding: '10px 12px',
                    borderRadius: '9px',
                    border: '1px solid var(--border)',
                    background: 'var(--soft-bg)',
                    color: 'var(--text)'
                  }}
                />

                {taskMode === 'subject' ? (
                  <select
                    value={newTaskSubjectId || subjects[0]?.id || ''}
                    onChange={e => setNewTaskSubjectId(e.target.value)}
                    style={{
                      flex: 1.5,
                      minWidth: '180px',
                      padding: '10px 12px',
                      borderRadius: '9px',
                      border: '1px solid var(--border)',
                      background: 'var(--soft-bg)',
                      color: 'var(--text)',
                      font: 'inherit'
                    }}
                  >
                    {subjects.length === 0 && <option value="">Сначала загрузи предметы</option>}
                    {subjects.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.lessonType || 'Занятие'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="date"
                    value={newTaskDate}
                    onChange={e => setNewTaskDate(e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: '150px',
                      padding: '10px 12px',
                      borderRadius: '9px',
                      border: '1px solid var(--border)',
                      background: 'var(--soft-bg)',
                      color: 'var(--text)',
                      font: 'inherit'
                    }}
                  />
                )}

                <button type="submit" className="add-button">
                  <Plus size={17} />
                  Добавить
                </button>
              </form>

              <div className="tasks-list">
                {tasks.map(task => {
                  const deadlineInfo = getTaskDeadlineInfo(task, schedule);
                  return (
                    <div
                      className="task-row"
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      style={{ cursor: 'pointer', opacity: task.done ? 0.5 : 1 }}
                    >
                      <div className="task-icon">
                        <CheckSquare size={19} />
                      </div>
                      <div className="task-info">
                        <strong style={{ textDecoration: task.done ? 'line-through' : 'none' }}>
                          {task.title}
                        </strong>
                        <small>{task.subject}</small>
                      </div>
                      <span className={`deadline ${deadlineInfo.isUrgent ? 'urgent' : 'normal'}`}>
                        {deadlineInfo.text}
                      </span>
                      <button
                        type="button"
                        className="mini-btn"
                        onClick={e => deleteTask(task.id, e)}
                        title="Удалить задачу"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}


          {activeTab === 'schedule' && (
            <Schedule
              subjects={subjects}
              setSubjects={setSubjects}
              schedule={schedule}
              setSchedule={setSchedule}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
