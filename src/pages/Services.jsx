import { Link } from 'react-router-dom';
import { useReveal } from '../hooks/useReveal.js';
import InnerHero from '../components/InnerHero.jsx';
import MarqueeCta from '../components/MarqueeCta.jsx';

const services = [
  {
    id: 'laser',
    n: '01',
    title: 'Лазерная резка',
    text: 'Точная фигурная резка листового металла оптоволоконным лазером. Допуски от ±0.1 мм. Обрабатываем сталь, нержавейку и алюминий толщиной до 20 мм.',
    tags: ['Сталь до 20 мм', 'Нержавейка до 12 мм', 'Алюминий до 10 мм', 'Допуск ±0.1 мм', 'DXF / DWG / PDF'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12,5 19,12 12,19" />
      </svg>
    ),
  },
  {
    id: 'bending',
    n: '02',
    title: 'Гибка листового металла',
    text: 'Листогибочный пресс с рабочей длиной до 3000 мм. Гибка под любым углом — от простых П-образных профилей до сложных многоуровневых форм. Серийность от 1 детали.',
    tags: ['Длина до 3000 мм', 'Толщина 0.5–12 мм', 'Любой угол', 'Сложные профили'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 6 L4 18 Q4 20 6 20 L20 20" />
      </svg>
    ),
  },
  {
    id: 'assembly',
    n: '03',
    title: 'Отвёрточная сборка',
    text: 'Механическая сборка изделий из металлических компонентов. Установка крепежа, прокладок, резьбовых вставок. Упаковка и маркировка по вашему ТЗ.',
    tags: ['По вашим чертежам', 'Комплектация крепежом', 'Упаковка и маркировка', 'Серийное производство'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
      </svg>
    ),
  },
  {
    id: 'painting',
    n: '04',
    title: 'Порошковая покраска',
    text: 'Электростатическое нанесение порошкового покрытия с полимеризацией в печи. Любой цвет по каталогу RAL. Стойкость к коррозии, химии и механическим повреждениям.',
    tags: ['Все цвета RAL', 'Матовая / глянцевая', 'Антикоррозийная', 'Толщина 60–120 мкм'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
  {
    id: 'mig',
    n: '05',
    title: 'Сварка полуавтоматом',
    text: 'MIG/MAG сварка в среде защитного газа — стальные конструкции, рамы, корпуса, ёмкости. Сварные швы по ГОСТ. Высокая производительность при серийном выпуске.',
    tags: ['Сталь / Нержавейка', 'MIG / MAG', 'Швы по ГОСТ', 'Конструкции любой сложности'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26Z" />
      </svg>
    ),
  },
  {
    id: 'tig',
    n: '06',
    title: 'Аргонодуговая сварка',
    text: 'TIG-сварка алюминия, нержавейки, меди и титана. Чистый шов без пор и брызг. Идеально для тонколистового металла и деталей с высокими требованиями к внешнему виду.',
    tags: ['Алюминий', 'Нержавейка', 'Медь / Титан', 'TIG / Аргон', 'Тонколистовой металл'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22,4 12,14.01 9,11.01" />
      </svg>
    ),
  },
];

const materials = [
  { icon: '🔩', title: 'Сталь',        text: 'Ст3, 08кп, 09Г2С, конструкционные марки' },
  { icon: '✨', title: 'Нержавейка',   text: 'AISI 304, 316L, 430, пищевые марки' },
  { icon: '🪨', title: 'Алюминий',     text: 'АМг, АД31, Д16Т, листы и профили' },
  { icon: '🟠', title: 'Медь и латунь', text: 'М1, Л63 — для TIG-сварки и резки' },
];

const process = [
  { n: '01', title: 'Заявка',       text: 'Пришлите чертёж или опишите задачу в форме или мессенджере.' },
  { n: '02', title: 'Расчёт',       text: 'Считаем стоимость и сроки. Ответ за 1 рабочий день.' },
  { n: '03', title: 'Договор',      text: 'Согласуем технические требования, подписываем договор.' },
  { n: '04', title: 'Производство', text: 'Изготовление с контролем качества на каждом этапе.' },
  { n: '05', title: 'Доставка',     text: 'Самовывоз или отправка транспортной компанией по России.' },
];

export default function Services() {
  useReveal();

  return (
    <>
      <InnerHero crumb="Услуги" title="Услуги" em="металлообработки" />

      {/* 6 SERVICES */}
      <section className="section">
        <div className="container">
          <div className="sec-head">
            <div className="sec-meta">
              <span className="sec-num">01</span>
              <span className="sec-tag">Полный цикл производства</span>
            </div>
          </div>

          <div className="svc-list">
            {services.map((s) => (
              <div key={s.id} className="svc-detail reveal" id={s.id}>
                <div className="svc-detail-num">{s.n}</div>
                <div className="svc-detail-body">
                  <div className="svc-detail-head">
                    <div className="svc-detail-icon">{s.icon}</div>
                    <h3>{s.title}</h3>
                  </div>
                  <p>{s.text}</p>
                  <div className="svc-tags">
                    {s.tags.map((t) => (
                      <span key={t} className="svc-tag">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="svc-detail-photo">
                  <div className="svc-photo-placeholder">
                    {s.icon}
                    <span>Фото</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MATERIALS */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="sec-head">
            <div className="sec-meta">
              <span className="sec-num">02</span>
              <span className="sec-tag">С чем работаем</span>
            </div>
          </div>
          <div className="mat-grid">
            {materials.map((m) => (
              <div key={m.title} className="mat-card reveal">
                <span className="mat-icon">{m.icon}</span>
                <h4>{m.title}</h4>
                <p>{m.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="sec-head">
            <div className="sec-meta">
              <span className="sec-num">03</span>
              <span className="sec-tag">Как мы работаем</span>
            </div>
          </div>
          <div className="process-row">
            {process.map((p) => (
              <div key={p.n} className="proc-step reveal">
                <div className="proc-n">{p.n}</div>
                <h4>{p.title}</h4>
                <p>{p.text}</p>
              </div>
            ))}
          </div>

          <div className="svc-cta-block" style={{ marginTop: '2px' }}>
            <h2>Нужен расчёт?<br /><em>Пришлите чертёж</em></h2>
            <p>Ответим в течение 1 рабочего дня</p>
            <div className="svc-cta-actions">
              <Link to="/contact" className="btn-solid">Оставить заявку →</Link>
              <Link to="/works" className="btn-outline">Примеры работ →</Link>
            </div>
          </div>
        </div>
      </section>

      <MarqueeCta items={['Ваш заказ — следующий']} repeat={4} />
    </>
  );
}
