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

// ---------------------------------------------------------------------------
//  WAAR DE SESSIE WORDT BEWAARD
//
//  Supabase bewaart een sessie standaard in localStorage: die overleeft het
//  sluiten van de browser, dus je blijft ingelogd. Dat is prettig op je eigen
//  laptop, maar niet op een geleend of gedeeld apparaat — dan blijft de
//  volgende gebruiker in jouw account zitten.
//
//  Daarom kiest de gebruiker bij het inloggen zelf. De keuze zelf staat in
//  localStorage (die moet een herstart overleven), de sessie in localStorage
//  of sessionStorage al naar gelang die keuze. sessionStorage wordt geleegd
//  zodra het tabblad sluit.
// ---------------------------------------------------------------------------

const KEUZE_SLEUTEL = "mw_ingelogd_blijven";

export function blijftIngelogd(): boolean {
  try {
    // Standaard aan: dat is het gedrag dat mensen verwachten.
    return localStorage.getItem(KEUZE_SLEUTEL) !== "nee";
  } catch {
    return true;
  }
}

/**
 * Vastleggen wat de gebruiker koos. Moet gebeuren VOORDAT er wordt ingelogd,
 * anders belandt de sessie in de verkeerde opslag.
 */
export function zetBlijftIngelogd(waarde: boolean): void {
  try {
    localStorage.setItem(KEUZE_SLEUTEL, waarde ? "ja" : "nee");
    if (!waarde) {
      // Een eerdere sessie kan nog in localStorage staan. Die moet weg, anders
      // laat je juist op een gedeeld apparaat een inlog achter.
      Object.keys(localStorage)
        .filter((k) => k.startsWith("sb-"))
        .forEach((k) => localStorage.removeItem(k));
    }
  } catch {
    /* negeren: privémodus */
  }
}

function actieveOpslag(): Storage {
  return blijftIngelogd() ? window.localStorage : window.sessionStorage;
}

// De keuze wordt bij élke lees- en schrijfactie opnieuw bekeken, niet één keer
// bij het opstarten. Zo werkt een wijziging meteen, zonder herladen.
const sessieOpslag = {
  getItem: (key: string): string | null => {
    try {
      return actieveOpslag().getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      actieveOpslag().setItem(key, value);
    } catch {
      /* negeren */
    }
  },
  removeItem: (key: string): void => {
    // Bij uitloggen uit beide opslagplaatsen wissen, ongeacht de keuze.
    try {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    } catch {
      /* negeren */
    }
  },
};

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: sessieOpslag,
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Het enige domein waarmee geregistreerd mag worden.
// Dit is de eerste van drie lagen: dit formulier, de hook in Supabase, en de
// toegangsregels in de database. Deze laag is comfort, geen beveiliging — met
// de ontwikkelaarsconsole omzeil je hem. De derde laag is degene die telt.
export const TOEGESTAAN_DOMEIN = "@morgens.nl";

/**
 * Minimale wachtwoordlengte die het formulier afdwingt.
 *
 * LET OP: dit moet gelijk zijn aan de instelling in Supabase onder
 * Authentication -> Password settings. Staat die hoger dan dit getal, dan
 * accepteert het formulier iets wat de server daarna weigert — en dat is een
 * vervelende plek om erachter te komen.
 */
export const MIN_WACHTWOORD_LENGTE = 10;

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
