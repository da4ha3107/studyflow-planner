import { useState } from 'react';
import {
  Plus, AlertTriangle, Trash2, BookOpen,
  CheckCircle2, Pencil, Check, ChevronDown, ChevronUp
} from 'lucide-react';
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

  // Состояния для режима редактирования карточки и раскрытия списка лаб
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);


  const showLabsInput = activeCategory === 'Лабораторная' || activeCategory === 'Практика / Семинар';

  const filteredSubjects = subjects.filter(sub => {
    const type = sub.lessonType || 'Другое';
    return activeCategory === 'Другое' ? OTHER_SUBTYPES.includes(type) : type === activeCategory;
  });

  const getTabCount = (tabId: CategoryTab) => {
    return subjects.filter(sub => {
      const type = sub.lessonType || 'Другое';
      return tabId === 'Другое' ? OTHER_SUBTYPES.includes(type) : type === tabId;
    }).length;
  };

  // Создаём начальный массив галочек [1, 2, ..., count]
  const buildInitialChecklist = (count: number) =>
    Array.from({ length: count }, (_, i) => i + 1);

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalType: LessonType = activeCategory === 'Другое' ? otherSubtype : activeCategory;
    const doneLabsNum = showLabsInput ? Number(completedLabs) || 0 : 0;

    const newSubject: Subject = {
      id: Date.now().toString(),
      name: name.trim(),
      lessonType: finalType,
      totalLessons: Number(totalLessons) || 0,
      completedLessons: Number(completedLessons) || 0,
      totalLabs: showLabsInput ? Number(totalLabs) || 0 : 0,
      completedLabs: doneLabsNum,
      completedLabItems: buildInitialChecklist(doneLabsNum)
    };

    setSubjects([...subjects, newSubject]);
    setName('');
    setTotalLessons('');
    setCompletedLessons('');
    setTotalLabs('');
    setCompletedLabs('');
    setShowAddForm(false);
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
        // Если студент руками поменял число сданных лаб — синхронизируем квадратики
        if (field === 'completedLabs') {
          updated.completedLabItems = buildInitialChecklist(updated.completedLabs);
        }
        return updated;
      })
    );
  };

  // Переключение конкретной лабораторной работы в чек-листе
  const toggleLabCheckbox = (subId: string, labNumber: number) => {
    setSubjects(
      subjects.map(sub => {
        if (sub.id !== subId) return sub;
        const currentList =
          sub.completedLabItems && sub.completedLabItems.length === sub.completedLabs
            ? sub.completedLabItems
            : buildInitialChecklist(sub.completedLabs);

        const exists = currentList.includes(labNumber);
        const nextList = exists
          ? currentList.filter(n => n !== labNumber)
          : [...currentList, labNumber].sort((a, b) => a - b);

        return {
          ...sub,
          completedLabItems: nextList,
          completedLabs: nextList.length
        };
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
    border: '1px solid var(--accent)',
    background: 'var(--surface)',
    color: 'var(--text)',
    textAlign: 'center',
    fontWeight: 700,
    font: 'inherit'
  };
  return (
    <div>
            <section
        className="welcome"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          textAlign: 'left'
        }}
      >
        <div>
          <span className="date-label">УЧЁТ ЗАНЯТИЙ И РАБОТ</span>
          <h1 style={{ margin: '4px 0' }}>Мои предметы</h1>
          <p style={{ margin: 0 }}>
            Нажми на предмет, чтобы отметить сданные работы, или на карандаш — чтобы изменить цифры.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
          <button
            type="button"
            className="add-button"
            style={{
              padding: '9px 14px',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              height: '38px'
            }}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus size={16} />
            {showAddForm ? 'Скрыть форму' : 'Добавить предмет'}
          </button>

          {subjects.length > 0 && (
            <button
              type="button"
              className="icon-button"
              style={{
                width: 'auto',
                height: '38px',
                padding: '0 14px',
                fontSize: '12px',
                color: '#DC2626',
                whiteSpace: 'nowrap'
              }}
              onClick={() => {
                if (window.confirm('Удалить все предметы из списка?')) setSubjects([]);
              }}
            >
              Очистить список
            </button>
          )}
        </div>
      </section>


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


 {showAddForm && (
      <form className="form-card" onSubmit={handleAddSubject}>
        <strong>Добавить в раздел «{TABS.find(t => t.id === activeCategory)?.label}»</strong>
        <div className="form-grid">
          <div className="input-group">
            <label>Название предмета</label>
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
      )}



      {filteredSubjects.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px', padding: '32px' }}>
          В разделе «{TABS.find(t => t.id === activeCategory)?.label}» пока пусто.
        </div>
      ) : (
        <div className="subjects-grid">
          {filteredSubjects.map(sub => {
            const type = sub.lessonType || 'Другое';
            const supportsLabs = HAS_LABS_TYPES.includes(type);
            const isConfigured = sub.totalLessons > 0;
            // Если предмет ещё не заполнен — сразу открываем в режиме ввода, иначе в режиме просмотра
            const isEditing = editingId === sub.id || !isConfigured;
            const isExpanded = expandedId === sub.id;

            const lessonsLeft = Math.max(0, sub.totalLessons - sub.completedLessons);
            const labsLeft = Math.max(0, sub.totalLabs - sub.completedLabs);
            const isUrgent = isConfigured && supportsLabs && labsLeft > 0 && labsLeft >= lessonsLeft;

            const checkedItems =
              sub.completedLabItems && sub.completedLabItems.length === sub.completedLabs
                ? sub.completedLabItems
                : buildInitialChecklist(sub.completedLabs);

            const labsPercent =
              sub.totalLabs > 0 ? Math.min(100, Math.round((sub.completedLabs / sub.totalLabs) * 100)) : 0;

            return (
              <div className="subject-card" key={sub.id}>
                <div className="subject-header">
                  <div>
                    <strong style={{ fontSize: '16px', display: 'block' }}>{sub.name}</strong>
                    <small style={{ color: 'var(--muted)' }}>
                      {isConfigured
                        ? `Занятие ${sub.completedLessons} из ${sub.totalLessons}`
                        : 'Впиши данные из портала вуза'}
                    </small>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                    <span
                      className={`subject-badge ${isUrgent ? 'danger' : ''}`}
                      style={!isConfigured ? { background: 'var(--soft-bg)', color: 'var(--muted)' } : undefined}
                    >
                      {!isConfigured ? 'Не заполнено' : isUrgent ? 'Поторопись!' : 'В графике'}
                    </span>

                    {/* Кнопка карандашик / галочка сохранения */}
                    {isConfigured && (
                      <button
                        type="button"
                        className="mini-btn"
                        onClick={() => setEditingId(editingId === sub.id ? null : sub.id)}
                        title={isEditing ? 'Сохранить числа' : 'Редактировать цифры'}
                        style={
                          isEditing
                            ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }
                            : undefined
                        }
                      >
                        {isEditing ? <Check size={14} /> : <Pencil size={14} />}
                      </button>
                    )}

                    <button className="mini-btn" onClick={() => deleteSubject(sub.id)} title="Удалить">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {isUrgent && (
                  <div className="warning-banner" style={{ margin: 0, padding: '10px 12px', fontSize: '12px' }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    <span>
                      Осталось <b>{lessonsLeft}</b> {lessonsLeft === 1 ? 'пара' : 'пар'}, сдать нужно ещё <b>{labsLeft}</b> раб.!
                    </span>
                  </div>
                )}

                {/* Блок отображения пар (чистый вид в режиме просмотра, поля в режиме редактирования) */}
                                <div className="counter-row">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={15} /> Прошло пар:
                  </span>
                  {isEditing ? (
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
                  ) : (
                    <strong style={{ fontSize: '14px' }}>
                      {sub.completedLessons} из {sub.totalLessons}
                    </strong>
                  )}
                </div>

                {supportsLabs && (
                  <div className="counter-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={15} /> Сдано работ:
                      </span>
                      {isEditing ? (
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
                      ) : (
                        <strong style={{ fontSize: '14px' }}>
                          {sub.completedLabs} из {sub.totalLabs || '—'}
                        </strong>
                      )}
                    </div>

                    {!isEditing && sub.totalLabs > 0 && (
                      <div style={{ height: '6px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${labsPercent}%`,
                            height: '100%',
                            background: 'var(--accent)',
                            transition: 'width 0.25s ease'
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
                {supportsLabs && sub.totalLabs > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '9px',
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>Отметить работы по списку ({sub.completedLabs}/{sub.totalLabs})</span>
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>

                    {isExpanded && (
                      <div
                        style={{
                          marginTop: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          maxHeight: '220px',
                          overflowY: 'auto',
                          paddingRight: '4px'
                        }}
                      >
                        {Array.from({ length: sub.totalLabs }, (_, idx) => {
                          const labNum = idx + 1;
                          const isChecked = checkedItems.includes(labNum);
                          return (
                            <label
                              key={labNum}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                background: isChecked ? 'var(--accent-soft)' : 'var(--soft-bg)',
                                border: '1px solid var(--border)',
                                cursor: 'pointer',
                                fontSize: '13px'
                              }}
                            >
                              <span
                                style={{
                                  textDecoration: isChecked ? 'line-through' : 'none',
                                  color: isChecked ? 'var(--muted)' : 'var(--text)',
                                  fontWeight: isChecked ? 400 : 500
                                }}
                              >
                                Работа №{labNum}
                              </span>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleLabCheckbox(sub.id, labNum)}
                                style={{
                                  width: '17px',
                                  height: '17px',
                                  accentColor: 'var(--accent)',
                                  cursor: 'pointer'
                                }}
                              />
                            </label>
                          );
                        })}
                      </div>
                    )}
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
