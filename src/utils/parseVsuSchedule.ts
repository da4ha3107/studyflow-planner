import * as XLSX from 'xlsx';
import type { DayOfWeek, ScheduleItem, Subject } from '../types';

export interface ParsedVsuResult {
  groups: string[];
  getScheduleForGroup: (groupCode: string, subjects: Subject[]) => ScheduleItem[];
}


// Корректное приведение дня недели к типу DayOfWeek
function normalizeDay(raw: string): DayOfWeek | null {
  const lower = raw.trim().toLowerCase();
  if (lower.startsWith('понедельник')) return 'Пн';
  if (lower.startsWith('вторник')) return 'Вт';
  if (lower.startsWith('среда')) return 'Ср';
  if (lower.startsWith('четверг')) return 'Чт';
  if (lower.startsWith('пятница')) return 'Пт';
  if (lower.startsWith('суббота')) return 'Сб';
  if (lower.startsWith('воскресенье')) return 'Вс';
  return null;
}

export async function parseVsuFile(file: File): Promise<ParsedVsuResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: string[][] = XLSX.utils.sheet_to_json(firstSheet, {
    header: 1,
    defval: ''
  });

  // 1. Ищем строку с шифрами подгрупп (содержит паттерны вида 24ПИ1д_1 или 23ИСиТ1д)
  let groupRowIndex = -1;
  const groupColumns: { code: string; colIndex: number }[] = [];

  for (let r = 0; r < Math.min(25, rows.length); r++) {
    const row = rows[r];
    const foundInRow: { code: string; colIndex: number }[] = [];

    row.forEach((cell, cIdx) => {
      const val = String(cell || '').trim();
      if (/^\d{2}[А-Яа-яA-Za-z]+\d+[дз](_\d+)?$/.test(val)) {
        foundInRow.push({ code: val, colIndex: cIdx });
      }
    });

    if (foundInRow.length >= 3) {
      groupRowIndex = r;
      groupColumns.push(...foundInRow);
      break;
    }
  }

  return {
    groups: groupColumns.map(g => g.code),
    getScheduleForGroup: (groupCode: string, subjects: Subject[]) => {
      const target = groupColumns.find(g => g.code === groupCode);
      if (!target || groupRowIndex === -1) return [];

      const col = target.colIndex;
      const result: ScheduleItem[] = [];
      let currentDay: DayOfWeek | null = null;

      for (let r = groupRowIndex + 1; r < rows.length; r++) {
        const row = rows[r] || [];
        const dayCell = String(row[0] || '').trim();
        const detectedDay = normalizeDay(dayCell);
        if (detectedDay) {
          currentDay = detectedDay;
        }

        // Проверяем, начинается ли здесь пара (в колонке 2 стоит номер пары 1..8)
        const lessonNum = String(row[2] || '').trim();
        if (!currentDay || !/^[1-8]$/.test(lessonNum)) continue;

        const nextRow1 = rows[r + 1] || [];
        const nextRow2 = rows[r + 2] || [];

        // Время в формате (08:00-09:25) -> берём 08:00
        const rawTime = String(nextRow1[2] || '').trim();
        const timeMatch = rawTime.match(/(\d{2}:\d{2})/);
        const startTime = timeMatch ? timeMatch[1] : `0${7 + Number(lessonNum)}:00`;

        // Название предмета в колонке подгруппы (или в соседней левой колонке, если пара потоковая на всю группу)
        let title = String(row[col] || '').trim();
        let teacher = String(nextRow1[col] || '').trim();
        let room = String(nextRow2[col] || '').trim();

        // Если в подгруппе пусто, проверяем объединенную ячейку основной группы (col - 1)
        if (!title && groupCode.endsWith('_2') && col > 0) {
          title = String(row[col - 1] || '').trim();
          if (!teacher) teacher = String(nextRow1[col - 1] || '').trim();
          if (!room) room = String(nextRow2[col - 1] || '').trim();
        }

        if (!title) continue;

        // Очищаем название от "(Лек)", "(Лаб)", "(ПЗ)" для сопоставления с базой предметов
        const cleanBaseName = title.replace(/\s*\((Лек|Лаб|ПЗ|Лек \(off\))\)\s*$/i, '').trim();
        const matchedSubject = subjects.find(
          s => cleanBaseName.toLowerCase().includes(s.name.toLowerCase()) ||
               s.name.toLowerCase().includes(cleanBaseName.toLowerCase())
        );

        const roomAndTeacher = [room, teacher].filter(Boolean).join(' · ');

        result.push({
          id: `vsu-${currentDay}-${lessonNum}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          day: currentDay,
          time: startTime,
          title,
          room: roomAndTeacher || 'Ауд. не указана',
          subjectId: matchedSubject?.id,
          isOneTime: false
        });
      }

      return result;
    }
  };
}
