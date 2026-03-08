import { useRef, useMemo, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { StockData } from '../../hooks/useStockData';
import { CryptoCoin } from './CryptoCoin'; // New component
import type { ViewMode } from '../../App';

interface StarsProps {
  data: StockData[];
  onSelect: (data: StockData | null) => void;
  onFocus: (pos: THREE.Vector3 | null, scale?: number) => void;
  theme: 'dark' | 'light';
  viewMode: ViewMode;
  focusTarget: THREE.Vector3 | null;
}

function LoadingCoin({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.5, 8, 8]} />
      <meshBasicMaterial color="gray" wireframe />
    </mesh>
  );
}

export function Stars({ data, onSelect, onFocus, theme, viewMode, focusTarget }: StarsProps) {
  const groupRef = useRef<THREE.Group>(null!);

  // Calculate positions for ALL modes
  const items = useMemo(() => {
    return data.map((stock, i) => {
      // 1. Calculate Scale (Hierarchy)
      const capInBillions = (stock.market_cap || 1000) / 1e9;
      let scale = 0.5;
      
      if (capInBillions > 1000) scale = 6.0; 
      else if (capInBillions > 200) scale = 4.0;
      else if (capInBillions > 50) scale = 2.5;
      else if (capInBillions > 10) scale = 1.5;
      else scale = 0.6;

      // 2. Calculate Layouts
      
      // A. Galaxy (Solar System)
      let galaxyPos: [number, number, number] = [0, 0, 0];
      {
        let radius = 0;
        let angle = i * 0.5;
        if (i === 0) radius = 0;
        else if (i < 10) radius = 10 + i * 1.5; // Tighter inner planets
        else radius = 25 + (i - 10) * 0.5; // Tighter outer belt (0.8 -> 0.5)
        
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        const maxVertical = 30;
        let y = stock.price_change_percentage_24h * 1.5; 
        if (y > maxVertical) y = maxVertical;
        if (y < -maxVertical) y = -maxVertical;
        if (i === 0) y = y * 0.2;
        
        galaxyPos = [x, y, z];
      }

      // B. Market Cap Grid (Flat Plane)
      // Arrange in a grid based on Rank (i)
      let marketCapPos: [number, number, number] = [0, 0, 0];
      {
        const cols = Math.ceil(Math.sqrt(data.length));
        const spacing = 4; // Space between items
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = (col - cols / 2) * spacing;
        const z = (row - cols / 2) * spacing;
        marketCapPos = [x, 0, z];
      }

      // C. Trends Grid (3D Bar Chart)
      // Same X/Z grid, but Y is trend
      let trendsPos: [number, number, number] = [0, 0, 0];
      {
        const cols = Math.ceil(Math.sqrt(data.length));
        const spacing = 4;
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = (col - cols / 2) * spacing;
        const z = (row - cols / 2) * spacing;
        
        // Exaggerate height for trends view
        let y = stock.price_change_percentage_24h * 2.0;
        trendsPos = [x, y, z];
      }

      return {
        stock,
        scale,
        // Store all positions
        positions: {
          galaxy: galaxyPos,
          'market-cap': marketCapPos,
          trends: trendsPos
        }
      };
    });
  }, [data]);

  useFrame(() => {
    if (!groupRef.current) return;
    // Rotate the whole galaxy slowly ONLY in galaxy mode AND when not focused
    if (viewMode === 'galaxy') {
       if (!focusTarget) {
         groupRef.current.rotation.y += 0.0005;
       }
    } else {
       // Slowly reset rotation to 0 when in grid modes for easier reading
       groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.05);
    }
  });

  return (
    <group ref={groupRef}>
      {items.map((item, index) => (
        <group key={item.stock.id}>
          <Suspense fallback={<LoadingCoin position={item.positions[viewMode]} />}>
            <CryptoCoin 
              data={item.stock} 
              // Pass the target position based on current mode
              position={item.positions[viewMode]} 
              scale={item.scale} 
              onSelect={onSelect}
              onFocus={onFocus}
              theme={theme}
              viewMode={viewMode}
              index={index}
            />
          </Suspense>
        </group>
      ))}
    </group>
  );
}
