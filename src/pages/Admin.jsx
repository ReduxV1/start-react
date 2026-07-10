import { useCallback, useEffect, useState } from 'react';
import InnerHero from '../components/InnerHero.jsx';

const STATUS_LABELS = {
  new: 'Новая',
  in_progress: 'В работе',
  done: 'Выполнена',
  rejected: 'Отклонена',
};

const FILTERS = [
  { value: '', label: 'Все' },
  { value: 'new', label: 'Новые' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'done', label: 'Выполненные' },
  { value: 'rejected', label: 'Отклонённые' },
];

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem('adminToken') || '');
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState('');

  const [stats, setStats] = useState(null);
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  const api = useCallback(
    async (path, options = {}) => {
      const res = await fetch(path, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token,
          ...options.headers,
        },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.detail || `Ошибка ${res.status}`);
      }
      return json;
    },
    [token]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (status) params.set('status', status);
      if (q) params.set('q', q);
      const [list, st] = await Promise.all([
        api(`/api/leads?${params}`),
        api('/api/stats'),
      ]);
      setLeads(list.items);
      setTotal(list.total);
      setPages(list.pages);
      setStats(st);
      setAuthed(true);
      localStorage.setItem('adminToken', token);
    } catch (err) {
      setError(err.message);
      if (String(err.message).includes('токен')) setAuthed(false);
    } finally {
      setLoading(false);
    }
  }, [api, page, status, q, token]);

  useEffect(() => {
    if (authed) load();
  }, [authed, page, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const login = (e) => {
    e.preventDefault();
    load();
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setToken('');
    setAuthed(false);
    setLeads([]);
    setStats(null);
  };

  const changeStatus = async (id, newStatus) => {
    try {
      await api(`/api/leads/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm(`Удалить заявку #${id}? Действие необратимо.`)) return;
    try {
      await api(`/api/leads/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  /* ─── Экран входа ─────────────────────────── */
  if (!authed) {
    return (
      <>
        <InnerHero crumb="Админ" title="Панель" em="заявок" />
        <section className="section">
          <div className="container">
            <div className="admin-login">
              <form className="form" onSubmit={login}>
                <div className="field">
                  <label>Админ-токен</label>
                  <input
                    type="password"
                    placeholder="Значение ADMIN_TOKEN из .env"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-solid btn-full" disabled={loading}>
                  {loading ? 'Проверяем…' : 'Войти →'}
                </button>
                <div className={'form-err' + (error ? ' show' : '')}>{error}</div>
              </form>
            </div>
          </div>
        </section>
      </>
    );
  }

  /* ─── Панель ──────────────────────────────── */
  return (
    <>
      <InnerHero crumb="Админ" title="Панель" em="заявок" />
      <section className="section">
        <div className="container">
          {/* Статистика */}
          {stats && (
            <div className="admin-stats">
              <div className="admin-stat">
                <span className="admin-stat-n">{stats.total}</span>
                <span className="admin-stat-l">Всего</span>
              </div>
              <div className="admin-stat">
                <span className="admin-stat-n">{stats.last_7_days}</span>
                <span className="admin-stat-l">За 7 дней</span>
              </div>
              {Object.entries(stats.by_status).map(([s, n]) => (
                <div key={s} className="admin-stat">
                  <span className="admin-stat-n">{n}</span>
                  <span className="admin-stat-l">{STATUS_LABELS[s]}</span>
                </div>
              ))}
            </div>
          )}

          {/* Панель управления */}
          <div className="admin-toolbar">
            <div className="admin-filters">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  className={'admin-filter' + (status === f.value ? ' on' : '')}
                  onClick={() => { setStatus(f.value); setPage(1); }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <form
              className="admin-search"
              onSubmit={(e) => { e.preventDefault(); setPage(1); load(); }}
            >
              <input
                type="text"
                placeholder="Поиск: имя, телефон, текст…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button type="submit" className="btn-outline">Найти</button>
            </form>
            <button className="btn-outline" onClick={logout}>Выйти</button>
          </div>

          <div className={'form-err' + (error ? ' show' : '')}>{error}</div>

          {/* Список заявок */}
          <div className="admin-leads">
            {leads.length === 0 && !loading && (
              <p className="admin-empty">Заявок пока нет</p>
            )}
            {leads.map((l) => (
              <div key={l.id} className={`admin-lead status-${l.status}`}>
                <div className="admin-lead-head">
                  <span className="admin-lead-id">#{l.id}</span>
                  <span className="admin-lead-date">{fmtDate(l.created_at)}</span>
                  <select
                    className="admin-lead-status"
                    value={l.status}
                    onChange={(e) => changeStatus(l.id, e.target.value)}
                  >
                    {Object.entries(STATUS_LABELS).map(([v, label]) => (
                      <option key={v} value={v}>{label}</option>
                    ))}
                  </select>
                  <button className="admin-lead-del" onClick={() => remove(l.id)} title="Удалить">
                    ✕
                  </button>
                </div>
                <div className="admin-lead-body">
                  <div className="admin-lead-who">
                    <strong>{l.name}</strong>
                    {l.company && <span> · {l.company}</span>}
                    <span> · <a href={`tel:${l.phone}`}>{l.phone}</a></span>
                    {l.email && <span> · <a href={`mailto:${l.email}`}>{l.email}</a></span>}
                  </div>
                  {(l.services.length > 0 || l.quantity) && (
                    <div className="admin-lead-meta">
                      {l.services.join(', ')}
                      {l.services.length > 0 && l.quantity && ' · '}
                      {l.quantity}
                    </div>
                  )}
                  <p className="admin-lead-msg">{l.message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Пагинация */}
          {pages > 1 && (
            <div className="admin-pager">
              <button
                className="btn-outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Назад
              </button>
              <span>{page} / {pages} · всего {total}</span>
              <button
                className="btn-outline"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Вперёд →
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
