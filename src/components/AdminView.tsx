import * as React from "react";
import styles from "./AdminView.module.scss";
import { supabase, Profiel } from "../lib/supabase";
import { Werkvorm } from "../models/types";
import { haalVoorstellen, keurVoorstelGoed, wijsVoorstelAf, Voorstel } from "../lib/werkvormenApi";
import { getCategoryTheme } from "./categoryTheme";

export interface IAdminViewProps {
  /** Id van de ingelogde beheerder, om de eigen regel te markeren. */
  userId: string;
  werkvormenCount: number;
  /** Aanroepen zodra de bibliotheek is veranderd, zodat de app herlaadt. */
  onWerkvormenGewijzigd: () => void;
  onAddNew: () => void;
  /** Voorstel eerst aanpassen en dan pas toevoegen. */
  onEditVoorstel: (w: Werkvorm) => void;
}

function fmtDatum(iso: string): string {
  const d = new Date(iso);
  const p = (n: number): string => (n < 10 ? "0" + n : "" + n);
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`;
}

interface ProfielRij extends Profiel {
  created_at: string;
}

const AdminView: React.FC<IAdminViewProps> = ({
  userId,
  werkvormenCount,
  onWerkvormenGewijzigd,
  onAddNew,
  onEditVoorstel,
}) => {
  const [voorstellen, setVoorstellen] = React.useState<Voorstel[] | null>(null);
  const [voorstelBezig, setVoorstelBezig] = React.useState<string | null>(null);
  const [gebruikers, setGebruikers] = React.useState<ProfielRij[] | null>(null);
  const [fout, setFout] = React.useState<string | null>(null);
  const [bezigMet, setBezigMet] = React.useState<string | null>(null);

  const laden = React.useCallback(async (): Promise<void> => {
    setFout(null);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, display_name, rol, created_at")
      .order("created_at", { ascending: true });
    if (error) {
      setFout(
        "Kon de gebruikers niet ophalen. Ben je nog ingelogd als beheerder? " +
          `(${error.message})`
      );
      setGebruikers([]);
      return;
    }
    setGebruikers((data || []) as ProfielRij[]);
  }, []);

  const laadVoorstellen = React.useCallback(async (): Promise<void> => {
    try {
      setVoorstellen(await haalVoorstellen());
    } catch (e) {
      setFout(e instanceof Error ? e.message : String(e));
      setVoorstellen([]);
    }
  }, []);

  React.useEffect(() => {
    void laden();
    void laadVoorstellen();
  }, [laden, laadVoorstellen]);

  const goedkeuren = async (v: Voorstel): Promise<void> => {
    setFout(null);
    setVoorstelBezig(v.id);
    try {
      await keurVoorstelGoed(v);
      onWerkvormenGewijzigd();
      await laadVoorstellen();
    } catch (e) {
      setFout(e instanceof Error ? e.message : String(e));
    } finally {
      setVoorstelBezig(null);
    }
  };

  const afwijzen = async (v: Voorstel): Promise<void> => {
    if (!window.confirm(`Voorstel "${v.werkvorm.title}" afwijzen?`)) return;
    setFout(null);
    setVoorstelBezig(v.id);
    try {
      await wijsVoorstelAf(v.id);
      await laadVoorstellen();
    } catch (e) {
      setFout(e instanceof Error ? e.message : String(e));
    } finally {
      setVoorstelBezig(null);
    }
  };

  const wijzigRol = async (g: ProfielRij, nieuweRol: "gebruiker" | "admin"): Promise<void> => {
    setFout(null);
    setBezigMet(g.id);
    const { error } = await supabase.from("profiles").update({ rol: nieuweRol }).eq("id", g.id);
    setBezigMet(null);

    if (error) {
      // De database bewaakt dit met een trigger, en die meldingen zijn al in
      // het Nederlands geschreven — dus die tonen we gewoon.
      setFout(error.message);
      return;
    }
    await laden();
  };

  const aantalAdmins = (gebruikers || []).filter((g) => g.rol === "admin").length;

  return (
    <div className={styles.admin}>
      <div className={styles.headRow}>
        <div>
          <h2 className={styles.title}>Beheer</h2>
          <p className={styles.sub}>
            {werkvormenCount} werkvormen · {gebruikers ? gebruikers.length : "…"} gebruikers ·{" "}
            {aantalAdmins} beheerder{aantalAdmins === 1 ? "" : "s"}
          </p>
        </div>
        <button type="button" className={styles.addBtn} onClick={onAddNew}>
          + Nieuwe werkvorm toevoegen
        </button>
      </div>

      {fout && <p className={styles.foutmelding}>{fout}</p>}

      <h3 className={styles.sectionTitle}>
        Voorstellen{voorstellen ? ` (${voorstellen.length})` : ""}
      </h3>
      <p className={styles.hint}>
        Werkvormen die collega&apos;s hebben ingestuurd. Goedkeuren zet de werkvorm meteen in
        de bibliotheek, voor iedereen zichtbaar.
      </p>

      {voorstellen === null ? (
        <p className={styles.hint}>Bezig met laden…</p>
      ) : voorstellen.length === 0 ? (
        <p className={styles.hint}>Geen openstaande voorstellen.</p>
      ) : (
        <div className={styles.list}>
          {voorstellen.map((v) => (
            <div key={v.id} className={styles.card}>
              <div className={styles.info}>
                <strong>{v.werkvorm.title || "(zonder titel)"}</strong>
                <span className={styles.tags}>
                  {(v.werkvorm.category || []).map((c) => (
                    <span key={c} className={styles.tag}>
                      {getCategoryTheme(c).icon} {c}
                    </span>
                  ))}
                </span>
                <span className={styles.meta}>
                  Voorgesteld door {v.inzenderNaam} · {fmtDatum(v.createdAt)}
                </span>
                {v.werkvorm.goal && <span className={styles.goal}>{v.werkvorm.goal}</span>}
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.approve}
                  disabled={voorstelBezig === v.id}
                  onClick={() => void goedkeuren(v)}
                >
                  {voorstelBezig === v.id ? "Bezig…" : "Goedkeuren"}
                </button>
                <button type="button" onClick={() => onEditVoorstel(v.werkvorm)}>
                  Aanpassen &amp; toevoegen
                </button>
                <button
                  type="button"
                  className={styles.reject}
                  disabled={voorstelBezig === v.id}
                  onClick={() => void afwijzen(v)}
                >
                  Afwijzen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 className={styles.sectionTitle}>Gebruikers</h3>
      <p className={styles.hint}>
        Beheerders kunnen werkvormen bewerken en collega&apos;s tot beheerder maken. De laatste
        beheerder kan zichzelf niet degraderen — anders kan niemand het nog terugdraaien.
      </p>

      {gebruikers === null ? (
        <p className={styles.hint}>Bezig met laden…</p>
      ) : gebruikers.length === 0 ? (
        <p className={styles.hint}>Nog geen gebruikers gevonden.</p>
      ) : (
        <div className={styles.list}>
          {gebruikers.map((g) => {
            const isZelf = g.id === userId;
            const isAdmin = g.rol === "admin";
            return (
              <div key={g.id} className={styles.card}>
                <div className={styles.info}>
                  <strong>
                    {g.display_name || g.email}
                    {isZelf && <span className={styles.zelf}>jij</span>}
                  </strong>
                  <span className={styles.meta}>
                    {g.email} · aangemeld op {fmtDatum(g.created_at)}
                  </span>
                </div>
                <div className={styles.actions}>
                  <span className={isAdmin ? `${styles.rol} ${styles.rolAdmin}` : styles.rol}>
                    {isAdmin ? "Beheerder" : "Gebruiker"}
                  </span>
                  {isAdmin ? (
                    <button
                      type="button"
                      className={styles.reject}
                      disabled={bezigMet === g.id}
                      onClick={() => wijzigRol(g, "gebruiker")}
                      title="Beheerrechten intrekken"
                    >
                      {bezigMet === g.id ? "Bezig…" : "Rechten intrekken"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.approve}
                      disabled={bezigMet === g.id}
                      onClick={() => wijzigRol(g, "admin")}
                      title="Deze collega beheerder maken"
                    >
                      {bezigMet === g.id ? "Bezig…" : "Maak beheerder"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminView;
