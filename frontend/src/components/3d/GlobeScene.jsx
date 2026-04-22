import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Globe() {
  const groupRef = useRef();

  // Fibonacci-distributed dots on sphere surface
  const dotPositions = useMemo(() => {
    const N = 480;
    const arr = new Float32Array(N * 3);
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const r = 2.01;
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const rad = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      arr[i * 3]     = r * rad * Math.cos(theta);
      arr[i * 3 + 1] = r * y;
      arr[i * 3 + 2] = r * rad * Math.sin(theta);
    }
    return arr;
  }, []);

  // Accent dots (brighter, fewer — simulate hotspot cities)
  const accentPositions = useMemo(() => {
    const spots = [
      [0, 2.01, 0], [1.4, 1.4, 0.8], [-1.2, 1.5, -1.1],
      [1.8, 0.8, -0.9], [-1.9, 0.5, 0.7], [0.6, -1.8, 1.2],
      [-0.5, -1.9, -1.0], [2.0, -0.2, 0.3], [-1.5, -1.3, 1.1],
      [0.9, 1.7, -1.3],
    ];
    return new Float32Array(spots.flat());
  }, []);

  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y += 0.0018;
  });

  return (
    <group ref={groupRef}>
      {/* Dark core */}
      <mesh>
        <sphereGeometry args={[1.96, 64, 64]} />
        <meshBasicMaterial color="#060d1c" />
      </mesh>

      {/* Outer wireframe shell */}
      <mesh>
        <sphereGeometry args={[2, 28, 28]} />
        <meshBasicMaterial color="#1e3a5f" wireframe transparent opacity={0.18} />
      </mesh>

      {/* Surface dots */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={dotPositions}
            count={dotPositions.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial color="#3b82f6" size={0.028} sizeAttenuation transparent opacity={0.85} />
      </points>

      {/* Accent hotspot dots */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={accentPositions}
            count={accentPositions.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial color="#60a5fa" size={0.07} sizeAttenuation transparent opacity={1} />
      </points>

      {/* Equator ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.02, 0.004, 8, 120]} />
        <meshBasicMaterial color="#2563eb" transparent opacity={0.4} />
      </mesh>

      {/* Subtle atmosphere glow */}
      <mesh>
        <sphereGeometry args={[2.15, 32, 32]} />
        <meshBasicMaterial color="#1d4ed8" transparent opacity={0.04} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

export default function GlobeScene() {
  return <Globe />;
}
