import { supabase } from "./supabase";
import { IBouwplan } from "../models/bouwplan";

// ---------------------------------------------------------------------------
//  FAVORIETEN
// ---------------------------------------------------------------------------

export async function haalFavorieten(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("favorites")
    .select("werkvorm_id")
    .eq("user_id", userId);
  if (error) throw new Error(`Kon de favorieten niet ophalen: ${error.message}`);
  return (data || []).map((r) => (r as { werkvorm_id: string }).werkvorm_id);
}

export async function zetFavoriet(
  userId: string,
  werkvormId: string,
  aan: boolean
): Promise<void> {
  if (aan) {
    const { error } = await supabase
      .from("favorites")
      .insert({ user_id: userId, werkvorm_id: werkvormId });
    if (error) throw new Error(`Kon de favoriet niet opslaan: ${error.message}`);
    return;
  }
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("werkvorm_id", werkvormId);
  if (error) throw new Error(`Kon de favoriet niet verwijderen: ${error.message}`);
}

// ---------------------------------------------------------------------------
//  BOUWPLANNEN
// ---------------------------------------------------------------------------

interface BouwplanRij {
  id: string;
  titel: string;
  plan: IBouwplan;
  updated_at: string;
}

/**
 * De app werkt intern met IBouwplan, waarin het id en updatedAt in het document
 * zelf zitten. In de database is het id de primaire sleutel. We laten het
 * database-id leidend zijn en schrijven dat terug in het document, zodat de
 * component met één id werkt en niet met twee.
 */
export async function haalBouwplannen(userId: string): Promise<IBouwplan[]> {
  const { data, error } = await supabase
    .from("bouwplannen")
    .select("id, titel, plan, updated_at")
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`Kon de bouwplannen niet ophalen: ${error.message}`);

  return ((data || []) as unknown as BouwplanRij[]).map((r) => ({
    ...r.plan,
    id: r.id,
    updatedAt: new Date(r.updated_at).getTime(),
  }));
}

/** Slaat een bouwplan op. Bestaat het al, dan wordt het bijgewerkt. */
export async function bewaarBouwplan(userId: string, plan: IBouwplan): Promise<IBouwplan> {
  const nu = new Date().toISOString();
  const velden = {
    owner_id: userId,
    titel: plan.bijeenkomst || "Naamloos bouwplan",
    plan,
    updated_at: nu,
  };

  // Een bouwplan dat nog niet in de database staat heeft een lokaal gegenereerd
  // id, geen UUID. Daaraan herkennen we of het nieuw is.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(plan.id);

  if (!isUuid) {
    const { data, error } = await supabase
      .from("bouwplannen")
      .insert(velden)
      .select("id, titel, plan, updated_at")
      .single();
    if (error) throw new Error(`Kon het bouwplan niet opslaan: ${error.message}`);
    const r = data as unknown as BouwplanRij;
    return { ...r.plan, id: r.id, updatedAt: new Date(r.updated_at).getTime() };
  }

  const { data, error } = await supabase
    .from("bouwplannen")
    .update(velden)
    .eq("id", plan.id)
    .select("id, titel, plan, updated_at")
    .single();
  if (error) throw new Error(`Kon het bouwplan niet opslaan: ${error.message}`);
  const r = data as unknown as BouwplanRij;
  return { ...r.plan, id: r.id, updatedAt: new Date(r.updated_at).getTime() };
}

export async function verwijderBouwplan(id: string): Promise<void> {
  const { error } = await supabase.from("bouwplannen").delete().eq("id", id);
  if (error) throw new Error(`Kon het bouwplan niet verwijderen: ${error.message}`);
}

// ---------------------------------------------------------------------------
//  EENMALIGE OVERZETTING VAN LOKALE DATA
//
//  Wie de app al gebruikte vóór de database heeft bouwplannen en favorieten in
//  zijn browser staan. Die zou hij anders stilzwijgend kwijtraken.
//
//  Draait alleen als er aan de databasekant nog niets staat, dus meermaals
//  uitvoeren kan geen duplicaten opleveren. Na afloop worden de lokale
//  sleutels gewist, zodat het bij een volgende keer niet opnieuw gebeurt.
// ---------------------------------------------------------------------------

const LOKAAL_BOUWPLANNEN = "mw_bouwplannen";
const LOKAAL_FAVORIETEN = "mw_favorites";

function leesLokaal<T>(sleutel: string): T | null {
  try {
    const rauw = localStorage.getItem(sleutel);
    return rauw ? (JSON.parse(rauw) as T) : null;
  } catch {
    return null;
  }
}

function wisLokaal(sleutel: string): void {
  try {
    localStorage.removeItem(sleutel);
  } catch {
    /* negeren */
  }
}

export interface OverzetResultaat {
  bouwplannen: number;
  favorieten: number;
}

export async function zetLokaleDataOver(
  userId: string,
  geldigeWerkvormIds: string[]
): Promise<OverzetResultaat> {
  const resultaat: OverzetResultaat = { bouwplannen: 0, favorieten: 0 };

  const lokalePlannen = leesLokaal<IBouwplan[]>(LOKAAL_BOUWPLANNEN);
  if (lokalePlannen && lokalePlannen.length > 0) {
    const bestaand = await haalBouwplannen(userId);
    if (bestaand.length === 0) {
      for (const p of lokalePlannen) {
        // id leegmaken zodat bewaarBouwplan hem als nieuw behandelt
        await bewaarBouwplan(userId, { ...p, id: "lokaal" });
        resultaat.bouwplannen += 1;
      }
    }
    wisLokaal(LOKAAL_BOUWPLANNEN);
  }

  const lokaleFavorieten = leesLokaal<string[]>(LOKAAL_FAVORIETEN);
  if (lokaleFavorieten && lokaleFavorieten.length > 0) {
    const bestaand = await haalFavorieten(userId);
    if (bestaand.length === 0) {
      // De oude favorieten verwijzen naar id's "1" t/m "34" uit mockData; die
      // bestaan niet meer sinds de werkvormen UUID's kregen. Alleen wat nog
      // ergens naar wijst, nemen we mee.
      const bruikbaar = lokaleFavorieten.filter((id) => geldigeWerkvormIds.indexOf(id) >= 0);
      for (const werkvormId of bruikbaar) {
        await zetFavoriet(userId, werkvormId, true);
        resultaat.favorieten += 1;
      }
    }
    wisLokaal(LOKAAL_FAVORIETEN);
  }

  return resultaat;
}
