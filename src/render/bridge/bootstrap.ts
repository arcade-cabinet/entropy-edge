import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { Camera3DControls } from '@jolly-pixel/engine';
import { Runtime } from '@jolly-pixel/runtime';
import { VoxelRenderer } from '@jolly-pixel/voxel.renderer';
import {
  generateObjective,
  resolveSeed,
  type Codename,
  type DuelState,
  type SectorObjective,
} from '@/sim';
import { attachPointerInput, SimBridge, type ProgressSnapshot } from '@/ecs';
import { createAmbient, createSfx, ensureStarted } from '@/audio';
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
  seed?: string | null;
  onDuelChange?: (state: DuelState) => void;
  onObjective?: (objective: SectorObjective) => void;
  onCodename?: (codename: Codename) => void;
  onProgress?: (progress: ProgressSnapshot) => void;
}

export type Teardown = () => void;

export async function bootstrap(options: BootstrapOptions): Promise<Teardown> {
  const { canvas } = options;
  const { rng: seedRng, codename } = resolveSeed(options.seed ?? null);
  options.onCodename?.(codename);

  await RAPIER.init();
  const rapierWorld = new RAPIER.World({ x: 0, y: -9.81, z: 0 });

  const runtime = new Runtime(canvas, { includePerformanceStats: false });
  const { world } = runtime;

  const scene = world.sceneManager.getSource();
  scene.background = new THREE.Color('#07080a');
  scene.fog = new THREE.FogExp2(0x07080a, 0.016);

  const ambientLight = new THREE.AmbientLight(new THREE.Color('#dce1e8'), 0.9);
  const dirLight = new THREE.DirectionalLight(new THREE.Color('#ffffff'), 1.6);
  dirLight.position.set(16, 28, 18);
  scene.add(ambientLight, dirLight);

  // Ground lattice — 24×24 grid centered at origin so the player sees the
  // build surface. Uses beacon cyan at low opacity so it reads as a hint, not
  // a frame.
  const ground = new THREE.GridHelper(
    24,
    24,
    new THREE.Color('#21d4ff'),
    new THREE.Color('#0f1115')
  );
  const groundMat = ground.material as THREE.LineBasicMaterial | THREE.LineBasicMaterial[];
  if (Array.isArray(groundMat)) {
    for (const m of groundMat) {
      m.transparent = true;
      m.opacity = 0.18;
    }
  } else {
    groundMat.transparent = true;
    groundMat.opacity = 0.18;
  }
  ground.position.y = -0.499;
  scene.add(ground);

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

  // Sector 1 objective — deterministic from the codename-backed seed.
  const objective = generateObjective(1, seedRng.fork('sector-1'));
  options.onObjective?.(objective);

  // Tier-target ring — a wide ring at the target Y so the player sees the goal.
  // Signal-orange to match the player palette so "reach me" is unambiguous.
  const tierMarker = new THREE.Mesh(
    new THREE.RingGeometry(11.2, 11.6, 64),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color('#ff6b1a'),
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    })
  );
  tierMarker.rotation.x = -Math.PI / 2;
  tierMarker.position.y = objective.tierTarget - 0.5;
  scene.add(tierMarker);

  const yourAnchor = { x: -6, y: 0, z: 0 } as const;
  const rivalAnchor = { x: 6, y: 0, z: 0 } as const;

  const bridge = new SimBridge({
    voxelMap,
    objective,
    yourAnchor,
    rivalAnchor,
    seed: codename.slug,
  });

  // Seed the two anchors visually so the player has something to build from.
  bridge.seedCell('you', yourAnchor);
  bridge.seedCell('rival', rivalAnchor);
  options.onDuelChange?.(bridge.state);

  // Audio — synthesized pad + SFX. Nothing fires until first gesture.
  const ambient = createAmbient();
  const sfx = createSfx();
  let audioArmed = false;
  const armAudio = () => {
    if (audioArmed) return;
    audioArmed = true;
    void ensureStarted().then(() => ambient.start(objective.difficultyBand));
  };

  // Stability feedback — import stability solver lazily and rAF-debounce so
  // rapid rival-turn commits don't trigger N full solves in one microtask.
  let stabilityRaf = 0;
  let solverPromise: Promise<typeof import('@/sim').solve> | null = null;
  const loadSolver = () => {
    if (!solverPromise) {
      solverPromise = import('@/sim').then((m) => m.solve);
    }
    return solverPromise;
  };
  const requestStabilityRefresh = () => {
    if (stabilityRaf) return;
    stabilityRaf = requestAnimationFrame(async () => {
      stabilityRaf = 0;
      const solve = await loadSolver();
      const state = solve(bridge.grid);
      const total = bridge.grid.cellCount || 1;
      const stressed = state.stressed.size;
      ambient.setStability((total - stressed) / total);
      sfx.stress(stressed / total);
    });
  };

  const offChange = bridge.onChange((state) => {
    options.onDuelChange?.(state);
    requestStabilityRefresh();
    if (state.status.kind === 'claimed') {
      void sfx.claim();
    }
  });
  const offProgress = options.onProgress
    ? bridge.onProgress((snap) => options.onProgress?.(snap))
    : null;
  // Emit an initial progress snapshot so the HUD reflects the seeded anchors.
  options.onProgress?.(bridge.progress());
  const offCommit = bridge.onCommit((event) => {
    void sfx.play(event.kind, event.owner);
  });

  // Pointer input — tap/drag-to-place cubes.
  let detachPointer: (() => void) | null = null;
  const tryAttachPointer = () => {
    if (detachPointer || !cameraRef) return;
    detachPointer = attachPointerInput({
      canvas,
      cameraHost: cameraRef,
      grid: bridge.grid,
      onTap: (pos) => {
        armAudio();
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

  // Start the runtime directly — loadRuntime() adds a separate loading UI
  // and fetches GPU benchmarks from unpkg.com which trips our CSP.
  runtime.start();

  return () => {
    if (stabilityRaf) {
      cancelAnimationFrame(stabilityRaf);
      stabilityRaf = 0;
    }
    offChange();
    offProgress?.();
    offCommit();
    detachPointer?.();
    ambient.stop();
    sfx.stop();
    runtime.stop?.();
    tierMarker.geometry.dispose();
    (tierMarker.material as THREE.Material).dispose();
    ground.geometry.dispose();
    if (Array.isArray(ground.material)) {
      for (const m of ground.material) m.dispose();
    } else {
      ground.material.dispose();
    }
  };
}
