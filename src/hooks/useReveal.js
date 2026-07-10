import { useEffect } from 'react';

/* Перенос initReveal() из main.js:
   элементы .reveal получают класс .in при появлении во вьюпорте,
   с каскадной задержкой внутри одного родителя. */
export function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const siblings = [
              ...entry.target.parentElement.querySelectorAll('.reveal:not(.in)'),
            ];
            const delay = siblings.indexOf(entry.target);
            setTimeout(
              () => entry.target.classList.add('in'),
              Math.min(delay * 90, 360)
            );
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}
