/**
 * bootstrap.ts
 *
 * JollyPixel runtime + Rapier + VoxelRenderer engine startup.
 *
 * PR A stub: returns a no-op teardown. Full wiring lands in PR C once the
 * sim layer exists to feed the renderer.
 */

export interface BootstrapOptions {
  canvas: HTMLCanvasElement;
}

export type Teardown = () => void;

export async function bootstrap(_options: BootstrapOptions): Promise<Teardown> {
  return () => {
    // no-op
  };
}
