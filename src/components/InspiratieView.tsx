import * as React from "react";
import styles from "./InspiratieView.module.scss";
import { Werkvorm } from "../models/types";
import {
  haalFeed,
  plaatsBericht,
  verwijderBericht,
  plaatsReactie,
  verwijderReactie,
  wisselEmoji,
  EMOJIS,
  Bericht,
  Reactie,
  BerichtType,
} from "../lib/inspiratieApi";

export interface IInspiratieViewProps {
  userId: string;
  userDisplayName: string;
  isAdmin: boolean;
  werkvormen: Werkvorm[];
  onShowWerkvorm: (w: Werkvorm) => void;
}

const TYPES: BerichtType[] = ["Ervaring", "Tip", "Bouwplan"];

/** Relatieve tijd leest in een feed prettiger dan een datum. */
function sinds(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "net";
  if (min < 60) return `${min} min geleden`;
  const uur = Math.floor(min / 60);
  if (uur < 24) return `${uur} uur geleden`;
  const dag = Math.floor(uur / 24);
  if (dag < 7) return dag === 1 ? "gisteren" : `${dag} dagen geleden`;
  return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
}

function initialen(naam: string): string {
  return naam
    .split(/[\s.@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((d) => d[0].toUpperCase())
    .join("");
}

interface IEmojiBalkProps {
  emojis: { emoji: string; aantal: number; ikOok: boolean }[];
  onWissel: (emoji: string, staatAan: boolean) => void;
}

const EmojiBalk: React.FC<IEmojiBalkProps> = ({ emojis, onWissel }) => {
  const [kiezerOpen, setKiezerOpen] = React.useState(false);
  const gebruikt = emojis.map((e) => e.emoji);

  return (
    <div className={styles.emojiBalk}>
      {emojis.map((e) => (
        <button
          key={e.emoji}
          type="button"
          className={e.ikOok ? `${styles.emojiPil} ${styles.emojiPilAan}` : styles.emojiPil}
          onClick={() => onWissel(e.emoji, e.ikOok)}
          title={e.ikOok ? "Klik om je reactie terug te nemen" : "Ook reageren"}
        >
          <span className={styles.emojiTeken}>{e.emoji}</span> {e.aantal}
        </button>
      ))}

      {kiezerOpen ? (
        <span className={styles.emojiKiezer}>
          {EMOJIS.filter((e) => gebruikt.indexOf(e) < 0).map((e) => (
            <button
              key={e}
              type="button"
              className={styles.emojiKeuze}
              onClick={() => {
                onWissel(e, false);
                setKiezerOpen(false);
              }}
              title={`Reageer met ${e}`}
            >
              {e}
            </button>
          ))}
          <button type="button" className={styles.emojiToevoegen} onClick={() => setKiezerOpen(false)}>
            ×
          </button>
        </span>
      ) : (
        <button
          type="button"
          className={styles.emojiToevoegen}
          onClick={() => setKiezerOpen(true)}
          title="Reageer met een emoji"
        >
          ☺+
        </button>
      )}
    </div>
  );
};

interface IReactieProps {
  reactie: Reactie;
  diepte: number;
  userId: string;
  isAdmin: boolean;
  onAntwoord: (parentId: string, body: string) => Promise<void>;
  onVerwijder: (id: string) => Promise<void>;
  onEmoji: (commentId: string, emoji: string, staatAan: boolean) => Promise<void>;
}

const ReactieBlok: React.FC<IReactieProps> = ({
  reactie,
  diepte,
  userId,
  isAdmin,
  onAntwoord,
  onVerwijder,
  onEmoji,
}) => {
  const [antwoordOpen, setAntwoordOpen] = React.useState(false);
  const [tekst, setTekst] = React.useState("");
  const [bezig, setBezig] = React.useState(false);
  const magVerwijderen = reactie.auteurId === userId || isAdmin;

  // Dieper dan drie niveaus inspringen wordt op een laptop onleesbaar; daarna
  // lopen antwoorden gewoon door op hetzelfde niveau.
  const inspringing = Math.min(diepte, 3);

  const verstuur = async (): Promise<void> => {
    if (!tekst.trim()) return;
    setBezig(true);
    try {
      await onAntwoord(reactie.id, tekst.trim());
      setTekst("");
      setAntwoordOpen(false);
    } finally {
      setBezig(false);
    }
  };

  return (
    <div className={styles.reactie} style={{ marginLeft: inspringing * 22 }}>
      <div className={styles.reactieKop}>
        <span className={styles.avatarKlein}>{initialen(reactie.auteurNaam)}</span>
        <strong className={styles.auteur}>{reactie.auteurNaam}</strong>
        <span className={styles.tijd}>{sinds(reactie.createdAt)}</span>
      </div>
      <p className={styles.reactieTekst}>{reactie.body}</p>

      <div className={styles.reactieVoet}>
        <EmojiBalk
          emojis={reactie.emojis}
          onWissel={(e, aan) => void onEmoji(reactie.id, e, aan)}
        />
        <button type="button" className={styles.tekstKnop} onClick={() => setAntwoordOpen((v) => !v)}>
          {antwoordOpen ? "Annuleren" : "Antwoorden"}
        </button>
        {magVerwijderen && (
          <button
            type="button"
            className={styles.tekstKnop}
            onClick={() => {
              if (window.confirm("Deze reactie verwijderen?")) void onVerwijder(reactie.id);
            }}
          >
            Verwijderen
          </button>
        )}
      </div>

      {antwoordOpen && (
        <div className={styles.antwoordVak}>
          <textarea
            className={styles.textarea}
            rows={2}
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
            placeholder="Schrijf een antwoord…"
          />
          <button type="button" className={styles.knopKlein} disabled={bezig} onClick={() => void verstuur()}>
            {bezig ? "Bezig…" : "Plaatsen"}
          </button>
        </div>
      )}

      {reactie.antwoorden.map((a) => (
        <ReactieBlok
          key={a.id}
          reactie={a}
          diepte={diepte + 1}
          userId={userId}
          isAdmin={isAdmin}
          onAntwoord={onAntwoord}
          onVerwijder={onVerwijder}
          onEmoji={onEmoji}
        />
      ))}
    </div>
  );
};

const InspiratieView: React.FC<IInspiratieViewProps> = ({
  userId,
  userDisplayName,
  isAdmin,
  werkvormen,
  onShowWerkvorm,
}) => {
  const [feed, setFeed] = React.useState<Bericht[] | null>(null);
  const [fout, setFout] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<BerichtType | "">("");
  const [openThreads, setOpenThreads] = React.useState<string[]>([]);

  const [schrijfOpen, setSchrijfOpen] = React.useState(false);
  const [nType, setNType] = React.useState<BerichtType>("Ervaring");
  const [nTitel, setNTitel] = React.useState("");
  const [nTekst, setNTekst] = React.useState("");
  const [nWerkvormen, setNWerkvormen] = React.useState<string[]>([]);
  const [bezig, setBezig] = React.useState(false);

  const laden = React.useCallback(async (): Promise<void> => {
    setFout(null);
    try {
      setFeed(await haalFeed(userId));
    } catch (e) {
      setFout(e instanceof Error ? e.message : String(e));
      setFeed([]);
    }
  }, [userId]);

  React.useEffect(() => {
    void laden();
  }, [laden]);

  const metFout = async (fn: () => Promise<void>): Promise<void> => {
    try {
      await fn();
      await laden();
    } catch (e) {
      setFout(e instanceof Error ? e.message : String(e));
    }
  };

  const plaats = async (): Promise<void> => {
    if (!nTitel.trim()) return;
    setBezig(true);
    try {
      await plaatsBericht(userId, {
        type: nType,
        title: nTitel.trim(),
        body: nTekst.trim(),
        werkvormIds: nWerkvormen,
      });
      setNTitel("");
      setNTekst("");
      setNWerkvormen([]);
      setSchrijfOpen(false);
      await laden();
    } catch (e) {
      setFout(e instanceof Error ? e.message : String(e));
    } finally {
      setBezig(false);
    }
  };

  const zichtbaar = (feed || []).filter((b) => !filter || b.type === filter);
  const werkvormOp = (id: string): Werkvorm | undefined =>
    werkvormen.filter((w) => w.id === id)[0];

  return (
    <div className={styles.inspiratie}>
      <div className={styles.kop}>
        <div>
          <h2 className={styles.titel}>Inspiratie</h2>
          <p className={styles.sub}>
            Deel wat je hebt geprobeerd, wat werkte en wat niet. Collega&apos;s kunnen reageren.
          </p>
        </div>
        <button type="button" className={styles.knop} onClick={() => setSchrijfOpen((v) => !v)}>
          {schrijfOpen ? "Annuleren" : "Nieuw bericht"}
        </button>
      </div>

      {fout && (
        <p className={styles.fout}>
          {fout}{" "}
          <button type="button" className={styles.tekstKnop} onClick={() => void laden()}>
            opnieuw proberen
          </button>
        </p>
      )}

      {schrijfOpen && (
        <div className={styles.schrijfvak}>
          <div className={styles.veldRij}>
            <label className={styles.label}>
              Type
              <select
                className={styles.select}
                value={nType}
                onChange={(e) => setNType(e.target.value as BerichtType)}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <input
            className={styles.input}
            type="text"
            value={nTitel}
            onChange={(e) => setNTitel(e.target.value)}
            placeholder="Waar gaat het over?"
            maxLength={160}
          />
          <textarea
            className={styles.textarea}
            rows={5}
            value={nTekst}
            onChange={(e) => setNTekst(e.target.value)}
            placeholder="Vertel je verhaal — wat deed je, met welke groep, en wat leverde het op?"
          />

          <label className={styles.label}>
            Werkvormen koppelen (optioneel)
            <select
              className={styles.select}
              value=""
              onChange={(e) => {
                const id = e.target.value;
                if (id && nWerkvormen.indexOf(id) < 0) setNWerkvormen((p) => [...p, id]);
              }}
            >
              <option value="">Kies een werkvorm…</option>
              {werkvormen
                .filter((w) => nWerkvormen.indexOf(w.id) < 0)
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.title}
                  </option>
                ))}
            </select>
          </label>

          {nWerkvormen.length > 0 && (
            <div className={styles.chips}>
              {nWerkvormen.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={styles.chip}
                  onClick={() => setNWerkvormen((p) => p.filter((x) => x !== id))}
                  title="Koppeling verwijderen"
                >
                  {werkvormOp(id)?.title || "?"} ✕
                </button>
              ))}
            </div>
          )}

          <div className={styles.schrijfVoet}>
            <span className={styles.tijd}>Je plaatst dit als {userDisplayName}</span>
            <button
              type="button"
              className={styles.knop}
              disabled={bezig || !nTitel.trim()}
              onClick={() => void plaats()}
            >
              {bezig ? "Bezig…" : "Plaatsen"}
            </button>
          </div>
        </div>
      )}

      <div className={styles.filters}>
        <button
          type="button"
          className={filter === "" ? `${styles.filterChip} ${styles.filterAan}` : styles.filterChip}
          onClick={() => setFilter("")}
        >
          Alles
        </button>
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            className={filter === t ? `${styles.filterChip} ${styles.filterAan}` : styles.filterChip}
            onClick={() => setFilter(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {feed === null ? (
        <p className={styles.leeg}>Bezig met laden…</p>
      ) : zichtbaar.length === 0 ? (
        <p className={styles.leeg}>
          {filter
            ? `Nog geen berichten van het type ${filter}.`
            : "Nog geen berichten. Wees de eerste die iets deelt."}
        </p>
      ) : (
        <div className={styles.feed}>
          {zichtbaar.map((b) => {
            const threadOpen = openThreads.indexOf(b.id) >= 0;
            const magVerwijderen = b.auteurId === userId || isAdmin;
            return (
              <article key={b.id} className={styles.bericht}>
                <header className={styles.berichtKop}>
                  <span className={styles.avatar}>{initialen(b.auteurNaam)}</span>
                  <div className={styles.berichtMeta}>
                    <strong className={styles.auteur}>{b.auteurNaam}</strong>
                    <span className={styles.tijd}>{sinds(b.createdAt)}</span>
                  </div>
                  <span className={styles.typeBadge}>{b.type}</span>
                </header>

                <h3 className={styles.berichtTitel}>{b.title}</h3>
                {b.body && <p className={styles.berichtTekst}>{b.body}</p>}

                {b.werkvormIds.length > 0 && (
                  <div className={styles.chips}>
                    {b.werkvormIds.map((id) => {
                      const w = werkvormOp(id);
                      if (!w) return null;
                      return (
                        <button
                          key={id}
                          type="button"
                          className={styles.chip}
                          onClick={() => onShowWerkvorm(w)}
                          title="Werkvorm bekijken"
                        >
                          {w.title}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className={styles.berichtVoet}>
                  <EmojiBalk
                    emojis={b.emojis}
                    onWissel={(e, aan) =>
                      void metFout(() => wisselEmoji(userId, { postId: b.id }, e, aan))
                    }
                  />
                  <button
                    type="button"
                    className={styles.tekstKnop}
                    onClick={() =>
                      setOpenThreads((p) => (threadOpen ? p.filter((x) => x !== b.id) : [...p, b.id]))
                    }
                  >
                    {b.aantalReacties === 0
                      ? "Reageren"
                      : `${b.aantalReacties} reactie${b.aantalReacties === 1 ? "" : "s"}`}
                  </button>
                  {magVerwijderen && (
                    <button
                      type="button"
                      className={styles.tekstKnop}
                      onClick={() => {
                        if (window.confirm(`Bericht "${b.title}" verwijderen? Ook de reacties gaan weg.`)) {
                          void metFout(() => verwijderBericht(b.id));
                        }
                      }}
                    >
                      Verwijderen
                    </button>
                  )}
                </div>

                {threadOpen && (
                  <div className={styles.thread}>
                    {b.reacties.map((r) => (
                      <ReactieBlok
                        key={r.id}
                        reactie={r}
                        diepte={0}
                        userId={userId}
                        isAdmin={isAdmin}
                        onAntwoord={(parentId, body) =>
                          metFout(() => plaatsReactie(userId, b.id, body, parentId))
                        }
                        onVerwijder={(id) => metFout(() => verwijderReactie(id))}
                        onEmoji={(commentId, emoji, aan) =>
                          metFout(() => wisselEmoji(userId, { commentId }, emoji, aan))
                        }
                      />
                    ))}
                    <NieuweReactie
                      onPlaats={(body) => metFout(() => plaatsReactie(userId, b.id, body, null))}
                    />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

const NieuweReactie: React.FC<{ onPlaats: (body: string) => Promise<void> }> = ({ onPlaats }) => {
  const [tekst, setTekst] = React.useState("");
  const [bezig, setBezig] = React.useState(false);
  return (
    <div className={styles.antwoordVak}>
      <textarea
        className={styles.textarea}
        rows={2}
        value={tekst}
        onChange={(e) => setTekst(e.target.value)}
        placeholder="Schrijf een reactie…"
      />
      <button
        type="button"
        className={styles.knopKlein}
        disabled={bezig || !tekst.trim()}
        onClick={() => {
          setBezig(true);
          void onPlaats(tekst.trim()).then(() => {
            setTekst("");
            setBezig(false);
          });
        }}
      >
        {bezig ? "Bezig…" : "Plaatsen"}
      </button>
    </div>
  );
};

export default InspiratieView;
