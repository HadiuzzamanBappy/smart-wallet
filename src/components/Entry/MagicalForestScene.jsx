import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// Recursive fractal tree component
const WireTree = ({ position, rotation, depth = 0, maxDepth = 4, length = 2, radius = 0.2 }) => {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Gentle swaying motion based on depth (branches sway more)
      const t = clock.getElapsedTime();
      meshRef.current.rotation.x = rotation[0] + Math.sin(t + depth) * 0.05 * (depth / maxDepth);
      meshRef.current.rotation.z = rotation[2] + Math.cos(t + depth) * 0.05 * (depth / maxDepth);
    }
  });

  if (depth > maxDepth) return null;

  return (
    <group position={position} rotation={rotation} ref={meshRef}>
      {/* Branch/Trunk Mesh */}
      <mesh position={[0, length / 2, 0]}>
        <cylinderGeometry args={[radius * 0.7, radius, length, 8]} />
        <meshStandardMaterial
          color="#34d399"
          emissive="#059669"
          emissiveIntensity={0.2}
          wireframe={true}
          transparent
          opacity={0.3} /* Watermark opacity */
        />
      </mesh>

      {/* Child Branches (recursive) */}
      {depth < maxDepth && (
        <>
          <WireTree
            position={[0, length, 0]}
            rotation={[0.5, 1, 0.5]}
            depth={depth + 1}
            maxDepth={maxDepth}
            length={length * 0.75}
            radius={radius * 0.7}
          />
          <WireTree
            position={[0, length, 0]}
            rotation={[-0.5, -1, -0.5]}
            depth={depth + 1}
            maxDepth={maxDepth}
            length={length * 0.75}
            radius={radius * 0.7}
          />
          <WireTree
            position={[0, length, 0]}
            rotation={[0.5, 0.5, -0.5]}
            depth={depth + 1}
            maxDepth={maxDepth}
            length={length * 0.75}
            radius={radius * 0.7}
          />
        </>
      )}
    </group>
  );
};

// 3D Falling Leaves Particle System
const FallingLeaves = ({ count = 50 }) => {
  const meshRef = useRef();

  // Create a 3D Leaf Mesh for wireframe rendering
  const leafGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    // A natural curved leaf shape
    shape.moveTo(0, -0.6);
    // Right curve up to tip
    shape.bezierCurveTo(0.4, -0.3, 0.4, 0.3, 0, 0.6);
    // Left curve down to base
    shape.bezierCurveTo(-0.4, 0.3, -0.4, -0.3, 0, -0.6);

    // Extrude to give the wireframe 3D depth and complex mesh lines
    const extrudeSettings = {
      depth: 0.05,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.02
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center(); // Center for proper rotation axis
    geometry.scale(0.3, 0.3, 0.3); // Scale down to particle size
    return geometry;
  }, []);

  // Generate random positions, rotations, and speeds for each leaf
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        position: [
          (Math.random() - 0.5) * 30, // x spread
          Math.random() * 20,         // y starting height
          (Math.random() - 0.5) * 30  // z spread
        ],
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
        speed: 0.01 + Math.random() * 0.02,
        swaySpeed: 1 + Math.random() * 2,
        swayAmount: 0.05 + Math.random() * 0.1
      });
    }
    return temp;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const time = clock.getElapsedTime();

    particles.forEach((particle, i) => {
      // Fall down
      particle.position[1] -= particle.speed;

      // Sway side to side (wind effect)
      particle.position[0] += Math.sin(time * particle.swaySpeed + i) * particle.swayAmount;

      // Rotate while falling
      particle.rotation[0] += 0.02;
      particle.rotation[1] += 0.02;

      // Reset if it hits the ground
      if (particle.position[1] < -5) {
        particle.position[1] = 20;
        particle.position[0] = (Math.random() - 0.5) * 30;
      }

      dummy.position.set(...particle.position);
      dummy.rotation.set(...particle.rotation);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[leafGeometry, null, count]}>
      <meshStandardMaterial
        color="#059669"
        emissive="#059669"
        emissiveIntensity={0.4}
        wireframe={true}
        side={THREE.DoubleSide}
        transparent
        opacity={0.04}
      />
    </instancedMesh>
  );
};

const MagicalForestScene = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <Canvas camera={{ position: [0, 5, 15], fov: 60 }}>
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#fbbf24" />
        <pointLight position={[-10, 5, -10]} intensity={1.5} color="#34d399" />

        {/* Magical ambient fireflies */}
        <Sparkles count={150} scale={25} size={2} speed={0.8} opacity={0.8} noise={0.2} color="#fcd34d" />
        <Sparkles count={100} scale={20} size={3} speed={0.5} opacity={0.6} noise={0.1} color="#fef08a" />
        <Sparkles count={50} scale={15} size={4} speed={0.3} opacity={0.4} color="#10b981" />

        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
          {/* Main wireframe trees removed to focus entirely on the beautiful background vignette */}
        </Float>

        {/* Falling leaves - reduced count */}
        <FallingLeaves count={40} />
      </Canvas>
    </div>
  );
};

export default MagicalForestScene;
