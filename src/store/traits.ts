import { trait } from "koota";
import { createInitialState } from "../engine/simulation";

export const EntropyTrait = trait(() => createInitialState());
