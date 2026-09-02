import { supabase } from "./supabase";
import { Categorie, Fase, Setting, Werkvorm } from "../models/types";

// De database gebruikt snake_case, de app camelCase. Die omzetting staat hier
// op één plek, zodat de componenten er niets van merken.
interface WerkvormRij {
  id: string;
  title: string;
  category: string[];
  fase: string[];
  goal: string;
  description: string;
  duration: number;
  group_size_min: number;
  group_size_max: number;
  materials: string[];
  steps: string[];
  tips: string[];
  image_url: string | null;
  image_slug: string | null;
  extra_link: string | null;
  tags: string[];
  settings: string[];
}

const KOLOMMEN =
  "id, title, category, fase, goal, description, duration, group_size_min, " +
  "group_size_max, materials, steps, tips, image_url, image_slug, extra_link, tags, settings";

function naarWerkvorm(r: WerkvormRij): Werkvorm {
  return {
    id: r.id,
    title: r.title,
    category: (r.category || []) as Categorie[],
    fase: (r.fase || []) as Fase[],
    goal: r.goal || "",
    description: r.description || "",
    duration: r.duration || 0,
    groupSizeMin: r.group_size_min || 0,
    groupSizeMax: r.group_size_max || 9999,
    materials: r.materials || [],
    steps: r.steps || [],
    tips: r.tips || [],
    imageUrl: r.image_url || undefined,
    imageSlug: r.image_slug || undefined,
    extraLink: r.extra_link || undefined,
    tags: r.tags || [],
    settings: (r.settings || []) as Setting[],
  };
}

// Bij opslaan laten we 'id' weg: die wordt door de database gegenereerd bij
// nieuwe rijen, en bij bestaande rijen staat hij al in de where-clausule.
function naarRij(w: Werkvorm): Omit<WerkvormRij, "id"> {
  return {
    title: w.title,
    category: w.category || [],
    fase: w.fase || [],
    goal: w.goal || "",
    description: w.description || "",
    duration: w.duration || 0,
    group_size_min: w.groupSizeMin || 0,
    group_size_max: w.groupSizeMax || 9999,
    materials: w.materials || [],
    steps: w.steps || [],
    tips: w.tips || [],
    image_url: w.imageUrl || null,
    image_slug: w.imageSlug || null,
    extra_link: w.extraLink || null,
    tags: w.tags || [],
    settings: w.settings || [],
  };
}

export async function haalWerkvormen(): Promise<Werkvorm[]> {
  const { data, error } = await supabase.from("werkvormen").select(KOLOMMEN).order("title");
  if (error) throw new Error(`Kon de werkvormen niet ophalen: ${error.message}`);
  return (data as unknown as WerkvormRij[]).map(naarWerkvorm);
}

export async function voegWerkvormToe(w: Werkvorm): Promise<Werkvorm> {
  const { data, error } = await supabase
    .from("werkvormen")
    .insert(naarRij(w))
    .select(KOLOMMEN)
    .single();
  if (error) throw new Error(`Kon de werkvorm niet toevoegen: ${error.message}`);
  return naarWerkvorm(data as unknown as WerkvormRij);
}

export async function werkWerkvormBij(w: Werkvorm): Promise<Werkvorm> {
  const { data, error } = await supabase
    .from("werkvormen")
    .update({ ...naarRij(w), updated_at: new Date().toISOString() })
    .eq("id", w.id)
    .select(KOLOMMEN)
    .single();
  if (error) throw new Error(`Kon de werkvorm niet opslaan: ${error.message}`);
  return naarWerkvorm(data as unknown as WerkvormRij);
}

export async function verwijderWerkvorm(id: string): Promise<void> {
  const { error } = await supabase.from("werkvormen").delete().eq("id", id);
  if (error) throw new Error(`Kon de werkvorm niet verwijderen: ${error.message}`);
}

// ---------------------------------------------------------------------------
//  VOORSTELLEN
// ---------------------------------------------------------------------------

export interface Voorstel {
  id: string;
  createdAt: string;
  status: "open" | "goedgekeurd" | "afgewezen";
  werkvorm: Werkvorm;
  inzenderNaam: string;
}

interface VoorstelRij {
  id: string;
  created_at: string;
  status: "open" | "goedgekeurd" | "afgewezen";
  werkvorm: Werkvorm;
  submitter: { display_name: string | null; email: string } | null;
}

/** Voorstel indienen. Iedere ingelogde gebruiker mag dit. */
export async function dienVoorstelIn(werkvorm: Werkvorm, userId: string): Promise<void> {
  const { error } = await supabase
    .from("suggestions")
    .insert({ submitter_id: userId, werkvorm, status: "open" });
  if (error) throw new Error(`Kon het voorstel niet versturen: ${error.message}`);
}

/**
 * Openstaande voorstellen ophalen. De toegangsregels zorgen ervoor dat een
 * gewone gebruiker alleen zijn eigen voorstellen ziet en een beheerder alle.
 */
export async function haalVoorstellen(): Promise<Voorstel[]> {
  const { data, error } = await supabase
    .from("suggestions")
    .select("id, created_at, status, werkvorm, submitter:profiles(display_name, email)")
    .eq("status", "open")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Kon de voorstellen niet ophalen: ${error.message}`);

  return (data as unknown as VoorstelRij[]).map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    status: r.status,
    werkvorm: r.werkvorm,
    inzenderNaam: r.submitter?.display_name || r.submitter?.email || "Onbekend",
  }));
}

/** Voorstel goedkeuren: als werkvorm opnemen en het voorstel afvinken. */
export async function keurVoorstelGoed(v: Voorstel): Promise<Werkvorm> {
  const nieuw = await voegWerkvormToe(v.werkvorm);
  const { error } = await supabase
    .from("suggestions")
    .update({ status: "goedgekeurd" })
    .eq("id", v.id);
  // De werkvorm staat er nu wél in. Faalt alleen het afvinken, dan is dat
  // hinderlijk maar niet erg: het voorstel blijft in de inbox staan.
  if (error) throw new Error(`Werkvorm toegevoegd, maar het voorstel bleef openstaan: ${error.message}`);
  return nieuw;
}

export async function wijsVoorstelAf(id: string): Promise<void> {
  const { error } = await supabase.from("suggestions").update({ status: "afgewezen" }).eq("id", id);
  if (error) throw new Error(`Kon het voorstel niet afwijzen: ${error.message}`);
}
