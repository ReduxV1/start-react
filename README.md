# СТАРТ — сайт металлообработки

Фронтенд: React + Vite + React Router
Бэкенд: Python + FastAPI + SQLite

## Требования

- Node.js 18+
- Python 3.10+

## Установка

```bash
npm install
pip install -r api/requirements.txt
copy .env.example .env        # Windows (Linux/macOS: cp .env.example .env)
```

Заполните `.env`:
- `ADMIN_TOKEN` — придумайте длинный секрет, это пароль от панели /admin
- `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` — для уведомлений (инструкция внутри файла)

Положите `.glb` и `.mp4` файлы моделей в `public/models/`.

## Разработка

```bash
npm run dev
```

- Сайт:            http://localhost:5173
- Панель заявок:   http://localhost:5173/admin
- Swagger (API):   http://localhost:3001/docs

## Продакшен

```bash
npm run build     # сборка фронтенда в dist/
npm start         # FastAPI раздаёт и API, и сайт на порту 3001
```

## Где лежат заявки

Все заявки сохраняются в SQLite-базу `api/leads.db` (создаётся автоматически)
и дублируются в Telegram, если он настроен. Статусы заявок:
new → in_progress → done / rejected. Менять их можно в панели /admin
или через API (см. /docs).
