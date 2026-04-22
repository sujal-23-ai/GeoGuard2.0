import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

function Orb({ position, color, speed = 1, radius = 0.3 }) {
  const meshRef = useRef();
  const initialY = position[1];

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.position.y = initialY + Math.sin(state.clock.elapsedTime * speed) * 0.3;
    meshRef.current.rotation.x += 0.005;
    meshRef.current.rotation.z += 0.003;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.4} wireframe />
    </mesh>
  );
}

export default function FloatingOrbs() {
  return (
    <group>
      <Orb position={[-4, 1, -3]} color="#3B82F6" speed={0.8} radius={0.4} />
      <Orb position={[4, -1, -2]} color="#06B6D4" speed={1.2} radius={0.3} />
      <Orb position={[0, 2, -4]} color="#8B5CF6" speed={0.6} radius={0.5} />
      <Orb position={[-3, -2, -2]} color="#10B981" speed={1.0} radius={0.25} />
      <Orb position={[3, 2, -3]} color="#F59E0B" speed={0.9} radius={0.35} />
      <pointLight position={[0, 0, 2]} intensity={0.5} color="#3B82F6" />
      <pointLight position={[4, 0, -2]} intensity={0.3} color="#06B6D4" />
      <ambientLight intensity={0.1} />
    </group>
  );
}
