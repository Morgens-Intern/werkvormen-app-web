import * as React from "react";
import styles from "./Werkvormen.module.scss";
import type { IWerkvormenProps } from "./IWerkvormenProps";
import { Categorie, Fase, Setting, Werkvorm } from "../models/types";
import { ISuggestion } from "../models/suggestion";
import {
  loadWerkvormen,
  saveWerkvormen,
  loadSuggestions,
  saveSuggestions,
  newId,
} from "./werkvormStore";
import WerkvormCard from "./WerkvormCard";
import WerkvormDetail from "./WerkvormDetail";
import WerkvormForm from "./WerkvormForm";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import BouwplanBuilder from "./BouwplanBuilder";
import AdminView from "./AdminView";
import InspiratieView from "./InspiratieView";

const FAVORITES_KEY = "mw_favorites";
const ADMIN_PASSWORD = "MorgensAdmin2026";

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
  const [activeView, setActiveView] = React.useState("home");
  const [werkvormen, setWerkvormen] = React.useState<Werkvorm[]>(loadWerkvormen);
  const [suggestions, setSuggestions] = React.useState<ISuggestion[]>(loadSuggestions);
  const [isAdmin, setIsAdmin] = React.useState(false);
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
  const [isDark, setIsDark] = React.useState(() => {
    try {
      return localStorage.getItem("mw_theme") === "dark";
    } catch {
      return false;
    }
  });

  const toggleDark = (): void => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("mw_theme", next ? "dark" : "light");
      } catch {
        /* negeren */
      }
      return next;
    });
  };

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

  // --- Werkvormen- en voorstellen-mutaties (persisteren lokaal) ---
  const addWerkvorm = (w: Werkvorm): void =>
    setWerkvormen((prev) => {
      const list = [w, ...prev];
      saveWerkvormen(list);
      return list;
    });
  const updateWerkvorm = (w: Werkvorm): void =>
    setWerkvormen((prev) => {
      const list = prev.map((x) => (x.id === w.id ? w : x));
      saveWerkvormen(list);
      return list;
    });
  const deleteWerkvorm = (id: string): void =>
    setWerkvormen((prev) => {
      const list = prev.filter((x) => x.id !== id);
      saveWerkvormen(list);
      return list;
    });
  const addSuggestion = (s: ISuggestion): void =>
    setSuggestions((prev) => {
      const list = [s, ...prev];
      saveSuggestions(list);
      return list;
    });
  const removeSuggestion = (id: string): void =>
    setSuggestions((prev) => {
      const list = prev.filter((x) => x.id !== id);
      saveSuggestions(list);
      return list;
    });

  const toggleAdmin = (): void => {
    if (isAdmin) {
      setIsAdmin(false);
      if (activeView === "beheer") setActiveView("home");
      return;
    }
    const pw = window.prompt("Voer het beheerderswachtwoord in:");
    if (pw === null) return;
    if (pw === ADMIN_PASSWORD) setIsAdmin(true);
    else window.alert("Onjuist wachtwoord.");
  };

  const onSaveForm = (w: Werkvorm): void => {
    if (!editor) return;
    const wv: Werkvorm = w.id ? w : { ...w, id: newId("u") };
    if (editor.mode === "propose") {
      addSuggestion({
        id: newId("s"),
        submitter: props.userDisplayName || "Onbekend",
        date: Date.now(),
        werkvorm: wv,
      });
    } else if (editor.mode === "edit") {
      updateWerkvorm(wv);
    } else {
      addWerkvorm(wv);
      if (editor.suggestionId) removeSuggestion(editor.suggestionId);
    }
    setEditor(null);
  };

  const approveSuggestion = (id: string): void => {
    const s = suggestions.filter((x) => x.id === id)[0];
    if (!s) return;
    addWerkvorm(s.werkvorm.id ? s.werkvorm : { ...s.werkvorm, id: newId("u") });
    removeSuggestion(id);
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
        isAdmin={isAdmin}
        onToggleAdmin={toggleAdmin}
        isDark={isDark}
        onToggleDark={toggleDark}
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
        <BouwplanBuilder werkvormen={werkvormen} onShowWerkvorm={setSelected} />
      )}

      {activeView === "inspiratie" && (
        <InspiratieView
          userDisplayName={props.userDisplayName}
          werkvormen={werkvormen}
          onShowWerkvorm={setSelected}
        />
      )}

      {activeView === "beheer" && isAdmin && (
        <AdminView
          suggestions={suggestions}
          werkvormenCount={werkvormen.length}
          onApprove={approveSuggestion}
          onEditApprove={(s) => setEditor({ mode: "new", werkvorm: s.werkvorm, suggestionId: s.id })}
          onReject={(id) => removeSuggestion(id)}
          onAddNew={() => setEditor({ mode: "new", werkvorm: null })}
        />
      )}

      {selected && (
        <WerkvormDetail
          werkvorm={selected}
          onClose={() => setSelected(null)}
          isFav={favorites.indexOf(selected.id) >= 0}
          onToggleFav={() => toggleFavorite(selected.id)}
          isAdmin={isAdmin}
          onEdit={() => {
            setEditor({ mode: "edit", werkvorm: selected });
            setSelected(null);
          }}
          onDelete={() => {
            if (window.confirm("Deze werkvorm verwijderen uit de bibliotheek?")) {
              deleteWerkvorm(selected.id);
              setSelected(null);
            }
          }}
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
