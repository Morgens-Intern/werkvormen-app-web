import * as React from "react";
import styles from "./Sidebar.module.scss";
import { Categorie, Fase, Setting } from "../models/types";
import { getCategoryTheme } from "./categoryTheme";

export interface ISidebarProps {
  categorie: string[];
  doel: string[];
  fase: string[];
  setting: string[];
  duur: number | null;
  groep: number | null;
  onToggleCategorie: (c: string) => void;
  onToggleDoel: (d: string) => void;
  onToggleFase: (f: string) => void;
  onToggleSetting: (s: string) => void;
  onSetDuur: (v: number | null) => void;
  onSetGroep: (v: number | null) => void;
  onClear: () => void;
}

const CATEGORIES: Categorie[] = [
  "Energizer",
  "Divergeren",
  "Convergeren",
  "Besluitvorming",
  "Reflectie",
  "IJsbreker",
  "Liberating Structure",
  "Overig",
];
const FASES: Fase[] = ["Start", "Analyse", "Besluitvorming", "Reflectie", "Afronding"];
const SETTINGS: Setting[] = ["Online", "Hybride", "Fysiek"];
const DOELEN = [
  "Ideeën genereren",
  "Samenwerking verbeteren",
  "Prioriteren",
  "Draagvlak creëren",
  "Inzichten ophalen",
  "Bewustwording",
  "Anders",
];
const DUUR = [
  { l: "0–10 min", v: 0 },
  { l: "10–30 min", v: 1 },
  { l: "30–60 min", v: 2 },
  { l: "60+ min", v: 3 },
];
const GROEP = [
  { l: "2–5", v: 0 },
  { l: "5–15", v: 1 },
  { l: "15–30", v: 2 },
  { l: "30+", v: 3 },
];

const Sidebar: React.FC<ISidebarProps> = ({
  categorie,
  doel,
  fase,
  setting,
  duur,
  groep,
  onToggleCategorie,
  onToggleDoel,
  onToggleFase,
  onToggleSetting,
  onSetDuur,
  onSetGroep,
  onClear,
}) => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.headerRow}>
        <span className={styles.filtersLabel}>Filters</span>
        <button type="button" className={styles.clear} onClick={onClear}>
          Wissen
        </button>
      </div>

      <h4 className={styles.groupTitle}>Categorie</h4>
      <div className={styles.options}>
        {CATEGORIES.map((c) => (
          <label key={c} className={styles.check}>
            <input
              type="checkbox"
              checked={categorie.indexOf(c) >= 0}
              onChange={() => onToggleCategorie(c)}
            />
            <span>
              {getCategoryTheme(c).icon} {c}
            </span>
          </label>
        ))}
      </div>

      <h4 className={styles.groupTitle}>Fase</h4>
      <div className={styles.options}>
        {FASES.map((f) => (
          <label key={f} className={styles.check}>
            <input
              type="checkbox"
              checked={fase.indexOf(f) >= 0}
              onChange={() => onToggleFase(f)}
            />
            <span>{f}</span>
          </label>
        ))}
      </div>

      <h4 className={styles.groupTitle}>Geschikt voor</h4>
      <div className={styles.options}>
        {SETTINGS.map((s) => (
          <label key={s} className={styles.check}>
            <input
              type="checkbox"
              checked={setting.indexOf(s) >= 0}
              onChange={() => onToggleSetting(s)}
            />
            <span>{s}</span>
          </label>
        ))}
      </div>

      <h4 className={styles.groupTitle}>Doel</h4>
      <div className={styles.options}>
        {DOELEN.map((d) => (
          <label key={d} className={styles.check}>
            <input
              type="checkbox"
              checked={doel.indexOf(d) >= 0}
              onChange={() => onToggleDoel(d)}
            />
            <span>{d}</span>
          </label>
        ))}
      </div>

      <h4 className={styles.groupTitle}>Tijdsduur</h4>
      <div className={styles.pills}>
        {DUUR.map((o) => (
          <button
            key={o.v}
            type="button"
            className={duur === o.v ? `${styles.pill} ${styles.pillActive}` : styles.pill}
            onClick={() => onSetDuur(duur === o.v ? null : o.v)}
          >
            {o.l}
          </button>
        ))}
      </div>

      <h4 className={styles.groupTitle}>Groepsgrootte</h4>
      <div className={styles.pills}>
        {GROEP.map((o) => (
          <button
            key={o.v}
            type="button"
            className={groep === o.v ? `${styles.pill} ${styles.pillActive}` : styles.pill}
            onClick={() => onSetGroep(groep === o.v ? null : o.v)}
          >
            {o.l}
          </button>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
