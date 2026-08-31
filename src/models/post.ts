// Datamodel voor de inspiratiesectie: ervaringen, tips en gedeelde bouwplannen.

export type PostType = "Ervaring" | "Tip" | "Bouwplan";

export interface IPost {
  id: string;
  type: PostType;
  title: string;
  body: string;
  author: string;
  date: number;
  werkvormIds: string[]; // gekoppelde werkvormen
  bouwplanId?: string; // gekoppeld bouwplan (indien type Bouwplan)
  bouwplanTitel?: string;
  likes: number;
  likedByMe: boolean;
}
