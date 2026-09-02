import * as React from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, haalProfielOp, Profiel } from "./lib/supabase";
import AuthView, { AuthModus } from "./components/AuthView";
import { ruimVerouderdeOpslagOp } from "./components/werkvormStore";
import Werkvormen from "./components/Werkvormen";

/**
 * Bepaalt wat de bezoeker te zien krijgt: het inlogscherm of de app.
 *
 * Het thema wordt hier bewaard en niet in Werkvormen, omdat het inlogscherm
 * er ook op moet reageren — anders zie je bij het inloggen even een wit scherm
 * flitsen voordat de app in donkere modus verschijnt.
 */
const App: React.FC = () => {
  const [session, setSession] = React.useState<Session | null>(null);
  const [profiel, setProfiel] = React.useState<Profiel | null>(null);
  const [laden, setLaden] = React.useState(true);
  const [authModus, setAuthModus] = React.useState<AuthModus | undefined>(undefined);

  const [isDark, setIsDark] = React.useState(() => {
    try {
      return localStorage.getItem("mw_theme") === "dark";
    } catch {
      return false;
    }
  });

  const toggleDark = React.useCallback((): void => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("mw_theme", next ? "dark" : "light");
      } catch {
        /* negeren */
      }
      return next;
    });
  }, []);

  React.useEffect(() => {
    // Eenmalig: resten opruimen van toen werkvormen en inspiratie nog in de
    // browser stonden. Zonder dit blijft die oude kopie ruimte innemen.
    ruimVerouderdeOpslagOp();
  }, []);

  React.useEffect(() => {
    let actief = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!actief) return;
      setSession(data.session);
      if (!data.session) setLaden(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (!actief) return;
      // Binnenkomen via een herstellink: Supabase geeft een sessie, maar de
      // gebruiker moet eerst een nieuw wachtwoord kiezen.
      if (event === "PASSWORD_RECOVERY") {
        setAuthModus("nieuwwachtwoord");
        setSession(null);
        setLaden(false);
        return;
      }
      setSession(s);
      if (!s) {
        setProfiel(null);
        setLaden(false);
      }
    });

    return () => {
      actief = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Profiel ophalen zodra er een sessie is. Het profiel bevat de rol, en die
  // bepaalt of de beheerfuncties zichtbaar zijn.
  React.useEffect(() => {
    if (!session?.user) return;
    let actief = true;
    setLaden(true);
    haalProfielOp(session.user.id).then((p) => {
      if (!actief) return;
      setProfiel(p);
      setLaden(false);
    });
    return () => {
      actief = false;
    };
  }, [session]);

  const uitloggen = React.useCallback(async (): Promise<void> => {
    await supabase.auth.signOut();
    setProfiel(null);
    setAuthModus(undefined);
  }, []);

  if (laden) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: isDark ? "#0d1424" : "#f5fafe",
          color: isDark ? "#9aa8c2" : "#5b6b86",
          fontFamily: 'Calibri, "Segoe UI", system-ui, sans-serif',
        }}
      >
        Bezig met laden…
      </div>
    );
  }

  if (!session) {
    return <AuthView isDark={isDark} startModus={authModus} />;
  }

  // Het profiel wordt door een database-trigger aangemaakt bij registratie.
  // Ontbreekt het toch, dan is er iets misgegaan en helpt uitloggen niet — dus
  // tonen we wat er aan de hand is in plaats van een leeg scherm.
  if (!profiel) {
    return (
      <div style={{ padding: 40, fontFamily: 'Calibri, "Segoe UI", system-ui, sans-serif' }}>
        <h1 style={{ fontFamily: "Georgia, serif", color: "#0c1a55" }}>Profiel niet gevonden</h1>
        <p>
          Je bent ingelogd, maar er hoort geen profiel bij dit account. Neem contact op met
          Munzur — dit moet in de database rechtgezet worden.
        </p>
        <button type="button" onClick={uitloggen}>
          Uitloggen
        </button>
      </div>
    );
  }

  return (
    <Werkvormen
      userId={profiel.id}
      userDisplayName={profiel.display_name || profiel.email}
      isAdmin={profiel.rol === "admin"}
      onSignOut={uitloggen}
      isDark={isDark}
      onToggleDark={toggleDark}
    />
  );
};

export default App;
