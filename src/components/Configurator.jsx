import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Center, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import Env from './ThreeEnv.jsx';

/* Ходовые цвета порошковой покраски */
const RAL_COLORS = [
  { name: 'RAL 9005 Чёрный',      hex: '#0e0e10' },
  { name: 'RAL 7016 Антрацит',    hex: '#383e42' },
  { name: 'RAL 7035 Светло-серый', hex: '#c5c7c4' },
  { name: 'RAL 9006 Алюминий',    hex: '#a5a8a6' },
  { name: 'RAL 9016 Белый',       hex: '#f1f1ee' },
  { name: 'RAL 3020 Красный',     hex: '#c1121c' },
  { name: 'RAL 2004 Оранжевый',   hex: '#e25303' },
  { name: 'RAL 1023 Жёлтый',      hex: '#f7b500' },
  { name: 'RAL 6018 Зелёный',     hex: '#57a639' },
  { name: 'RAL 5015 Голубой',     hex: '#1761ab' },
];

const WOOD_TONES = [
  { name: 'Сосна', hex: '#d9b380' },
  { name: 'Дуб',   hex: '#b8905f' },
  { name: 'Орех',  hex: '#6b4a2f' },
  { name: 'Венге', hex: '#3e2b23' },
];

const LEVELS = [
  { id: 'all',  label: 'Изделие' },
  { id: 'mat',  label: 'Материалы' },
  { id: 'part', label: 'Детали' },
];

/* Перевод типовых имён материалов из CAD-экспорта */
const MAT_RU = {
  'Matte Aluminum':    'Матовый алюминий',
  'Matte Steel':       'Матовая сталь',
  'Polished Aluminum': 'Полированный алюминий',
  'Polished Nickel':   'Полированный никель',
  'Polished Steel':    'Полированная сталь',
  'color':             'Окрашенный металл',
  'Wood':              'Дерево',
  'Glass':             'Стекло',
};

/* «1_1-1_-_Деталь» → «1_1-1», «Замок_Smart-1_-_Деталь» → «Замок Smart-1» */
const prettyPartName = (raw) => {
  const n = raw
    .replace(/_?-?_?Деталь$/iu, '')
    .replace(/[_]+$/g, '')
    .replace(/_/g, ' ')
    .trim();
  return n || raw;
};

function ConfigModel({ url, onParts, onPick, onReady }) {
  const { scene } = useGLTF(url);

  const data = useMemo(() => {
    const s = scene.clone(true);
    const parts = [];
    let i = 0;
    s.traverse((o) => {
      if (o.isMesh && o.material) {
        const src = Array.isArray(o.material) ? o.material[0] : o.material;
        const mat = src.clone();
        o.material = mat;
        i += 1;
        const rawName = (o.name || '').trim();
        const rawMat = (src.name || '').trim();
        parts.push({
          id: o.uuid,
          name: rawName ? prettyPartName(rawName) : `Деталь ${i}`,
          matName: rawMat ? (MAT_RU[rawMat] || rawMat) : 'Материал',
          origColor: mat.color ? mat.color.getHex() : 0xffffff,
          mesh: o,
        });
      }
    });
    const box = new THREE.Box3().setFromObject(s);
    const size = box.getSize(new THREE.Vector3());
    s.scale.setScalar(2.4 / Math.max(size.x, size.y, size.z));
    return { obj: s, parts };
  }, [scene]);

  useEffect(() => {
    onParts(data.parts);
    onReady();
  }, [data, onParts, onReady]);

  return (
    <Center>
      <primitive
        object={data.obj}
        onClick={(e) => {
          e.stopPropagation();
          onPick(e.object.uuid);
        }}
      />
    </Center>
  );
}

export default function Configurator({ work }) {
  const [ready, setReady] = useState(false);
  const [parts, setParts] = useState([]);
  const [level, setLevel] = useState('all');
  const [selected, setSelected] = useState('all');
  const [colors, setColors] = useState({});
  const partsRef = useRef([]);
  const levelRef = useRef(level);
  levelRef.current = level;

  const handleParts = useCallback((p) => {
    partsRef.current = p;
    setParts(p);
  }, []);
  const handleReady = useCallback(() => setReady(true), []);

  const groups = useMemo(() => {
    const m = new Map();
    parts.forEach((p) => m.set(p.matName, (m.get(p.matName) || 0) + 1));
    return [...m.entries()];
  }, [parts]);

  const targetsFor = useCallback((lvl, key) => {
    const all = partsRef.current;
    if (lvl === 'all') return all;
    if (lvl === 'mat') return all.filter((p) => p.matName === key);
    return all.filter((p) => p.id === key);
  }, []);

  /* Подсветка выбранного узла */
  useEffect(() => {
    const ids = new Set(targetsFor(level, selected).map((p) => p.id));
    const highlight = level !== 'all';
    partsRef.current.forEach((p) => {
      if (p.mesh.material.emissive) {
        p.mesh.material.emissive.setHex(highlight && ids.has(p.id) ? 0x152a4d : 0x000000);
      }
    });
  }, [level, selected, parts, targetsFor]);

  const switchLevel = (lvl) => {
    setLevel(lvl);
    if (lvl === 'all') setSelected('all');
    else if (lvl === 'mat') setSelected(groups[0]?.[0] ?? '');
    else setSelected(parts[0]?.id ?? '');
  };

  /* Клик по детали прямо в 3D */
  const handlePick = useCallback((uuid) => {
    const part = partsRef.current.find((p) => p.id === uuid);
    if (!part) return;
    if (levelRef.current === 'mat') {
      setSelected(part.matName);
    } else {
      if (levelRef.current === 'all') setLevel('part');
      setSelected(uuid);
    }
  }, []);

  const paint = (hex) => {
    const targets = targetsFor(level, selected);
    targets.forEach((p) => p.mesh.material.color && p.mesh.material.color.set(hex));
    setColors((c) => {
      const next = { ...c };
      targets.forEach((p) => {
        next[p.id] = hex;
      });
      return next;
    });
  };

  const reset = () => {
    partsRef.current.forEach(
      (p) => p.mesh.material.color && p.mesh.material.color.setHex(p.origColor)
    );
    setColors({});
  };

  const items =
    level === 'all'
      ? [{ key: 'all', label: 'Всё изделие', note: `${parts.length} дет.` }]
      : level === 'mat'
        ? groups.map(([name, count]) => ({ key: name, label: name, note: `${count} дет.` }))
        : parts.map((p) => ({ key: p.id, label: p.name, note: p.matName }));

  const dotColor = (key) => {
    const t = targetsFor(level, key);
    if (!t.length) return '#888';
    const first = t[0];
    return colors[first.id] || `#${first.origColor.toString(16).padStart(6, '0')}`;
  };

  return (
    <div className="cfg-body">
      <div className="cfg-canvas">
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [2.6, 1.7, 3.4], fov: 40 }}
          gl={{ alpha: true, antialias: true }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[4, 6, 3]} intensity={1} />
          <directionalLight position={[-5, 2, -4]} intensity={0.3} color="#8fb0ff" />
          <Env />
          <Suspense fallback={null}>
            <ConfigModel
              url={work.model}
              onParts={handleParts}
              onPick={handlePick}
              onReady={handleReady}
            />
          </Suspense>
          <OrbitControls makeDefault enablePan={false} minDistance={1.5} maxDistance={7} />
        </Canvas>
        {!ready && <div className="cfg-loader">Загружаем 3D-модель…</div>}
        <div className="cfg-canvas-hint">
          Вращайте мышью · Кликните по детали, чтобы выбрать её
        </div>
      </div>

      <div className="cfg-panel">
        <div className="cfg-sec-label">Уровень детализации</div>
        <div className="cfg-tabs">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              className={'cfg-tab' + (level === l.id ? ' on' : '')}
              onClick={() => switchLevel(l.id)}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="cfg-list">
          {items.map((it) => (
            <button
              key={it.key}
              className={'cfg-item' + (selected === it.key ? ' on' : '')}
              onClick={() => setSelected(it.key)}
            >
              <span className="cfg-dot" style={{ background: dotColor(it.key) }} />
              <span className="cfg-item-name">{it.label}</span>
              <span className="cfg-item-note">{it.note}</span>
            </button>
          ))}
        </div>

        <div className="cfg-sec-label">Порошковая покраска · RAL</div>
        <div className="cfg-swatches">
          {RAL_COLORS.map((c) => (
            <button
              key={c.hex}
              className="cfg-swatch"
              style={{ background: c.hex }}
              title={c.name}
              aria-label={c.name}
              onClick={() => paint(c.hex)}
            />
          ))}
        </div>

        <div className="cfg-sec-label">Дерево</div>
        <div className="cfg-swatches">
          {WOOD_TONES.map((c) => (
            <button
              key={c.hex}
              className="cfg-swatch"
              style={{ background: c.hex }}
              title={c.name}
              aria-label={c.name}
              onClick={() => paint(c.hex)}
            />
          ))}
        </div>

        <button className="cfg-reset" onClick={reset}>
          Сбросить к заводским цветам
        </button>
      </div>
    </div>
  );
}
