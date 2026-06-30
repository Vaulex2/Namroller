import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { useReducedMotion } from 'framer-motion';

/* ── Procedural 3D roller viewer ───────────────────────────────
   Drag to orbit 360°. Geometry is generated from the product type (no CAD
   assets): idler = steel tube + shaft; impact = tube with rubber rings;
   pulley = wide lagged drum. Lazy-loaded so three.js ships only on product
   pages. Auto-rotate idles unless reduced motion is requested. */

const STEEL = { color: '#c2cbd4', metalness: 0.9, roughness: 0.34 };
const STEEL_DARK = { color: '#7b8694', metalness: 0.85, roughness: 0.45 };
const RUBBER = { color: '#1c2128', metalness: 0.1, roughness: 0.85 };
const ACCENT = { color: '#F97316', metalness: 0.4, roughness: 0.5 };

function variantOf(product) {
  const id = product?.id || '';
  const cat = product?.cat || '';
  if (id.includes('impact')) return 'impact';
  if (cat === 'Pulleys' || id.includes('pulley')) return 'pulley';
  return 'idler';
}

/* A horizontal cylinder (cylinders are Y-aligned by default → rotate to X). */
function Cyl({ radius, length, material, position = [0, 0, 0], segments = 48 }) {
  return (
    <mesh position={position} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, length, segments]} />
      <meshStandardMaterial {...material} />
    </mesh>
  );
}

function Roller({ variant }) {
  // Dimensions tuned for a pleasing on-screen scale.
  const tubeR = variant === 'pulley' ? 1.15 : 0.8;
  const tubeL = variant === 'pulley' ? 2.6 : 3.4;
  const shaftR = 0.16;
  const shaftL = tubeL + 1.1;

  return (
    <group rotation={[0.15, 0, 0]}>
      {/* Shaft */}
      <Cyl radius={shaftR} length={shaftL} material={STEEL_DARK} segments={24} />

      {/* Main tube / drum */}
      <Cyl radius={tubeR} length={tubeL} material={STEEL} />

      {/* End caps */}
      <Cyl radius={tubeR * 1.02} length={0.12} material={STEEL_DARK} position={[tubeL / 2, 0, 0]} />
      <Cyl radius={tubeR * 1.02} length={0.12} material={STEEL_DARK} position={[-tubeL / 2, 0, 0]} />

      {/* Brand accent band */}
      <Cyl radius={tubeR * 1.012} length={0.18} material={ACCENT} position={[tubeL / 2 - 0.4, 0, 0]} />

      {/* Impact rubber rings */}
      {variant === 'impact' && [-1, -0.4, 0.4, 1].map((f, i) => (
        <Cyl key={i} radius={tubeR + 0.18} length={0.34} material={RUBBER} position={[f * (tubeL / 2.6), 0, 0]} />
      ))}

      {/* Pulley lagging (slightly larger dark outer sleeve) */}
      {variant === 'pulley' && (
        <Cyl radius={tubeR + 0.12} length={tubeL - 0.3} material={RUBBER} />
      )}
    </group>
  );
}

export default function Product3DViewer({ product, height = 340 }) {
  const reduce = useReducedMotion();
  const variant = variantOf(product);

  return (
    <div style={{
      height, width: '100%',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-subtle)',
      overflow: 'hidden',
      background: 'linear-gradient(150deg, var(--slate-900), var(--slate-950))',
    }}>
      <Canvas shadows dpr={[1, 2]} camera={{ position: [3.5, 2, 6], fov: 38 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 6, 4]} intensity={1.6} castShadow />
        <directionalLight position={[-4, 2, -3]} intensity={0.5} color="#7dd3fc" />
        <pointLight position={[0, -3, 3]} intensity={0.4} color="#F97316" />

        <Suspense fallback={null}>
          <Roller variant={variant} />
          <ContactShadows position={[0, -1.6, 0]} opacity={0.45} scale={10} blur={2.4} far={4} />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom
          minDistance={4}
          maxDistance={9}
          autoRotate={!reduce}
          autoRotateSpeed={1.1}
        />
      </Canvas>
    </div>
  );
}
