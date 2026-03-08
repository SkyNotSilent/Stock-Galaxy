import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { TextureLoader } from 'three';
import * as THREE from 'three';
import type { StockData } from '../../hooks/useStockData';
import type { ViewMode } from '../../App';

interface CryptoCoinProps {
  data: StockData;
  position: [number, number, number];
  scale: number;
  onSelect: (data: StockData) => void;
  onFocus: (pos: THREE.Vector3 | null, scale?: number) => void;
  theme: 'dark' | 'light';
  viewMode: ViewMode;
  index: number;
}

export function CryptoCoin({ data, position, scale, onSelect, onFocus, theme, viewMode, index }: CryptoCoinProps) {
  const meshRef = useRef<THREE.Group>(null!);
  const [hovered, setHover] = useState(false);
  
  // Calculate stem height directly for immediate visibility
  let stemHeight = 0;
  if (viewMode === 'trends') {
      stemHeight = Math.abs(position[1]);
      if (stemHeight < 0.5) stemHeight = 0.5;
  }
  
  // Custom texture loader with error handling
  // If the main image fails, we fallback to a generated placeholder
  const fallbackUrl = `https://placehold.co/64x64/${theme === 'dark' ? '333333' : 'e5e7eb'}/${theme === 'dark' ? 'ffffff' : '000000'}?text=${data.symbol.substring(0, 3).toUpperCase()}`;
  
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new TextureLoader();
    const url = data.image || fallbackUrl;

    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.flipY = false;
        setTexture(tex);
      },
      undefined,
      () => {
        // On error, load fallback
        console.warn(`Failed to load texture for ${data.symbol}, using fallback.`);
        loader.load(fallbackUrl, (fallbackTex) => {
            fallbackTex.colorSpace = THREE.SRGBColorSpace;
            fallbackTex.flipY = false;
            setTexture(fallbackTex);
        });
      }
    );
  }, [data.image, fallbackUrl]);
  
  // Color logic based on price change
  const isUp = data.price_change_percentage_24h > 0;
  const ringColor = isUp ? '#4ade80' : '#f87171'; // Green or Red ring
  const metalColor = theme === 'dark' ? '#333' : '#ddd';

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Smoothly interpolate position to target
    // We want a clear visual transition where coins travel to their new spots
    const currentPos = meshRef.current.position;
    
    // Calculate distance to target
    const targetPos = new THREE.Vector3(...position);
    const distance = currentPos.distanceTo(targetPos);
    
    // If distance is significant, we are in a transition state
    // Use a spring-like ease-out for natural movement
    // Stagger based on index to create a "wave" effect rather than rigid block movement
    
    // Speed factor: 
    // - Closer coins move slower (precision)
    // - Further coins move faster (catch up)
    // - Add index-based delay logic by modulating speed
    
    // Base speed
    let speed = 3.0;
    
    // Add organic variation
    // index % 10 gives groups of 10
    // Math.sin gives wave pattern
    const organicDelay = Math.sin(index * 0.5 + state.clock.elapsedTime) * 0.5 + 1;
    
    if (distance > 0.1) {
       // Transitioning
       // Lerp with variable speed creates the "streaming" effect
       currentPos.lerp(targetPos, delta * (speed * organicDelay));
    } else {
       // Arrived (or very close)
       // Snap to exact position to prevent micro-jitter
       currentPos.lerp(targetPos, delta * 10);
    }

    // Rotate coin
    meshRef.current.rotation.y += delta * (hovered ? 2 : 0.5);
    
    // Float animation (only if near target to avoid wobble during transition)
    // And maybe lessen it in grid mode?
    // Let's keep it subtle.
    const t = state.clock.getElapsedTime();
    const offset = position[0] * 0.5 + position[2] * 0.5; 
    
    // Add floating offset to Y, but respect the lerped base Y
    // We add the sine wave *after* lerping the base position
    // To do this cleanly, we might need a wrapper group for position and inner for float,
    // or just add it to the lerped Y.
    // For simplicity:
    meshRef.current.position.y += Math.sin(t + offset) * 0.005; // Very subtle float to avoid fighting lerp

    // Scale effect on hover
    const targetScale = hovered ? scale * 1.5 : scale;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 5);
  });

  // If texture isn't loaded yet, show a simple placeholder or nothing (let Suspense handle parent if needed, but here we handle texture async)
  // Since we removed useTexture (suspense-based), we render immediately.
  const map = texture || null;

  return (
    <group 
      ref={meshRef} 
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(data);
        // Fly to coin immediately on single click
        onFocus(new THREE.Vector3(...position), scale);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        // Redundant but kept for compatibility
        onFocus(new THREE.Vector3(...position), scale);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* The Coin Body (Cylinder) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1, 1, 0.2, 32]} />
        <meshStandardMaterial 
          color={metalColor} 
          metalness={0.8} 
          roughness={0.2} 
        />
      </mesh>

      {/* The Face (Texture) - Front */}
      {map && (
        <mesh position={[0, 0, 0.11]} rotation={[0, 0, 0]}>
          <circleGeometry args={[0.85, 32]} />
          <meshBasicMaterial map={map} transparent />
        </mesh>
      )}

      {/* The Face (Texture) - Back */}
      {map && (
        <mesh position={[0, 0, -0.11]} rotation={[0, Math.PI, 0]}>
          <circleGeometry args={[0.85, 32]} />
          <meshBasicMaterial map={map} transparent />
        </mesh>
      )}

      {/* The Glowing Ring (Status) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.05, 0.05, 16, 32]} />
        <meshBasicMaterial color={ringColor} toneMapped={false} />
      </mesh>

      {/* 3D Bar Chart Stem (Only visible in trends mode) */}
      {viewMode === 'trends' && (
        <mesh position={[0, -stemHeight / 2, 0]} scale={[1, stemHeight, 1]}>
          {/* Default height 1, so scale Y controls actual height */}
          <cylinderGeometry args={[0.1, 0.1, 1, 8]} />
          <meshStandardMaterial 
            color={isUp ? '#4ade80' : '#f87171'} 
            transparent 
            opacity={0.6} 
            emissive={isUp ? '#4ade80' : '#f87171'}
            emissiveIntensity={0.5}
          />
        </mesh>
      )}
    </group>
  );
}
