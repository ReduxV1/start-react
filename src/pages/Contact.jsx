import { useState } from 'react';
import { useReveal } from '../hooks/useReveal.js';
import InnerHero from '../components/InnerHero.jsx';

const serviceOptions = [
  'Лазерная резка',
  'Гибка металла',
  'Отвёрточная сборка',
  'Порошковая покраска',
  'Сварка MIG/MAG',
  'Аргонодуговая TIG',
];

const emptyForm = {
  name: '',
  company: '',
  phone: '',
  email: '',
  quantity: '',
  message: '',
};

/* Маска телефона — перенос initPhoneMask() из main.js */
function formatPhone(value) {
  let val = value.replace(/\D/g, '');
  if (val.startsWith('8')) val = '7' + val.slice(1);
  if (val.startsWith('7')) {
    const m = val.match(/^(\d{1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})$/);
    if (m) {
      return (
        '+7' +
        (m[2] ? ' (' + m[2] : '') +
        (m[3] ? ') ' + m[3] : '') +
        (m[4] ? '-' + m[4] : '') +
        (m[5] ? '-' + m[5] : '')
      );
    }
  }
  return val.slice(0, 15);
}

export default function Contact() {
  useReveal();

  const [form, setForm] = useState(emptyForm);
  const [checked, setChecked] = useState(new Set());
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onPhone = (e) =>
    setForm((f) => ({ ...f, phone: formatPhone(e.target.value) }));

  const toggleService = (name) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setError('');
    setOk(false);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, services: [...checked] }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Не удалось отправить заявку. Попробуйте позже или позвоните нам.');
      }

      setOk(true);
      setForm(emptyForm);
      setChecked(new Set());
      setTimeout(() => setOk(false), 6000);
    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'Нет соединения с сервером. Проверьте интернет или позвоните нам.'
          : err.message
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <InnerHero crumb="Контакты" title="Свяжитесь" em="с нами" orbs={['orb-2', 'orb-3']} />

      <section className="section">
        <div className="container contact-wrap">
          {/* LEFT */}
          <div>
            <p className="contact-intro">
              Пришлите чертёж или опишите задачу — рассчитаем стоимость
              и&nbsp;сроки за&nbsp;1&nbsp;рабочий день.
            </p>

            <div className="contact-rows">
              <div className="contact-row">
                <div className="contact-row-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.07 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                </div>
                <div>
                  <span className="contact-row-label">Телефон</span>
                  <a href="tel:+70000000000" className="contact-row-val">+7 (000) 000-00-00</a>
                </div>
              </div>

              <div className="contact-row">
                <div className="contact-row-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div>
                  <span className="contact-row-label">Email</span>
                  <a href="mailto:info@meridian.ru" className="contact-row-val">info@meridian.ru</a>
                </div>
              </div>

              <div className="contact-row">
                <div className="contact-row-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                </div>
                <div>
                  <span className="contact-row-label">Telegram</span>
                  <a href="https://t.me/meridian" target="_blank" rel="noopener noreferrer" className="contact-row-val">@meridian</a>
                </div>
              </div>

              <div className="contact-row">
                <div className="contact-row-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12,6 12,12 16,14" />
                  </svg>
                </div>
                <div>
                  <span className="contact-row-label">Режим работы</span>
                  <span className="contact-row-val">Пн–Пт: 9:00–18:00</span>
                </div>
              </div>

              <div className="contact-row">
                <div className="contact-row-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <span className="contact-row-label">Адрес</span>
                  <span className="contact-row-val">г. Город, ул. Производственная, 1</span>
                </div>
              </div>
            </div>

            <div className="contact-avail">
              <div className="avail-dot"></div>
              <span>Принимаем новые заказы</span>
            </div>
          </div>

          {/* FORM */}
          <div className="form-wrap">
            <h3>Заявка на расчёт</h3>
            <form className="form" onSubmit={onSubmit}>
              <div className="form-duo">
                <div className="field">
                  <label>Имя *</label>
                  <input type="text" placeholder="Ваше имя" required value={form.name} onChange={set('name')} />
                </div>
                <div className="field">
                  <label>Компания</label>
                  <input type="text" placeholder="Организация" value={form.company} onChange={set('company')} />
                </div>
              </div>

              <div className="form-duo">
                <div className="field">
                  <label>Телефон *</label>
                  <input type="tel" placeholder="+7 (___) ___-__-__" required value={form.phone} onChange={onPhone} />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input type="email" placeholder="your@email.ru" value={form.email} onChange={set('email')} />
                </div>
              </div>

              <div className="field">
                <label>Нужные услуги</label>
                <div className="svc-checks">
                  {serviceOptions.map((name) => (
                    <label
                      key={name}
                      className={'svc-check' + (checked.has(name) ? ' on' : '')}
                    >
                      <input
                        type="checkbox"
                        checked={checked.has(name)}
                        onChange={() => toggleService(name)}
                      />
                      <span className="check-box"></span>
                      <span>{name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>Количество</label>
                <select value={form.quantity} onChange={set('quantity')}>
                  <option value="">Выберите количество...</option>
                  <option>1–10 штук (единичный заказ)</option>
                  <option>10–100 штук (мелкая серия)</option>
                  <option>100–1000 штук</option>
                  <option>более 1000 штук</option>
                </select>
              </div>

              <div className="field">
                <label>Описание задачи *</label>
                <textarea
                  rows="5"
                  placeholder="Опишите что нужно сделать. Если есть чертёж — укажите, мы свяжемся для его получения."
                  required
                  value={form.message}
                  onChange={set('message')}
                />
              </div>

              <button
                type="submit"
                className="btn-solid btn-full"
                style={{ padding: '16px' }}
                disabled={sending}
              >
                {sending ? 'Отправляем…' : 'Отправить заявку →'}
              </button>

              <div className={'form-ok' + (ok ? ' show' : '')}>
                ✓ Заявка принята! Свяжемся в течение 1 рабочего дня
              </div>
              <div className={'form-err' + (error ? ' show' : '')}>
                {error}
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
