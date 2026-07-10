"""
=============================================
API сайта СТАРТ — FastAPI + SQLite
=============================================

Запуск (из корня проекта):
    python -m uvicorn main:app --app-dir api --port 3001 --reload

Интерактивная документация (Swagger):
    http://localhost:3001/docs

Эндпоинты:
    POST   /api/contact          — приём заявки с формы (публичный)
    GET    /api/health           — проверка, что сервер жив (публичный)
    GET    /api/leads            — список заявок с фильтрами   (админ)
    GET    /api/leads/{id}       — одна заявка                 (админ)
    PATCH  /api/leads/{id}       — смена статуса / заметка     (админ)
    DELETE /api/leads/{id}       — удаление заявки             (админ)
    GET    /api/stats            — статистика по заявкам       (админ)

Админ-эндпоинты требуют заголовок:
    X-Admin-Token: <значение ADMIN_TOKEN из .env>
"""

import json
import os
import re
import sqlite3
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import httpx
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator

# ─── Конфигурация ────────────────────────────────────────────

BASE_DIR = Path(__file__).resolve().parent          # папка api/
ROOT_DIR = BASE_DIR.parent                          # корень проекта
DIST_DIR = ROOT_DIR / "dist"                        # собранный фронтенд
DB_PATH = BASE_DIR / "leads.db"

load_dotenv(ROOT_DIR / ".env")

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "")

STATUSES = ("new", "in_progress", "done", "rejected")
STATUS_LABELS = {
    "new": "Новая",
    "in_progress": "В работе",
    "done": "Выполнена",
    "rejected": "Отклонена",
}

# ─── База данных ─────────────────────────────────────────────


def db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db() -> None:
    with db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS leads (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at  TEXT NOT NULL,
                updated_at  TEXT NOT NULL,
                name        TEXT NOT NULL,
                company     TEXT NOT NULL DEFAULT '',
                phone       TEXT NOT NULL,
                email       TEXT NOT NULL DEFAULT '',
                services    TEXT NOT NULL DEFAULT '[]',
                quantity    TEXT NOT NULL DEFAULT '',
                message     TEXT NOT NULL,
                status      TEXT NOT NULL DEFAULT 'new',
                note        TEXT NOT NULL DEFAULT ''
            )
            """
        )


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def row_to_lead(row: sqlite3.Row) -> dict:
    d = dict(row)
    d["services"] = json.loads(d["services"])
    return d


# ─── Схемы ───────────────────────────────────────────────────


class ContactIn(BaseModel):
    """Заявка с формы сайта."""

    name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=10, max_length=30)
    message: str = Field(min_length=5, max_length=3000)
    company: str = Field(default="", max_length=200)
    email: str = Field(default="", max_length=200)
    quantity: str = Field(default="", max_length=100)
    services: list[str] = Field(default_factory=list, max_length=10)

    @field_validator("phone")
    @classmethod
    def phone_has_digits(cls, v: str) -> str:
        if len(re.sub(r"\D", "", v)) < 10:
            raise ValueError("Телефон должен содержать не менее 10 цифр")
        return v.strip()

    @field_validator("name", "message", "company", "email", "quantity")
    @classmethod
    def strip_str(cls, v: str) -> str:
        return v.strip()

    @field_validator("services")
    @classmethod
    def clip_services(cls, v: list[str]) -> list[str]:
        return [str(s)[:60] for s in v]


class LeadPatch(BaseModel):
    """Изменение заявки админом."""

    status: Optional[str] = None
    note: Optional[str] = Field(default=None, max_length=2000)

    @field_validator("status")
    @classmethod
    def status_valid(cls, v):
        if v is not None and v not in STATUSES:
            raise ValueError(f"Статус должен быть одним из: {', '.join(STATUSES)}")
        return v


# ─── Авторизация админа ──────────────────────────────────────


def require_admin(x_admin_token: str = Header(default="", alias="X-Admin-Token")):
    if not ADMIN_TOKEN:
        raise HTTPException(503, "ADMIN_TOKEN не задан в .env — задайте его и перезапустите сервер")
    if x_admin_token != ADMIN_TOKEN:
        raise HTTPException(401, "Неверный админ-токен")


# ─── Rate limit (5 заявок в минуту с одного IP) ─────────────

_hits: dict[str, list[float]] = {}


def rate_limited(ip: str, limit: int = 5, window: float = 60.0) -> bool:
    now = time.monotonic()
    arr = [t for t in _hits.get(ip, []) if now - t < window]
    arr.append(now)
    _hits[ip] = arr
    return len(arr) > limit


# ─── Telegram ────────────────────────────────────────────────


def build_text(d: ContactIn) -> str:
    lines = [
        "🔧 Новая заявка с сайта СТАРТ",
        "",
        f"👤 Имя: {d.name}",
        f"🏢 Компания: {d.company}" if d.company else "",
        f"📞 Телефон: {d.phone}",
        f"✉️ Email: {d.email}" if d.email else "",
        f"⚙️ Услуги: {', '.join(d.services)}" if d.services else "",
        f"📦 Количество: {d.quantity}" if d.quantity else "",
        "",
        "📝 Задача:",
        d.message,
    ]
    return "\n".join(line for line in lines if line != "")


async def send_telegram(text: str) -> bool:
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        return False
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(url, json={"chat_id": TELEGRAM_CHAT_ID, "text": text})
        resp.raise_for_status()
    return True


# ─── Приложение ──────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    print(f"База данных: {DB_PATH}")
    if not TELEGRAM_BOT_TOKEN:
        print("⚠ TELEGRAM_BOT_TOKEN не задан — уведомления в Telegram отключены, заявки сохраняются в базу")
    if not ADMIN_TOKEN:
        print("⚠ ADMIN_TOKEN не задан — админ-эндпоинты недоступны (задайте в .env)")
    yield


app = FastAPI(
    title="СТАРТ — API заявок",
    description="Приём заявок с сайта, хранение в SQLite, уведомления в Telegram, админ-эндпоинты для отслеживания.",
    version="1.0.0",
    lifespan=lifespan,
)


# ─── Публичные эндпоинты ─────────────────────────────────────


@app.get("/api/health", tags=["Публичные"])
def health():
    """Проверка, что API работает."""
    with db() as conn:
        total = conn.execute("SELECT COUNT(*) FROM leads").fetchone()[0]
    return {
        "ok": True,
        "time": now_iso(),
        "leads_total": total,
        "telegram_configured": bool(TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID),
    }


@app.post("/api/contact", tags=["Публичные"])
async def create_contact(payload: ContactIn, request: Request):
    """Приём заявки с формы сайта. Сохраняет в базу и шлёт уведомление в Telegram."""
    ip = request.client.host if request.client else "unknown"
    if rate_limited(ip):
        raise HTTPException(429, "Слишком много запросов, попробуйте позже")

    ts = now_iso()
    with db() as conn:
        cur = conn.execute(
            """
            INSERT INTO leads (created_at, updated_at, name, company, phone,
                               email, services, quantity, message)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                ts, ts, payload.name, payload.company, payload.phone,
                payload.email, json.dumps(payload.services, ensure_ascii=False),
                payload.quantity, payload.message,
            ),
        )
        lead_id = cur.lastrowid

    # Telegram — не критичен: если упал, заявка уже в базе
    try:
        await send_telegram(build_text(payload) + f"\n\n#заявка_{lead_id}")
    except Exception as exc:  # noqa: BLE001
        print(f"[contact] Telegram не сработал (заявка #{lead_id} сохранена в базе): {exc}")

    return {"ok": True, "id": lead_id}


# ─── Админ-эндпоинты ─────────────────────────────────────────


@app.get("/api/leads", tags=["Админ"], dependencies=[Depends(require_admin)])
def list_leads(
    status: Optional[str] = Query(default=None, description="Фильтр по статусу"),
    q: Optional[str] = Query(default=None, description="Поиск по имени/телефону/тексту"),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
):
    """Список заявок: фильтр по статусу, поиск, пагинация. Новые сверху."""
    if status is not None and status not in STATUSES:
        raise HTTPException(400, f"Статус должен быть одним из: {', '.join(STATUSES)}")

    where, params = [], []
    if status:
        where.append("status = ?")
        params.append(status)
    if q:
        like = f"%{q}%"
        where.append("(name LIKE ? OR phone LIKE ? OR message LIKE ? OR company LIKE ?)")
        params += [like, like, like, like]
    where_sql = ("WHERE " + " AND ".join(where)) if where else ""

    with db() as conn:
        total = conn.execute(f"SELECT COUNT(*) FROM leads {where_sql}", params).fetchone()[0]
        rows = conn.execute(
            f"SELECT * FROM leads {where_sql} ORDER BY id DESC LIMIT ? OFFSET ?",
            params + [per_page, (page - 1) * per_page],
        ).fetchall()

    return {
        "items": [row_to_lead(r) for r in rows],
        "total": total,
        "page": page,
        "pages": max(1, -(-total // per_page)),
    }


@app.get("/api/leads/{lead_id}", tags=["Админ"], dependencies=[Depends(require_admin)])
def get_lead(lead_id: int):
    """Одна заявка по id."""
    with db() as conn:
        row = conn.execute("SELECT * FROM leads WHERE id = ?", (lead_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Заявка не найдена")
    return row_to_lead(row)


@app.patch("/api/leads/{lead_id}", tags=["Админ"], dependencies=[Depends(require_admin)])
def patch_lead(lead_id: int, patch: LeadPatch):
    """Изменить статус заявки и/или заметку."""
    fields, params = [], []
    if patch.status is not None:
        fields.append("status = ?")
        params.append(patch.status)
    if patch.note is not None:
        fields.append("note = ?")
        params.append(patch.note.strip())
    if not fields:
        raise HTTPException(400, "Нечего обновлять: передайте status и/или note")

    fields.append("updated_at = ?")
    params += [now_iso(), lead_id]

    with db() as conn:
        cur = conn.execute(f"UPDATE leads SET {', '.join(fields)} WHERE id = ?", params)
        if cur.rowcount == 0:
            raise HTTPException(404, "Заявка не найдена")
        row = conn.execute("SELECT * FROM leads WHERE id = ?", (lead_id,)).fetchone()
    return row_to_lead(row)


@app.delete("/api/leads/{lead_id}", tags=["Админ"], dependencies=[Depends(require_admin)])
def delete_lead(lead_id: int):
    """Удалить заявку."""
    with db() as conn:
        cur = conn.execute("DELETE FROM leads WHERE id = ?", (lead_id,))
    if cur.rowcount == 0:
        raise HTTPException(404, "Заявка не найдена")
    return {"ok": True}


@app.get("/api/stats", tags=["Админ"], dependencies=[Depends(require_admin)])
def stats():
    """Статистика: всего, по статусам, за последние 7 дней."""
    with db() as conn:
        total = conn.execute("SELECT COUNT(*) FROM leads").fetchone()[0]
        by_status = {s: 0 for s in STATUSES}
        for row in conn.execute("SELECT status, COUNT(*) c FROM leads GROUP BY status"):
            by_status[row["status"]] = row["c"]
        week = conn.execute(
            "SELECT COUNT(*) FROM leads WHERE created_at >= datetime('now', '-7 days')"
        ).fetchone()[0]
    return {
        "total": total,
        "by_status": by_status,
        "status_labels": STATUS_LABELS,
        "last_7_days": week,
    }


# ─── Продакшен: раздача собранного фронтенда ────────────────

if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str):
        candidate = DIST_DIR / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(DIST_DIR / "index.html")
