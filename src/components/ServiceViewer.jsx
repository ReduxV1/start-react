import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import Env from './ThreeEnv.jsx';

const MODEL_URL = '/models/model-1.glb';

/* Вид детали «на этапе» конкретной услуги.
   real = оригинальные материалы из .glb (металл + дерево). */
const STAGE_MATS = {
  wireframe: { color: '#5b8af5', wireframe: true,  metalness: 0.1,  roughness: 0.6  },
  steel:     { color: '#9aa0ab', wireframe: false, metalness: 0.85, roughness: 0.35 },
  dark:      { color: '#6a7078', wireframe: false, metalness: 0.9,  roughness: 0.28 },
  weld:      { color: '#7a7168', wireframe: false, metalness: 0.8,  roughness: 0.45 },
  polished:  { color: '#c9ccd4', wireframe: false, metalness: 1.0,  roughness: 0.12 },
  real:      null,
};

function Model({ stage, dragRef }) {
  const group = useRef();
  const { scene } = useGLTF(MODEL_URL);
  const spec = STAGE_MATS[stage] ?? null;

  const obj = useMemo(() => {
    const s = scene.clone(true);
    if (spec) {
      const m = new THREE.MeshStandardMaterial({
        color: new THREE.Color(spec.color),
        metalness: spec.metalness,
        roughness: spec.roughness,
        wireframe: spec.wireframe,
      });
      s.traverse((o) => {
        if (o.isMesh) o.material = m;
      });
    }
    const box = new THREE.Box3().setFromObject(s);
    const size = box.getSize(new THREE.Vector3());
    s.scale.setScalar(2.2 / Math.max(size.x, size.y, size.z));
    return s;
  }, [scene, spec]);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const d = dragRef.current;
    if (!d.active) {
      d.y += d.vy;
      d.x += d.vx;
      d.vy *= 0.94;
      d.vx *= 0.94;
      d.idle += delta * 0.25;
    }
    d.x = Math.min(0.7, Math.max(-0.7, d.x));
    g.rotation.y = d.idle + d.y;
    g.rotation.x = 0.18 + d.x;
  });

  return (
    <group ref={group}>
      <Center>
        <primitive object={obj} />
      </Center>
    </group>
  );
}

useGLTF.preload(MODEL_URL);

/* Canvas монтируется только когда блок в зоне видимости —
   иначе 6 WebGL-контекстов на странице жили бы одновременно */
export default function ServiceViewer({ stage, label }) {
  const wrapRef = useRef(null);
  const dragRef = useRef({ x: 0, y: 0, vx: 0, vy: 0, lastX: 0, lastY: 0, idle: 0, active: false });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { rootMargin: '150px' }
    );
    io.observe(wrapRef.current);
    return () => io.disconnect();
  }, []);

  const down = (e) => {
    const d = dragRef.current;
    d.active = true;
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    d.vx = 0;
    d.vy = 0;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch { /* неизвестный pointerId — не критично */ }
  };

  const move = (e) => {
    const d = dragRef.current;
    if (!d.active) return;
    const dx = e.clientX - d.lastX;
    const dy = e.clientY - d.lastY;
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    d.y += dx * 0.008;
    d.x += dy * 0.005;
    d.vy = dx * 0.008;
    d.vx = dy * 0.005;
  };

  const up = () => {
    dragRef.current.active = false;
  };

  return (
    <div
      className="svcv"
      ref={wrapRef}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      {visible && (
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0.3, 3.6], fov: 38 }}
          gl={{ alpha: true, antialias: true }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[4, 5, 3]} intensity={1} />
          <directionalLight position={[-5, 2, -4]} intensity={0.3} color="#8fb0ff" />
          <Env />
          <Suspense fallback={null}>
            <Model stage={stage} dragRef={dragRef} />
          </Suspense>
        </Canvas>
      )}
      <span className="svcv-label">{label}</span>
    </div>
  );
}
