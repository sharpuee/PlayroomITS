import { Suspense, useEffect, type ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

export type SnapshotFn = (size?: number) => string | null;

function SnapshotBridge({ onReady }: { onReady?: (fn: SnapshotFn) => void }) {
  const { gl, scene, camera } = useThree();
  if (onReady) {
    onReady((size = 360) => {
      gl.render(scene, camera);
      const src = gl.domElement;
      const c = document.createElement('canvas');
      const ratio = src.width / src.height;
      c.width = size;
      c.height = size;
      const ctx = c.getContext('2d');
      if (!ctx) return null;
      ctx.fillStyle = '#F4F6F8';
      ctx.fillRect(0, 0, size, size);
      // Centre-crop to a square.
      const sw = Math.min(src.width, src.height);
      const sx = (src.width - sw) / 2;
      const sy = (src.height - sw) / 2;
      ctx.drawImage(src, sx, sy, sw, sw, 0, 0, size, size);
      void ratio;
      return c.toDataURL('image/jpeg', 0.85);
    });
  }
  return null;
}

function CameraRig({ position }: { position: [number, number, number] }) {
  const camera = useThree((s) => s.camera);
  const key = position.join(',');
  useEffect(() => {
    camera.position.set(...position);
    camera.updateProjectionMatrix();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, camera]);
  return null;
}

/** Soft studio lighting without network-loaded HDR files. */
export function StudioLights({ warmth = 0.5, intensity = 1 }: { warmth?: number; intensity?: number }) {
  const warm = new THREE.Color().lerpColors(new THREE.Color('#dfe9ff'), new THREE.Color('#ffe2bf'), warmth);
  return (
    <>
      <ambientLight intensity={0.35 * intensity} />
      <directionalLight position={[3, 6, 4]} intensity={1.6 * intensity} color={warm} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-4, 3, -2]} intensity={0.5 * intensity} color="#cfd8ff" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2 * intensity} color={warm} position={[0, 4, 4]} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={1.4 * intensity} color="#ffffff" position={[-5, 1, 1]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={1.2 * intensity} color="#ffffff" position={[5, 1, 1]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
        <Lightformer form="ring" intensity={0.8 * intensity} color="#e8ecff" position={[0, 3, -5]} scale={3} />
      </Environment>
    </>
  );
}

interface StudioProps {
  children: ReactNode;
  target?: [number, number, number];
  camera?: [number, number, number];
  onSnapshotReady?: (fn: SnapshotFn) => void;
  autoRotate?: boolean;
  floor?: boolean;
}

export function Studio({ children, target = [0, 1, 0], camera = [0, 1.2, 4.2], onSnapshotReady, autoRotate = false, floor = true }: StudioProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: camera, fov: 32, near: 0.05, far: 100 }}
      gl={{ preserveDrawingBuffer: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
    >
      <Suspense fallback={null}>
        <StudioLights />
        {children}
        {floor && <ContactShadows position={[0, 0.001, 0]} opacity={0.42} scale={6} blur={2.4} far={3} resolution={512} />}
      </Suspense>
      <OrbitControls target={target} makeDefault enablePan={false} minDistance={1.2} maxDistance={9} maxPolarAngle={Math.PI * 0.55} autoRotate={autoRotate} autoRotateSpeed={1.2} />
      <CameraRig position={camera} />
      <SnapshotBridge onReady={onSnapshotReady} />
    </Canvas>
  );
}
