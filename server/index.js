/* =============================================
   SERVER — приём заявок с формы
   POST /api/contact
   Каналы уведомлений (включаются через .env):
   1. Telegram-бот   — TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
   2. Email (SMTP)   — SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_TO
   ============================================= */

import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '50kb' }));

/* ─── Валидация ──────────────────────────────── */
function validate(body) {
  const errors = [];
  const name = (body.name || '').trim();
  const phone = (body.phone || '').trim();
  const message = (body.message || '').trim();

  if (name.length < 2 || name.length > 100) errors.push('Укажите имя');
  if (phone.replace(/\D/g, '').length < 10) errors.push('Укажите корректный телефон');
  if (message.length < 5 || message.length > 3000) errors.push('Опишите задачу');

  return {
    errors,
    data: {
      name,
      phone,
      message,
      company: (body.company || '').trim().slice(0, 200),
      email: (body.email || '').trim().slice(0, 200),
      quantity: (body.quantity || '').trim().slice(0, 100),
      services: Array.isArray(body.services)
        ? body.services.map((s) => String(s).slice(0, 60)).slice(0, 10)
        : [],
    },
  };
}

/* ─── Текст заявки ───────────────────────────── */
function buildText(d) {
  const lines = [
    '🔧 Новая заявка с сайта СТАРТ',
    '',
    `👤 Имя: ${d.name}`,
    d.company && `🏢 Компания: ${d.company}`,
    `📞 Телефон: ${d.phone}`,
    d.email && `✉️ Email: ${d.email}`,
    d.services.length && `⚙️ Услуги: ${d.services.join(', ')}`,
    d.quantity && `📦 Количество: ${d.quantity}`,
    '',
    `📝 Задача:`,
    d.message,
  ];
  return lines.filter(Boolean).join('\n');
}

/* ─── Telegram ───────────────────────────────── */
async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!res.ok) throw new Error(`Telegram: ${res.status} ${await res.text()}`);
  return true;
}

/* ─── Email (опционально) ────────────────────── */
async function sendEmail(text, data) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_TO } = process.env;
  if (!SMTP_HOST || !MAIL_TO) return false;

  const { default: nodemailer } = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 465),
    secure: Number(SMTP_PORT || 465) === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });

  await transporter.sendMail({
    from: SMTP_USER || 'noreply@localhost',
    to: MAIL_TO,
    subject: `Заявка с сайта: ${data.name}, ${data.phone}`,
    text,
  });
  return true;
}

/* ─── Простейший rate limit по IP ────────────── */
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const windowMs = 60_000;
  const arr = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 5; // максимум 5 заявок в минуту с одного IP
}

/* ─── Эндпоинт ───────────────────────────────── */
app.post('/api/contact', async (req, res) => {
  try {
    if (rateLimited(req.ip)) {
      return res.status(429).json({ ok: false, error: 'Слишком много запросов, попробуйте позже' });
    }

    const { errors, data } = validate(req.body);
    if (errors.length) {
      return res.status(400).json({ ok: false, error: errors.join('. ') });
    }

    const text = buildText(data);
    const results = await Promise.allSettled([sendTelegram(text), sendEmail(text, data)]);

    const delivered = results.some((r) => r.status === 'fulfilled' && r.value === true);
    const failed = results.filter((r) => r.status === 'rejected');
    failed.forEach((r) => console.error('[contact] канал не сработал:', r.reason?.message));

    if (!delivered) {
      /* Ни один канал не настроен или все упали — логируем заявку,
         чтобы она не потерялась, и честно сообщаем об этом в консоль. */
      console.warn('[contact] уведомления не настроены, заявка записана в лог:\n' + text);
      if (failed.length) {
        return res.status(502).json({ ok: false, error: 'Не удалось отправить заявку, позвоните нам' });
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[contact] ошибка:', err);
    res.status(500).json({ ok: false, error: 'Внутренняя ошибка сервера' });
  }
});

/* ─── Продакшен: раздаём собранный фронтенд ──── */
const dist = path.join(__dirname, '..', 'dist');
app.use(express.static(dist));
app.get(/^(?!\/api\/).*/, (_req, res, next) => {
  res.sendFile(path.join(dist, 'index.html'), (err) => err && next());
});

app.listen(PORT, () => {
  console.log(`API-сервер запущен: http://localhost:${PORT}`);
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log('⚠ TELEGRAM_BOT_TOKEN не задан — заявки будут писаться только в консоль (см. .env.example)');
  }
});
