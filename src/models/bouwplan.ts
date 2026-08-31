// Datamodel voor een bouwplan, afgeleid van de Morgens-bouwplantemplate.

export interface IPrepRow {
  acties: string;
  materiaal: string;
  begeleider: string;
}

export interface IAgendaItem {
  id: string;
  startTijd: string;
  eindTijd: string;
  onderwerp: string;
  resultaat: string; // Wat moet dit punt opleveren?
  gedrag: string; // Welk gedrag wordt van de deelnemers verwacht?
  werkvormId: string; // gekoppelde werkvorm (optioneel)
  aanpak: string;
  materiaal: string;
  begeleider: string;
}

export interface IBouwplan {
  id: string;
  bijeenkomst: string;
  datum: string;
  locatie: string;
  doel: string;
  deelnemers: string;
  voorbereidingWorkshop: IPrepRow;
  voorbereidingMeenemen: IPrepRow;
  voorbereidingLocatie: IPrepRow;
  agenda: IAgendaItem[];
  nazorgLocatie: IPrepRow;
  nazorgNa: IPrepRow;
  updatedAt: number;
}

export type PrepSection =
  | "voorbereidingWorkshop"
  | "voorbereidingMeenemen"
  | "voorbereidingLocatie"
  | "nazorgLocatie"
  | "nazorgNa";

function id(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function emptyPrepRow(): IPrepRow {
  return { acties: "", materiaal: "", begeleider: "" };
}

export function emptyAgendaItem(): IAgendaItem {
  return {
    id: id(),
    startTijd: "",
    eindTijd: "",
    onderwerp: "",
    resultaat: "",
    gedrag: "",
    werkvormId: "",
    aanpak: "",
    materiaal: "",
    begeleider: "",
  };
}

export function emptyBouwplan(): IBouwplan {
  return {
    id: id(),
    bijeenkomst: "",
    datum: "",
    locatie: "",
    doel: "",
    deelnemers: "",
    voorbereidingWorkshop: emptyPrepRow(),
    voorbereidingMeenemen: emptyPrepRow(),
    voorbereidingLocatie: emptyPrepRow(),
    agenda: [emptyAgendaItem()],
    nazorgLocatie: emptyPrepRow(),
    nazorgNa: emptyPrepRow(),
    updatedAt: Date.now(),
  };
}
