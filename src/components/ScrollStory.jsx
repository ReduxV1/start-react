import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import Env from './ThreeEnv.jsx';

const MODEL_URL = '/models/model-1.glb';

/* Этапы производства: текст слева + вид материала детали.
   На финальном этапе override снимается — деталь показывается
   с реальными материалами из .glb (металл + дерево). */
const STAGES = [
  {
    tag: 'Чертёж',
    title: 'Вы отправляете чертёж',
    desc: 'DWG, DXF, STEP или PDF — считаем стоимость и срок производства за 1 рабочий день.',
    mat: { color: '#5b8af5', wireframe: true,  metalness: 0.1,  roughness: 0.6  },
  },
  {
    tag: 'Лазерная резка',
    title: 'Режем из листа до 20 мм',
    desc: 'Сталь, нержавейка, алюминий. Чистая кромка без окалины, допуски по чертежу.',
    mat: { color: '#9aa0ab', wireframe: false, metalness: 0.85, roughness: 0.35 },
  },
  {
    tag: 'Гибка и сварка',
    title: 'Гнём и свариваем в сборку',
    desc: 'Листогиб до 3000 мм, сварка MIG/MAG и аргонодуговая TIG. Контроль геометрии на каждом этапе.',
    mat: { color: '#6a7078', wireframe: false, metalness: 0.9,  roughness: 0.28 },
  },
  {
    tag: 'Покраска и сборка',
    title: 'Красим и собираем изделие',
    desc: 'Порошковая покраска металла в любой цвет RAL, деревянные элементы, упаковка. Фото готового изделия — до отгрузки.',
    mat: null,
  },
];

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

function PartModel({ progressRef, dragRef, reduced, shiftX, onReady }) {
  const group = useRef();
  const { scene } = useGLTF(MODEL_URL);

  const override = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(STAGES[0].mat.color),
        metalness: STAGES[0].mat.metalness,
        roughness: STAGES[0].mat.roughness,
        wireframe: STAGES[0].mat.wireframe,
      }),
    []
  );

  const model = useMemo(() => {
    const s = scene.clone(true);
    const meshes = [];
    s.traverse((o) => {
      if (o.isMesh) {
        meshes.push({ mesh: o, orig: o.material });
        o.material = override;
      }
    });
    const box = new THREE.Box3().setFromObject(s);
    const size = box.getSize(new THREE.Vector3());
    const k = 2.05 / Math.max(size.x, size.y, size.z);
    s.scale.setScalar(k);
    return { obj: s, meshes };
  }, [scene, override]);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  const tmpColor = useMemo(() => new THREE.Color(), []);
  const finalRef = useRef(false);

  useFrame((state, delta) => {
    const p = progressRef.current;
    const stage = Math.min(STAGES.length - 1, Math.floor(p * STAGES.length));
    const isFinal = STAGES[stage].mat === null;

    /* На финальном этапе — реальные материалы из .glb, до него — override */
    if (isFinal !== finalRef.current) {
      finalRef.current = isFinal;
      model.meshes.forEach(({ mesh, orig }) => {
        mesh.material = isFinal ? orig : override;
      });
    }

    if (!isFinal) {
      const m = STAGES[stage].mat;
      const k = 1 - Math.pow(0.0001, delta);
      override.color.lerp(tmpColor.set(m.color), k);
      override.metalness += (m.metalness - override.metalness) * k;
      override.roughness += (m.roughness - override.roughness) * k;
      override.wireframe = m.wireframe;
    }

    const g = group.current;
    if (!g) return;

    /* Ручное вращение: инерция после отпускания + ограничение наклона */
    const d = dragRef.current;
    if (!d.active) {
      d.y += d.vy;
      d.x += d.vx;
      d.vy *= 0.94;
      d.vx *= 0.94;
    }
    d.x = clamp(d.x, -0.7, 0.7);

    const baseY = reduced ? state.clock.elapsedTime * 0.15 : 0.5 + p * Math.PI * 2.2;
    const targetY = baseY + d.y;
    g.rotation.y += (targetY - g.rotation.y) * Math.min(1, 6 * delta);
    g.rotation.x = 0.15 + Math.sin(p * Math.PI) * 0.08 + d.x;
    g.position.x = shiftX;
    g.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.04;
  });

  return (
    <group ref={group}>
      <Center>
        <primitive object={model.obj} />
      </Center>
    </group>
  );
}

useGLTF.preload(MODEL_URL);

export default function ScrollStory() {
  const sectionRef = useRef(null);
  const barRef = useRef(null);
  const progressRef = useRef(0);
  const dragRef = useRef({ x: 0, y: 0, vx: 0, vy: 0, lastX: 0, lastY: 0, active: false });
  const [stage, setStage] = useState(0);
  const [ready, setReady] = useState(false);
  const [reduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [narrow, setNarrow] = useState(() => window.innerWidth < 960);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      progressRef.current = p;
      if (barRef.current) barRef.current.style.width = `${(p * 100).toFixed(1)}%`;
      setStage(Math.min(STAGES.length - 1, Math.floor(p * STAGES.length)));
      setNarrow(window.innerWidth < 960);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const s = STAGES[stage];
  const isFinal = stage === STAGES.length - 1;

  /* Вращение детали мышью / пальцем поверх скролл-анимации */
  const onPointerDown = (e) => {
    const d = dragRef.current;
    d.active = true;
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    d.vx = 0;
    d.vy = 0;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch { /* некоторые браузеры не знают этот pointerId — не критично */ }
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d.active) return;
    const dx = e.clientX - d.lastX;
    const dy = e.clientY - d.lastY;
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    d.y += dx * 0.006;
    d.x += dy * 0.004;
    d.vy = dx * 0.006;
    d.vx = dy * 0.004;
  };

  const onPointerUp = () => {
    dragRef.current.active = false;
  };

  return (
    <section className="story" ref={sectionRef}>
      <div className="story-sticky">
        <div
          className="story-canvas-wrap"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <Canvas
            dpr={[1, 2]}
            camera={{ position: [0, 0.35, 4.2], fov: 38 }}
            gl={{ alpha: true, antialias: true }}
          >
            <ambientLight intensity={0.35} />
            <directionalLight position={[4, 5, 3]} intensity={1.1} />
            <directionalLight position={[-5, 2, -4]} intensity={0.35} color="#8fb0ff" />
            <Env />
            <Suspense fallback={null}>
              <PartModel
                progressRef={progressRef}
                dragRef={dragRef}
                reduced={reduced}
                shiftX={narrow ? 0 : 1.05}
                onReady={() => setReady(true)}
              />
            </Suspense>
          </Canvas>
        </div>

        {!ready && <div className="story-loader">Загружаем 3D-модель…</div>}

        <div className="story-ui">
          <div className="story-head">
            <span className="sec-num">01</span>
            <span className="sec-tag">Полный цикл производства</span>
          </div>

          <div className={'story-stage' + (isFinal ? ' final' : '')} key={stage}>
            <div className="story-tag">
              [ 0{stage + 1} / 0{STAGES.length} — {s.tag} ]
            </div>
            <h3 className="story-title">{s.title}</h3>
            <p className="story-desc">{s.desc}</p>
            {isFinal && (
              <Link to="/contact" className="btn-solid story-cta">
                Отправить чертёж
              </Link>
            )}
          </div>

          <div className="story-foot">
            <div className="story-dots">
              {STAGES.map((_, i) => (
                <span key={i} className={i <= stage ? 'on' : ''} />
              ))}
            </div>
            <div className="story-bar">
              <span ref={barRef} />
            </div>
            <span className="story-hint">Листайте — этапы · Тяните мышью — вращение</span>
          </div>
        </div>
      </div>
    </section>
  );
}
