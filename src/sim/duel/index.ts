import type { PlayerId, Vec3 } from '@/sim/_shared';
import type { Grid } from '@/sim/grid';
import type { Rng } from '@/sim/rng';
import { evaluate, type SectorObjective } from '@/sim/objective';
import { checkPlacement, commitPlacement, type PlacementRequest } from '@/sim/placement';
import { plan as planRival, type RivalContext } from '@/sim/yuka-agent';

/**
 * Duel — turn loop on a shared grid. Both builders share the lattice.
 * Budget per round, maxRounds from the objective. Claim fires when a
 * player's evaluated progress hits `claimed=true`.
 */

export type TurnOwner = PlayerId;

export type DuelStatus =
  | { kind: 'pending' }
  | { kind: 'ongoing' }
  | { kind: 'claimed'; winner: PlayerId; round: number }
  | { kind: 'drawn'; reason: 'maxRounds' };

export interface DuelState {
  readonly round: number;
  readonly turn: TurnOwner;
  readonly youRemaining: number;
  readonly rivalRemaining: number;
  readonly status: DuelStatus;
  readonly monuments: ReadonlyArray<{ owner: PlayerId; pos: Vec3 }>;
}

export interface DuelConfig {
  readonly grid: Grid;
  readonly objective: SectorObjective;
  readonly yourAnchor: Vec3;
  readonly rivalAnchor: Vec3;
  readonly rng: Rng;
}

export class DuelController {
  private _state: DuelState;

  constructor(private readonly config: DuelConfig) {
    this._state = {
      round: 1,
      turn: 'you',
      youRemaining: config.objective.blockBudgetPerRound,
      rivalRemaining: config.objective.blockBudgetPerRound,
      status: { kind: 'ongoing' },
      monuments: [],
    };
  }

  get state(): DuelState {
    return this._state;
  }

  /** Commit the player's proposed placement. Returns the new state. */
  commitPlayer(req: PlacementRequest): DuelState {
    if (this._state.status.kind !== 'ongoing') return this._state;
    if (this._state.turn !== 'you') {
      throw new Error('duel.commitPlayer: not your turn');
    }
    const check = checkPlacement(this.config.grid, req);
    if (check.validity === 'red') {
      throw new Error(`duel.commitPlayer: illegal placement (${check.reason})`);
    }
    const cost = check.cellsToPlace.length;
    if (cost > this._state.youRemaining) {
      throw new Error(
        `duel.commitPlayer: insufficient budget (need ${cost}, have ${this._state.youRemaining})`
      );
    }
    commitPlacement(this.config.grid, req);
    this._state = {
      ...this._state,
      youRemaining: this._state.youRemaining - cost,
    };
    this.afterCommit('you');
    return this._state;
  }

  /** End your turn early, handing over to the rival with whatever budget you have left. */
  endYourTurn(): DuelState {
    if (this._state.turn !== 'you') return this._state;
    this._state = { ...this._state, turn: 'rival' };
    return this._state;
  }

  /** Advance the rival's turn. Runs plan() → commit() until rival budget is spent or nothing legal remains. */
  runRivalTurn(): DuelState {
    if (this._state.status.kind !== 'ongoing') return this._state;
    if (this._state.turn !== 'rival') {
      throw new Error('duel.runRivalTurn: not rival turn');
    }
    const ctx: RivalContext = {
      grid: this.config.grid,
      objective: this.config.objective,
      me: 'rival',
      anchor: this.config.rivalAnchor,
      rng: this.config.rng.fork(`rival-r${this._state.round}`),
    };
    let guard = 0;
    while (this._state.rivalRemaining > 0 && guard < 32) {
      guard += 1;
      const proposal = planRival(ctx);
      if (!proposal) break;
      const check = checkPlacement(this.config.grid, {
        kind: proposal.kind,
        origin: proposal.origin,
        owner: 'rival',
      });
      if (check.validity === 'red') break;
      const cost = check.cellsToPlace.length;
      if (cost > this._state.rivalRemaining) break;
      commitPlacement(this.config.grid, {
        kind: proposal.kind,
        origin: proposal.origin,
        owner: 'rival',
      });
      this._state = {
        ...this._state,
        rivalRemaining: this._state.rivalRemaining - cost,
      };
      this.afterCommit('rival');
      if (this._state.status.kind !== 'ongoing') break;
    }
    if (this._state.status.kind === 'ongoing') {
      this.nextRound();
    }
    return this._state;
  }

  private afterCommit(who: PlayerId): void {
    const progress = evaluate(this.config.grid, this.config.objective, who);
    if (progress.claimed) {
      const monuments: Array<{ owner: PlayerId; pos: Vec3 }> = [];
      for (const cell of this.config.grid.cellsOf(who)) {
        this.config.grid.markMonument(cell.pos);
        monuments.push({ owner: who, pos: cell.pos });
      }
      this._state = {
        ...this._state,
        status: { kind: 'claimed', winner: who, round: this._state.round },
        monuments,
      };
    }
  }

  private nextRound(): void {
    const next = this._state.round + 1;
    if (next > this.config.objective.maxRounds) {
      this._state = {
        ...this._state,
        status: { kind: 'drawn', reason: 'maxRounds' },
      };
      return;
    }
    this._state = {
      ...this._state,
      round: next,
      turn: 'you',
      youRemaining: this.config.objective.blockBudgetPerRound,
      rivalRemaining: this.config.objective.blockBudgetPerRound,
    };
  }
}
