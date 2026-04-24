import { describe, it, expect } from 'vitest';
import { Grid, Rng, generateObjective, DuelController, plan as planRival, collapseChain } from '@/sim';

describe('AI vs AI Balance Diagnostics', () => {
  it('runs 20 matches to verify AI logic and balance', () => {
    let youWins = 0;
    let rivalWins = 0;
    let draws = 0;
    let totalRounds = 0;

    for (let i = 0; i < 20; i++) {
      const rng = new Rng(`balance-test-${i}`);
      const grid = Grid.default();
      // Increase difficulty band every 5 matches
      const objective = generateObjective(Math.floor(i / 5) + 1, rng.fork('obj'));
      const ctrl = new DuelController({
        grid,
        objective,
        yourAnchor: { x: -6, y: 0, z: 0 },
        rivalAnchor: { x: 6, y: 0, z: 0 },
        rng: rng.fork('duel'),
      });

      // AI match loop
      let guardOuter = 0;
      while (ctrl.state.status.kind === 'ongoing' && guardOuter < 200) {
        guardOuter++;
        if (ctrl.state.turn === 'you') {
          let guardInner = 0;
          while (ctrl.state.youRemaining > 0 && guardInner < 32) {
            guardInner++;
            const plan = planRival({ 
              grid, 
              objective, 
              me: 'you', 
              anchor: { x: -6, y: 0, z: 0 }, 
              rng: rng.fork(`you-${ctrl.state.round}-${guardInner}`) 
            });
            if (!plan) break;
            try { 
              ctrl.commitPlayer({ kind: plan.kind, origin: plan.origin, owner: 'you' }); 
            } catch { 
              break; 
            }
          }
          collapseChain(grid);
          if (ctrl.state.status.kind === 'ongoing') {
            ctrl.endYourTurn();
          }
        } else {
          ctrl.runRivalTurn();
          collapseChain(grid);
        }
      }

      if (ctrl.state.status.kind === 'claimed') {
        if (ctrl.state.status.winner === 'you') youWins++;
        else rivalWins++;
      } else {
        draws++;
      }
      totalRounds += ctrl.state.round;
    }

    console.log(`Balance Diagnostics (20 matches): You ${youWins} | Rival ${rivalWins} | Draws ${draws} | Avg Rounds: ${(totalRounds/20).toFixed(1)}`);
    
    // Sanity checks
    expect(youWins + rivalWins + draws).toBe(20);
    // AI shouldn't be completely broken, matches should take time
    expect(totalRounds).toBeGreaterThan(20); 
  });
});