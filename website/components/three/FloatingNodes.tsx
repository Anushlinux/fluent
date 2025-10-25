'use client';

/**
 * FloatingNodes Component
 * Force-directed graph nodes positioned around the brain with edges and subtle motion
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { applyDitherShader } from './DitherShader';

interface Node {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  connections: number[];
}

export function FloatingNodes() {
  const nodesRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  // Generate nodes positioned around brain sphere
  const nodes = useMemo<Node[]>(() => {
    const nodeCount = 10;
    const radius = 6; // Distance from center (brain is radius 4)
    const generated: Node[] = [];

    for (let i = 0; i < nodeCount; i++) {
      // Use Fibonacci sphere for even distribution
      const phi = Math.acos(1 - (2 * (i + 0.5)) / nodeCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      generated.push({
        id: i,
        position: new THREE.Vector3(x, y, z),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01
        ),
        connections: [],
      });
    }

    // Create connections between nearby nodes
    for (let i = 0; i < generated.length; i++) {
      for (let j = i + 1; j < generated.length; j++) {
        const distance = generated[i].position.distanceTo(generated[j].position);
        if (distance < 8 && Math.random() > 0.5) {
          generated[i].connections.push(j);
        }
      }
    }

    return generated;
  }, []);

  // Create node geometries and materials
  const nodeMeshes = useMemo(() => {
    const meshes: JSX.Element[] = [];

    nodes.forEach((node, index) => {
      const geometry = new THREE.DodecahedronGeometry(0.15, 0);
      const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.8,
      });

      applyDitherShader(material, 0.1, 1.5);

      meshes.push(
        <mesh
          key={`node-${index}`}
          position={[node.position.x, node.position.y, node.position.z]}
          geometry={geometry}
          material={material}
        />
      );
    });

    return meshes;
  }, [nodes]);

  // Create edges between nodes
  const edgesGeometry = useMemo(() => {
    const positions: number[] = [];

    nodes.forEach((node) => {
      node.connections.forEach((connectedIndex) => {
        const connectedNode = nodes[connectedIndex];
        positions.push(
          node.position.x, node.position.y, node.position.z,
          connectedNode.position.x, connectedNode.position.y, connectedNode.position.z
        );
      });
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    return geometry;
  }, [nodes]);

  const edgeMaterial = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
    });
  }, []);

  // Subtle motion animation
  useFrame((state) => {
    if (nodesRef.current) {
      const time = state.clock.getElapsedTime();
      
      nodesRef.current.children.forEach((mesh, index) => {
        if (mesh instanceof THREE.Mesh) {
          const node = nodes[index];
          
          // Apply simplex-like noise using sin functions
          const noiseX = Math.sin(time * 0.3 + index * 0.5) * 0.08;
          const noiseY = Math.cos(time * 0.4 + index * 0.7) * 0.08;
          const noiseZ = Math.sin(time * 0.5 + index * 0.3) * 0.08;

          mesh.position.x = node.position.x + noiseX;
          mesh.position.y = node.position.y + noiseY;
          mesh.position.z = node.position.z + noiseZ;
        }
      });
    }

    // Update edge positions to follow nodes
    if (linesRef.current && nodesRef.current) {
      const positions: number[] = [];
      const meshes = nodesRef.current.children;

      nodes.forEach((node, index) => {
        node.connections.forEach((connectedIndex) => {
          const nodeMesh = meshes[index] as THREE.Mesh;
          const connectedMesh = meshes[connectedIndex] as THREE.Mesh;

          if (nodeMesh && connectedMesh) {
            positions.push(
              nodeMesh.position.x, nodeMesh.position.y, nodeMesh.position.z,
              connectedMesh.position.x, connectedMesh.position.y, connectedMesh.position.z
            );
          }
        });
      });

      linesRef.current.geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
      );
    }
  });

  return (
    <>
      <group ref={nodesRef}>
        {nodeMeshes}
      </group>
      <lineSegments ref={linesRef} geometry={edgesGeometry} material={edgeMaterial} />
    </>
  );
}

