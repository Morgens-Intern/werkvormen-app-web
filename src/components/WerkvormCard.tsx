import * as React from "react";
import styles from "./WerkvormCard.module.scss";
import { Werkvorm } from "../models/types";
import { getCategoryTheme } from "./categoryTheme";
import CategoryVisual from "./CategoryVisual";
import { getWerkvormImage } from "./werkvormImages";
import { ClockIcon, UsersIcon, HeartIcon } from "./icons";

export interface IWerkvormCardProps {
  werkvorm: Werkvorm;
  onClick?: () => void;
  isFav?: boolean;
  onToggleFav?: () => void;
}

const WerkvormCard: React.FC<IWerkvormCardProps> = ({
  werkvorm,
  onClick,
  isFav,
  onToggleFav,
}) => {
  const [imgError, setImgError] = React.useState(false);
  const theme = getCategoryTheme(werkvorm.category[0]);
  const imageSrc = werkvorm.imageUrl || getWerkvormImage(werkvorm.title);
  const showImage = !!imageSrc && !imgError;
  const groep = `${werkvorm.groupSizeMin}–${werkvorm.groupSizeMax === 9999 ? "∞" : werkvorm.groupSizeMax}`;

  const handleFav = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (onToggleFav) onToggleFav();
  };

  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.imageWrap}>
        {showImage ? (
          <img
            src={imageSrc}
            alt={werkvorm.title}
            className={styles.image}
            // Pas laden zodra de kaart in beeld komt; scheelt bij het openen
            // van de bibliotheek een paar MB aan afbeeldingen.
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className={styles.visual}
            style={{
              background: `linear-gradient(135deg, ${theme.color}, ${theme.colorDark})`,
            }}
          >
            <CategoryVisual
              categorie={werkvorm.category[0]}
              className={styles.visualSvg}
            />
          </div>
        )}
        {onToggleFav && (
          <button
            type="button"
            className={isFav ? `${styles.favBtn} ${styles.favActive}` : styles.favBtn}
            onClick={handleFav}
            aria-label={isFav ? "Verwijder uit favorieten" : "Voeg toe aan favorieten"}
            title={isFav ? "Verwijder uit favorieten" : "Voeg toe aan favorieten"}
          >
            <HeartIcon size={18} filled={isFav} />
          </button>
        )}
      </div>
      <div className={styles.body}>
        <div className={styles.tags}>
          {werkvorm.category.map((c) => (
            <span key={c} className={styles.tag}>
              {c}
            </span>
          ))}
        </div>
        {werkvorm.settings && werkvorm.settings.length > 0 && (
          <div className={styles.settings}>
            {werkvorm.settings.map((s) => (
              <span key={s} className={styles.settingTag}>
                {s}
              </span>
            ))}
          </div>
        )}
        <h3 className={styles.title}>{werkvorm.title}</h3>
        <p className={styles.description}>
          {werkvorm.description || werkvorm.goal}
        </p>
        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <ClockIcon size={14} /> {werkvorm.duration} min
          </span>
          <span className={styles.metaItem}>
            <UsersIcon size={14} /> {groep} pers.
          </span>
        </div>
      </div>
    </div>
  );
};

export default WerkvormCard;
