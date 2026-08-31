import { Werkvorm } from "./types";

// Een voorstel voor een nieuwe werkvorm, ingediend door een gebruiker en
// wachtend op beoordeling door een beheerder.
export interface ISuggestion {
  id: string;
  submitter: string;
  date: number;
  werkvorm: Werkvorm;
}
