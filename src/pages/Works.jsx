import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReveal } from '../hooks/useReveal.js';
import InnerHero from '../components/InnerHero.jsx';
import MarqueeCta from '../components/MarqueeCta.jsx';

/* Видео и .glb лежат в public/models/ */
const works = [
  { model: '/models/model-1.glb', video: '/models/Ящик.mp4',                    title: 'Почтовый ящик' },
  { model: '/models/model-2.glb', video: '/models/Верстак.mp4',                 title: 'Верстак' },
  { model: '/models/model-3.glb', video: '/models/Скамья.mp4',                  title: 'Скамья' },
  { model: '/models/model-4.glb', video: '/models/Ящик инструментальный.mp4',   title: 'Ящик инструментальный' },
  { model: '/models/model-5.glb', video: '/models/Тумба.mp4',                   title: 'Тумба' },
  { model: '/models/model-6.glb', video: '/models/Корзина в сборе.mp4',         title: 'Корзина в сборе' },
];

function Badge3d() {
  return (
    <span className="work-3d-badge">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
      3D
    </span>
  );
}

export default function Works() {
  useReveal();

  const [active, setActive] = useState(null); // объект works или null
  const [progress, setProgress] = useState(0);
  const [progressDone, setProgressDone] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const viewerRef = useRef(null);

  /* Открытие модалки */
  const openModal = (work) => {
    setProgress(0);
    setProgressDone(false);
    setHintVisible(false);
    setActive(work);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setActive(null);
    document.body.style.overflow = '';
  };

  /* Escape закрывает модалку */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  /* События model-viewer: прогресс загрузки и скрытие подсказки */
  useEffect(() => {
    if (!active) return;
    const viewer = viewerRef.current;
    if (!viewer) return;

    const onProgress = (e) => {
      const pct = e.detail.totalProgress * 100;
      setProgress(pct);
      if (pct >= 100) {
        setTimeout(() => setProgressDone(true), 500);
        setTimeout(() => setHintVisible(true), 700);
      }
    };
    const onCamera = () => setHintVisible(false);
    const onError = (e) => console.error('model-viewer error', e);

    viewer.addEventListener('progress', onProgress);
    viewer.addEventListener('camera-change', onCamera, { once: true });
    viewer.addEventListener('error', onError);
    return () => {
      viewer.removeEventListener('progress', onProgress);
      viewer.removeEventListener('camera-change', onCamera);
      viewer.removeEventListener('error', onError);
    };
  }, [active]);

  /* Сброс overflow при уходе со страницы с открытой модалкой */
  useEffect(() => () => { document.body.style.overflow = ''; }, []);

  return (
    <>
      <InnerHero crumb="Примеры работ" title="Примеры" em="наших работ" />

      <section className="section">
        <div className="container">
          <div className="sec-head">
            <div className="sec-meta">
              <span className="sec-num">01</span>
              <span className="sec-tag">Детали и изделия</span>
            </div>
            <p className="works-hint">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M5 3l14 9-7 1-3 7z" />
              </svg>
              Нажмите на карточку — откроется 3D-модель
            </p>
          </div>

          <div className="works-grid">
            {works.map((w) => (
              <div
                key={w.title}
                className="work-card reveal"
                onClick={() => openModal(w)}
              >
                <div className="work-img-wrap">
                  <video src={w.video} autoPlay muted loop playsInline />
                  <div className="work-overlay">
                    <Badge3d />
                  </div>
                </div>
                <div className="work-info">
                  <h3>{w.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3D MODAL */}
      <div className={'modal3d' + (active ? ' open' : '')} role="dialog" aria-modal="true">
        <div className="modal3d-backdrop" onClick={closeModal}></div>
        <div className="modal3d-inner">
          <div className="modal3d-head">
            <div className="modal3d-meta">
              <span className="modal3d-tag"></span>
              <h2 className="modal3d-title">{active?.title || ''}</h2>
              <p className="modal3d-desc"></p>
            </div>
            <button className="modal3d-close" aria-label="Закрыть" onClick={closeModal}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="2" y1="2" x2="16" y2="16" />
                <line x1="16" y1="2" x2="2" y2="16" />
              </svg>
            </button>
          </div>

          <div className="modal3d-viewer-wrap">
            {active && (
              <model-viewer
                ref={viewerRef}
                src={active.model}
                camera-controls=""
                auto-rotate=""
                style={{ width: '100%', height: '520px', display: 'block' }}
              >
                <div className="modal3d-progress-wrap" slot="progress-bar">
                  <div
                    className="modal3d-progress-bar"
                    style={{
                      width: `${progress}%`,
                      opacity: progressDone ? 0 : 1,
                    }}
                  ></div>
                </div>
              </model-viewer>
            )}

            <div className="modal3d-hint" style={{ opacity: hintVisible ? 1 : 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4l3 3" />
              </svg>
              Перетащите для вращения · Прокрутите для зума
            </div>
          </div>

          <div className="modal3d-foot">
            <Link to="/contact" className="btn-solid" onClick={closeModal}>
              Заказать данную работу →
            </Link>
          </div>
        </div>
      </div>

      <MarqueeCta items={['Хотите так же?', 'Оставьте заявку']} repeat={4} />
    </>
  );
}
