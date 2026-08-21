// WijnWijs vragenbank — samengesteld uit twee bronbestanden:
//
//   questions-core.js        210 vragen (10 starters + de 200 uit de eerste
//                            AI-bank, peer-reviewed aug 2026)
//   questions-sden2-extra.js 200 aanvullende SDEN 2-vragen (aug 2026), geschreven
//                            om de dun bezette thema's op te vullen
//
// De rest van de app importeert alleen QUESTIONS uit dit bestand.

import { QUESTIONS_CORE } from "./questions-core.js";
import { QUESTIONS_EXTRA } from "./questions-sden2-extra.js";

export const QUESTIONS = [...QUESTIONS_CORE, ...QUESTIONS_EXTRA];
