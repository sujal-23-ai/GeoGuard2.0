import { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Convert geographic coordinates to a point on a unit sphere of radius r */
function latLngToVec3(lat, lng, r = 1) {
  const phi   = (90 - lat)  * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  );
}

/** Map 0–100 accident rate to a THREE.Color (green → yellow → red) */
function rateToColor(rate) {
  if (rate >= 70) return new THREE.Color('#ef4444'); // red
  if (rate >= 40) return new THREE.Color('#f59e0b'); // amber
  return new THREE.Color('#10b981');                 // green
}

/** Midpoint arc control point lifted above sphere surface */
function arcMidpoint(a, b, lift = 0.45) {
  const mid = a.clone().add(b).multiplyScalar(0.5);
  return mid.normalize().multiplyScalar(1 + lift);
}

// ─── shaders ──────────────────────────────────────────────────────────────────

const ATMO_VERT = /* glsl */`
  varying vec3 vNormal;
  void main() {
    vNormal     = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMO_FRAG = /* glsl */`
  varying vec3 vNormal;
  uniform vec3  glowColor;
  uniform float coefficient;
  uniform float power;
  void main() {
    float intensity = pow(coefficient - dot(vNormal, vec3(0.0, 0.0, 1.0)), power);
    gl_FragColor    = vec4(glowColor, intensity);
  }
`;

// ─── sub-components ───────────────────────────────────────────────────────────

/** Dark Earth sphere with bump map + optional night texture */
function EarthSphere() {
  const meshRef  = useRef();
  const textures = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const night  = loader.load(
      'https://unpkg.com/three-globe/example/img/earth-night.jpg',
      undefined,
      undefined,
      // On error fall back to a plain dark material (handled by missing texture)
      () => {},
    );
    night.colorSpace = THREE.SRGBColorSpace;
    return { night };
  }, []);

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshPhongMaterial
        map={textures.night}
        color="#1a2a4a"          /* shows if texture fails to load */
        emissive="#070e1f"
        emissiveIntensity={0.15}
        shininess={12}
        specular={new THREE.Color('#1a3060')}
      />
    </mesh>
  );
}

/** Fresnel-based atmosphere glow rendered on a slightly larger shell */
function Atmosphere() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader:   ATMO_VERT,
        fragmentShader: ATMO_FRAG,
        uniforms: {
          glowColor:   { value: new THREE.Color('#2563eb') },
          coefficient: { value: 0.7 },
          power:       { value: 4.5 },
        },
        side:        THREE.BackSide,
        blending:    THREE.AdditiveBlending,
        transparent: true,
        depthWrite:  false,
      }),
    [],
  );

  return (
    <mesh scale={[1.18, 1.18, 1.18]}>
      <sphereGeometry args={[1, 48, 48]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

/** Inner soft glow ring */
function InnerGlow() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader:   ATMO_VERT,
        fragmentShader: ATMO_FRAG,
        uniforms: {
          glowColor:   { value: new THREE.Color('#1d4ed8') },
          coefficient: { value: 0.35 },
          power:       { value: 6.0 },
        },
        side:        THREE.FrontSide,
        blending:    THREE.AdditiveBlending,
        transparent: true,
        depthWrite:  false,
      }),
    [],
  );

  return (
    <mesh>
      <sphereGeometry args={[1, 48, 48]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

/** Instanced data markers — one sphere per data point, colored by accident rate */
function DataMarkers({ data, onHover, onUnhover, onClick }) {
  const meshRef  = useRef();
  const count    = data.length;
  const dummy    = useMemo(() => new THREE.Object3D(), []);
  const phases   = useMemo(() => data.map(() => Math.random() * Math.PI * 2), [data]);
  const colors   = useMemo(() => data.map(d => rateToColor(d.accidentRate)), [data]);
  const positions = useMemo(
    () => data.map(d => latLngToVec3(d.lat, d.lng, 1.012)),
    [data],
  );

  // Initialise instance matrices + colors once
  useEffect(() => {
    if (!meshRef.current) return;
    data.forEach((_, i) => {
      dummy.position.copy(positions[i]);
      dummy.lookAt(0, 0, 0);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, colors[i]);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [data, positions, colors, dummy]);

  // Pulse scale per frame based on accident rate
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    data.forEach((d, i) => {
      const speed  = 0.8 + (d.accidentRate / 100) * 2.4; // faster = more dangerous
      const amp    = 0.15 + (d.accidentRate / 100) * 0.5;
      const pulse  = 1 + amp * Math.sin(t * speed + phases[i]);
      const base   = 0.008 + (d.accidentRate / 100) * 0.012;
      dummy.position.copy(positions[i]);
      dummy.lookAt(0, 0, 0);
      dummy.scale.setScalar(base * pulse);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, count]}
      onPointerOver={(e) => { e.stopPropagation(); onHover?.(data[e.instanceId], e); }}
      onPointerOut={(e)  => { e.stopPropagation(); onUnhover?.(); }}
      onClick={(e)       => { e.stopPropagation(); onClick?.(data[e.instanceId]); }}
    >
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial
        toneMapped={false}
        roughness={0.2}
        metalness={0.1}
      />
    </instancedMesh>
  );
}

/** Outer pulse rings for high-risk points (rate ≥ 70) */
function PulseRings({ data }) {
  const highRisk = useMemo(() => data.filter(d => d.accidentRate >= 70), [data]);
  const phases   = useMemo(() => highRisk.map(() => Math.random() * Math.PI * 2), [highRisk]);
  const refs     = useRef([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    highRisk.forEach((_, i) => {
      const ring = refs.current[i];
      if (!ring) return;
      const progress = ((t * 0.8 + phases[i] / (Math.PI * 2)) % 1);
      ring.scale.setScalar(0.01 + progress * 0.055);
      ring.material.opacity = (1 - progress) * 0.65;
    });
  });

  return (
    <>
      {highRisk.map((d, i) => {
        const pos = latLngToVec3(d.lat, d.lng, 1.013);
        const normal = pos.clone().normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          normal,
        );
        return (
          <mesh
            key={i}
            ref={el => { refs.current[i] = el; }}
            position={pos}
            quaternion={q}
          >
            <ringGeometry args={[0.9, 1.0, 32]} />
            <meshBasicMaterial
              color="#ef4444"
              transparent
              opacity={0.5}
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        );
      })}
    </>
  );
}

/** Animated arc between two geographic points — uses a fixed-point Line so no per-frame GC */
function Arc({ from, to, color = '#ef4444', speed = 1 }) {
  const lineRef  = useRef();
  const progress = useRef(0);

  // Pre-bake all 64 points; animate by showing 1..N of them each frame
  const allPoints = useMemo(() => {
    const a   = latLngToVec3(from.lat, from.lng, 1.022);
    const b   = latLngToVec3(to.lat,   to.lng,   1.022);
    const mid = arcMidpoint(a, b, 0.44);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    return curve.getPoints(64);
  }, [from, to]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(allPoints);
    return geo;
  }, [allPoints]);

  useFrame((_, delta) => {
    progress.current = Math.min(1, progress.current + delta * speed * 0.35);
    if (!lineRef.current) return;
    // Update drawRange to reveal arc progressively
    const visible = Math.max(2, Math.round(progress.current * allPoints.length));
    lineRef.current.geometry.setDrawRange(0, visible);
    lineRef.current.material.opacity = Math.min(0.85, progress.current * 1.2);
  });

  return (
    <line ref={lineRef} geometry={geometry}>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        linewidth={1}
      />
    </line>
  );
}

/** Renders arcs between the top high-risk cities */
function GlobeArcs({ data, show }) {
  const highRisk = useMemo(
    () => [...data].sort((a, b) => b.accidentRate - a.accidentRate).slice(0, 6),
    [data],
  );

  const pairs = useMemo(() => {
    const result = [];
    for (let i = 0; i < highRisk.length - 1; i++) {
      result.push([highRisk[i], highRisk[i + 1]]);
    }
    return result;
  }, [highRisk]);

  if (!show || pairs.length === 0) return null;

  return (
    <>
      {pairs.map(([a, b], i) => (
        <Arc
          key={`${a.country}-${b.country}-${i}`}
          from={a}
          to={b}
          color="#ef4444"
          speed={0.6 + i * 0.15}
        />
      ))}
    </>
  );
}

/** Hovering HTML tooltip pinned to the hovered marker */
function Tooltip({ data, position }) {
  if (!data || !position) return null;
  const color = data.accidentRate >= 70 ? '#ef4444' : data.accidentRate >= 40 ? '#f59e0b' : '#10b981';
  return (
    <Html position={position} center distanceFactor={2.5} zIndexRange={[100, 0]}>
      <div
        style={{
          background: 'rgba(11,15,26,0.92)',
          border:     `1px solid ${color}50`,
          borderRadius: 12,
          padding:    '8px 12px',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          backdropFilter: 'blur(12px)',
          boxShadow:  `0 0 16px ${color}30`,
        }}
      >
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 11, letterSpacing: '0.04em' }}>
          {data.country}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', background: color,
            boxShadow: `0 0 8px ${color}`,
          }} />
          <span style={{ color: color, fontWeight: 700, fontSize: 12 }}>
            {data.accidentRate}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>/ 100</span>
        </div>
      </div>
    </Html>
  );
}

/** Auto-rotating group — pauses on hover */
function AutoRotate({ children, paused }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (!ref.current || paused) return;
    ref.current.rotation.y += delta * 0.08;
  });
  return <group ref={ref}>{children}</group>;
}

/** Camera focus animation — flies to a country on click */
function CameraFocus({ target }) {
  const { camera } = useThree();
  const targetPos  = useRef(null);

  useEffect(() => {
    if (!target) return;
    const vec = latLngToVec3(target.lat, target.lng, 3.2);
    targetPos.current = vec;
  }, [target]);

  useFrame(() => {
    if (!targetPos.current) return;
    camera.position.lerp(targetPos.current, 0.06);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// ─── Scene ────────────────────────────────────────────────────────────────────

function GlobeScene({ data, showArcs, highRiskOnly }) {
  const [hovered, setHovered]       = useState(null);
  const [hoveredPos, setHoveredPos] = useState(null);
  const [focused, setFocused]       = useState(null);

  const displayData = useMemo(
    () => (highRiskOnly ? data.filter(d => d.accidentRate >= 70) : data),
    [data, highRiskOnly],
  );

  const handleHover = useCallback((d, e) => {
    setHovered(d);
    setHoveredPos(latLngToVec3(d.lat, d.lng, 1.08));
  }, []);

  const handleClick = useCallback((d) => {
    setFocused(d);
  }, []);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 3, 5]} intensity={1.2} color="#a8c8ff" />
      <directionalLight position={[-5, -2, -3]} intensity={0.15} color="#1a3060" />
      <pointLight position={[3, 5, 3]} intensity={0.4} color="#3b82f6" decay={2} />

      {/* Background stars */}
      <Stars radius={120} depth={50} count={4000} factor={3} fade speed={0.4} />

      {/* Globe */}
      <AutoRotate paused={!!hovered || !!focused}>
        <EarthSphere />
        <Atmosphere />
        <InnerGlow />
        <DataMarkers
          data={displayData}
          onHover={handleHover}
          onUnhover={() => setHovered(null)}
          onClick={handleClick}
        />
        <PulseRings data={displayData} />
        <GlobeArcs data={data} show={showArcs} />
        <Tooltip data={hovered} position={hoveredPos} />
      </AutoRotate>

      {/* Camera animation on country click */}
      <CameraFocus target={focused} />

      <OrbitControls
        enableZoom
        enablePan={false}
        minDistance={1.5}
        maxDistance={5}
        zoomSpeed={0.6}
        rotateSpeed={0.5}
        autoRotate={false}
      />
    </>
  );
}

// ─── Default data ─────────────────────────────────────────────────────────────

const DEFAULT_DATA = [
  { country: 'Nigeria',        lat:  9.0820, lng:  8.6753,   accidentRate: 89 },
  { country: 'South Africa',   lat:-30.5595, lng: 22.9375,   accidentRate: 82 },
  { country: 'India',          lat: 20.5937, lng: 78.9629,   accidentRate: 78 },
  { country: 'Brazil',         lat:-14.2350, lng:-51.9253,   accidentRate: 74 },
  { country: 'Pakistan',       lat: 30.3753, lng: 69.3451,   accidentRate: 71 },
  { country: 'Bangladesh',     lat: 23.6850, lng: 90.3563,   accidentRate: 68 },
  { country: 'Ethiopia',       lat:  9.1450, lng: 40.4897,   accidentRate: 66 },
  { country: 'Mexico',         lat: 23.6345, lng:-102.5528,  accidentRate: 63 },
  { country: 'Egypt',          lat: 26.8206, lng: 30.8025,   accidentRate: 59 },
  { country: 'Indonesia',      lat: -0.7893, lng:114.9213,   accidentRate: 55 },
  { country: 'China',          lat: 35.8617, lng:104.1954,   accidentRate: 49 },
  { country: 'USA',            lat: 37.0902, lng:-95.7129,   accidentRate: 44 },
  { country: 'Russia',         lat: 61.5240, lng: 105.3188,  accidentRate: 42 },
  { country: 'Australia',      lat:-25.2744, lng:133.7751,   accidentRate: 28 },
  { country: 'Germany',        lat: 51.1657, lng: 10.4515,   accidentRate: 18 },
  { country: 'Japan',          lat: 36.2048, lng:138.2529,   accidentRate: 14 },
  { country: 'United Kingdom', lat: 55.3781, lng: -3.4360,   accidentRate: 12 },
  { country: 'Norway',         lat: 60.4720, lng:  8.4689,   accidentRate: 8  },
  { country: 'Sweden',         lat: 60.1282, lng: 18.6435,   accidentRate: 7  },
  { country: 'New Zealand',    lat:-40.9006, lng:172.8860,   accidentRate: 6  },
];

// ─── Public component ─────────────────────────────────────────────────────────

/**
 * GeoGlobe — interactive 3D accident-rate globe
 *
 * Props:
 *   data        — array of { country, lat, lng, accidentRate }
 *   size        — pixel size (square); default 520
 *   showArcs    — draw arcs between top high-risk countries; default true
 *   className   — extra CSS classes on the wrapper
 */
export default function GeoGlobe({
  data      = DEFAULT_DATA,
  size      = 520,
  showArcs  = true,
  className = '',
}) {
  const [highRiskOnly, setHighRiskOnly] = useState(false);

  return (
    <div className={className} style={{ position: 'relative', width: size, height: size }}>
      {/* Toggle pill */}
      <div style={{
        position:    'absolute',
        bottom:      18,
        left:        '50%',
        transform:   'translateX(-50%)',
        zIndex:      10,
        display:     'flex',
        gap:         4,
        background:  'rgba(11,15,26,0.80)',
        border:      '1px solid rgba(255,255,255,0.12)',
        borderRadius: 999,
        padding:     '3px 4px',
        backdropFilter: 'blur(12px)',
      }}>
        {['Global View', 'High Risk Only'].map((label, i) => {
          const active = highRiskOnly === (i === 1);
          return (
            <button
              key={label}
              onClick={() => setHighRiskOnly(i === 1)}
              style={{
                padding:      '5px 14px',
                borderRadius: 999,
                border:       'none',
                cursor:       'pointer',
                fontSize:     10,
                fontWeight:   700,
                letterSpacing: '0.06em',
                background:   active ? (i === 1 ? '#ef444420' : '#3b82f620') : 'transparent',
                color:        active ? (i === 1 ? '#ef4444'   : '#60a5fa')   : 'rgba(255,255,255,0.35)',
                transition:   'all 0.2s',
              }}
            >
              {label.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* R3F Canvas */}
      <Canvas
        camera={{ position: [0, 0, 2.8], fov: 45 }}
        style={{ width: '100%', height: '100%', borderRadius: 16 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <GlobeScene
          data={data}
          showArcs={showArcs}
          highRiskOnly={highRiskOnly}
        />
      </Canvas>
    </div>
  );
}
