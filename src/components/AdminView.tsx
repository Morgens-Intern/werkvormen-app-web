import * as React from "react";
import styles from "./AdminView.module.scss";
import { ISuggestion } from "../models/suggestion";
import { getCategoryTheme } from "./categoryTheme";

export interface IAdminViewProps {
  suggestions: ISuggestion[];
  werkvormenCount: number;
  onApprove: (id: string) => void;
  onEditApprove: (s: ISuggestion) => void;
  onReject: (id: string) => void;
  onAddNew: () => void;
}

function fmtDate(ms: number): string {
  const d = new Date(ms);
  const p = (n: number): string => (n < 10 ? "0" + n : "" + n);
  return d.toLocaleDateString("nl-NL") + " " + p(d.getHours()) + ":" + p(d.getMinutes());
}

const AdminView: React.FC<IAdminViewProps> = ({
  suggestions,
  werkvormenCount,
  onApprove,
  onEditApprove,
  onReject,
  onAddNew,
}) => {
  return (
    <div className={styles.admin}>
      <div className={styles.headRow}>
        <div>
          <h2 className={styles.title}>Beheer</h2>
          <p className={styles.sub}>{werkvormenCount} werkvormen in de bibliotheek</p>
        </div>
        <button type="button" className={styles.addBtn} onClick={onAddNew}>
          + Nieuwe werkvorm toevoegen
        </button>
      </div>

      <h3 className={styles.sectionTitle}>Openstaande voorstellen ({suggestions.length})</h3>
      {suggestions.length === 0 ? (
        <p className={styles.hint}>Er zijn geen openstaande voorstellen.</p>
      ) : (
        <div className={styles.list}>
          {suggestions.map((s) => (
            <div key={s.id} className={styles.card}>
              <div className={styles.info}>
                <strong>{s.werkvorm.title || "(zonder titel)"}</strong>
                <span className={styles.tags}>
                  {s.werkvorm.category.map((c) => (
                    <span key={c} className={styles.tag}>
                      {getCategoryTheme(c).icon} {c}
                    </span>
                  ))}
                </span>
                <span className={styles.meta}>
                  Voorgesteld door {s.submitter} · {fmtDate(s.date)}
                </span>
                {s.werkvorm.goal && <span className={styles.goal}>{s.werkvorm.goal}</span>}
              </div>
              <div className={styles.actions}>
                <button type="button" className={styles.approve} onClick={() => onApprove(s.id)}>
                  Goedkeuren
                </button>
                <button type="button" onClick={() => onEditApprove(s)}>
                  Aanpassen &amp; goedkeuren
                </button>
                <button type="button" className={styles.reject} onClick={() => onReject(s.id)}>
                  Afwijzen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminView;
