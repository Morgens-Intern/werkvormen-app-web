import * as React from "react";
import styles from "./BouwplanBuilder.module.scss";
import { Werkvorm } from "../models/types";
import {
  IBouwplan,
  IAgendaItem,
  IPrepRow,
  PrepSection,
  emptyBouwplan,
  emptyAgendaItem,
} from "../models/bouwplan";
import { exportBouwplanToWord } from "./bouwplanExport";
import { getCategoryTheme } from "./categoryTheme";
import BouwplanPreview from "./BouwplanPreview";

const STORAGE_KEY = "mw_bouwplannen";

function loadPlans(): IBouwplan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as IBouwplan[]) : [];
  } catch {
    return [];
  }
}
function persistPlans(plans: IBouwplan[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  } catch {
    /* negeren */
  }
}

function pad2(n: number): string {
  return n < 10 ? "0" + n : "" + n;
}
function parseTime(t: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec((t || "").trim());
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (h > 23 || mm > 59) return null;
  return h * 60 + mm;
}
function fmtTime(mins: number): string {
  const t = ((mins % 1440) + 1440) % 1440;
  return pad2(Math.floor(t / 60)) + ":" + pad2(t % 60);
}
function addMinutes(t: string, dur: number): string {
  const base = parseTime(t);
  if (base === null) return "";
  return fmtTime(base + dur);
}
function fmtDur(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h} u ${m} min` : `${m} min`;
}
function fmtDateTime(ms: number): string {
  const d = new Date(ms);
  return (
    d.toLocaleDateString("nl-NL") + " " + pad2(d.getHours()) + ":" + pad2(d.getMinutes())
  );
}
function itemDuur(it: IAgendaItem, werkvormen: Werkvorm[]): number | null {
  const w = werkvormen.filter((x) => x.id === it.werkvormId)[0];
  if (w) return w.duration;
  const s = parseTime(it.startTijd);
  const e = parseTime(it.eindTijd);
  if (s !== null && e !== null && e > s) return e - s;
  return null;
}
function splitItems(s: string): string[] {
  return (s || "")
    .split(/[,\n]/)
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

export interface IBouwplanBuilderProps {
  werkvormen: Werkvorm[];
  onShowWerkvorm?: (w: Werkvorm) => void;
}

const BouwplanBuilder: React.FC<IBouwplanBuilderProps> = ({
  werkvormen,
  onShowWerkvorm,
}) => {
  const [tab, setTab] = React.useState<"nieuw" | "opgeslagen">("nieuw");
  const [plan, setPlan] = React.useState<IBouwplan>(emptyBouwplan);
  const [plans, setPlans] = React.useState<IBouwplan[]>(loadPlans);
  const [savedMsg, setSavedMsg] = React.useState("");
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [showPreview, setShowPreview] = React.useState(false);

  const persist = (list: IBouwplan[]): void => {
    setPlans(list);
    persistPlans(list);
  };

  const setField = (
    k: "bijeenkomst" | "datum" | "locatie" | "doel" | "deelnemers",
    v: string,
  ): void => setPlan((p) => ({ ...p, [k]: v }));

  const setPrep = (section: PrepSection, field: keyof IPrepRow, v: string): void =>
    setPlan((p) => ({ ...p, [section]: { ...p[section], [field]: v } }));

  const setAgenda = (itemId: string, field: keyof IAgendaItem, v: string): void =>
    setPlan((p) => ({
      ...p,
      agenda: p.agenda.map((it) => (it.id === itemId ? { ...it, [field]: v } : it)),
    }));

  const updateStart = (itemId: string, value: string): void =>
    setPlan((p) => ({
      ...p,
      agenda: p.agenda.map((it) => {
        if (it.id !== itemId) return it;
        const w = werkvormen.filter((x) => x.id === it.werkvormId)[0];
        const eind = w ? addMinutes(value, w.duration) : it.eindTijd;
        return { ...it, startTijd: value, eindTijd: eind };
      }),
    }));

  const chooseWerkvorm = (itemId: string, werkvormId: string): void =>
    setPlan((p) => ({
      ...p,
      agenda: p.agenda.map((it) => {
        if (it.id !== itemId) return it;
        const w = werkvormen.filter((x) => x.id === werkvormId)[0];
        if (!w) return { ...it, werkvormId: "" };
        return {
          ...it,
          werkvormId,
          onderwerp: it.onderwerp || w.title,
          aanpak: w.title,
          materiaal: (w.materials || []).join(", "),
          eindTijd: it.startTijd ? addMinutes(it.startTijd, w.duration) : it.eindTijd,
        };
      }),
    }));

  const addAgenda = (): void =>
    setPlan((p) => ({ ...p, agenda: [...p.agenda, emptyAgendaItem()] }));
  const removeAgenda = (itemId: string): void =>
    setPlan((p) => ({ ...p, agenda: p.agenda.filter((it) => it.id !== itemId) }));
  const moveAgenda = (itemId: string, dir: -1 | 1): void =>
    setPlan((p) => {
      const idx = p.agenda.findIndex((it) => it.id === itemId);
      const j = idx + dir;
      if (idx < 0 || j < 0 || j >= p.agenda.length) return p;
      const arr = p.agenda.slice();
      const tmp = arr[idx];
      arr[idx] = arr[j];
      arr[j] = tmp;
      return { ...p, agenda: arr };
    });

  const dropOn = (targetId: string): void => {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    setPlan((p) => {
      const arr = p.agenda.slice();
      const from = arr.findIndex((x) => x.id === dragId);
      const to = arr.findIndex((x) => x.id === targetId);
      if (from < 0 || to < 0) return p;
      const moved = arr.splice(from, 1)[0];
      arr.splice(to, 0, moved);
      return { ...p, agenda: arr };
    });
    setDragId(null);
  };

  const doorschuiven = (): void =>
    setPlan((p) => {
      let cursor = parseTime(p.agenda.length > 0 ? p.agenda[0].startTijd : "");
      if (cursor === null) return p;
      const agenda = p.agenda.map((it) => {
        const start = fmtTime(cursor as number);
        const w = werkvormen.filter((x) => x.id === it.werkvormId)[0];
        let dur: number | null = null;
        if (w) dur = w.duration;
        else {
          const s = parseTime(it.startTijd);
          const e = parseTime(it.eindTijd);
          if (s !== null && e !== null && e > s) dur = e - s;
        }
        let eind = it.eindTijd;
        if (dur !== null) {
          eind = fmtTime((cursor as number) + dur);
          cursor = (cursor as number) + dur;
        }
        return { ...it, startTijd: start, eindTijd: eind };
      });
      return { ...p, agenda };
    });

  const nieuw = (): void => {
    setPlan(emptyBouwplan());
    setTab("nieuw");
  };
  const opslaan = (): void => {
    const updated: IBouwplan = { ...plan, updatedAt: Date.now() };
    const exists = plans.some((x) => x.id === updated.id);
    const list = exists
      ? plans.map((x) => (x.id === updated.id ? updated : x))
      : [updated, ...plans];
    persist(list);
    setPlan(updated);
    setSavedMsg("Bouwplan opgeslagen.");
    window.setTimeout(() => setSavedMsg(""), 3000);
  };
  const openPlan = (planId: string): void => {
    const pl = plans.filter((x) => x.id === planId)[0];
    if (pl) {
      setPlan(pl);
      setTab("nieuw");
    }
  };
  const dupPlan = (planId: string): void => {
    const pl = plans.filter((x) => x.id === planId)[0];
    if (!pl) return;
    const copy: IBouwplan = {
      ...pl,
      id: Math.random().toString(36).slice(2, 10),
      bijeenkomst: (pl.bijeenkomst || "Bouwplan") + " (kopie)",
      updatedAt: Date.now(),
    };
    persist([copy, ...plans]);
  };
  const delPlan = (planId: string): void => {
    if (window.confirm("Dit bouwplan verwijderen? Dit kan niet ongedaan worden gemaakt.")) {
      persist(plans.filter((x) => x.id !== planId));
    }
  };

  const exporteer = (): void => {
    try {
      exportBouwplanToWord(plan);
    } catch (e) {
      setSavedMsg("Export mislukt. Controleer de gegevens en probeer opnieuw.");
      window.setTimeout(() => setSavedMsg(""), 4000);
    }
  };

  const totaalMin = plan.agenda.reduce((sum, it) => {
    const s = parseTime(it.startTijd);
    const e = parseTime(it.eindTijd);
    return s !== null && e !== null && e > s ? sum + (e - s) : sum;
  }, 0);

  // Tijdlijn-segmenten
  const timelineTotal = plan.agenda.reduce((s, it) => {
    const d = itemDuur(it, werkvormen);
    return s + (d || 0);
  }, 0);
  const timeline: { id: string; pct: number; color: string; label: string; title: string }[] = [];
  if (timelineTotal > 0) {
    plan.agenda.forEach((it, i) => {
      const d = itemDuur(it, werkvormen);
      if (!d) return;
      const w = werkvormen.filter((x) => x.id === it.werkvormId)[0];
      const color = w ? getCategoryTheme(w.category[0]).color : "#94a3b8";
      timeline.push({
        id: it.id,
        pct: (d / timelineTotal) * 100,
        color,
        label: it.onderwerp || `Onderdeel ${i + 1}`,
        title: `${it.startTijd || ""}${it.eindTijd ? "–" + it.eindTijd : ""} · ${it.onderwerp || "Onderdeel " + (i + 1)} (${d} min)`,
      });
    });
  }

  // Materiaaloverzicht (uniek, over voorbereiding, agenda en nazorg)
  const materiaalMap = new Map<string, string>();
  [
    plan.voorbereidingWorkshop,
    plan.voorbereidingMeenemen,
    plan.voorbereidingLocatie,
    plan.nazorgLocatie,
    plan.nazorgNa,
  ].forEach((r) => splitItems(r.materiaal).forEach((m) => materiaalMap.set(m.toLowerCase(), m)));
  plan.agenda.forEach((it) => splitItems(it.materiaal).forEach((m) => materiaalMap.set(m.toLowerCase(), m)));
  const materiaalLijst: string[] = [];
  materiaalMap.forEach((v) => materiaalLijst.push(v));

  const sortedPlans = plans.slice().sort((a, b) => b.updatedAt - a.updatedAt);

  const renderPrepRow = (
    label: string,
    section: PrepSection,
    row: IPrepRow,
  ): React.ReactElement => (
    <div className={styles.prepRow}>
      <div className={styles.prepLabel}>{label}</div>
      <textarea className={styles.cell} placeholder="Acties" value={row.acties} onChange={(e) => setPrep(section, "acties", e.target.value)} />
      <textarea className={styles.cell} placeholder="Benodigd materiaal" value={row.materiaal} onChange={(e) => setPrep(section, "materiaal", e.target.value)} />
      <input className={styles.cell} placeholder="Begeleider" value={row.begeleider} onChange={(e) => setPrep(section, "begeleider", e.target.value)} />
    </div>
  );

  return (
    <div className={styles.builder}>
      <div className={styles.tabs}>
        <button type="button" className={tab === "nieuw" ? `${styles.tab} ${styles.tabActive}` : styles.tab} onClick={() => setTab("nieuw")}>
          Bouwplan maken
        </button>
        <button type="button" className={tab === "opgeslagen" ? `${styles.tab} ${styles.tabActive}` : styles.tab} onClick={() => setTab("opgeslagen")}>
          Opgeslagen ({plans.length})
        </button>
        <div className={styles.tabSpacer} />
        <button type="button" className={styles.newBtn} onClick={nieuw}>
          + Nieuw
        </button>
      </div>

      {tab === "nieuw" ? (
        <div className={styles.form}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Bijeenkomst</h3>
            <div className={styles.headerGrid}>
              <label className={styles.field}>
                <span>Bijeenkomst</span>
                <input value={plan.bijeenkomst} onChange={(e) => setField("bijeenkomst", e.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Datum</span>
                <input type="date" value={plan.datum} onChange={(e) => setField("datum", e.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Locatie</span>
                <input value={plan.locatie} onChange={(e) => setField("locatie", e.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Deelnemers</span>
                <input value={plan.deelnemers} onChange={(e) => setField("deelnemers", e.target.value)} />
              </label>
              <label className={`${styles.field} ${styles.fieldWide}`}>
                <span>Doel bijeenkomst</span>
                <textarea value={plan.doel} onChange={(e) => setField("doel", e.target.value)} />
              </label>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Voorbereiding</h3>
            <div className={styles.prepHead}>
              <span>Onderdeel</span>
              <span>Acties</span>
              <span>Benodigd materiaal</span>
              <span>Begeleider</span>
            </div>
            {renderPrepRow("Voorbereiding voor workshop / training", "voorbereidingWorkshop", plan.voorbereidingWorkshop)}
            {renderPrepRow("Vooraf meenemen", "voorbereidingMeenemen", plan.voorbereidingMeenemen)}
            {renderPrepRow("Voorbereiding op locatie", "voorbereidingLocatie", plan.voorbereidingLocatie)}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeadRow}>
              <h3 className={styles.sectionTitle}>Agenda / programma</h3>
              <div className={styles.headRight}>
                {totaalMin > 0 && <span className={styles.totaal}>Totale duur: {fmtDur(totaalMin)}</span>}
                <button
                  type="button"
                  className={styles.doorschuifBtn}
                  onClick={doorschuiven}
                  disabled={plan.agenda.length === 0 || parseTime(plan.agenda[0].startTijd) === null}
                  title="Vult de tijden aaneensluitend in vanaf de starttijd van het eerste onderdeel"
                >
                  Tijden doorschuiven
                </button>
                <button type="button" className={styles.addBtn} onClick={addAgenda}>+ Onderdeel toevoegen</button>
              </div>
            </div>

            {timeline.length > 0 && (
              <div className={styles.timeline}>
                {timeline.map((seg) => (
                  <div key={seg.id} className={styles.timelineSeg} style={{ width: seg.pct + "%", background: seg.color }} title={seg.title}>
                    <span className={styles.segLabel}>{seg.label}</span>
                  </div>
                ))}
              </div>
            )}

            {plan.agenda.length === 0 && <p className={styles.hint}>Nog geen agendapunten. Voeg er een toe.</p>}
            {plan.agenda.map((it, idx) => {
              const gekoppeld = werkvormen.filter((x) => x.id === it.werkvormId)[0];
              return (
                <div
                  key={it.id}
                  className={dragId === it.id ? `${styles.agendaItem} ${styles.dragging}` : styles.agendaItem}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => dropOn(it.id)}
                >
                  <div
                    className={styles.agendaTop}
                    draggable
                    onDragStart={() => setDragId(it.id)}
                    onDragEnd={() => setDragId(null)}
                  >
                    <span className={styles.dragHandle} title="Sleep om te ordenen">⠿</span>
                    <span className={styles.agendaNr}>{idx + 1}</span>
                    <div className={styles.agendaControls}>
                      <button type="button" onClick={() => moveAgenda(it.id, -1)} disabled={idx === 0} title="Omhoog">↑</button>
                      <button type="button" onClick={() => moveAgenda(it.id, 1)} disabled={idx === plan.agenda.length - 1} title="Omlaag">↓</button>
                      <button type="button" onClick={() => removeAgenda(it.id)} title="Verwijderen" className={styles.removeBtn}>✕</button>
                    </div>
                  </div>
                  <div className={styles.agendaGrid}>
                    <label className={styles.field}>
                      <span>Starttijd</span>
                      <input type="time" value={it.startTijd || ""} onChange={(e) => updateStart(it.id, e.target.value)} />
                    </label>
                    <label className={styles.field}>
                      <span>Eindtijd</span>
                      <input type="time" value={it.eindTijd || ""} onChange={(e) => setAgenda(it.id, "eindTijd", e.target.value)} />
                    </label>
                    <label className={`${styles.field} ${styles.fieldWide}`}>
                      <span>
                        Werkvorm koppelen
                        {gekoppeld && onShowWerkvorm && (
                          <button type="button" className={styles.viewLink} onClick={() => onShowWerkvorm(gekoppeld)}>
                            details bekijken
                          </button>
                        )}
                      </span>
                      <select value={it.werkvormId} onChange={(e) => chooseWerkvorm(it.id, e.target.value)}>
                        <option value="">Geen / eigen aanpak</option>
                        {werkvormen.map((w) => (
                          <option key={w.id} value={w.id}>{w.title} ({w.duration} min)</option>
                        ))}
                      </select>
                    </label>
                    <label className={`${styles.field} ${styles.fieldWide}`}>
                      <span>Onderwerp / agendapunt</span>
                      <textarea value={it.onderwerp} onChange={(e) => setAgenda(it.id, "onderwerp", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                      <span>Wat moet dit opleveren?</span>
                      <textarea value={it.resultaat} onChange={(e) => setAgenda(it.id, "resultaat", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                      <span>Verwacht gedrag deelnemers</span>
                      <textarea value={it.gedrag} onChange={(e) => setAgenda(it.id, "gedrag", e.target.value)} />
                    </label>
                    <label className={`${styles.field} ${styles.fieldWide}`}>
                      <span>Aanpak</span>
                      <textarea value={it.aanpak} onChange={(e) => setAgenda(it.id, "aanpak", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                      <span>Benodigd materiaal</span>
                      <textarea value={it.materiaal} onChange={(e) => setAgenda(it.id, "materiaal", e.target.value)} />
                    </label>
                    <label className={styles.field}>
                      <span>Begeleider</span>
                      <input value={it.begeleider} onChange={(e) => setAgenda(it.id, "begeleider", e.target.value)} />
                    </label>
                  </div>
                </div>
              );
            })}
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Nazorg</h3>
            <div className={styles.prepHead}>
              <span>Onderdeel</span>
              <span>Acties</span>
              <span>Benodigd materiaal</span>
              <span>Begeleider</span>
            </div>
            {renderPrepRow("Nazorg op locatie", "nazorgLocatie", plan.nazorgLocatie)}
            {renderPrepRow("Nazorg na workshop / training", "nazorgNa", plan.nazorgNa)}
          </section>

          {materiaalLijst.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Materiaaloverzicht</h3>
              <div className={styles.matChips}>
                {materiaalLijst.map((m) => (
                  <span key={m} className={styles.matChip}>{m}</span>
                ))}
              </div>
            </section>
          )}

          <div className={styles.actions}>
            <button type="button" className={styles.saveBtn} onClick={opslaan}>Opslaan</button>
            <button type="button" className={styles.exportBtn} onClick={() => setShowPreview(true)}>Voorbeeld</button>
            <button type="button" className={styles.exportBtn} onClick={exporteer}>Exporteren naar Word</button>
            {savedMsg && <span className={styles.savedMsg}>{savedMsg}</span>}
          </div>
        </div>
      ) : (
        <div className={styles.savedList}>
          {sortedPlans.length === 0 ? (
            <p className={styles.hint}>Je hebt nog geen bouwplannen opgeslagen.</p>
          ) : (
            sortedPlans.map((pl) => (
              <div key={pl.id} className={styles.savedCard}>
                <div className={styles.savedInfo}>
                  <strong>{pl.bijeenkomst || "(zonder titel)"}</strong>
                  <span className={styles.savedMeta}>
                    {pl.agenda.length} agendapunten · laatst bewerkt {fmtDateTime(pl.updatedAt)}
                  </span>
                </div>
                <div className={styles.savedActions}>
                  <button type="button" onClick={() => openPlan(pl.id)}>Openen</button>
                  <button type="button" onClick={() => dupPlan(pl.id)}>Dupliceren</button>
                  <button type="button" className={styles.delBtn} onClick={() => delPlan(pl.id)}>Verwijderen</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showPreview && (
        <BouwplanPreview
          plan={plan}
          onClose={() => setShowPreview(false)}
          onExport={exporteer}
        />
      )}
    </div>
  );
};

export default BouwplanBuilder;
