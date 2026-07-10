/* Шапка внутренних страниц: орбы + хлебные крошки + заголовок */
export default function InnerHero({ crumb, title, em, orbs = ['orb-1', 'orb-3'] }) {
  return (
    <section className="inner-hero">
      <div className="hero-visual">
        {orbs.map((o) => (
          <div key={o} className={`orb ${o}`} />
        ))}
      </div>
      <div className="container inner-hero-body">
        <div className="breadcrumb">
          <span>СТАРТ</span>
          <span className="breadcrumb-sep">/</span>
          <span className="bc-active">{crumb}</span>
        </div>
        <h1 className="inner-hero-title">
          {title} <em>{em}</em>
        </h1>
      </div>
    </section>
  );
}
