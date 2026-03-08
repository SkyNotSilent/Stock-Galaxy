import { useRef } from 'react';
import { OrbitControls, Stars as DreiStars } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Stars } from './Stars';
import { CameraController } from './CameraController';
import type { StockData } from '../../hooks/useStockData';
import type { ViewMode } from '../../App';

interface GalaxyProps {
  data: StockData[];
  onSelect: (data: StockData | null) => void;
  onFocus: (pos: THREE.Vector3 | null, scale?: number) => void;
  theme: 'dark' | 'light';
  viewMode: ViewMode;
  focusTarget: { position: THREE.Vector3, scale: number } | null;
}

export function Galaxy({ data, onSelect, onFocus, theme, viewMode, focusTarget }: GalaxyProps) {
  const isDark = theme === 'dark';
  const controlsRef = useRef<OrbitControlsImpl>(null!);

  return (
    <>
      <color attach="background" args={[isDark ? '#000000' : '#f0f0f0']} />
      
      <ambientLight intensity={isDark ? 0.2 : 0.8} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color={isDark ? "#4ade80" : "#000000"} />
      
      {/* Background star field for depth - Only visible in dark mode */}
      {isDark && (
        <DreiStars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      )}
      
      {/* Removed Fog to improve visibility of distant coins as per user request */}

      {/* The main data visualization */}
      <Stars 
        data={data} 
        onSelect={onSelect} 
        onFocus={onFocus}
        theme={theme} 
        viewMode={viewMode} 
        focusTarget={focusTarget ? focusTarget.position : null}
      />
      
      <CameraController 
        viewMode={viewMode} 
        controlsRef={controlsRef} 
        focusTarget={focusTarget} 
        dataLength={data.length}
      />
      
      <OrbitControls 
        ref={controlsRef}
        enablePan={true} 
        enableZoom={true} 
        enableRotate={true} 
        autoRotate={false}
        maxDistance={400} // Increased to see full galaxy
        minDistance={5}
      />
    </>
  );
}
