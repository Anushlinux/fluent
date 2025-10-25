'use client';

/**
 * BrainModel Component
 * Abstract geometric wireframe brain with dither shader and rotation animation
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { applyDitherShader } from './DitherShader';

export function BrainModel() {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create brain geometry - icosahedron with high subdivisions for organic look
  const geometry = useMemo(() => {
    return new THREE.IcosahedronGeometry(4, 3);
  }, []);

  // Create wireframe material with dither effect
  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      wireframe: true,
      emissive: 0xffffff,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.6,
    });

    // Apply dither shader
    applyDitherShader(mat, 0.08, 2.0);

    return mat;
  }, []);

  // Rotation animation
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.15;
      meshRef.current.rotation.x += delta * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} />
  );
}

