import { useEffect, useRef } from 'react';
import { bootstrap } from '@/render/bridge/bootstrap';

/**
 * Game
 *
 * Hosts the voxel canvas and boots the JollyPixel runtime. React owns the
 * canvas element and UI chrome; JollyPixel owns the render loop and ECS.
 *
 * This PR A stub paints an empty canvas. The landing page, HUD, overlays,
 * and actual duel gameplay wire through subsequent PRs.
 */
export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const teardown = bootstrap({ canvas });
    return () => {
      teardown.then((dispose) => dispose());
    };
  }, []);

  return (
    <main
      style={{
        width: '100vw',
        height: '100svh',
        background: 'var(--color-bg, #07080a)',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </main>
  );
}
