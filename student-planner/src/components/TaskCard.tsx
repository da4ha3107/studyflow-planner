import { useState } from 'react';
import { CheckSquare, Plus, Trash2, Pencil, Check } from 'lucide-react';
import type { Subject, Task, ScheduleItem } from '../types';
import { getTaskDeadlineInfo } from '../utils/taskDeadline';

interface Props {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  schedule: ScheduleItem[];
}

export function TaskCard({ tasks, setTasks, subjects, setSubjects, schedule }: Props) {
  const [taskMode, setTaskMode] = useState<'subject' | 'personal'>('subject');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubjectId, setNewTaskSubjectId] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');

  const toggleTask = (id: string) => {
    const target = tasks.find(t => t.id === id);
    if (!target) return;

    const nextDone = !target.done;
    setTasks(tasks.map(t => (t.id === id ? { ...t, done: nextDone } : t)));

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

    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const startEditTask = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTaskId(task.id);
    setEditTitle(task.title);
  };

  const saveEditTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editTitle.trim()) return;
    setTasks(tasks.map(t => (t.id === id ? { ...t, title: editTitle.trim() } : t)));
    setEditingTaskId(null);
  };


  const deleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
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
              onClick={() => {
                if (editingTaskId !== task.id) toggleTask(task.id);
              }}
              style={{ cursor: 'pointer', opacity: task.done ? 0.5 : 1 }}
            >
              <div className="task-icon">
                <CheckSquare size={19} />
              </div>

              <div className="task-info">
                {editingTaskId === task.id ? (
                  <input
                    type="text"
                    value={editTitle}
                    onClick={e => e.stopPropagation()}
                    onChange={e => setEditTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '7px',
                      border: '1px solid var(--accent)',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      font: 'inherit'
                    }}
                  />
                ) : (
                  <strong style={{ textDecoration: task.done ? 'line-through' : 'none' }}>
                    {task.title}
                  </strong>
                )}
                <small>{task.subject}</small>
              </div>

              <span className={`deadline ${deadlineInfo.isUrgent ? 'urgent' : 'normal'}`}>
                {deadlineInfo.text}
              </span>

              {editingTaskId === task.id ? (
                <button
                  type="button"
                  className="mini-btn"
                  onClick={e => saveEditTask(task.id, e)}
                  title="Сохранить"
                  style={{ background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }}
                >
                  <Check size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  className="mini-btn"
                  onClick={e => startEditTask(task, e)}
                  title="Редактировать задачу"
                >
                  <Pencil size={14} />
                </button>
              )}

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
  );
}
