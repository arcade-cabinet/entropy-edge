import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { Camera3DControls } from '@jolly-pixel/engine';
import { Runtime, loadRuntime } from '@jolly-pixel/runtime';
import { VoxelRenderer } from '@jolly-pixel/voxel.renderer';
import { generateObjective, Rng, type DuelState, type SectorObjective } from '@/sim';
import { attachPointerInput, SimBridge } from '@/ecs';
import { BLOCK_DEFINITIONS } from './blocks';

/**
 * JollyPixel runtime bootstrap.
 *
 * Boots Rapier3D, the JollyPixel runtime, the voxel renderer, and the sim
 * bridge. Exposes a listener hook so the React HUD can mirror DuelState.
 *
 * Per the three-layer contract: the bridge mutates the grid (sim), then
 * pushes setVoxel calls into the renderer. React never touches the grid
 * directly — it reads DuelState via onDuelChange and dispatches pointer
 * events via this module's public API.
 */

export interface BootstrapOptions {
  canvas: HTMLCanvasElement;
  seed?: string;
  onDuelChange?: (state: DuelState) => void;
  onObjective?: (objective: SectorObjective) => void;
}

export type Teardown = () => void;

export async function bootstrap(options: BootstrapOptions): Promise<Teardown> {
  const { canvas } = options;
  const seed = options.seed ?? `run-${Math.floor(Date.now() / 1000)}`;

  await RAPIER.init();
  const rapierWorld = new RAPIER.World({ x: 0, y: -9.81, z: 0 });

  const runtime = new Runtime(canvas, { includePerformanceStats: false });
  const { world } = runtime;

  const scene = world.sceneManager.getSource();
  scene.background = new THREE.Color('#07080a');
  scene.fog = new THREE.FogExp2(0x07080a, 0.016);

  const ambient = new THREE.AmbientLight(new THREE.Color('#dce1e8'), 0.9);
  const dir = new THREE.DirectionalLight(new THREE.Color('#ffffff'), 1.6);
  dir.position.set(16, 28, 18);
  scene.add(ambient, dir);

  let cameraRef: Camera3DControls | null = null;
  world.createActor('camera').addComponent(Camera3DControls, {}, (component) => {
    component.camera.position.set(18, 16, 22);
    component.camera.lookAt(0, 3, 0);
    cameraRef = component;
  });

  const voxelMap = world
    .createActor('lattice')
    .addComponentAndGet(VoxelRenderer, {
      chunkSize: 16,
      layers: ['player', 'rival', 'monument', 'hologram'],
      blocks: BLOCK_DEFINITIONS,
      alphaTest: 0.3,
      material: 'lambert',
      rapier: {
        api: RAPIER as never,
        world: rapierWorld as never,
      },
    });

  await voxelMap.loadTileset({
    id: 'default',
    src: 'tileset/entropy-edge.png',
    tileSize: 32,
  });

  // Sector 1 objective — deterministic from the seed.
  const seedRng = new Rng(seed);
  const objective = generateObjective(1, seedRng.fork('sector-1'));
  options.onObjective?.(objective);

  const yourAnchor = { x: -6, y: 0, z: 0 } as const;
  const rivalAnchor = { x: 6, y: 0, z: 0 } as const;

  const bridge = new SimBridge({
    voxelMap,
    objective,
    yourAnchor,
    rivalAnchor,
    seed,
  });

  // Seed the two anchors visually so the player has something to build from.
  bridge.seedCell('you', yourAnchor);
  bridge.seedCell('rival', rivalAnchor);
  options.onDuelChange?.(bridge.state);

  const offChange = bridge.onChange((state) => options.onDuelChange?.(state));

  // Pointer input — tap/drag-to-place cubes.
  let detachPointer: (() => void) | null = null;
  const tryAttachPointer = () => {
    if (detachPointer || !cameraRef) return;
    detachPointer = attachPointerInput({
      canvas,
      cameraHost: cameraRef,
      grid: bridge.grid,
      onTap: (pos) => {
        if (bridge.state.turn !== 'you') return;
        if (bridge.state.status.kind !== 'ongoing') return;
        try {
          bridge.commitPlayer({ kind: 'cube', origin: pos });
        } catch {
          // Illegal placement — ignore silently; hologram feedback lands in PR H.
        }
        if (bridge.state.youRemaining === 0) {
          bridge.endYourTurn();
          bridge.runRivalTurn();
        }
      },
    });
  };
  // Camera3DControls is added synchronously above but its `camera` field is
  // assigned in the callback which fires after this frame; schedule the pointer
  // attachment on the next microtask.
  queueMicrotask(tryAttachPointer);

  world.on('beforeFixedUpdate', () => {
    rapierWorld.step();
  });

  loadRuntime(runtime).catch((error: unknown) => {
    console.error('[entropy-edge] runtime load failed', error);
  });

  return () => {
    offChange();
    detachPointer?.();
    runtime.stop?.();
  };
}
