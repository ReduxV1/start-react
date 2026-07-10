import { Link } from 'react-router-dom';

/* Бегущая CTA-строка. items — массив фраз, повторяется repeat раз. */
export default function MarqueeCta({ items, repeat = 4 }) {
  const track = [];
  for (let i = 0; i < repeat; i++) {
    items.forEach((text, j) => {
      track.push(
        <span key={`t-${i}-${j}`}>{text}</span>,
        <span key={`d-${i}-${j}`} className="mc-dot">✦</span>
      );
    });
  }

  return (
    <section className="marquee-cta">
      <Link to="/contact" className="marquee-cta-inner">
        <div className="marquee-track">{track}</div>
      </Link>
    </section>
  );
}
