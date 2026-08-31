// Lokale opslaglaag voor werkvormen en voorstellen.
// Wordt bij de eerste keer geseed met de gecureerde mockData. Zodra een
// beheerder iets toevoegt/bewerkt/verwijdert, wordt de volledige lijst lokaal
// bewaard. Deze laag vervangen we later door SharePoint (PnPjs).

import { Werkvorm } from "../models/types";
import { ISuggestion } from "../models/suggestion";
import { mockWerkvormen } from "../data/mockData";

const WV_KEY = "mw_werkvormen_v2";
const SUG_KEY = "mw_suggestions_v1";

export function loadWerkvormen(): Werkvorm[] {
  try {
    const raw = localStorage.getItem(WV_KEY);
    if (raw) return JSON.parse(raw) as Werkvorm[];
  } catch {
    /* negeren */
  }
  return mockWerkvormen.slice();
}

export function saveWerkvormen(list: Werkvorm[]): void {
  try {
    localStorage.setItem(WV_KEY, JSON.stringify(list));
  } catch {
    /* negeren */
  }
}

export function loadSuggestions(): ISuggestion[] {
  try {
    const raw = localStorage.getItem(SUG_KEY);
    return raw ? (JSON.parse(raw) as ISuggestion[]) : [];
  } catch {
    return [];
  }
}

export function saveSuggestions(list: ISuggestion[]): void {
  try {
    localStorage.setItem(SUG_KEY, JSON.stringify(list));
  } catch {
    /* negeren */
  }
}

export function newId(prefix: string): string {
  return prefix + "-" + Math.random().toString(36).slice(2, 9);
}
