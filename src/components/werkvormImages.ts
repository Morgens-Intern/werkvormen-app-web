// Automatische koppeling van afbeeldingen aan werkvormen.
//
// Zet een afbeelding in de map ../assets/werkvormen met als bestandsnaam de titel
// van de werkvorm (bijv. "TRIZ.jpg" of "1-2-4-all.png"). De afbeelding verschijnt
// dan automatisch op de bijbehorende kaart en detailpagina. Is er (nog) geen
// afbeelding, dan valt de app terug op de categorie-illustratie.

export function slugify(name: string): string {
  return name
    .replace(/³/g, "3") // superscript 3 (W³) -> 3
    .replace(/[éèêë]/gi, "e")
    .replace(/[àáâä]/gi, "a")
    .replace(/[ïíî]/gi, "i")
    .replace(/[öóô]/gi, "o")
    .replace(/[üúû]/gi, "u")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const modules = import.meta.glob(
  "../assets/werkvormen/*.{png,jpg,jpeg,webp,gif,svg}",
  { eager: true }
) as Record<string, { default: string }>;

const imageMap: Record<string, string> = {};

Object.keys(modules).forEach((path) => {
  const file = path.split("/").pop() || "";
  const base = file.replace(/\.[^.]+$/, "");
  imageMap[slugify(base)] = modules[path].default;
});

export function getWerkvormImage(title: string): string | undefined {
  return imageMap[slugify(title)];
}
