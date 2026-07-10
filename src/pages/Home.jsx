import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useReveal } from '../hooks/useReveal.js';
import MarqueeCta from '../components/MarqueeCta.jsx';

const tickerItems = [
  'Лазерная резка',
  'Гибка металла',
  'Сварка MIG/MAG',
  'Аргонодуговая TIG',
  'Порошковая покраска',
  'Отвёрточная сборка',
];

const services = [
  { n: '01', hash: 'laser',    name: 'Лазерная резка',          desc: 'Сталь, нержавейка, алюминий · до 20 мм' },
  { n: '02', hash: 'bending',  name: 'Гибка листового металла', desc: 'Пресс до 3000 мм · любой угол' },
  { n: '03', hash: 'assembly', name: 'Отвёрточная сборка',      desc: 'Сборка, крепёж, упаковка' },
  { n: '04', hash: 'painting', name: 'Порошковая покраска',     desc: 'Все цвета RAL · антикоррозийная' },
  { n: '05', hash: 'mig',      name: 'Сварка полуавтоматом',    desc: 'MIG/MAG · конструкции любой сложности' },
  { n: '06', hash: 'tig',      name: 'Аргонодуговая сварка',    desc: 'TIG · алюминий, нержавейка, медь' },
];

const why = [
  { n: '01', title: 'Полный цикл',        text: 'Резка, гибка, сварка, покраска и сборка на одном производстве — без субподрядчиков.' },
  { n: '02', title: 'От 1 штуки',         text: 'Работаем с единичными заказами и прототипами. Малая серия — без проблем.' },
  { n: '03', title: 'Срок расчёта 1 день', text: 'Пришлите чертёж — стоимость и сроки получите в течение 1 рабочего дня.' },
  { n: '04', title: 'Контроль качества',  text: 'Допуски по чертежу, контроль на каждом этапе, фото готового изделия до отгрузки.' },
];

function TickerSet() {
  return (
    <div className="ticker-set" aria-hidden="true">
      {tickerItems.map((t) => (
        <Fragment key={t}>
          <span>{t}</span>
          <span className="sep">·</span>
        </Fragment>
      ))}
    </div>
  );
}

export default function Home() {
  useReveal();

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-visual">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>
        <div className="hero-lines">
          <div className="hline" style={{ top: '22%', left: 0, width: '38%' }}></div>
          <div className="hline" style={{ top: '55%', right: 0, width: '44%' }}></div>
          <div className="hline" style={{ top: '78%', left: 0, width: '20%' }}></div>
          <div className="vline" style={{ left: '60%', top: 0, height: '100%' }}></div>
        </div>

        <div className="hero-body">
          <div className="hero-label">
            <span className="hero-label-line"></span>
            <span>Производство деталей под заказ · с 2016 года</span>
          </div>
          <h1 className="hero-heading">
            <span className="h-line" data-d="0">Точная</span>
            <span className="h-line" data-d="1">металло-</span>
            <span className="h-line" data-d="2">обработка</span>
          </h1>
          <div className="hero-foot">
            <p className="hero-desc">
              Лазерная резка, гибка, сварка, порошковая покраска и сборка —
              полный цикл производства металлических изделий под ваш проект.
            </p>
            <div className="hero-actions">
              <Link to="/contact" className="btn-solid">Оставить заявку</Link>
              <Link to="/services" className="btn-outline">Услуги →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="ticker-wrap">
        <div className="ticker-track">
          <TickerSet />
          <TickerSet />
        </div>
      </div>

      {/* SERVICES */}
      <section className="section">
        <div className="container">
          <div className="sec-head">
            <div className="sec-meta">
              <span className="sec-num">01</span>
              <span className="sec-tag">Что мы делаем</span>
            </div>
            <h2 className="sec-title">6 видов <em>обработки металла</em></h2>
          </div>
          <div className="svc-rows">
            {services.map((s) => (
              <Link key={s.hash} to={`/services#${s.hash}`} className="svc-row reveal">
                <span className="svc-n">{s.n}</span>
                <span className="svc-name">{s.name}</span>
                <span className="svc-desc-short">{s.desc}</span>
                <span className="svc-arrow">↗</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="section">
        <div className="container">
          <div className="sec-head">
            <div className="sec-meta">
              <span className="sec-num">02</span>
              <span className="sec-tag">Почему мы</span>
            </div>
          </div>
          <div className="why-grid">
            {why.map((w) => (
              <div key={w.n} className="why-item reveal">
                <div className="why-n">{w.n}</div>
                <h4>{w.title}</h4>
                <p>{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarqueeCta items={['Отправьте нам чертёж']} repeat={8} />
    </>
  );
}
