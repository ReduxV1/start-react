import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReveal } from '../hooks/useReveal.js';
import InnerHero from '../components/InnerHero.jsx';
import MarqueeCta from '../components/MarqueeCta.jsx';

/* three.js тяжёлый — 3D-вставки грузятся отдельным чанком */
const ServiceViewer = lazy(() => import('../components/ServiceViewer.jsx'));

const services = [
  {
    id: 'laser',
    n: '01',
    title: 'Лазерная резка',
    short: 'Резка',
    stage: 'wireframe',
    stageLabel: 'Этап: раскрой по чертежу',
    text: 'Точная фигурная резка листового металла оптоволоконным лазером. Допуски от ±0.1 мм. Обрабатываем сталь, нержавейку и алюминий толщиной до 20 мм.',
    tags: ['Сталь до 20 мм', 'Нержавейка до 12 мм', 'Алюминий до 10 мм', 'Допуск ±0.1 мм', 'DXF / DWG / PDF'],
  },
  {
    id: 'bending',
    n: '02',
    title: 'Гибка листового металла',
    short: 'Гибка',
    stage: 'steel',
    stageLabel: 'Этап: заготовка после резки',
    text: 'Листогибочный пресс с рабочей длиной до 3000 мм. Гибка под любым углом — от простых П-образных профилей до сложных многоуровневых форм. Серийность от 1 детали.',
    tags: ['Длина до 3000 мм', 'Толщина 0.5–12 мм', 'Любой угол', 'Сложные профили'],
  },
  {
    id: 'mig',
    n: '03',
    title: 'Сварка полуавтоматом',
    short: 'MIG/MAG',
    stage: 'weld',
    stageLabel: 'Этап: сварная сборка',
    text: 'MIG/MAG сварка в среде защитного газа — стальные конструкции, рамы, корпуса, ёмкости. Сварные швы по ГОСТ. Высокая производительность при серийном выпуске.',
    tags: ['Сталь / Нержавейка', 'MIG / MAG', 'Швы по ГОСТ', 'Конструкции любой сложности'],
  },
  {
    id: 'tig',
    n: '04',
    title: 'Аргонодуговая сварка',
    short: 'TIG',
    stage: 'polished',
    stageLabel: 'Этап: чистовой шов',
    text: 'TIG-сварка алюминия, нержавейки, меди и титана. Чистый шов без пор и брызг. Идеально для тонколистового металла и деталей с высокими требованиями к внешнему виду.',
    tags: ['Алюминий', 'Нержавейка', 'Медь / Титан', 'TIG / Аргон', 'Тонколистовой металл'],
  },
  {
    id: 'painting',
    n: '05',
    title: 'Порошковая покраска',
    short: 'Покраска',
    stage: 'dark',
    stageLabel: 'Этап: подготовка к покраске',
    text: 'Электростатическое нанесение порошкового покрытия с полимеризацией в печи. Любой цвет по каталогу RAL. Стойкость к коррозии, химии и механическим повреждениям.',
    tags: ['Все цвета RAL', 'Матовая / глянцевая', 'Антикоррозийная', 'Толщина 60–120 мкм'],
  },
  {
    id: 'assembly',
    n: '06',
    title: 'Отвёрточная сборка',
    short: 'Сборка',
    stage: 'real',
    stageLabel: 'Готовое изделие',
    text: 'Механическая сборка изделий из металлических компонентов. Установка крепежа, прокладок, резьбовых вставок. Упаковка и маркировка по вашему ТЗ.',
    tags: ['По вашим чертежам', 'Комплектация крепежом', 'Упаковка и маркировка', 'Серийное производство'],
  },
];

const facts = [
  { n: '6',      l: 'видов обработки' },
  { n: '±0.1',   l: 'мм — допуск резки' },
  { n: '1 день', l: 'на расчёт заказа' },
  { n: 'от 1',   l: 'штуки — любой тираж' },
];

const materials = [
  { name: 'Сталь',             grades: 'Ст3 · 08кп · 09Г2С',    stock: 'Лист 0.5–20 мм', ops: 'Резка · Гибка · MIG/MAG · Покраска' },
  { name: 'Нержавеющая сталь', grades: 'AISI 304 · 316L · 430', stock: 'Лист 0.5–12 мм', ops: 'Резка · Гибка · TIG' },
  { name: 'Алюминий',          grades: 'АМг2 · АД31 · Д16Т',    stock: 'Лист 0.5–10 мм', ops: 'Резка · Гибка · TIG' },
  { name: 'Медь и латунь',     grades: 'М1 · Л63',              stock: 'Лист 0.5–6 мм',  ops: 'Резка · TIG' },
];

const process = [
  { n: '01', title: 'Заявка',       text: 'Пришлите чертёж или опишите задачу в форме или мессенджере.' },
  { n: '02', title: 'Расчёт',       text: 'Считаем стоимость и сроки. Ответ за 1 рабочий день.' },
  { n: '03', title: 'Договор',      text: 'Согласуем технические требования, подписываем договор.' },
  { n: '04', title: 'Производство', text: 'Изготовление с контролем качества на каждом этапе.' },
  { n: '05', title: 'Доставка',     text: 'Самовывоз или отправка транспортной компанией по России.' },
];

function ViewerFallback() {
  return <div className="svcv"><span className="svcv-label">Загружаем 3D…</span></div>;
}

export default function Services() {
  useReveal();

  /* Scroll-spy: подсветка активной услуги в sticky-оглавлении */
  const [activeId, setActiveId] = useState(services[0].id);
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveId(e.target.id);
        });
      },
      { rootMargin: '-35% 0px -55% 0px' }
    );
    services.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  /* Линия прогресса в секции «Как мы работаем» */
  const procRef = useRef(null);
  const procBarRef = useRef(null);
  const [litSteps, setLitSteps] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = procRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.3)));
      if (procBarRef.current) procBarRef.current.style.width = `${(p * 100).toFixed(1)}%`;
      setLitSteps(Math.round(p * process.length));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <InnerHero crumb="Услуги" title="Услуги" em="металлообработки" />

      {/* FACTS STRIP */}
      <div className="svc-facts">
        <div className="container svc-facts-inner">
          {facts.map((f) => (
            <div key={f.l} className="svc-fact">
              <span className="svc-fact-n">{f.n}</span>
              <span className="svc-fact-l">{f.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 6 SERVICES + STICKY RAIL */}
      <section className="section">
        <div className="container">
          <div className="sec-head">
            <div className="sec-meta">
              <span className="sec-num">01</span>
              <span className="sec-tag">Полный цикл производства</span>
            </div>
            <p className="works-hint">Деталь в каждом блоке можно вращать мышью</p>
          </div>

          <div className="svc-layout">
            <nav className="svc-rail" aria-label="Навигация по услугам">
              <span className="svc-rail-title">Услуги</span>
              {services.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={'svc-rail-link' + (activeId === s.id ? ' on' : '')}
                >
                  <span className="svc-rail-n">{s.n}</span> {s.short}
                </a>
              ))}
            </nav>

            <div className="svc-list">
              {services.map((s) => (
                <div key={s.id} className="svc-detail reveal" id={s.id}>
                  <div className="svc-detail-num">{s.n}</div>
                  <div className="svc-detail-body">
                    <div className="svc-detail-head">
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
                    <Suspense fallback={<ViewerFallback />}>
                      <ServiceViewer stage={s.stage} label={s.stageLabel} />
                    </Suspense>
                  </div>
                </div>
              ))}
            </div>
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
          <div className="mat-table reveal">
            <div className="mat-row mat-row-head">
              <span>Материал</span>
              <span>Марки</span>
              <span>Сортамент</span>
              <span>Операции</span>
            </div>
            {materials.map((m) => (
              <div key={m.name} className="mat-row">
                <span className="mat-name">{m.name}</span>
                <span data-label="Марки">{m.grades}</span>
                <span data-label="Сортамент">{m.stock}</span>
                <span data-label="Операции">{m.ops}</span>
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

          <div ref={procRef}>
            <div className="proc-track">
              <span ref={procBarRef} />
            </div>
            <div className="process-row">
              {process.map((p, i) => (
                <div key={p.n} className={'proc-step reveal' + (i < litSteps ? ' lit' : '')}>
                  <div className="proc-n">{p.n}</div>
                  <h4>{p.title}</h4>
                  <p>{p.text}</p>
                </div>
              ))}
            </div>
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
