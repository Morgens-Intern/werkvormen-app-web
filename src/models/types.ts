export type Categorie = 'Energizer' | 'Divergeren' | 'Convergeren' | 'Besluitvorming' | 'Reflectie' | 'IJsbreker' | 'Liberating Structure' | 'Overig';
export type Fase = 'Start' | 'Analyse' | 'Besluitvorming' | 'Reflectie' | 'Afronding';
export type Setting = 'Online' | 'Hybride' | 'Fysiek';

export interface User {
  username: string;
  firstName: string;
  lastName: string;
  status: 'pending' | 'approved';
  role?: 'user' | 'admin';
}

export interface BouwplanItem {
  id: string;
  startTime: string;
  endTime: string;
  subject: string;
  expectedResult: string;
  werkvormId?: string;
  customAanpak?: string;
  materials: string;
}

export interface Bouwplan {
  id: string;
  title: string;
  goal: string;
  participants: string;
  duration: string;
  items: BouwplanItem[];
  createdBy: string;
  sharedWith: string[];
  createdAt: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  message: string;
  date: number;
  read: boolean;
}

export interface Werkvorm {
  id: string;
  title: string;
  category: Categorie[];
  fase: Fase[];
  goal: string;
  description: string;
  duration: number;
  groupSizeMin: number;
  groupSizeMax: number; // Use 9999 for infinity
  materials: string[];
  steps: string[];
  tips: string[];
  imageUrl?: string;
  extraLink?: string;
  tags: string[];
  settings?: Setting[];
}

export interface Suggestion {
  id: string;
  title: string;
  category: string;
  duration: string;
  goal: string;
  groupSize: string;
  materials: string;
  steps: string;
  submitter: string;
  notes: string;
  date: string;
}

export interface Filters {
  search: string;
  categorie: string[];
  doel: string[];
  fase: string[];
  duur: number | null; // index
  groep: number | null; // index
  materiaal: string[];
}
