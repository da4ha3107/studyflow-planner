import {
  BookOpen, CalendarDays, CheckSquare,
  Clock, AlertTriangle, FileText
} from 'lucide-react';
import type { Subject, UserProfile, Task, ScheduleItem, DayOfWeek } from '../types';
import type { ActiveTab } from '../components/Sidebar';

interface Props {
  user: UserProfile;
  subjects: Subject[];
  tasks: Task[];
  schedule: ScheduleItem[];
  setActiveTab: (tab: ActiveTab) => void;
}

export function Dashboard({ user, subjects, tasks, schedule, setActiveTab }: Props) {
  const daysMap: DayOfWeek[] = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const todayName = daysMap[new Date().getDay()];
  const todaySchedule = schedule
    .filter(item => item.day === todayName)
    .sort((a, b) => a.time.localeCompare(b.time));

  // Умное предупреждение только по предметам с практиками/лабами, где указано число пар
  const urgentSubjects = subjects.filter(sub => {
    const type = sub.lessonType || 'Лабораторная';
    const hasLabs = type === 'Лабораторная' || type === 'Практика / Семинар';
    const lessonsLeft = sub.totalLessons - sub.completedLessons;
    const labsLeft = sub.totalLabs - sub.completedLabs;
    return hasLabs && sub.totalLessons > 0 && labsLeft > 0 && labsLeft >= lessonsLeft;
  });

  const completedTasksCount = tasks.filter(t => t.done).length;
  const activeTasksCount = tasks.length - completedTasksCount;
  const progressPercent = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  return (
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
              <b>{labsLeft}</b> раб.!
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
                      {sub && sub.totalLessons > 0
                        ? `Занятие ${sub.completedLessons} из ${sub.totalLessons}`
                        : sub
                        ? 'Пара из базы'
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
  );
}
