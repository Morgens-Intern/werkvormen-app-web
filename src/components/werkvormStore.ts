// Opslaglaag.
//
// De werkvormen komen RECHTSTREEKS uit de gecureerde bronlijst in
// src/data/mockData.ts — ze worden bewust niet in localStorage bewaard.
// Daardoor krijgt iedereen bij de eerstvolgende keer laden automatisch de
// nieuwste lijst: bestand aanpassen, pushen, klaar. Zou je ze wél cachen, dan
// blijft een collega die de app eerder gebruikte voor altijd op de oude versie
// hangen zonder dat iemand doorheeft waarom.
//
// In localStorage staat alleen wat persoonlijk is: favorieten, bouwplannen,
// thema en of de tip is weggeklikt.

import { Werkvorm } from "../models/types";
import { mockWerkvormen } from "../data/mockData";

// Sleutels uit een eerdere versie, toen beheerders werkvormen lokaal konden
// bewerken. Die kopie zou de bronlijst nu overschaduwen, dus ruimen we hem op.
const VEROUDERDE_SLEUTELS = ["mw_werkvormen_v2", "mw_suggestions_v1", "mw_posts_v1"];

function ruimVerouderdeOpslagOp(): void {
  try {
    VEROUDERDE_SLEUTELS.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* negeren: privémodus of opslag vol */
  }
}

export function loadWerkvormen(): Werkvorm[] {
  ruimVerouderdeOpslagOp();
  return mockWerkvormen.slice();
}

export function newId(prefix: string): string {
  return prefix + "-" + Math.random().toString(36).slice(2, 9);
}
