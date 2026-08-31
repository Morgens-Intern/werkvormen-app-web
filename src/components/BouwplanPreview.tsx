import * as React from "react";
import styles from "./BouwplanPreview.module.scss";
import { IBouwplan, IPrepRow } from "../models/bouwplan";

export interface IBouwplanPreviewProps {
  plan: IBouwplan;
  onClose: () => void;
  onExport: () => void;
}

function splitItems(s: string): string[] {
  return (s || "")
    .split(/[,\n]/)
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

const BouwplanPreview: React.FC<IBouwplanPreviewProps> = ({ plan, onClose, onExport }) => {
  const prep: { label: string; row: IPrepRow }[] = [
    { label: "Voorbereiding voor workshop / training", row: plan.voorbereidingWorkshop },
    { label: "Vooraf meenemen", row: plan.voorbereidingMeenemen },
    { label: "Voorbereiding op locatie", row: plan.voorbereidingLocatie },
  ];
  const nazorg: { label: string; row: IPrepRow }[] = [
    { label: "Nazorg op locatie", row: plan.nazorgLocatie },
    { label: "Nazorg na workshop / training", row: plan.nazorgNa },
  ];

  const materiaalMap = new Map<string, string>();
  [
    plan.voorbereidingWorkshop,
    plan.voorbereidingMeenemen,
    plan.voorbereidingLocatie,
    plan.nazorgLocatie,
    plan.nazorgNa,
  ].forEach((r) => splitItems(r.materiaal).forEach((m) => materiaalMap.set(m.toLowerCase(), m)));
  plan.agenda.forEach((it) => splitItems(it.materiaal).forEach((m) => materiaalMap.set(m.toLowerCase(), m)));
  const materiaal: string[] = [];
  materiaalMap.forEach((v) => materiaal.push(v));

  const prepTable = (rows: { label: string; row: IPrepRow }[]): React.ReactElement => (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Onderdeel</th>
          <th>Acties</th>
          <th>Benodigd materiaal</th>
          <th>Begeleider</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label}>
            <td className={styles.rowLabel}>{r.label}</td>
            <td>{r.row.acties || "—"}</td>
            <td>{r.row.materiaal || "—"}</td>
            <td>{r.row.begeleider || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.toolbar}>
          <span className={styles.toolbarTitle}>Voorbeeld</span>
          <div className={styles.toolbarActions}>
            <button type="button" className={styles.exportBtn} onClick={onExport}>
              Exporteren naar Word
            </button>
            <button type="button" className={styles.closeBtn} onClick={onClose}>
              Sluiten
            </button>
          </div>
        </div>

        <div className={styles.page}>
          <h1 className={styles.docTitle}>Bouwplan</h1>
          <p className={styles.subTitle}>{plan.bijeenkomst || "(zonder titel)"}</p>

          <div className={styles.infoGrid}>
            <div>
              <span className={styles.infoLabel}>Datum</span>
              <span>{plan.datum || "—"}</span>
            </div>
            <div>
              <span className={styles.infoLabel}>Locatie</span>
              <span>{plan.locatie || "—"}</span>
            </div>
            <div>
              <span className={styles.infoLabel}>Deelnemers</span>
              <span>{plan.deelnemers || "—"}</span>
            </div>
          </div>
          {plan.doel && (
            <p className={styles.doel}>
              <span className={styles.infoLabel}>Doel</span>
              {plan.doel}
            </p>
          )}

          <h2 className={styles.h2}>Voorbereiding</h2>
          {prepTable(prep)}

          <h2 className={styles.h2}>Agenda / programma</h2>
          {plan.agenda.length === 0 ? (
            <p className={styles.empty}>Geen agendapunten.</p>
          ) : (
            plan.agenda.map((it, idx) => (
              <div key={it.id} className={styles.agendaItem}>
                <div className={styles.agendaHead}>
                  <span className={styles.agendaTijd}>
                    {[it.startTijd, it.eindTijd].filter((x) => x).join(" – ") || `Onderdeel ${idx + 1}`}
                  </span>
                  <strong>{it.onderwerp || "(geen onderwerp)"}</strong>
                </div>
                {it.resultaat && <p><em>Resultaat:</em> {it.resultaat}</p>}
                {it.gedrag && <p><em>Verwacht gedrag:</em> {it.gedrag}</p>}
                {it.aanpak && <p><em>Aanpak:</em> {it.aanpak}</p>}
                {it.materiaal && <p><em>Materiaal:</em> {it.materiaal}</p>}
                {it.begeleider && <p><em>Begeleider:</em> {it.begeleider}</p>}
              </div>
            ))
          )}

          <h2 className={styles.h2}>Nazorg</h2>
          {prepTable(nazorg)}

          {materiaal.length > 0 && (
            <>
              <h2 className={styles.h2}>Materiaaloverzicht</h2>
              <ul className={styles.matList}>
                {materiaal.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BouwplanPreview;
