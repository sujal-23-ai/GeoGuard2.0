import { useEffect, useRef, useCallback } from 'react';
import createGlobe from 'cobe';

// Global incident hotspots — pre-seeded for demo (real data replaces in production)
const HOTSPOTS = [
  { lat: 40.7128,  lng: -74.006,   sev: 5, count: 34 },  // New York
  { lat: 51.5074,  lng: -0.1278,   sev: 4, count: 28 },  // London
  { lat: 19.0760,  lng: 72.8777,   sev: 5, count: 41 },  // Mumbai
  { lat: -23.5505, lng: -46.6333,  sev: 5, count: 38 },  // São Paulo
  { lat: 28.6139,  lng: 77.2090,   sev: 5, count: 42 },  // Delhi
  { lat: 6.5244,   lng: 3.3792,    sev: 5, count: 39 },  // Lagos
  { lat: 35.6762,  lng: 139.6503,  sev: 4, count: 22 },  // Tokyo
  { lat: 37.7749,  lng: -122.4194, sev: 4, count: 26 },  // San Francisco
  { lat: -26.2041, lng: 28.0473,   sev: 5, count: 35 },  // Johannesburg
  { lat: 30.0444,  lng: 31.2357,   sev: 4, count: 21 },  // Cairo
  { lat: 34.0522,  lng: -118.2437, sev: 4, count: 29 },  // Los Angeles
  { lat: 48.8566,  lng: 2.3522,    sev: 3, count: 18 },  // Paris
  { lat: 55.7558,  lng: 37.6173,   sev: 3, count: 16 },  // Moscow
  { lat: -33.8688, lng: 151.2093,  sev: 3, count: 14 },  // Sydney
  { lat: 31.2304,  lng: 121.4737,  sev: 4, count: 24 },  // Shanghai
  { lat: -34.6037, lng: -58.3816,  sev: 4, count: 20 },  // Buenos Aires
  { lat: 13.7563,  lng: 100.5018,  sev: 3, count: 17 },  // Bangkok
  { lat: 1.3521,   lng: 103.8198,  sev: 4, count: 19 },  // Singapore
  { lat: 41.0082,  lng: 28.9784,   sev: 3, count: 15 },  // Istanbul
  { lat: 52.5200,  lng: 13.4050,   sev: 2, count: 9  },  // Berlin
];

const GLOW = { 1: '#10b981', 2: '#84cc16', 3: '#f59e0b', 4: '#f97316', 5: '#ef4444' };

const toHex2 = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');

export default function GlobeCobe({ size = 500 }) {
  const cobeRef    = useRef(null);
  const overlayRef = useRef(null);
  const phiRef     = useRef(0);
  const rafRef     = useRef(null);

  // Draw severity-coloured heatmap dots, synced to cobe's rotation
  const drawHeatmap = useCallback(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const W   = canvas.width;
    const H   = canvas.height;
    const phi = phiRef.current;
    const theta = 0.3; // matches cobe default
    const radius = Math.min(W, H) * 0.46;
    const cx = W / 2;
    const cy = H / 2;

    ctx.clearRect(0, 0, W, H);

    for (const { lat, lng, sev, count } of HOTSPOTS) {
      const lngR = (lng * Math.PI) / 180;
      const latR = (lat * Math.PI) / 180;

      // Spherical → Cartesian
      let x = Math.cos(latR) * Math.sin(lngR);
      let y = Math.sin(latR);
      let z = Math.cos(latR) * Math.cos(lngR);

      // Rotate Y by –phi  (globe rotates +phi, so points see –phi)
      const cp = Math.cos(-phi), sp = Math.sin(-phi);
      const x1 = x * cp - z * sp;
      const z1 = x * sp + z * cp;

      // Rotate X by –theta
      const ct = Math.cos(-theta), st = Math.sin(-theta);
      const y2 = y * ct - z1 * st;
      const z2 = y * st + z1 * ct;

      // Cull back-face (z2 < 0.05 = hidden side)
      if (z2 < 0.05) continue;
      const fade = Math.max(0, (z2 - 0.05) / 0.95);

      const sx = cx + radius * x1;
      const sy = cy - radius * y2;

      const color = GLOW[sev] || '#3b82f6';
      const baseR = 3 + (count / 14) * 3.5 + sev * 1.2;
      const glowR = baseR * 3.8;

      // Outer glow
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
      g.addColorStop(0,   color + toHex2(fade * 200));
      g.addColorStop(0.4, color + toHex2(fade * 70));
      g.addColorStop(1,   color + '00');
      ctx.beginPath();
      ctx.arc(sx, sy, glowR, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(sx, sy, baseR * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = color + toHex2(fade * 255);
      ctx.fill();

      // Bright centre
      ctx.beginPath();
      ctx.arc(sx, sy, baseR * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${(fade * 0.92).toFixed(2)})`;
      ctx.fill();
    }

    rafRef.current = requestAnimationFrame(drawHeatmap);
  }, []);

  useEffect(() => {
    if (!cobeRef.current) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let phi = 0;

    const globe = createGlobe(cobeRef.current, {
      devicePixelRatio: dpr,
      width:  size * dpr,
      height: size * dpr,
      phi: 0,
      theta: 0.3,
      dark: 1,
      diffuse: 1.3,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor:   [0.10, 0.20, 0.44],
      markerColor: [0.40, 0.68, 1.00],
      glowColor:   [0.10, 0.28, 0.80],
      markers: [],
      onRender: (state) => {
        phi += 0.0018;
        state.phi = phi;
        phiRef.current = phi;
      },
    });

    rafRef.current = requestAnimationFrame(drawHeatmap);

    return () => {
      globe.destroy();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [size, drawHeatmap]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* World globe (cobe) */}
      <canvas
        ref={cobeRef}
        style={{ width: size, height: size }}
        className="absolute inset-0"
      />
      {/* Severity heatmap overlay — screen blend fuses colours with globe dots */}
      <canvas
        ref={overlayRef}
        width={size}
        height={size}
        style={{ width: size, height: size, mixBlendMode: 'screen' }}
        className="absolute inset-0 pointer-events-none"
      />
    </div>
  );
}
