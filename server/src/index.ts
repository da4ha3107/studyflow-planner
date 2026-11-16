import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'studyflow_secret_key_2026';
const ADMIN_EMAIL = 'da5ha3107@yandex.by';

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Middleware проверки авторизации по токену
interface AuthRequest extends express.Request {
  userId?: string;
}

const authMiddleware = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  const header = req.headers.authorization;
  if (!header) {
    res.status(401).json({ error: 'Нет токена авторизации' });
    return;
  }
  const token = header.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Неверный или истекший токен' });
  }
};

// 1. Регистрация пользователя
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Заполните все поля' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ error: 'Пользователь с такой почтой уже существует' });
      return;
    }
    

    const passwordHash = await bcrypt.hash(password, 10);
    const role = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'ADMIN' : 'STUDENT';
const user = await prisma.user.create({
  data: { name, email, passwordHash, role }
});


    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, group: user.group,role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка регистрации' });
  }
});

// 2. Вход в аккаунт
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ error: 'Пользователь не найден' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(400).json({ error: 'Неверный пароль' });
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, group: user.group, role: user.role }
    });
  } catch {
    res.status(500).json({ error: 'Ошибка входа' });
  }
});
// 3. Получить все данные пользователя (предметы, расписание, задачи)
app.get('/api/data', authMiddleware, async (req: AuthRequest, res) => {
  try {
        const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      include: { subjects: true, schedule: true, tasks: true }
    });

    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    res.json({
      user: { id: user.id, name: user.name, email: user.email, group: user.group,role: user.role },
      subjects: user.subjects,
      schedule: user.schedule,
      tasks: user.tasks
    });
  } catch {
    res.status(500).json({ error: 'Ошибка загрузки данных' });
  }
});

// 4. Полная синхронизация данных студента с PostgreSQL
app.post('/api/sync', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { group, subjects, schedule, tasks } = req.body;

    if (typeof group === 'string') {
      await prisma.user.update({ where: { id: userId }, data: { group } });
    }

    // Обновляем предметы
    if (Array.isArray(subjects)) {
      await prisma.subject.deleteMany({ where: { userId } });
      if (subjects.length > 0) {
        await prisma.subject.createMany({
          data: subjects.map((s: any) => ({
            id: s.id,
            userId,
            name: s.name,
            lessonType: s.lessonType || 'Другое',
            totalLessons: Number(s.totalLessons) || 0,
            completedLessons: Number(s.completedLessons) || 0,
            totalLabs: Number(s.totalLabs) || 0,
            completedLabs: Number(s.completedLabs) || 0
          }))
        });
      }
    }

    // Обновляем расписание
    if (Array.isArray(schedule)) {
      await prisma.scheduleItem.deleteMany({ where: { userId } });
      if (schedule.length > 0) {
        await prisma.scheduleItem.createMany({
          data: schedule.map((item: any) => ({
            id: item.id,
            userId,
            day: item.day,
            time: item.time,
            title: item.title,
            room: item.room || null,
            subjectId: item.subjectId || null,
            isOneTime: Boolean(item.isOneTime)
          }))
        });
      }
    }

    // Обновляем задачи
    if (Array.isArray(tasks)) {
      await prisma.task.deleteMany({ where: { userId } });
      if (tasks.length > 0) {
        await prisma.task.createMany({
          data: tasks.map((t: any) => ({
            id: t.id,
            userId,
            title: t.title,
            subject: t.subject,
            subjectId: t.subjectId || null,
            dueDate: t.dueDate || null,
            done: Boolean(t.done)
          }))
        });
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сохранения в базу данных' });
  }
});

// 5. Общая база расписаний ВГУ (читают все студенты)
app.get('/api/vsu-groups', async (_req, res) => {
  try {
    const records = await prisma.vsuGroupSchedule.findMany();
    const map: Record<string, unknown> = {};
    records.forEach(r => {
      map[r.groupCode] = r.lessons;
    });
    res.json(map);
  } catch {
    res.status(500).json({ error: 'Ошибка загрузки расписания групп' });
  }
});

// Загружает новую таблицу только администратор
app.post('/api/vsu-groups', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const currentUser = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!currentUser || currentUser.role !== 'ADMIN') {
      res.status(403).json({ error: 'Загружать общее расписание может только администратор' });
      return;
    }

    const groupsMap = req.body as Record<string, any>;
    const entries = Object.entries(groupsMap);

    await prisma.vsuGroupSchedule.deleteMany();

    for (const [groupCode, lessons] of entries) {
      await prisma.vsuGroupSchedule.upsert({
        where: { groupCode },
        update: { lessons },
        create: { groupCode, lessons }
      });
    }

    res.json({ ok: true, count: entries.length });
  } catch {
    res.status(500).json({ error: 'Ошибка сохранения расписания ВГУ' });
  }
});

app.listen(PORT, () => {
  console.log(`Сервер StudyFlow запущен на http://localhost:${PORT}`);
});

