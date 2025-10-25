'use client';

/**
 * BrainScene Component
 * Main Three.js scene container with brain model, floating nodes, lighting, and camera
 */

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { BrainModel } from './BrainModel';
import { FloatingNodes } from './FloatingNodes';

interface BrainSceneProps {
  className?: string;
  interactive?: boolean;
  opacity?: number;
}

export function BrainScene({ className = '', interactive = true, opacity = 1 }: BrainSceneProps) {
  return (
    <div className={className} style={{ opacity }}>
      <Canvas
        camera={{
          position: [0, 0, 15],
          fov: 50,
        }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={0.8} color="#ffffff" />
          <directionalLight position={[-10, -10, -5]} intensity={0.3} color="#ffffff" />
          <pointLight position={[0, 0, 0]} intensity={0.5} color="#ffffff" />

          {/* Brain and Nodes */}
          <BrainModel />
          <FloatingNodes />

          {/* Camera Controls */}
          {interactive && (
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              autoRotate
              autoRotateSpeed={0.3}
              maxPolarAngle={Math.PI / 1.5}
              minPolarAngle={Math.PI / 3}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}

