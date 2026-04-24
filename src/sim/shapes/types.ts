import type { PlayerId, ShapeKind, Vec3 } from '@/sim/_shared';

/**
 * Shape grammar types. A ShapeDef names what cells a composite occupies
 * relative to its origin and how it loads the structure beneath it.
 */

export interface ShapeMetrics {
  /** How many units of load the composite can carry (at its support face). */
  readonly capacity: number;
  /** Weight the composite adds to everything beneath it. */
  readonly weight: number;
  /** True if this composite requires a brace to be structurally legal. */
  readonly requiresBrace: boolean;
}

export interface ShapeDef {
  readonly kind: ShapeKind;
  /** Cells occupied by the composite, in lattice coordinates relative to origin. */
  readonly footprint: readonly Vec3[];
  /**
   * Cells that MUST already exist beneath the composite for placement legality.
   * Relative to origin. Empty = ground only.
   */
  readonly supportFootprint: readonly Vec3[];
  readonly metrics: ShapeMetrics;
}

export interface ShapeInstance {
  readonly kind: ShapeKind;
  readonly origin: Vec3;
  readonly owner: PlayerId;
  readonly id: string;
  readonly cellPositions: readonly Vec3[];
}
