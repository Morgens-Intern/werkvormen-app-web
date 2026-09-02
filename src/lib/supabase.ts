import { createClient } from "@supabase/supabase-js";

// Deze twee waarden komen uit .env (lokaal) en uit de omgevingsvariabelen van
// Cloudflare Pages (productie). Ze worden bij het bouwen in de bundel gezet en
// zijn dus publiek — dat hoort zo. De anon-sleutel geeft op zichzelf nergens
// toegang toe; de toegangsregels in de database bepalen wat iemand mag zien.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  // Expliciet falen is hier beter dan een app die stilletjes niet kan inloggen.
  // Zie je dit in productie, dan ontbreken de variabelen in Cloudflare Pages
  // onder Settings -> Variables and secrets.
  throw new Error(
    "VITE_SUPABASE_URL of VITE_SUPABASE_ANON_KEY ontbreekt. " +
      "Lokaal: controleer .env. In productie: Cloudflare Pages -> Settings -> Variables and secrets."
  );
}

export const supabase = createClient(url, anonKey);

// Het enige domein waarmee geregistreerd mag worden.
// Dit is de eerste van drie lagen: dit formulier, de hook in Supabase, en de
// toegangsregels in de database. Deze laag is comfort, geen beveiliging — met
// de ontwikkelaarsconsole omzeil je hem. De derde laag is degene die telt.
export const TOEGESTAAN_DOMEIN = "@morgens.nl";

export function heeftToegestaanDomein(email: string): boolean {
  return email.trim().toLowerCase().endsWith(TOEGESTAAN_DOMEIN);
}

export interface Profiel {
  id: string;
  email: string;
  display_name: string | null;
  rol: "gebruiker" | "admin";
}

export async function haalProfielOp(userId: string): Promise<Profiel | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, rol")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data as Profiel;
}
