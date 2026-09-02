import * as React from "react";
import styles from "./TopBar.module.scss";
import { HeartIcon, SunIcon, MoonIcon } from "./icons";

export interface ITopBarProps {
  userDisplayName: string;
  search: string;
  onSearchChange: (value: string) => void;
  favoritesCount: number;
  showFavorites: boolean;
  onToggleFavorites: () => void;
  activeView: string;
  onNavigate: (view: string) => void;
  onPropose: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  onSignOut: () => void;
}

const MorgensLogo: React.FC<{ dark?: boolean }> = ({ dark }) => {
  const c = dark ? "#e8eefc" : "#0c1a55";
  return (
    <svg
      height="34"
      viewBox="0 0 200 60"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Morgens Conclusion"
    >
      <text x="0" y="32" fill={c} fontFamily="Georgia, serif" fontWeight="bold" fontSize="38" letterSpacing="-1">
        morgens
      </text>
      <line x1="0" y1="42" x2="190" y2="42" stroke={c} strokeWidth="1.5" />
      <text x="0" y="56" fill={c} fontFamily="Arial, sans-serif" fontSize="11" letterSpacing="5">
        CONCLUSION
      </text>
    </svg>
  );
};

const TopBar: React.FC<ITopBarProps> = ({
  userDisplayName,
  search,
  onSearchChange,
  favoritesCount,
  showFavorites,
  onToggleFavorites,
  activeView,
  onNavigate,
  onPropose,
  isDark,
  onToggleDark,
  onSignOut,
}) => {
  const navClass = (view: string): string =>
    activeView === view ? `${styles.navItem} ${styles.navActive}` : styles.navItem;

  return (
    <header className={styles.topbar}>
      <div className={styles.logo}>
        <MorgensLogo dark={isDark} />
      </div>
      <nav className={styles.nav}>
        <button type="button" className={navClass("home")} onClick={() => onNavigate("home")} title="Werkvormenbibliotheek">
          Home
        </button>
        <button type="button" className={styles.navItem} disabled title="Binnenkort">
          AI Adviseur
        </button>
        <button type="button" className={navClass("bouwplannen")} onClick={() => onNavigate("bouwplannen")} title="Bouwplannen maken (sessieplanner)">
          Bouwplannen
        </button>
        <button type="button" className={styles.navItem} onClick={onPropose} title="Stel een nieuwe werkvorm voor">
          Nieuwe werkvorm
        </button>
      </nav>
      {activeView === "home" && (
        <div className={styles.searchWrap}>
          <input
            className={styles.search}
            type="text"
            placeholder="Zoek werkvormen..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      )}
      <div className={styles.right}>
        <button
          type="button"
          className={styles.themeToggle}
          onClick={onToggleDark}
          title={isDark ? "Overschakelen naar lichte modus" : "Overschakelen naar donkere modus"}
          aria-label="Thema wisselen"
        >
          {isDark ? <SunIcon size={17} /> : <MoonIcon size={17} />}
        </button>
        <button
          type="button"
          className={styles.adminToggle}
          onClick={onSignOut}
          title={`Ingelogd als ${userDisplayName} — klik om uit te loggen`}
        >
          Uitloggen
        </button>
        {activeView === "home" && (
          <button
            type="button"
            className={showFavorites ? `${styles.favBtn} ${styles.favBtnActive}` : styles.favBtn}
            onClick={onToggleFavorites}
            aria-pressed={showFavorites}
            title="Toon alleen je favorieten"
          >
            <HeartIcon size={16} filled={showFavorites} />
            Favorieten
            {favoritesCount > 0 && <span className={styles.favCount}>{favoritesCount}</span>}
          </button>
        )}
        <span className={styles.welcome}>Welkom, {userDisplayName}</span>
      </div>
    </header>
  );
};

export default TopBar;
