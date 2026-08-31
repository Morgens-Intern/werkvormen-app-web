import * as React from "react";
import { Categorie } from "../models/types";

export interface ICategoryVisualProps {
  categorie?: Categorie;
  className?: string;
}

const W = "#ffffff";

function renderMotif(categorie?: Categorie): React.ReactElement {
  switch (categorie) {
    case "Energizer":
      return (
        <polygon
          points="112,24 82,66 100,66 90,96 122,52 104,52"
          fill={W}
        />
      );
    case "Divergeren":
      return (
        <g fill="none" stroke={W} strokeWidth="6" strokeLinecap="round">
          <circle cx="100" cy="50" r="20" />
          <rect x="92" y="70" width="16" height="9" rx="2" fill={W} stroke="none" />
          <line x1="100" y1="16" x2="100" y2="8" />
          <line x1="68" y1="50" x2="60" y2="50" />
          <line x1="132" y1="50" x2="140" y2="50" />
          <line x1="77" y1="27" x2="71" y2="21" />
          <line x1="123" y1="27" x2="129" y2="21" />
        </g>
      );
    case "Convergeren":
      return (
        <g fill="none" stroke={W} strokeWidth="6">
          <circle cx="100" cy="56" r="30" />
          <circle cx="100" cy="56" r="16" />
          <circle cx="100" cy="56" r="4" fill={W} stroke="none" />
        </g>
      );
    case "Besluitvorming":
      return (
        <g fill="none" stroke={W} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="100" cy="56" r="30" />
          <polyline points="86,57 96,68 116,43" strokeWidth="7" />
        </g>
      );
    case "Reflectie":
      return (
        <g fill="none" stroke={W} strokeWidth="6" strokeLinecap="round">
          <circle cx="92" cy="48" r="22" />
          <line x1="108" y1="64" x2="126" y2="82" strokeWidth="8" />
        </g>
      );
    case "IJsbreker":
      return (
        <g fill="none" stroke={W} strokeWidth="6" strokeLinecap="round">
          <line x1="100" y1="26" x2="100" y2="86" />
          <line x1="74" y1="41" x2="126" y2="71" />
          <line x1="126" y1="41" x2="74" y2="71" />
          <line x1="100" y1="26" x2="94" y2="34" />
          <line x1="100" y1="26" x2="106" y2="34" />
          <line x1="100" y1="86" x2="94" y2="78" />
          <line x1="100" y1="86" x2="106" y2="78" />
        </g>
      );
    case "Liberating Structure":
      return (
        <g stroke={W} strokeWidth="6" fill="none" strokeLinecap="round">
          <rect x="78" y="52" width="44" height="34" rx="7" fill={W} stroke="none" />
          <circle cx="100" cy="66" r="4" fill="rgba(0,0,0,0.25)" stroke="none" />
          <path d="M84 52 V40 A16 16 0 0 1 116 40 V47" />
        </g>
      );
    default:
      return (
        <g fill={W}>
          <path d="M100 28 a20 20 0 0 1 20 20 c0 15 -20 34 -20 34 c0 0 -20 -19 -20 -34 a20 20 0 0 1 20 -20 z" />
          <circle cx="100" cy="48" r="7" fill="rgba(0,0,0,0.22)" />
        </g>
      );
  }
}

const CategoryVisual: React.FC<ICategoryVisualProps> = ({
  categorie,
  className,
}) => {
  return (
    <svg
      className={className}
      viewBox="0 0 200 120"
      preserveAspectRatio="xMidYMid slice"
      role="presentation"
      aria-hidden="true"
    >
      <circle cx="28" cy="98" r="42" fill="rgba(255,255,255,0.10)" />
      <circle cx="178" cy="18" r="30" fill="rgba(255,255,255,0.10)" />
      {renderMotif(categorie)}
    </svg>
  );
};

export default CategoryVisual;
