// Kleine opslaghulpjes.
//
// De werkvormen komen sinds fase C uit Supabase, niet meer uit localStorage.
// In de browser staat alleen nog wat persoonlijk is: favorieten, bouwplannen,
// thema en of de tip is weggeklikt.

// Sleutels uit eerdere versies, toen werkvormen, voorstellen en inspiratie
// lokaal werden bewaard. Die kopieën dienen nergens meer toe.
const VEROUDERDE_SLEUTELS = ["mw_werkvormen_v2", "mw_suggestions_v1", "mw_posts_v1"];

export function ruimVerouderdeOpslagOp(): void {
  try {
    VEROUDERDE_SLEUTELS.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* negeren: privémodus of opslag vol */
  }
}

export function newId(prefix: string): string {
  return prefix + "-" + Math.random().toString(36).slice(2, 9);
}
