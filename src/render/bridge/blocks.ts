import { Face, type BlockDefinition } from '@jolly-pixel/voxel.renderer';

/**
 * Block definitions for entropy-edge.
 *
 * Block IDs:
 *   1 — player solid cube
 *   2 — player stress cube (red face override)
 *   3 — player monument cube (mint glow)
 *   4 — rival solid cube
 *   5 — rival stress cube
 *   6 — rival monument cube
 *   7 — hologram ghost
 *
 * Tile atlas layout (16 × 16 px tiles):
 *   col 0, row 0 — signal-orange solid face
 *   col 1, row 0 — cyan-beacon edge face (top)
 *   col 2, row 0 — stress red face
 *   col 0, row 1 — violet-rival solid face
 *   col 1, row 1 — violet edge face
 *   col 2, row 1 — mint monument face
 *   col 0, row 2 — hologram cyan alpha face
 */

function faceTile(col: number, row: number) {
  return { tilesetId: 'default', col, row };
}

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  {
    id: 1,
    name: 'player',
    shapeId: 'cube',
    collidable: true,
    faceTextures: {
      [Face.PosY]: faceTile(1, 0),
      [Face.NegY]: faceTile(0, 0),
      [Face.PosX]: faceTile(0, 0),
      [Face.NegX]: faceTile(0, 0),
      [Face.PosZ]: faceTile(0, 0),
      [Face.NegZ]: faceTile(0, 0),
    },
    defaultTexture: faceTile(0, 0),
  },
  {
    id: 2,
    name: 'player-stress',
    shapeId: 'cube',
    collidable: true,
    faceTextures: {
      [Face.PosY]: faceTile(2, 0),
      [Face.NegY]: faceTile(2, 0),
      [Face.PosX]: faceTile(2, 0),
      [Face.NegX]: faceTile(2, 0),
      [Face.PosZ]: faceTile(2, 0),
      [Face.NegZ]: faceTile(2, 0),
    },
    defaultTexture: faceTile(2, 0),
  },
  {
    id: 3,
    name: 'player-monument',
    shapeId: 'cube',
    collidable: true,
    faceTextures: {
      [Face.PosY]: faceTile(2, 1),
      [Face.NegY]: faceTile(2, 1),
      [Face.PosX]: faceTile(2, 1),
      [Face.NegX]: faceTile(2, 1),
      [Face.PosZ]: faceTile(2, 1),
      [Face.NegZ]: faceTile(2, 1),
    },
    defaultTexture: faceTile(2, 1),
  },
  {
    id: 4,
    name: 'rival',
    shapeId: 'cube',
    collidable: true,
    faceTextures: {
      [Face.PosY]: faceTile(1, 1),
      [Face.NegY]: faceTile(0, 1),
      [Face.PosX]: faceTile(0, 1),
      [Face.NegX]: faceTile(0, 1),
      [Face.PosZ]: faceTile(0, 1),
      [Face.NegZ]: faceTile(0, 1),
    },
    defaultTexture: faceTile(0, 1),
  },
  {
    id: 5,
    name: 'rival-stress',
    shapeId: 'cube',
    collidable: true,
    faceTextures: {
      [Face.PosY]: faceTile(2, 0),
      [Face.NegY]: faceTile(2, 0),
      [Face.PosX]: faceTile(2, 0),
      [Face.NegX]: faceTile(2, 0),
      [Face.PosZ]: faceTile(2, 0),
      [Face.NegZ]: faceTile(2, 0),
    },
    defaultTexture: faceTile(2, 0),
  },
  {
    id: 6,
    name: 'rival-monument',
    shapeId: 'cube',
    collidable: true,
    faceTextures: {
      [Face.PosY]: faceTile(2, 1),
      [Face.NegY]: faceTile(2, 1),
      [Face.PosX]: faceTile(2, 1),
      [Face.NegX]: faceTile(2, 1),
      [Face.PosZ]: faceTile(2, 1),
      [Face.NegZ]: faceTile(2, 1),
    },
    defaultTexture: faceTile(2, 1),
  },
  {
    id: 7,
    name: 'hologram',
    shapeId: 'cube',
    collidable: false,
    faceTextures: {
      [Face.PosY]: faceTile(0, 2),
      [Face.NegY]: faceTile(0, 2),
      [Face.PosX]: faceTile(0, 2),
      [Face.NegX]: faceTile(0, 2),
      [Face.PosZ]: faceTile(0, 2),
      [Face.NegZ]: faceTile(0, 2),
    },
    defaultTexture: faceTile(0, 2),
  },
];

export const BLOCK_IDS = {
  PLAYER: 1,
  PLAYER_STRESS: 2,
  PLAYER_MONUMENT: 3,
  RIVAL: 4,
  RIVAL_STRESS: 5,
  RIVAL_MONUMENT: 6,
  HOLOGRAM: 7,
} as const;
