'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const AnimatedDitherShader = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();
  
  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2(size.width, size.height) },
    }),
    []
  );

  useEffect(() => {
    uniforms.u_resolution.value.set(size.width, size.height);
  }, [size, uniforms]);

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float u_time;
    uniform vec2 u_resolution;
    varying vec2 vUv;

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    void main() {
      vec2 st = vUv;
      vec2 pixel = gl_FragCoord.xy;
      
      // Base color - exact #ff4e00
      vec3 orangeBase = vec3(1.0, 0.3059, 0.0);
      
      // Fire glow from bottom center (under the button)
      vec2 fireCenter = vec2(0.5, 0.15); // Center bottom area
      float distFromFire = length(st - fireCenter);
      
      // Intense fire glow - hot at center, fading outward
      float fireGlow = 1.0 - smoothstep(0.0, 0.7, distFromFire);
      fireGlow = pow(fireGlow, 2.5);
      
      // Create hot fire colors
      vec3 fireCore = vec3(1.0, 0.9, 0.7); // Hot yellow-white
      vec3 fireOuter = vec3(1.0, 0.6, 0.3); // Orange glow
      
      // Mix fire colors based on distance
      vec3 fireColor = mix(fireOuter, fireCore, fireGlow * 0.8);
      vec3 colorWithGlow = mix(orangeBase, fireColor, fireGlow * 0.6);
      
      // Darken corners for contrast
      vec2 centerDist = abs(st - vec2(0.5, 0.5));
      float cornerFade = 1.0 - smoothstep(0.3, 0.8, length(centerDist));
      colorWithGlow *= (0.85 + cornerFade * 0.15);
      
      // Grid-based dither pattern
      float gridSize = 4.0;
      vec2 gridPos = floor(pixel / gridSize);
      vec2 gridUV = fract(pixel / gridSize);
      
      // Create dots in grid cells
      float dotRadius = 0.35;
      float distToCenter = length(gridUV - 0.5);
      float dotShape = smoothstep(dotRadius, dotRadius - 0.1, distToCenter);
      
      // Fiery twinkling pattern - influenced by fire glow
      float cellNoise = noise(gridPos * 0.1 + u_time * 0.5);
      
      // Create dancing fire effect - more chaotic near the fire
      float fireInfluence = fireGlow * 1.5;
      float twinkle = sin(u_time * 4.0 + cellNoise * 12.0 + fireInfluence * 10.0) * 0.5 + 0.5;
      twinkle += sin(u_time * 6.0 - cellNoise * 8.0) * 0.3 * fireInfluence;
      
      // More dots visible in the fire area
      float threshold = 0.35 - fireInfluence * 0.2 + cellNoise * 0.4;
      float dotVisibility = step(threshold, random(gridPos) + twinkle * 0.4);
      
      // Final dot pattern
      float dots = dotShape * dotVisibility;
      
      // Dots glow brighter in fire area
      float dotBrightness = dots * (0.1 + fireGlow * 0.4);
      
      // Add fire sparkle effect
      float sparkle = step(0.98, random(gridPos + u_time * 0.1)) * fireGlow;
      dotBrightness += sparkle * 0.3;
      
      // Combine everything
      vec3 finalColor = colorWithGlow + vec3(dotBrightness);
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as any;
      if (material.uniforms) {
        material.uniforms.u_time.value = state.clock.elapsedTime;
      }
    }
  });

  return (
    <mesh ref={meshRef} scale={[2, 2, 1]}>
      <planeGeometry args={[10, 10]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
};

const HeroSection = () => {
  return (
    <>
      <section id="home-hero" className="relative z-10 bg-background md:px-2">
        <div className="relative h-full w-full md:pb-3">
          <div className="corner-lines-container">
            <svg
              className="absolute bottom-0 left-1/2 h-px w-[200dvw] -translate-x-1/2 hidden md:block"
              style={{ stroke: 'rgba(255, 255, 255, 0.1)', opacity: 1, transition: 'opacity 2000ms ease-out' }}
            >
              <line x1="0" y1="0" x2="100%" y2="0" strokeWidth="1" />
            </svg>
          </div>
          <div className="mx-auto w-full max-w-[1480px] pt-2">
            <div className="flex items-center justify-center relative overflow-hidden border-b border-border md:rounded-2xl md:border-0 min-h-[720px] md:min-h-[800px]" style={{ backgroundColor: '#ff4e00' }}>
              
              {/* WebGL Canvas Background */}
              <div className="absolute inset-0 w-full h-full">
                <Canvas
                  camera={{ position: [0, 0, 3.5], fov: 90 }}
                  dpr={typeof window !== 'undefined' ? window.devicePixelRatio : 1}
                  gl={{ 
                    alpha: false, 
                    antialias: true,
                    powerPreference: 'high-performance'
                  }}
                  style={{ width: '100%', height: '100%' }}
                >
                  <AnimatedDitherShader />
                </Canvas>
              </div>

              {/* Content Overlay */}
              <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-10 overflow-hidden px-4 py-6 text-center pt-12 md:px-8 lg:px-12 xl:px-16 md:py-8 lg:py-12 xl:py-16">
                <div className="relative flex h-full flex-col items-center justify-center gap-10">
                  <h1 className="text-white max-w-[1080px] text-balance text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                    Transform your Web3 learning into a powerful knowledge graph
                  </h1>
                  <div className="flex flex-col items-center">
                    <h5 className="text-white opacity-90 max-w-[700px] leading-[1.4em] font-medium text-lg md:text-xl">
                      Capture what you learn, visualize connections, and master concepts with AI-powered insights and adaptive quizzes.
                    </h5>
                  </div>
                  <a
                    href="#"
                    className="relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all ease-out duration-200 rounded-full bg-white text-orange-600 hover:bg-gray-50 active:scale-[0.98] px-8 py-4 mt-4 text-base md:text-lg shadow-lg hover:shadow-xl"
                  >
                    Start building your graph
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-0 -mt-0.5 flex w-full max-w-screen flex-col overflow-hidden md:hidden">
        <svg className="absolute top-0 left-1/2 h-px w-[200dvw] -translate-x-1/2 stroke-border opacity-5">
          <line x1="0" y1="0" x2="100%" y2="0" />
        </svg>
        <div className="relative mb-2 h-20 w-full"></div>
        <svg className="absolute -bottom-0 left-1/2 h-px w-[200dvw] -translate-x-1/2 stroke-border opacity-5">
          <line x1="0" y1="0" x2="100%" y2="0" />
        </svg>
      </section>
    </>
  );
};

export default HeroSection;