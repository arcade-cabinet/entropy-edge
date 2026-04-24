import * as THREE from 'three';
import type { Camera3DControls } from '@jolly-pixel/engine';
import type { Grid, Vec3 } from '@/sim';

/**
 * PointerInput — translates pointerdown on the canvas into a lattice cell
 * position and fires a callback. Mobile-first: tap = place at the hit cell
 * on an empty face of an existing block or on the ground plane.
 *
 * Strategy:
 *   - cast a ray from camera through the pointer
 *   - intersect with the ground plane at y=0; if that point lies within a
 *     filled cell, "pop up" to y of topmost filled cell + 1
 *   - caller validates via sim.placement.checkPlacement and commits.
 */

export interface PointerInputConfig {
  readonly canvas: HTMLCanvasElement;
  readonly cameraHost: Camera3DControls;
  readonly grid: Grid;
  readonly onTap: (pos: Vec3) => void;
}

export function attachPointerInput(cfg: PointerInputConfig): () => void {
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();

  const toLattice = (evt: PointerEvent): Vec3 | null => {
    const rect = cfg.canvas.getBoundingClientRect();
    ndc.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, cfg.cameraHost.camera);
    if (!raycaster.ray.intersectPlane(plane, hit)) return null;
    const x = Math.floor(hit.x + 0.5);
    const z = Math.floor(hit.z + 0.5);
    let y = 0;
    while (cfg.grid.has({ x, y, z })) y += 1;
    return { x, y, z };
  };

  const onPointerDown = (evt: PointerEvent) => {
    if (evt.button !== 0 && evt.pointerType === 'mouse') return;
    const pos = toLattice(evt);
    if (pos) cfg.onTap(pos);
  };

  cfg.canvas.addEventListener('pointerdown', onPointerDown);
  return () => {
    cfg.canvas.removeEventListener('pointerdown', onPointerDown);
  };
}
