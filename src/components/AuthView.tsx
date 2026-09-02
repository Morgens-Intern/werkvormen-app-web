import * as React from "react";
import styles from "./AuthView.module.scss";
import {
  supabase,
  heeftToegestaanDomein,
  TOEGESTAAN_DOMEIN,
  blijftIngelogd,
  zetBlijftIngelogd,
  MIN_WACHTWOORD_LENGTE,
} from "../lib/supabase";

export type AuthModus = "inloggen" | "registreren" | "vergeten" | "nieuwwachtwoord";

interface IAuthViewProps {
  isDark: boolean;
  /** Gezet wanneer de gebruiker via een herstellink binnenkomt. */
  startModus?: AuthModus;
}

const MorgensWoordmerk: React.FC<{ dark?: boolean }> = ({ dark }) => (
  <div
    style={{
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: 26,
      fontWeight: 700,
      color: dark ? "#e8eefc" : "#0c1a55",
      letterSpacing: "-0.5px",
    }}
  >
    morgens
    <span style={{ display: "block", fontSize: 9, letterSpacing: "3px", fontWeight: 400, marginTop: 2 }}>
      CONCLUSION
    </span>
  </div>
);

/**
 * Vertaalt Supabase-foutmeldingen naar iets waar een collega wat aan heeft.
 * De originele meldingen zijn Engels en technisch ("Invalid login credentials").
 */
function leesbareFout(bericht: string): string {
  const m = bericht.toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "Dit e-mailadres en wachtwoord horen niet bij elkaar. Let op hoofdletters, of gebruik 'Wachtwoord vergeten'.";
  }
  if (m.includes("email not confirmed")) {
    return "Je account is nog niet bevestigd. Kijk in je mail — ook in je ongewenste post — en klik op de link.";
  }
  if (m.includes("user already registered") || m.includes("already been registered")) {
    return "Er bestaat al een account met dit adres. Log in, of gebruik 'Wachtwoord vergeten'.";
  }
  if (m.includes("password should be at least")) {
    // Het getal uit de melding van Supabase halen, zodat deze tekst klopt
    // ook als de instelling in het dashboard verandert.
    const gevonden = bericht.match(/(\d+)/);
    const aantal = gevonden ? gevonden[1] : String(MIN_WACHTWOORD_LENGTE);
    return `Kies een wachtwoord van minstens ${aantal} tekens.`;
  }
  if (m.includes("password") && (m.includes("requirements") || m.includes("characters"))) {
    return "Dit wachtwoord voldoet niet aan de eisen. Gebruik letters én cijfers.";
  }
  if (m.includes("rate limit") || m.includes("too many requests") || m.includes("over_email_send_rate_limit")) {
    return "Er zijn net te veel mails verstuurd. Probeer het over een uur opnieuw, of vraag Munzur om je account met de hand te bevestigen.";
  }
  if (m.includes("signups not allowed") || m.includes("signup is disabled")) {
    return "Registreren staat op dit moment uit. Neem contact op met Munzur.";
  }
  return bericht;
}

const AuthView: React.FC<IAuthViewProps> = ({ isDark, startModus }) => {
  const [modus, setModus] = React.useState<AuthModus>(startModus || "inloggen");
  const [email, setEmail] = React.useState("");
  const [wachtwoord, setWachtwoord] = React.useState("");
  const [naam, setNaam] = React.useState("");
  const [ingelogdBlijven, setIngelogdBlijven] = React.useState(blijftIngelogd);
  const [bezig, setBezig] = React.useState(false);
  const [fout, setFout] = React.useState<string | null>(null);
  const [gelukt, setGelukt] = React.useState<string | null>(null);

  const wissel = (m: AuthModus): void => {
    setModus(m);
    setFout(null);
    setGelukt(null);
  };

  const verstuur = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setFout(null);
    setGelukt(null);

    if (modus !== "nieuwwachtwoord" && !heeftToegestaanDomein(email)) {
      setFout(`Gebruik je Morgens-adres. Alleen adressen op ${TOEGESTAAN_DOMEIN} hebben toegang.`);
      return;
    }

    setBezig(true);
    try {
      if (modus === "inloggen") {
        // Vastleggen vóór het inloggen: dit bepaalt waar de sessie belandt.
        zetBlijftIngelogd(ingelogdBlijven);
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: wachtwoord,
        });
        if (error) throw error;
        // Bij succes neemt App.tsx het over via onAuthStateChange.
      } else if (modus === "registreren") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: wachtwoord,
          options: { data: { display_name: naam.trim() } },
        });
        if (error) throw error;
        if (data.session) {
          // Bevestiging staat uit; we zijn meteen binnen.
          return;
        }
        setGelukt(
          "Gelukt. Je krijgt een mail met een bevestigingslink — klik daarop en je kunt inloggen. " +
            "Niets ontvangen? Kijk in je ongewenste post; de afzender is Supabase en niet morgens.nl."
        );
      } else if (modus === "vergeten") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setGelukt(
          "Als er een account met dit adres bestaat, is er een herstelmail onderweg. " +
            "Kijk ook in je ongewenste post."
        );
      } else if (modus === "nieuwwachtwoord") {
        const { error } = await supabase.auth.updateUser({ password: wachtwoord });
        if (error) throw error;
        setGelukt("Je wachtwoord is aangepast. Je bent nu ingelogd.");
      }
    } catch (err) {
      const bericht = err instanceof Error ? err.message : String(err);
      setFout(leesbareFout(bericht));
    } finally {
      setBezig(false);
    }
  };

  const koppen: Record<AuthModus, { titel: string; sub: string; knop: string }> = {
    inloggen: {
      titel: "Welkom terug",
      sub: "Log in om de werkvormenbibliotheek en je bouwplannen te openen.",
      knop: "Inloggen",
    },
    registreren: {
      titel: "Account aanmaken",
      sub: `Registreren kan met je Morgens-adres. Je krijgt een mail om je account te bevestigen.`,
      knop: "Account aanmaken",
    },
    vergeten: {
      titel: "Wachtwoord vergeten",
      sub: "Vul je Morgens-adres in, dan sturen we een link om een nieuw wachtwoord te kiezen.",
      knop: "Herstellink versturen",
    },
    nieuwwachtwoord: {
      titel: "Nieuw wachtwoord",
      sub: "Kies een nieuw wachtwoord voor je account.",
      knop: "Wachtwoord opslaan",
    },
  };

  const k = koppen[modus];

  return (
    <div className={isDark ? `${styles.auth} ${styles.dark}` : styles.auth}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <MorgensWoordmerk dark={isDark} />
        </div>
        <div className={styles.accent} />

        <h1 className={styles.titel}>{k.titel}</h1>
        <p className={styles.subtitel}>{k.sub}</p>

        {fout && <div className={`${styles.melding} ${styles.fout}`}>{fout}</div>}
        {gelukt && <div className={`${styles.melding} ${styles.gelukt}`}>{gelukt}</div>}

        <form onSubmit={verstuur}>
          {modus === "registreren" && (
            <div className={styles.veld}>
              <label className={styles.label} htmlFor="naam">
                Naam
              </label>
              <input
                id="naam"
                className={styles.input}
                type="text"
                value={naam}
                onChange={(e) => setNaam(e.target.value)}
                placeholder="Voor- en achternaam"
                autoComplete="name"
              />
            </div>
          )}

          {modus !== "nieuwwachtwoord" && (
            <div className={styles.veld}>
              <label className={styles.label} htmlFor="email">
                E-mailadres
              </label>
              <input
                id="email"
                className={styles.input}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`jouw.naam${TOEGESTAAN_DOMEIN}`}
                autoComplete="email"
              />
              <p className={styles.hint}>Alleen adressen op {TOEGESTAAN_DOMEIN}.</p>
            </div>
          )}

          {modus !== "vergeten" && (
            <div className={styles.veld}>
              <label className={styles.label} htmlFor="wachtwoord">
                Wachtwoord
              </label>
              <input
                id="wachtwoord"
                className={styles.input}
                type="password"
                required
                minLength={MIN_WACHTWOORD_LENGTE}
                value={wachtwoord}
                onChange={(e) => setWachtwoord(e.target.value)}
                autoComplete={modus === "inloggen" ? "current-password" : "new-password"}
              />
              {modus !== "inloggen" && (
                <p className={styles.hint}>
                  Minimaal {MIN_WACHTWOORD_LENGTE} tekens, met letters én cijfers.
                </p>
              )}
            </div>
          )}

          {modus === "inloggen" && (
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={ingelogdBlijven}
                onChange={(e) => setIngelogdBlijven(e.target.checked)}
              />
              <span>
                Ingelogd blijven
                <span className={styles.checkboxHint}>
                  Zet dit uit op een gedeelde of geleende laptop — dan word je uitgelogd
                  zodra je de browser sluit.
                </span>
              </span>
            </label>
          )}

          <button type="submit" className={styles.knop} disabled={bezig}>
            {bezig ? "Even geduld…" : k.knop}
          </button>
        </form>

        <div className={styles.schakel}>
          {modus === "inloggen" && (
            <>
              <div>
                Nog geen account?{" "}
                <button type="button" className={styles.link} onClick={() => wissel("registreren")}>
                  Maak er een aan
                </button>
              </div>
              <div style={{ marginTop: 8 }}>
                <button type="button" className={styles.link} onClick={() => wissel("vergeten")}>
                  Wachtwoord vergeten?
                </button>
              </div>
            </>
          )}
          {(modus === "registreren" || modus === "vergeten") && (
            <div>
              <button type="button" className={styles.link} onClick={() => wissel("inloggen")}>
                Terug naar inloggen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthView;
