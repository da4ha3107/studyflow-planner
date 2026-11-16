
export type LessonType =
  | 'Лекция'
  | 'Лабораторная'
  | 'Практика / Семинар'
  | 'Кураторский час'
  | 'Конференция'
  | 'Другое';


export interface Subject {
  id: string;
  name: string;
  lessonType?: LessonType;
  totalLessons: number;
  completedLessons: number;
  totalLabs: number;
  completedLabs: number;
  completedLabItems?: number[]; // Список номеров сданных лаб, например [1, 2, 5]
}


export interface Task {
  id: string;
  title: string;
  subject: string;
  subjectId?: string;    // Если привязано к предмету — дедлайн считается по расписанию
  dueDate?: string;      // Если личный план — точная дата YYYY-MM-DD
  done: boolean;
}


export interface UserProfile {
  name: string;
  email: string;
  group: string;
  role?: 'ADMIN' | 'STUDENT';
}

export type DayOfWeek = 'Пн' | 'Вт' | 'Ср' | 'Чт' | 'Пт' | 'Сб' | 'Вс';

export interface ScheduleItem {
  id: string;
  day: DayOfWeek;
  time: string;          // Например: "09:45"
  title: string;         // Название предмета или разового плана
  room?: string;         // Аудитория (если это пара)
  subjectId?: string;    // Ссылка на предмет из базы (если это пара, а не разовый план)
  isOneTime?: boolean;   // true — если это разовый личный план
}