---
title: Design
updated: 2026-04-23
status: current
domain: product
---

# Design

## Identity

**Entropy Edge** is a structural-duel roguelite. Two builders share
a voxel lattice and race to satisfy the same sector objective — a
tier target, with connectivity thresholds at intermediate tiers.
Every placement is judged by the stability solver. Every placement
can compose with adjacent cells into a higher-order shape (wedge,
pyramid, arch, truss, buttress). Whoever claims the sector keeps
the load-bearing cells as monuments that persist as the ground of
the next sector.

A run is one cumulative skyscraper built across a seed. The final
screen names the codename of the structure you and the rival
together produced — *"Tuned Manifold"*, *"Brittle Kernel"*,
*"Sharp Epsilon"*.

## Why a player places a block

A block has three simultaneous meanings. The player needs all three
to click:

1. **Goal**: does this cell advance me toward the sector objective
   — a connectivity threshold, the tier target, a required
   connector?
2. **Structure**: does this cell *carry* what I'm planning to build
   above it, and does it avoid creating stress on what's already
   here?
3. **Legacy**: will this cell be load-bearing at claim-time, and
   therefore become a permanent monument that I keep?

A block that advances the goal but leaves a stressed column is a
bad block. A block that's structurally perfect but off the goal
line is wasted budget. A block that claims a monument is weighted
heavier in the score because it echoes into every future sector.

## Player journey

1. **Land.** Title card. "Two builders, one lattice." Three verb
   chips. CTA: *Enter the Lattice*.
2. **Seed.** Seed codename displayed — *"Tuned Manifold"*. Share URL
   copies `?seed=tuned-manifold`.
3. **Sector 1.** Voxel camera swoops to ground level. Your signal-
   orange ground anchor glows; the rival's violet anchor glows on
   the opposite side. A ghosted tier marker hovers at y=4. Banner:
   *Sector 1 — Reach Tier 4. Hold 3 connected at Tier 2.* HUD: Tier
   0 / 4 · Budget 5 blocks · Rival 5 blocks · Turn: You.
4. **Drag to propose.** You tap the ground adjacent to your anchor
   and drag upward. Ghost cells appear along the drag path. The
   hologram outlines green if the placement is stable, amber if the
   placement creates stress, red if the placement is illegal.
   Release to commit.
5. **Composite fires.** Four cells in a 2×2 pattern at y=1 + one
   cell centered at y=2 → the hologram animates the transform and
   a *wedge* crystallizes. A distinct chord plays.
6. **Rival responds.** Violet blocks fade in on the opposite side.
   The rival has its own plan for the same goal; you see it
   building.
7. **Advance.** Tier counter ticks. Connectivity threshold lights
   green when satisfied. Stress red-pulses on any column carrying
   too much.
8. **Claim.** You place the block that completes Tier 4 first. The
   sector freezes. Banner: *Claimed.* Your anchor-adjacent
   load-bearing cells mint-glow — these are your monuments.
9. **Next sector.** The camera pulls up. The claimed structure
   becomes the ground floor of Sector 2. Rival's violet cells, if
   it held any connected, become its monuments and also persist.
   New tier target, new thresholds, higher difficulty band.
10. **Run-end.** At sector 5 or 10 (configurable by session mode)
    the top-down reveal shows the whole braced skeleton of the run.
    Codename names the monument. "Your Breach: Tuned Manifold."

## Duel rules

### Turn structure

- Both builders start with the same block budget per round (default
  N = 5, scaled by sector size in patterns.json).
- You go first. Drag to propose a multi-cell shape. Commit by
  releasing on a legal placement. Your turn ends when you've
  committed a shape that exhausts part or all of your budget, OR
  you tap *End Turn* to save unused blocks for next round.
- Rival goes next. It computes its goal-oriented response given the
  current lattice. It places one or more composites. Its turn ends.
- Rounds continue until one builder satisfies the full sector
  objective. That builder claims the sector.
- If the round counter exceeds `maxRounds` for the sector with
  neither claimer, the sector draws: purge fires normally, no
  monuments that round.

### Stability

Every cell has a load and a support footprint:

- **Load** = weight of what's on top of it, transitively, plus its
  own weight (1 for 1×1, 4 for 2×2, 9 for 3×3).
- **Support** = cells directly beneath it, within a cantilever
  tolerance (max 1 cell overhang per supporting column). Ground
  (y=0) is infinite support.
- A cell is **stable** if its load ≤ its support capacity.
- A cell is **stressed** if load > support, rendered with red
  emissive pulse. Stress propagates downward and outward over
  1-2 seconds.
- When stress crosses the collapse threshold, the cell and
  everything it supports falls as Rapier3D rigid-body debris.

### Shape grammar

Shapes compose on placement. Removal of any component cell reverts
the composite to its component cells.

| Shape | Assembly predicate | Structural role |
|---|---|---|
| **Plate 2×2** | 4 cells, same y, 2×2 arrangement | Distributes load across 4 columns |
| **Plate 3×3** | 9 cells | Wider distribution; legal base for pyramids |
| **Plate 4×4** | 16 cells | Heavy; requires distributed support |
| **Wedge** | 2×2 plate + 1 centered at y+1 | Triangular truss; corners carry load |
| **Pyramid** | 3×3 plate + 2×2 centered at y+1 + 1 centered at y+2 | Maximally stable |
| **Ziggurat** | Nested plates stepping inward by 1 each tier | Wide-base tower |
| **Lintel** | 2 columns + 1 block spanning tops (1-cell gap) | Distributes to both columns |
| **Beam** | 2 columns + N spanning blocks (≤3 gap) | Longer lintel |
| **Arch** | 2 columns + 2 diagonal blocks meeting at apex (≤5 gap) | Pushes load outward |
| **Truss bridge** | 2 columns + top chord + bottom chord + diagonal webs (≤8 gap) | Longest span |
| **Flying buttress** | Column + diagonal to ground anchor | Offloads lateral thrust |
| **Diagonal brace** | 2 cells stairstep from column to cantilever | Makes cantilevers legal |
| **K-brace** | 2 diagonals meeting mid-column | Doubles unsupported column length |
| **Cross-brace** | 2 diagonals X'd between columns | Prevents lateral sway |
| **Corbel** | Stepped blocks from column | Self-bracing shelf |

Built-in JollyPixel shapes (`Cube`, `Slab`, `Pole`, `PoleY`, `Ramp`,
`RampCornerInner`, `RampCornerOuter`, `Stair`, `StairCornerInner`,
`StairCornerOuter`) cover cube/plate/wedge/brace/corbel. Custom
`BlockShape` classes cover pyramid, arch, truss bridge, flying
buttress, K-brace, cross-brace.

### Transforms

A composite shape is one structural unit. The stability solver
treats it as a single load distributor with its own footprint and
capacity (see table above). Visuals match the structural identity
— a wedge is a triangular prism, a pyramid is a pyramid, a truss is
a wire-frame frame.

### Opposing agency (Scrabble, not adversarial)

The rival's Yuka behavior tree (priority descending):

1. **Reinforce own stress.** If any rival cell is stressed, place
   to shore up before doing anything else.
2. **Satisfy next unmet threshold.** Compute shortest-path shape
   palette to the next unmet connectivity or tier requirement.
3. **Reuse shared geometry.** If a player column is a legal anchor
   for the rival's next connector, use it (the rival gets there
   faster by building on the player's tower).
4. **Build toward tier target.** Extend upward on its own
   foundation.

Nothing in that tree says "block the player." The rival might
*incidentally* occupy a cell the player wanted, because that cell
was on the rival's optimal path. That is the Scrabble feeling — the
opponent took your triple-word square, but only because it was also
their best play.

Intent: *symmetry*. Same objectives, same block budget per round,
same shape palette, same legal moves. Difficulty scales the *goal*,
not the rival.

### Monuments

At claim-time, the sim walks the claimer's cells, identifies which
are load-bearing (in-use by a connectivity threshold OR on the
critical path to the tier target), and marks them monuments.

- **Your monuments** render mint (`#2ee5b8`) and persist as
  immutable cells in every subsequent sector this run.
- **Rival monuments** render violet (`#7d5cff`) and persist
  identically.
- Both types of monument count as legal anchor cells for new
  placements in future sectors — you can build on rival monuments.
- At run-end, the monument lattice is the run's permanent record.

### Collapse = lost progress, not explicit penalty

Scoring: tiers held × connectivity bonuses × (1 / blocks used).
Collapse reduces tiers held automatically — the score drop *is* the
penalty. No additional punitive term.

A rival causing your collapse by adding load to a stressed column
is a legal and legitimate move. It would cost you the same if you
did it to yourself.

## Difficulty spine (logarithmic)

Pure PRNG generates incoherent sectors. Instead: a log-curve
multiplier and a **pattern pool** per difficulty band.

```
difficulty(level) = log2(level + 1)
```

| Band | Levels | Patterns | Shape palette |
|---|---|---|---|
| 1 | 1-3 | Straight ascent, First platform | plate, wedge, lintel, diagonal brace |
| 2 | 4-7 | Twin peaks, Pyramid base | + pyramid, beam, arch |
| 3 | 8-12 | Stepping stones, Cathedral | + truss bridge, corbel |
| 4 | 13+ | Skyline, Flying buttress | + flying buttress, K-brace, cross-brace |

Each pattern is a template: tier target, intermediate connectivity
requirements, minimum platform sizes, minimum connector spans,
minimum separation distances. The generator rolls band → pattern →
parameters within ranges, then runs a **feasibility gate**: can
this goal be achieved by a competent player in ≤ `maxRounds`
turns given the shape palette and block budget? If not, re-roll.

### Difficulty telegraphing

The banner names what changed:

- Sector 3: *Palette expanded. Wedge assembly available.*
- Sector 4: *Platform required. Hold 4 at Tier 2.*
- Sector 8: *Multi-platform phase. Brace between structures.*
- Sector 12: *Wide-base frame. Trusses required.*

Every jump is named. No hidden difficulty.

## Session modes

`config/raw/session-modes.json` defines tunable sets. Locked:

- **Standard** — log-curve default. 5-sector run. Default block
  budget.
- **Brutalist** — favors 3×3 and 4×4 platforms, de-emphasizes
  cantilevers. Wider bases, shorter runs.
- **Vertigo** — favors tall towers, narrow cantilever cantilevers,
  K-brace-heavy patterns.
- **Daily** — seeded from UTC date. Leaderboard-friendly.

## Input (pointer-only, mobile-first)

- **Tap-drag** on empty cell → propose a shape. Drag path builds
  the proposed cell set. Hologram previews the composite transform
  if the path matches a grammar predicate.
- **Release** on legal placement → commit.
- **Drag outside lattice** during a proposal → cancel.
- **Pinch** → zoom.
- **Two-finger drag** → orbit camera.
- **Tap HUD size tile** → switch cell palette tier (1×1 / 2×2 /
  3×3 as unlocked).
- **Tap End Turn button** → commit remaining budget (unused
  budget does NOT carry).

No keyboard handlers. No `keydown`, no `keyup`. The tap targets are
thumb-reachable on a 390×844 viewport.

## Palette and fonts

See [`CLAUDE.md`](../CLAUDE.md#design-palette-locked) for the palette
block. Fonts: Space Grotesk (display), Inter (body), JetBrains Mono
(numerics).

## Audio

Tone.js synthesized ambient pad with low-pass filter whose cutoff
rises with combined stability percentage (more stable → brighter
pad). Per-shape-type SFX on commit:

- Cube: muted tap
- Plate: layered chord
- Wedge: suspended fourth
- Pyramid: major triad
- Arch: plagal cadence
- Truss bridge: wide voicing (shell voicing, no third)
- Brace: snap click
- Stress: low drone, pitch rising with stress amount
- Collapse: crash + debris shuffle

Rival commits use the same palette shifted by a fifth — identifiable
as "same family, different voice."

## Codename word pools

Mathematical-abstract register. Adjective + noun. See
`config/raw/codename-words.json`.

- Nouns: `fracture`, `vector`, `manifold`, `kernel`, `epsilon`,
  `tensor`, `axiom`, `lattice`, `graph`, `curve`.
- Adjectives: `brittle`, `tuned`, `drifting`, `unraveled`, `sharp`,
  `muted`, `recurrent`, `null`, `orthogonal`, `discrete`.
