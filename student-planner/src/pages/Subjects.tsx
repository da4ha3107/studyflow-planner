import { useState } from 'react';
import { Plus, AlertTriangle, Trash2, BookOpen, CheckCircle2 } from 'lucide-react';
import type { Subject, LessonType } from '../types';

interface Props {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
}

type CategoryTab = 'Лабораторная' | 'Практика / Семинар' | 'Лекция' | 'Другое';

const TABS: { id: CategoryTab; label: string }[] = [
  { id: 'Лабораторная', label: 'Лабораторные' },
  { id: 'Практика / Семинар', label: 'Практики (ПЗ)' },
  { id: 'Лекция', label: 'Лекции' },
  { id: 'Другое', label: 'Другое' }
];

const OTHER_SUBTYPES: LessonType[] = ['Кураторский час', 'Конференция', 'Другое'];
const HAS_LABS_TYPES: LessonType[] = ['Лабораторная', 'Практика / Семинар'];

export function Subjects({ subjects, setSubjects }: Props) {
  const [activeCategory, setActiveCategory] = useState<CategoryTab>('Лабораторная');
  const [name, setName] = useState('');
  const [otherSubtype, setOtherSubtype] = useState<LessonType>('Другое');
  const [totalLessons, setTotalLessons] = useState<number | ''>('');
  const [completedLessons, setCompletedLessons] = useState<number | ''>('');
  const [totalLabs, setTotalLabs] = useState<number | ''>('');
  const [completedLabs, setCompletedLabs] = useState<number | ''>('');

  const showLabsInput = activeCategory === 'Лабораторная' || activeCategory === 'Практика / Семинар';

  // Фильтруем предметы по выбранной вкладке
  const filteredSubjects = subjects.filter(sub => {
    const type = sub.lessonType || 'Другое';
    if (activeCategory === 'Другое') {
      return OTHER_SUBTYPES.includes(type);
    }
    return type === activeCategory;
  });

  const getTabCount = (tabId: CategoryTab) => {
    return subjects.filter(sub => {
      const type = sub.lessonType || 'Другое';
      return tabId === 'Другое' ? OTHER_SUBTYPES.includes(type) : type === tabId;
    }).length;
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalType: LessonType = activeCategory === 'Другое' ? otherSubtype : activeCategory;

    const newSubject: Subject = {
      id: Date.now().toString(),
      name: name.trim(),
      lessonType: finalType,
      totalLessons: Number(totalLessons) || 0,
      completedLessons: Number(completedLessons) || 0,
      totalLabs: showLabsInput ? Number(totalLabs) || 0 : 0,
      completedLabs: showLabsInput ? Number(completedLabs) || 0 : 0
    };

    setSubjects([...subjects, newSubject]);
    setName('');
    setTotalLessons('');
    setCompletedLessons('');
    setTotalLabs('');
    setCompletedLabs('');
  };

  const updateNumber = (
    id: string,
    field: 'completedLessons' | 'totalLessons' | 'completedLabs' | 'totalLabs',
    value: number
  ) => {
    const safeVal = Math.max(0, value);
    setSubjects(
      subjects.map(sub => {
        if (sub.id !== id) return sub;
        const updated = { ...sub, [field]: safeVal };
        if (updated.totalLessons > 0 && updated.completedLessons > updated.totalLessons) {
          updated.completedLessons = updated.totalLessons;
        }
        if (updated.totalLabs > 0 && updated.completedLabs > updated.totalLabs) {
          updated.completedLabs = updated.totalLabs;
        }
        return updated;
      })
    );
  };

  const deleteSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id));
  };

  const numInputStyle: React.CSSProperties = {
    width: '48px',
    padding: '4px 6px',
    borderRadius: '7px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    textAlign: 'center',
    fontWeight: 700,
    font: 'inherit'
  };
  return (
    <div>
      <section className="welcome">
        <div>
          <span className="date-label">УЧЁТ ЗАНЯТИЙ И РАБОТ</span>
          <h1>Мои предметы</h1>
          <p>Выбери нужный раздел, чтобы посмотреть или заполнить количество пар и работ.</p>
        </div>

        {subjects.length > 0 && (
          <button
            type="button"
            className="icon-button"
            style={{ width: 'auto', padding: '0 14px', fontSize: '12px', color: '#DC2626' }}
            onClick={() => {
              if (window.confirm('Удалить все предметы из списка?')) setSubjects([]);
            }}
          >
            Очистить список
          </button>
        )}
      </section>

      {/* 4 вкладки категорий: Лабы, ПЗ, Лекции, Другое */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '22px', flexWrap: 'wrap' }}>
        {TABS.map(tab => {
          const isSelected = activeCategory === tab.id;
          const count = getTabCount(tab.id);
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id)}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                background: isSelected ? 'var(--accent)' : 'var(--surface)',
                color: isSelected ? '#fff' : 'var(--text)',
                fontWeight: 600,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '1px 7px',
                  borderRadius: '99px',
                  background: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--soft-bg)',
                  color: isSelected ? '#fff' : 'var(--muted)'
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Форма добавления для выбранного раздела */}
      <form className="form-card" onSubmit={handleAddSubject}>
        <strong>Добавить в раздел «{TABS.find(t => t.id === activeCategory)?.label}»</strong>
        <div className="form-grid">
          <div className="input-group">
            <label>Название предмета / занятия</label>
            <input
              type="text"
              placeholder={activeCategory === 'Другое' ? 'Например: Физическая культура' : 'Например: Компьютерные сети'}
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          {activeCategory === 'Другое' && (
            <div className="input-group">
              <label>Уточнить вид</label>
              <select
                value={otherSubtype}
                onChange={e => setOtherSubtype(e.target.value as LessonType)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '9px',
                  border: '1px solid var(--border)',
                  background: 'var(--soft-bg)',
                  color: 'var(--text)',
                  font: 'inherit'
                }}
              >
                {OTHER_SUBTYPES.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="input-group">
            <label>Всего пар</label>
            <input
              type="number"
              min={0}
              max={200}
              placeholder="Из портала вуза"
              value={totalLessons}
              onChange={e => setTotalLessons(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>

          <div className="input-group">
            <label>Уже прошло</label>
            <input
              type="number"
              min={0}
              max={200}
              placeholder="0"
              value={completedLessons}
              onChange={e => setCompletedLessons(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>

          {showLabsInput && (
            <>
              <div className="input-group">
                <label>Всего работ / лаб</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Сколько сдать"
                  value={totalLabs}
                  onChange={e => setTotalLabs(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>

              <div className="input-group">
                <label>Уже сдано</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0"
                  value={completedLabs}
                  onChange={e => setCompletedLabs(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </>
          )}
        </div>

        <button type="submit" className="add-button">
          <Plus size={16} />
          Добавить
        </button>
      </form>

      {/* Карточки выбранной категории */}
      {filteredSubjects.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px', padding: '32px' }}>
          В разделе «{TABS.find(t => t.id === activeCategory)?.label}» пока пусто. Добавь предмет выше или загрузи расписание вуза.
        </div>
      ) : (
        <div className="subjects-grid">
          {filteredSubjects.map(sub => {
            const type = sub.lessonType || 'Другое';
            const supportsLabs = HAS_LABS_TYPES.includes(type);
            const isConfigured = sub.totalLessons > 0;
            const lessonsLeft = Math.max(0, sub.totalLessons - sub.completedLessons);
            const labsLeft = Math.max(0, sub.totalLabs - sub.completedLabs);
            const isUrgent = isConfigured && supportsLabs && labsLeft > 0 && labsLeft >= lessonsLeft;

            return (
              <div className="subject-card" key={sub.id}>
                <div className="subject-header">
                  <div>
                    <strong style={{ fontSize: '16px', display: 'block' }}>{sub.name}</strong>
                    <small style={{ color: 'var(--muted)' }}>
                      {isConfigured
                        ? `Занятие ${sub.completedLessons} из ${sub.totalLessons}`
                        : 'Впиши количество пар из портала вуза'}
                    </small>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                    <span
                      className={`subject-badge ${isUrgent ? 'danger' : ''}`}
                      style={!isConfigured ? { background: 'var(--soft-bg)', color: 'var(--muted)' } : undefined}
                    >
                      {!isConfigured ? 'Не заполнено' : isUrgent ? 'Поторопись!' : 'В графике'}
                    </span>
                    <button className="mini-btn" onClick={() => deleteSubject(sub.id)} title="Удалить">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {isUrgent && (
                  <div className="warning-banner" style={{ margin: 0, padding: '10px 12px', fontSize: '12px' }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    <span>
                      Осталось <b>{lessonsLeft}</b> {lessonsLeft === 1 ? 'пара' : 'пар'}, а сдать нужно ещё <b>{labsLeft}</b> раб.!
                    </span>
                  </div>
                )}

               <div className="counter-row">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={15} /> Прошло пар:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="number"
                      min={0}
                      max={200}
                      value={sub.completedLessons || ''}
                      placeholder="0"
                      onChange={e => updateNumber(sub.id, 'completedLessons', Number(e.target.value))}
                      style={numInputStyle}
                    />
                    <span style={{ color: 'var(--muted)' }}>из</span>
                    <input
                      type="number"
                      min={0}
                      max={200}
                      value={sub.totalLessons || ''}
                      placeholder="—"
                      onChange={e => updateNumber(sub.id, 'totalLessons', Number(e.target.value))}
                      style={numInputStyle}
                    />
                  </div>
                </div>

                {supportsLabs && (
                  <div className="counter-row">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={15} /> Сдано работ:
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={sub.completedLabs || ''}
                        placeholder="0"
                        onChange={e => updateNumber(sub.id, 'completedLabs', Number(e.target.value))}
                        style={numInputStyle}
                      />
                      <span style={{ color: 'var(--muted)' }}>из</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={sub.totalLabs || ''}
                        placeholder="—"
                        onChange={e => updateNumber(sub.id, 'totalLabs', Number(e.target.value))}
                        style={numInputStyle}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}