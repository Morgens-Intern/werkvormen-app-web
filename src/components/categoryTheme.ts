import { Categorie } from "../models/types";

export interface ICategoryTheme {
  color: string;
  colorDark: string;
  icon: string;
}

const THEMES: Record<Categorie, ICategoryTheme> = {
  Energizer: { color: "#f59e0b", colorDark: "#b45309", icon: "⚡" },
  Divergeren: { color: "#8b5cf6", colorDark: "#6d28d9", icon: "💡" },
  Convergeren: { color: "#10b981", colorDark: "#047857", icon: "🎯" },
  Besluitvorming: { color: "#3b82f6", colorDark: "#1d4ed8", icon: "🗳️" },
  Reflectie: { color: "#ec4899", colorDark: "#be185d", icon: "🔍" },
  IJsbreker: { color: "#06b6d4", colorDark: "#0e7490", icon: "🧊" },
  "Liberating Structure": { color: "#6366f1", colorDark: "#4338ca", icon: "🔓" },
  Overig: { color: "#64748b", colorDark: "#475569", icon: "📌" },
};

export function getCategoryTheme(categorie?: Categorie): ICategoryTheme {
  if (categorie && THEMES[categorie]) {
    return THEMES[categorie];
  }
  return THEMES.Overig;
}
