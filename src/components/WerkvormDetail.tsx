import * as React from "react";
import styles from "./WerkvormDetail.module.scss";
import { Werkvorm } from "../models/types";
import { getCategoryTheme } from "./categoryTheme";
import CategoryVisual from "./CategoryVisual";
import { getWerkvormImage } from "./werkvormImages";
import {
  ClockIcon,
  UsersIcon,
  TargetIcon,
  LightbulbIcon,
  HeartIcon,
} from "./icons";

export interface IWerkvormDetailProps {
  werkvorm: Werkvorm;
  onClose: () => void;
  isFav?: boolean;
  onToggleFav?: () => void;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const WerkvormDetail: React.FC<IWerkvormDetailProps> = ({
  werkvorm,
  onClose,
  isFav,
  onToggleFav,
  isAdmin,
  onEdit,
  onDelete,
}) => {
  const theme = getCategoryTheme(werkvorm.category[0]);
  const imageSrc = werkvorm.imageUrl || getWerkvormImage(werkvorm.title);
  const groep = `${werkvorm.groupSizeMin} – ${werkvorm.groupSizeMax === 9999 ? "Onbeperkt" : werkvorm.groupSizeMax}`;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div
          className={styles.header}
          style={
            imageSrc
              ? undefined
              : {
                  background: `linear-gradient(135deg, ${theme.color}, ${theme.colorDark})`,
                }
          }
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={werkvorm.title}
              className={styles.headerImage}
            />
          ) : (
            <CategoryVisual
              categorie={werkvorm.category[0]}
              className={styles.headerVisual}
            />
          )}
          <div className={styles.headerOverlay} />
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Sluiten"
          >
            ×
          </button>
          <div className={styles.headerText}>
            <div className={styles.tags}>
              {werkvorm.category.map((c) => (
                <span key={c} className={styles.tag}>
                  {c}
                </span>
              ))}
            </div>
            <h2 className={styles.title}>{werkvorm.title}</h2>
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.stats}>
            <span className={styles.stat}>
              <ClockIcon size={17} /> {werkvorm.duration} minuten
            </span>
            <span className={styles.stat}>
              <UsersIcon size={17} /> {groep} personen
            </span>
            {werkvorm.fase && werkvorm.fase.length > 0 && (
              <span className={styles.stat}>
                <TargetIcon size={17} /> Fase: {werkvorm.fase.join(", ")}
              </span>
            )}
          </div>

          {werkvorm.settings && werkvorm.settings.length > 0 && (
            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>Geschikt voor:</span>
              {werkvorm.settings.map((s) => (
                <span key={s} className={styles.settingPill}>
                  {s}
                </span>
              ))}
            </div>
          )}

          <section>
            <h3 className={styles.sectionTitle}>Doel &amp; beschrijving</h3>
            <p className={styles.goal}>{werkvorm.goal}</p>
            <p className={styles.text}>{werkvorm.description}</p>
          </section>

          {werkvorm.materials && werkvorm.materials.length > 0 && (
            <section>
              <h3 className={styles.sectionTitle}>Benodigd materiaal</h3>
              <div className={styles.materials}>
                {werkvorm.materials.map((m) => (
                  <span key={m} className={styles.material}>
                    {m}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className={styles.sectionTitle}>Stappenplan</h3>
            <ol className={styles.steps}>
              {werkvorm.steps.map((step, idx) => (
                <li key={idx} className={styles.step}>
                  <span className={styles.stepNum}>{idx + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {werkvorm.tips && werkvorm.tips.length > 0 && (
            <section className={styles.tipsBox}>
              <h3 className={styles.tipsTitle}>
                <LightbulbIcon size={18} /> Tips voor de facilitator
              </h3>
              <ul className={styles.tips}>
                {werkvorm.tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </section>
          )}

          {(onToggleFav || werkvorm.extraLink || isAdmin) && (
            <div className={styles.footer}>
              {onToggleFav && (
                <button
                  type="button"
                  className={isFav ? `${styles.favBtn} ${styles.favBtnActive}` : styles.favBtn}
                  onClick={onToggleFav}
                >
                  <HeartIcon size={18} filled={isFav} />
                  {isFav ? "Verwijder favoriet" : "Bewaar werkvorm"}
                </button>
              )}
              {isAdmin && onEdit && (
                <button type="button" className={styles.adminBtn} onClick={onEdit}>
                  Bewerken
                </button>
              )}
              {isAdmin && onDelete && (
                <button type="button" className={styles.adminDelBtn} onClick={onDelete}>
                  Verwijderen
                </button>
              )}
              {werkvorm.extraLink && (
                <a
                  href={werkvorm.extraLink}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.linkBtn}
                >
                  Meer informatie →
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WerkvormDetail;
