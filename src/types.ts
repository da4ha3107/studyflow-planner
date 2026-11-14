
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
  lessonType: LessonType; 
  totalLessons: number;      // Сколько всего пар в семестре
  completedLessons: number;  // Сколько пар уже прошло
  totalLabs: number;         // Сколько всего лаб нужно сдать
  completedLabs: number;     // Сколько уже сдано

  
}

export interface Task {
  id: string;
  title: string;
  subject: string;
  deadlineDays: number;
  done: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  group: string;
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