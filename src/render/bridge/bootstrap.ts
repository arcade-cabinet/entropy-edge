import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { Camera3DControls } from '@jolly-pixel/engine';
import { Runtime, loadRuntime } from '@jolly-pixel/runtime';
import { VoxelRenderer } from '@jolly-pixel/voxel.renderer';
import { BLOCK_DEFINITIONS, BLOCK_IDS } from './blocks';

/**
 * JollyPixel runtime bootstrap.
 *
 * Initializes Rapier3D (WASM), creates the Runtime bound to the supplied
 * canvas, loads the tileset, spawns the voxel map actor with one layer per
 * owner (+ hologram + monument), seeds a demo sector opener so the canvas
 * paints something, and kicks off the render loop.
 *
 * The duel loop + input wire through in PR D.
 */

export interface BootstrapOptions {
  canvas: HTMLCanvasElement;
}

export type Teardown = () => void;

export async function bootstrap(options: BootstrapOptions): Promise<Teardown> {
  const { canvas } = options;

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

  // Camera actor — Camera3DControls is the engine's blessed camera wrapper.
  world.createActor('camera').addComponent(Camera3DControls, {}, (component) => {
    component.camera.position.set(18, 16, 22);
    component.camera.lookAt(0, 3, 0);
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

  seedOpener(voxelMap);

  world.on('beforeFixedUpdate', () => {
    rapierWorld.step();
  });

  loadRuntime(runtime).catch((error: unknown) => {
    // Runtime.ts already logs; rethrow would crash the mount.
    console.error('[entropy-edge] runtime load failed', error);
  });

  return () => {
    runtime.stop?.();
  };
}

function seedOpener(voxelMap: VoxelRenderer): void {
  // Player anchor slab: 4-wide strip at (-8..-5, 0, -2..1).
  for (let dx = 0; dx < 4; dx++) {
    for (let dz = -2; dz < 2; dz++) {
      voxelMap.setVoxel('player', {
        position: { x: -8 + dx, y: 0, z: dz },
        blockId: BLOCK_IDS.PLAYER,
      });
    }
  }
  // Rival anchor slab: 4-wide strip at (4..7, 0, -2..1).
  for (let dx = 0; dx < 4; dx++) {
    for (let dz = -2; dz < 2; dz++) {
      voxelMap.setVoxel('rival', {
        position: { x: 4 + dx, y: 0, z: dz },
        blockId: BLOCK_IDS.RIVAL,
      });
    }
  }
  // Center monument: 3-tall tower (mint) so run-end visual is clear.
  for (let y = 0; y < 3; y++) {
    voxelMap.setVoxel('monument', {
      position: { x: 0, y, z: 0 },
      blockId: BLOCK_IDS.PLAYER_MONUMENT,
    });
  }
}
