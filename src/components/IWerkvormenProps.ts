export interface IWerkvormenProps {
  /** Naam van de ingelogde gebruiker, uit het profiel in Supabase. */
  userDisplayName: string;
  /** Komt uit de kolom 'rol' in de profiles-tabel, niet uit een wachtwoord. */
  isAdmin: boolean;
  onSignOut: () => void;
  isDark: boolean;
  onToggleDark: () => void;
}
