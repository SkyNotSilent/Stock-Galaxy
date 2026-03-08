import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { ViewMode } from '../../App';

interface CameraControllerProps {
  viewMode: ViewMode;
  controlsRef: React.RefObject<OrbitControlsImpl>;
}

// Target configurations for each view mode
const VIEW_CONFIGS = {
  galaxy: {
    position: new THREE.Vector3(0, 40, 80), // High angle, overview
    target: new THREE.Vector3(0, 0, 0),     // Look at center
  },
  'market-cap': {
    position: new THREE.Vector3(0, 100, 10), // Almost top-down (Map view)
    target: new THREE.Vector3(0, 0, 0),
  },
  trends: {
    position: new THREE.Vector3(0, 10, 120), // Low angle, Front view (to see heights)
    target: new THREE.Vector3(0, 10, 0),     // Look slightly up
  }
};

export function CameraController({ viewMode, controlsRef, focusTarget, dataLength }: CameraControllerProps & { focusTarget: { position: THREE.Vector3, scale: number } | null, dataLength?: number }) {
  const { camera } = useThree();
  const transitionRef = useRef(0); // 0 = finished, >0 = transitioning
  const transitionDuration = useRef(2.0); // Default duration
  const lastMode = useRef(viewMode);
  const lastFocus = useRef(focusTarget);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    // Detect mode change or focus change to trigger transition
    if (viewMode !== lastMode.current || focusTarget !== lastFocus.current) {
      transitionRef.current = 2.0; // Faster: 2.0s transition
      transitionDuration.current = 2.0;
      lastMode.current = viewMode;
      lastFocus.current = focusTarget;
    }

    // If transitioning, interpolate
    if (transitionRef.current > 0) {
      transitionRef.current -= delta;
      
      // Calculate progress (0 to 1)
      const rawProgress = 1 - (transitionRef.current / transitionDuration.current); 
      
      // Fix NaN/Infinity issues if duration is 0 (though we set it to 2.0)
      if (!isFinite(rawProgress)) return;

      // Apply Ease-In-Out Cubic for smooth start and end
      const progress = rawProgress < 0.5 
        ? 4 * rawProgress * rawProgress * rawProgress 
        : 1 - Math.pow(-2 * rawProgress + 2, 3) / 2;
      
      let targetPos, targetLookAt;

      if (focusTarget) {
        // Focus mode: Fly close to the target
        // Calculate offset based on target scale to ensure it fills the view
        // Base distance = scale * factor
        // For a scale of 1, distance 5 fills the screen nicely with FOV 50
        // But for scale 6 (BTC), distance 5 is INSIDE the coin.
        // We need distance proportional to scale.
        // Distance = Scale / tan(FOV/2) + Padding
        // FOV 50 -> tan(25) ~= 0.46
        // Min Dist = Scale / 0.46 ~= 2.1 * Scale
        // Let's use 3.0 * Scale for a comfortable "full view"
        const dist = Math.max(5, focusTarget.scale * 3.5); 
        
        // Position camera slightly above and offset
        const offset = new THREE.Vector3(0, dist * 0.3, dist); 
        targetPos = focusTarget.position.clone().add(offset);
        targetLookAt = focusTarget.position;
        
        // Simple lerp for focus
        camera.position.lerp(targetPos, delta * 4);
        controlsRef.current.target.lerp(targetLookAt, delta * 4);

      } else if (viewMode === 'market-cap' && dataLength && dataLength > 0) {
         // Cinematic Market Cap Transition
         // 1. Calculate BTC position
         const cols = Math.ceil(Math.sqrt(dataLength));
         const spacing = 4;
         const btcX = (0 - cols / 2) * spacing;
         const btcZ = (0 - cols / 2) * spacing;
         
         // Guard against NaN just in case
         if (isNaN(btcX) || isNaN(btcZ)) return;

         const btcPos = new THREE.Vector3(btcX, 0, btcZ);
         
         // 2. Define Keyframes
         // Start: High above (Bird's eye)
         // End: Diagonal Frontal view of BTC (Isometric-ish) - FROM THE LEFT
         
         const startHeight = 140; // Higher peak
         const endDistance = 35; // Closer
         const endHeight = 20; // Better angle
         
         // Multi-stage interpolation based on progress
         if (progress < 0.4) {
            // Phase 1: Rapid Ascent & Center (0% - 40%)
            // Fly to a high point slightly offset to start the arc
            const midPoint = btcPos.clone().add(new THREE.Vector3(0, startHeight, 20));
            camera.position.lerp(midPoint, delta * 4);
            controlsRef.current.target.lerp(btcPos, delta * 4);
         } else {
            // Phase 2: Dive & Rotate to Diagonal (40% - 100%)
            // Move to diagonal position (x=-z for opposite 45 degree angle)
            // Use negative X to view from the left side
            const finalPos = btcPos.clone().add(new THREE.Vector3(-endDistance, endHeight, endDistance));
            camera.position.lerp(finalPos, delta * 5); // Fast dive
            controlsRef.current.target.lerp(btcPos, delta * 5);
         }
         
         targetPos = null; // Handled above manually
         targetLookAt = null;

      } else {
        // Default View modes (Galaxy, Trends)
        const config = VIEW_CONFIGS[viewMode];
        targetPos = config.position;
        targetLookAt = config.target;
        
        // Standard smooth lerp
        camera.position.lerp(targetPos, delta * 3);
        controlsRef.current.target.lerp(targetLookAt, delta * 3);
      }

      controlsRef.current.update();
    } else {
      // User has full control
      // Handle Auto-Rotate behavior based on state
      if (viewMode === 'galaxy' && focusTarget) {
        controlsRef.current.autoRotate = true;
        controlsRef.current.autoRotateSpeed = 1.0; // Gentle orbit
      } else {
        controlsRef.current.autoRotate = false;
      }
      controlsRef.current.update();
    }
  });

  return null;
}
