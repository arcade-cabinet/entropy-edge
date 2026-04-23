import { PhaseTrait, ScoreTrait, TimerTrait } from "@/store/shared-traits";
import { createWorld } from "koota";
import { createInitialState } from "../engine/simulation";
import { EntropyTrait } from "./traits";

export const entropyWorld = createWorld();
export const entropyEntity = entropyWorld.spawn(
  PhaseTrait({ phase: "menu" }),
  ScoreTrait({ value: 0, label: "SCORE" }),
  TimerTrait({ elapsedMs: 0, remainingMs: 20_000, label: "STABILITY" }),
  EntropyTrait(createInitialState())
);
