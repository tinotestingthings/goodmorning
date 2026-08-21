// WijnWijs vragenbank — samengesteld uit twee bronbestanden:
//
//   questions-core.js        210 vragen (10 starters + de 200 uit de eerste
//                            AI-bank, peer-reviewed aug 2026)
//   questions-sden2-extra.js 200 aanvullende SDEN 2-vragen (aug 2026), geschreven
//                            om de dun bezette thema's op te vullen
//   questions-sden2-les.js   66 vragen rechtstreeks uit het lesmateriaal van de
//                            cursus (presentaties les 1-5, oefenexamen 2019,
//                            proeflijst 2026)
//
// De rest van de app importeert alleen QUESTIONS uit dit bestand.

import { QUESTIONS_CORE } from "./questions-core.js";
import { QUESTIONS_EXTRA } from "./questions-sden2-extra.js";
import { QUESTIONS_LES } from "./questions-sden2-les.js";

export const QUESTIONS = [...QUESTIONS_CORE, ...QUESTIONS_EXTRA, ...QUESTIONS_LES];
