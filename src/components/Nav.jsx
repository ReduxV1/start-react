import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

const links = [
  { to: '/', label: 'Главная' },
  { to: '/services', label: 'Услуги' },
  { to: '/works', label: 'Примеры' },
  { to: '/contact', label: 'Контакты' },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const drawerRef = useRef(null);
  const burgerRef = useRef(null);
  const location = useLocation();

  /* Тень навбара при скролле */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Закрыть drawer при смене маршрута */
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  /* Блокировка скролла body при открытом меню */
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  /* Клик вне drawer — закрыть */
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (
        drawerRef.current &&
        !drawerRef.current.contains(e.target) &&
        burgerRef.current &&
        !burgerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [open]);

  const navLinkClass = ({ isActive }) =>
    'nav-link' + (isActive ? ' active' : '');

  return (
    <>
      <nav className={'nav' + (scrolled ? ' scrolled' : '')} id="nav">
        <Link to="/" className="logo">
          <img src="/logo.png" alt="СТАРТ" className="logo-img" />
        </Link>
        <ul className="nav-links">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} end={l.to === '/'} className={navLinkClass}>
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <button
          ref={burgerRef}
          className={'burger' + (open ? ' open' : '')}
          id="burger"
          aria-label="Меню"
          onClick={() => setOpen((v) => !v)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>

      <div
        ref={drawerRef}
        className={'nav-drawer' + (open ? ' open' : '')}
        id="navDrawer"
      >
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={navLinkClass}
            onClick={() => setOpen(false)}
          >
            {l.label}
          </NavLink>
        ))}
        <div className="drawer-btns">
          <Link
            to="/contact"
            className="btn-solid btn-full"
            onClick={() => setOpen(false)}
          >
            Оставить заявку
          </Link>
        </div>
      </div>
    </>
  );
}
