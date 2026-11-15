import { useEffect, useState } from 'react';
import './App.css';
import type { Subject, UserProfile, Task, ScheduleItem, DayOfWeek } from './types';
import { Sidebar, type ActiveTab } from './components/Sidebar';
import { Header } from './components/Header';
import { TaskCard } from './components/TaskCard';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Subjects } from './pages/Subjects';
import { Schedule } from './pages/Schedule';

function App() {
  const [palette, setPalette] = useState(() => localStorage.getItem('palette') || 'lavender');
  const [mode, setMode] = useState(() => localStorage.getItem('mode') || 'light');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

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
    localStorage.setItem('studyflow_schedule', JSON.stringify(schedule));
  }, [schedule]);

  // Автоматический учёт пройденных пар по реальному времени
  useEffect(() => {
    const checkCompletedLessons = () => {
      const now = new Date();
      const daysMap: DayOfWeek[] = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
      const currentDayName = daysMap[now.getDay()];
      const todayKey = now.toISOString().slice(0, 10);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const countedRaw = localStorage.getItem('studyflow_counted_lessons');
      const countedIds: string[] = countedRaw ? JSON.parse(countedRaw) : [];
      const updatedCounted = [...countedIds];
      const subjectsToIncrement: string[] = [];

      schedule.forEach(item => {
        if (item.day !== currentDayName || !item.subjectId || item.isOneTime) return;

        const [hours, mins] = item.time.split(':').map(Number);
        if (isNaN(hours) || isNaN(mins)) return;

        const endMinutes = hours * 60 + mins + 85;
        const uniqueOccurrenceKey = `${todayKey}_${item.id}`;

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
    const timer = setInterval(checkCompletedLessons, 60000);
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

  return (
    <div className="app">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        palette={palette}
        setPalette={setPalette}
        mode={mode}
        setMode={setMode}
        user={user}
        onLogout={handleLogout}
      />

      <main className="main">
        <Header
          activeTab={activeTab}
          palette={palette}
          setPalette={setPalette}
          mode={mode}
          setMode={setMode}
          user={user}
          onLogout={handleLogout}
        />



        <div className="content">
          {activeTab === 'dashboard' && (
            <Dashboard
              user={user}
              subjects={subjects}
              tasks={tasks}
              schedule={schedule}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'subjects' && (
            <Subjects subjects={subjects} setSubjects={setSubjects} />
          )}

          {(activeTab === 'tasks' || activeTab === 'dashboard') && (
            <TaskCard
              tasks={tasks}
              setTasks={setTasks}
              subjects={subjects}
              setSubjects={setSubjects}
              schedule={schedule}
            />
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
