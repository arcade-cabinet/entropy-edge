---
title: Standards
updated: 2026-04-23
status: current
domain: quality
---

# Entropy Edge — Standards

## Code quality

### Responsibility, not line count

Files should do one thing well. The limit is whether a reader can
hold the file in their head and whether you can change one thing
without touching unrelated code. A 400-line content table or
single-responsibility solver is fine; a 250-line file that secretly
owns three unrelated subsystems is not.

No hard LOC gate. Shape-grammar shape classes, the stability solver,
and the Yuka behavior tree are likely to exceed 300 LOC each because
each is a single coherent responsibility. That is acceptable.

Hooks may warn, never block.

### TypeScript

- Strict mode via `tsconfig.app.json`.
- `verbatimModuleSyntax: true` — use `import type` for type-only
  imports.
- Biome `noExplicitAny: error`. Prefer discriminated unions.
- Explicit return types on exported functions in `src/sim/**` and
  `src/ecs/**`.
- `noNonNullAssertion: warn`. Justify every `!` with a comment or a
  guard.

### Linting and formatting

- Biome 2.4. `pnpm lint` = `biome lint .`.
- `quoteStyle: single`, `jsxQuoteStyle: double`, `semicolons:
  always`, `trailingCommas: es5`, `lineWidth: 100`, `indentWidth: 2`.
- `noRestrictedGlobals`: `localStorage` and `sessionStorage` are
  blocked. Use `src/platform/storage.ts` (Capacitor Preferences).
- No ESLint, no Prettier, no stylelint.
- No Tailwind build. `src/theme/tw.css` holds any pinned utility
  subset.

### Dependencies

- Weekly dependabot, minor + patch grouped.
- `three`, `@jolly-pixel/*`, `@dimforge/rapier3d-compat` pinned —
  review before bumping.
- `yuka`, `tone`, `seedrandom`, `zod` pinned by major.
- `react` / `react-dom` share version, bump together.

## Three-layer contract

Sim never imports engine. ECS never imports React/DOM. Render never
mutates sim. Violations are bugs. See
[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

## Player-journey gate (non-negotiable)

A PR may not merge if any of the below fail on desktop (1280×800) OR
mobile-portrait (390×844) viewports.

1. **Cold load** paints in under 2 seconds from navigation.
2. **Landing** shows the title in Space Grotesk orange, the tagline,
   three verb chips (*Build upward* · *Brace every span* · *Claim
   the tier*), and a primary CTA ("Enter the Lattice"). No layout
   shift.
3. **Transition** from CTA to gameplay in under 600ms. No console
   errors. Voxel canvas paints.
4. **Orient within 15 seconds**: a cold player can identify their
   ground-plane anchor, the rival's opposite-side ground, the tier
   target ghosted at the goal y, and the HUD showing *Sector*,
   *Tier*, *Your budget*, *Rival budget*, *Seed*.
5. **Pointer-only**: every interaction works with finger taps and
   drags. Keyboard handlers are forbidden in game code.
6. **No console errors** throughout the run.
7. **Claim finale** names the claim holder and the monument count;
   **draw finale** reads "Sector held open. Monuments unchanged."
   Both offer "Next Sector."

## Brand

- Title: **Entropy Edge**.
- Tagline: *Two builders, one lattice. Race the same objective,
  brace what you build, and keep what was load-bearing when you
  claimed it.*
- Verb chips: **Build upward** · **Brace every span** · **Claim the
  tier**.
- Palette and fonts: see [`CLAUDE.md`](./CLAUDE.md) palette block.
- Icon: a braced truss silhouette over graphite. Tracked in
  `docs/STATE.md`.
