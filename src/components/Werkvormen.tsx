import * as React from "react";
import styles from "./Werkvormen.module.scss";
import type { IWerkvormenProps } from "./IWerkvormenProps";
import { Categorie, Fase, Setting, Werkvorm } from "../models/types";
import { loadWerkvormen, newId } from "./werkvormStore";
import WerkvormCard from "./WerkvormCard";
import WerkvormDetail from "./WerkvormDetail";
import WerkvormForm from "./WerkvormForm";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import BouwplanBuilder from "./BouwplanBuilder";

const FAVORITES_KEY = "mw_favorites";

// Adres waar voorstellen voor nieuwe werkvormen naartoe gaan. De app heeft geen
// server, dus een voorstel gaat per mail naar de beheerder van de bibliotheek.
const BEHEERDER_MAIL = "munzur.atak@morgens.nl";

const DUUR_BOUNDS = [
  [0, 10],
  [10, 30],
  [30, 60],
  [60, 9999],
];
const DUUR_LABELS = ["0–10 min", "10–30 min", "30–60 min", "60+ min"];
const GROEP_BOUNDS = [
  [2, 5],
  [5, 15],
  [15, 30],
  [30, 9999],
];
const GROEP_LABELS = ["2–5 pers.", "5–15 pers.", "15–30 pers.", "30+ pers."];

const CATEGORY_TO_DOELEN: Record<string, string[]> = {
  Energizer: ["Samenwerking verbeteren", "Bewustwording"],
  Divergeren: ["Ideeën genereren", "Inzichten ophalen"],
  Convergeren: ["Prioriteren", "Inzichten ophalen"],
  Besluitvorming: ["Prioriteren", "Draagvlak creëren"],
  Reflectie: ["Bewustwording", "Samenwerking verbeteren", "Inzichten ophalen"],
  IJsbreker: ["Samenwerking verbeteren", "Anders"],
  "Liberating Structure": [
    "Samenwerking verbeteren",
    "Ideeën genereren",
    "Draagvlak creëren",
    "Inzichten ophalen",
  ],
  Overig: ["Anders"],
};

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

interface IChip {
  key: string;
  label: string;
  onRemove: () => void;
}

interface IEditor {
  mode: "propose" | "new" | "edit";
  werkvorm: Werkvorm | null;
  suggestionId?: string;
}

const Werkvormen: React.FC<IWerkvormenProps> = (props) => {
  const { isDark, onToggleDark } = props;
  const [activeView, setActiveView] = React.useState("home");
  const [werkvormen] = React.useState<Werkvorm[]>(loadWerkvormen);
  const [editor, setEditor] = React.useState<IEditor | null>(null);

  const [search, setSearch] = React.useState("");
  const [categorie, setCategorie] = React.useState<string[]>([]);
  const [doel, setDoel] = React.useState<string[]>([]);
  const [fase, setFase] = React.useState<string[]>([]);
  const [setting, setSetting] = React.useState<string[]>([]);
  const [duur, setDuur] = React.useState<number | null>(null);
  const [groep, setGroep] = React.useState<number | null>(null);
  const [sortBy, setSortBy] = React.useState("");
  const [selected, setSelected] = React.useState<Werkvorm | null>(null);
  const [favorites, setFavorites] = React.useState<string[]>(loadFavorites);
  const [showFavorites, setShowFavorites] = React.useState(false);
  const [showHint, setShowHint] = React.useState(() => {
    try {
      return localStorage.getItem("mw_hint_v1") !== "dismissed";
    } catch {
      return true;
    }
  });

  const dismissHint = (): void => {
    setShowHint(false);
    try {
      localStorage.setItem("mw_hint_v1", "dismissed");
    } catch {
      /* negeren */
    }
  };

  React.useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch {
      /* negeren */
    }
  }, [favorites]);

  // --- Voorstel voor een nieuwe werkvorm ---
  //
  // Er is geen server en geen gedeelde database, dus een voorstel lokaal
  // opslaan zou betekenen dat niemand het ooit ziet. In plaats daarvan zetten
  // we het voorstel op het klembord en openen we een mail aan de beheerder.
  //
  // Waarom klembord en niet alles in de mailto-link: Outlook kapt een mailto
  // rond de 2000 tekens af, en een werkvorm met stappenplan en tips zit daar
  // zo overheen. Dan zou het voorstel stilletjes half aankomen.
  const voorstelAlsTekst = (w: Werkvorm): string => {
    const regels = [
      `Titel: ${w.title}`,
      `Categorie: ${(w.category || []).join(", ")}`,
      `Fase: ${(w.fase || []).join(", ")}`,
      `Duur: ${w.duration} minuten`,
      `Groepsgrootte: ${w.groupSizeMin}–${w.groupSizeMax === 9999 ? "onbeperkt" : w.groupSizeMax}`,
      `Geschikt voor: ${(w.settings || []).join(", ")}`,
      "",
      `Doel: ${w.goal}`,
      "",
      `Beschrijving: ${w.description}`,
      "",
      "Stappenplan:",
      ...(w.steps || []).map((st, i) => `${i + 1}. ${st}`),
      "",
      "Tips:",
      ...(w.tips || []).map((t) => `- ${t}`),
      "",
      `Materialen: ${(w.materials || []).join(", ")}`,
      `Tags: ${(w.tags || []).join(", ")}`,
      w.extraLink ? `Meer informatie: ${w.extraLink}` : "",
    ];
    return regels.join("\n");
  };

  const onSaveForm = (w: Werkvorm): void => {
    const wv: Werkvorm = w.id ? w : { ...w, id: newId("u") };
    const tekst = voorstelAlsTekst(wv);
    const onderwerp = `Voorstel nieuwe werkvorm: ${wv.title}`;

    const openMail = (geplakt: boolean): void => {
      const body = geplakt
        ? "Je voorstel staat op je klembord — plak het hieronder met Ctrl+V en verstuur.\n\n"
        : tekst;
      window.location.href =
        `mailto:${BEHEERDER_MAIL}?subject=${encodeURIComponent(onderwerp)}` +
        `&body=${encodeURIComponent(body)}`;
      setEditor(null);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(tekst).then(
        () => openMail(true),
        () => openMail(false)
      );
    } else {
      openMail(false);
    }
  };

  // --- Filters ---
  const toggle = (list: string[], val: string): string[] =>
    list.indexOf(val) >= 0 ? list.filter((x) => x !== val) : [...list, val];

  const toggleFavorite = (id: string): void => setFavorites((prev) => toggle(prev, id));

  const clearFilters = (): void => {
    setSearch("");
    setCategorie([]);
    setDoel([]);
    setFase([]);
    setSetting([]);
    setDuur(null);
    setGroep(null);
  };

  const filtered = React.useMemo(() => {
    return werkvormen.filter((w) => {
      if (showFavorites && favorites.indexOf(w.id) < 0) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [
          w.title,
          w.description,
          w.goal,
          ...(w.tags || []),
          ...(w.materials || []),
        ]
          .join(" ")
          .toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      if (
        categorie.length > 0 &&
        !categorie.some((c) => w.category.indexOf(c as Categorie) >= 0)
      ) {
        return false;
      }
      if (fase.length > 0 && !fase.some((f) => w.fase.indexOf(f as Fase) >= 0)) {
        return false;
      }
      if (setting.length > 0) {
        const wv = w.settings || [];
        if (wv.length > 0 && !setting.some((s) => wv.indexOf(s as Setting) >= 0)) {
          return false;
        }
      }
      if (doel.length > 0) {
        const implicit = new Set<string>();
        w.category.forEach((c) =>
          (CATEGORY_TO_DOELEN[c] || []).forEach((d) => implicit.add(d)),
        );
        const text = ((w.tags || []).join(" ") + " " + w.goal).toLowerCase();
        const ok = doel.some(
          (d) => implicit.has(d) || text.indexOf(d.toLowerCase()) >= 0,
        );
        if (!ok) return false;
      }
      if (duur !== null) {
        const [lo, hi] = DUUR_BOUNDS[duur];
        if (w.duration < lo || w.duration > hi) return false;
      }
      if (groep !== null) {
        const [lo, hi] = GROEP_BOUNDS[groep];
        if (w.groupSizeMax < lo || w.groupSizeMin > hi) return false;
      }
      return true;
    });
  }, [werkvormen, search, categorie, doel, fase, setting, duur, groep, favorites, showFavorites]);

  const displayed = React.useMemo(() => {
    const arr = filtered.slice();
    if (sortBy === "titel") arr.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === "duur-op") arr.sort((a, b) => a.duration - b.duration);
    else if (sortBy === "duur-af") arr.sort((a, b) => b.duration - a.duration);
    return arr;
  }, [filtered, sortBy]);

  const chips: IChip[] = [];
  categorie.forEach((c) =>
    chips.push({ key: "c" + c, label: c, onRemove: () => setCategorie((p) => p.filter((x) => x !== c)) }),
  );
  fase.forEach((f) =>
    chips.push({ key: "f" + f, label: f, onRemove: () => setFase((p) => p.filter((x) => x !== f)) }),
  );
  doel.forEach((d) =>
    chips.push({ key: "d" + d, label: d, onRemove: () => setDoel((p) => p.filter((x) => x !== d)) }),
  );
  setting.forEach((s) =>
    chips.push({ key: "st" + s, label: s, onRemove: () => setSetting((p) => p.filter((x) => x !== s)) }),
  );
  if (duur !== null) chips.push({ key: "duur", label: DUUR_LABELS[duur], onRemove: () => setDuur(null) });
  if (groep !== null) chips.push({ key: "groep", label: GROEP_LABELS[groep], onRemove: () => setGroep(null) });

  const heading = showFavorites ? "Favorieten" : "Werkvormen";

  let formTitel = "";
  let formLabel = "";
  if (editor) {
    if (editor.mode === "propose") {
      formTitel = "Nieuwe werkvorm voorstellen";
      formLabel = "Voorstel indienen";
    } else if (editor.mode === "edit") {
      formTitel = "Werkvorm bewerken";
      formLabel = "Opslaan";
    } else if (editor.suggestionId) {
      formTitel = "Voorstel aanpassen & goedkeuren";
      formLabel = "Goedkeuren";
    } else {
      formTitel = "Nieuwe werkvorm toevoegen";
      formLabel = "Toevoegen";
    }
  }

  return (
    <section className={isDark ? `${styles.werkvormen} ${styles.dark}` : styles.werkvormen}>
      <TopBar
        userDisplayName={props.userDisplayName}
        search={search}
        onSearchChange={setSearch}
        favoritesCount={favorites.length}
        showFavorites={showFavorites}
        onToggleFavorites={() => setShowFavorites((v) => !v)}
        activeView={activeView}
        onNavigate={setActiveView}
        onPropose={() => setEditor({ mode: "propose", werkvorm: null })}
        isDark={isDark}
        onToggleDark={onToggleDark}
        onSignOut={props.onSignOut}
      />

      {activeView === "home" && (
        <>
          {showHint && (
            <div className={styles.hintBanner}>
              <span>
                💡 <strong>Tip:</strong> zoek en filter werkvormen in de linkerkolom, en klik op een
                kaart voor het volledige stappenplan. Maak een sessieplan via de tab{" "}
                <strong>Bouwplannen</strong>, of stel er zelf een voor via <strong>Nieuwe werkvorm</strong>.
              </span>
              <button type="button" className={styles.hintClose} onClick={dismissHint} aria-label="Tip sluiten">
                ×
              </button>
            </div>
          )}
          <div className={styles.layout}>
          <Sidebar
            categorie={categorie}
            doel={doel}
            fase={fase}
            setting={setting}
            duur={duur}
            groep={groep}
            onToggleCategorie={(c) => setCategorie((p) => toggle(p, c))}
            onToggleDoel={(d) => setDoel((p) => toggle(p, d))}
            onToggleFase={(f) => setFase((p) => toggle(p, f))}
            onToggleSetting={(s) => setSetting((p) => toggle(p, s))}
            onSetDuur={setDuur}
            onSetGroep={setGroep}
            onClear={clearFilters}
          />
          <main className={styles.content}>
            <h2 className={styles.heading}>
              {heading} ({displayed.length})
            </h2>

            <div className={styles.controls}>
              <div className={styles.chips}>
                {chips.map((ch) => (
                  <button
                    key={ch.key}
                    type="button"
                    className={styles.filterChip}
                    onClick={ch.onRemove}
                    title={`Filter '${ch.label}' verwijderen`}
                  >
                    {ch.label} <span className={styles.chipX}>✕</span>
                  </button>
                ))}
                {chips.length > 0 && (
                  <button type="button" className={styles.clearAll} onClick={clearFilters}>
                    Alles wissen
                  </button>
                )}
              </div>
              <select className={styles.sort} value={sortBy} onChange={(e) => setSortBy(e.target.value)} title="Sorteer de werkvormen">

                <option value="">Sorteren: standaard</option>
                <option value="titel">Titel (A–Z)</option>
                <option value="duur-op">Duur (kort → lang)</option>
                <option value="duur-af">Duur (lang → kort)</option>
              </select>
            </div>

            {displayed.length === 0 ? (
              <p className={styles.empty}>
                {showFavorites
                  ? "Je hebt nog geen favorieten. Klik op het hartje op een werkvorm om er een te bewaren."
                  : "Geen werkvormen gevonden met deze filters."}
              </p>
            ) : (
              <div className={styles.grid}>
                {displayed.map((w) => (
                  <WerkvormCard
                    key={w.id}
                    werkvorm={w}
                    onClick={() => setSelected(w)}
                    isFav={favorites.indexOf(w.id) >= 0}
                    onToggleFav={() => toggleFavorite(w.id)}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
        </>
      )}

      {activeView === "bouwplannen" && (
        <>
          <p className={styles.opslagNotitie}>
            Je bouwplannen worden in deze browser bewaard, niet op een server. Ze zijn dus
            alleen op dit apparaat beschikbaar. Exporteer een bouwplan naar Word zodra het af
            is — dat bestand kun je bewaren en delen.
          </p>
          <BouwplanBuilder werkvormen={werkvormen} onShowWerkvorm={setSelected} />
        </>
      )}

      {selected && (
        <WerkvormDetail
          werkvorm={selected}
          onClose={() => setSelected(null)}
          isFav={favorites.indexOf(selected.id) >= 0}
          onToggleFav={() => toggleFavorite(selected.id)}
        />
      )}

      {editor && (
        <WerkvormForm
          initial={editor.werkvorm}
          titel={formTitel}
          submitLabel={formLabel}
          onSave={onSaveForm}
          onCancel={() => setEditor(null)}
        />
      )}
    </section>
  );
};

export default Werkvormen;
