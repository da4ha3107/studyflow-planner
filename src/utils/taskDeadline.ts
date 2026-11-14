import type { Task, ScheduleItem, DayOfWeek } from '../types';

const JS_DAY_TO_VSU: DayOfWeek[] = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function formatDaysText(days: number, extraLabel?: string): { text: string; isUrgent: boolean } {
  const suffix = extraLabel ? ` (${extraLabel})` : '';
  if (days < 0) return { text: `Просрочено на ${Math.abs(days)} дн.`, isUrgent: true };
  if (days === 0) return { text: `Сегодня${suffix}`, isUrgent: true };
  if (days === 1) return { text: `Завтра${suffix}`, isUrgent: true };
  if (days === 2) return { text: `Через 2 дн.${suffix}`, isUrgent: true };
  return { text: `Через ${days} дн.${suffix}`, isUrgent: false };
}

export function getTaskDeadlineInfo(
  task: Task,
  schedule: ScheduleItem[]
): { text: string; isUrgent: boolean } {
  if (task.done) {
    return { text: 'Готово', isUrgent: false };
  }

  const now = new Date();

  // 1. Если задача привязана к предмету — ищем ближайшую предстоящую пару в расписании
  if (task.subjectId) {
    const subjectLessons = schedule.filter(item => item.subjectId === task.subjectId);

    if (subjectLessons.length === 0) {
      return { text: 'Нет пары в расписании', isUrgent: false };
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    let bestOffset = 999;
    let bestDayLabel: DayOfWeek | null = null;
    let bestTime = '';

    // Проверяем ближайшие 7 дней (от сегодняшнего дня до этого же дня на следующей неделе)
    for (let offset = 0; offset <= 7; offset++) {
      const checkDate = new Date(now);
      checkDate.setDate(now.getDate() + offset);
      const dayCode = JS_DAY_TO_VSU[checkDate.getDay()];

      const lessonsOnDay = subjectLessons
        .filter(l => l.day === dayCode)
        .sort((a, b) => a.time.localeCompare(b.time));

      for (const lesson of lessonsOnDay) {
        const [h, m] = lesson.time.split(':').map(Number);
        const endMinutes = (h || 0) * 60 + (m || 0) + 85; // Пара идёт 85 минут

        // Если это сегодня и пара УЖЕ закончилась (а задача не отмечена выполненной) —
        // пропускаем её, цикл сам перенесёт дедлайн на следующую пару!
        if (offset === 0 && currentMinutes >= endMinutes) {
          continue;
        }

        if (offset < bestOffset) {
          bestOffset = offset;
          bestDayLabel = dayCode;
          bestTime = lesson.time;
        }
        break;
      }

      if (bestOffset < 999) break;
    }

    if (bestOffset < 999 && bestDayLabel) {
      const label = bestOffset === 0 ? `в ${bestTime}` : `${bestDayLabel}, ${bestTime}`;
      return formatDaysText(bestOffset, label);
    }

    return { text: 'Ожидает расписания', isUrgent: false };
  }

  // 2. Если это личный план с выбранной датой
  if (task.dueDate) {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const [y, m, d] = task.dueDate.split('-').map(Number);
    const targetStart = new Date(y, (m || 1) - 1, d || 1).getTime();
    const diffDays = Math.round((targetStart - todayStart) / (1000 * 60 * 60 * 24));
    return formatDaysText(diffDays);
  }

  return { text: 'Без срока', isUrgent: false };
}
