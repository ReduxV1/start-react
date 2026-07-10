import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="logo">
              <img src="/logo.png" alt="СТАРТ" className="logo-img" />
            </Link>
            <p>
              Производство металлических деталей под заказ. Лазерная резка,
              гибка, сварка, порошковая покраска и сборка.
            </p>
          </div>
          <div className="footer-col">
            <h5>Навигация</h5>
            <ul>
              <li><Link to="/">Главная</Link></li>
              <li><Link to="/services">Услуги</Link></li>
              <li><Link to="/works">Примеры работ</Link></li>
              <li><Link to="/contact">Контакты</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>Контакты</h5>
            <ul>
              <li><span>+7 (000) 000-00-00</span></li>
              <li><span>info@start.ru</span></li>
              <li><span>Пн–Пт: 9:00–18:00</span></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-copy">© 2024 СТАРТ. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}
