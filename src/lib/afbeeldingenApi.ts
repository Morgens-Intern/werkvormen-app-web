import { supabase } from "./supabase";

const BUCKET = "werkvormen";

/** Breedte waarop afbeeldingen worden verkleind voordat ze worden geüpload. */
const MAX_BREEDTE = 900;

/**
 * Verkleint een afbeelding en levert een JPEG-blob op.
 *
 * Waarom een blob en geen data-URL: een data-URL is base64 en daarmee ongeveer
 * een derde groter dan het bestand zelf, én hij zou in de database belanden.
 * Een blob gaat rechtstreeks naar Storage; in de database staat alleen de URL.
 */
function verkleinNaarBlob(bestand: File, maxBreedte: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const lezer = new FileReader();
    lezer.onerror = () => reject(new Error("Kon het bestand niet lezen."));
    lezer.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Dit lijkt geen geldige afbeelding."));
      img.onload = () => {
        const schaal = Math.min(1, maxBreedte / img.width);
        const b = Math.round(img.width * schaal);
        const h = Math.round(img.height * schaal);
        const canvas = document.createElement("canvas");
        canvas.width = b;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("De browser kan geen afbeeldingen verwerken."));
          return;
        }
        ctx.drawImage(img, 0, 0, b, h);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Verkleinen mislukt."))),
          "image/jpeg",
          0.82
        );
      };
      img.src = lezer.result as string;
    };
    lezer.readAsDataURL(bestand);
  });
}

function bestandsnaam(): string {
  // Willekeurige naam: voorkomt botsingen tussen gelijknamige uploads en
  // maakt de URL niet te raden op basis van de titel van een werkvorm.
  const willekeurig =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${willekeurig}.jpg`;
}

/**
 * Verkleint de afbeelding, zet hem in Storage en geeft de publieke URL terug.
 * Die URL wordt opgeslagen in de kolom image_url van de werkvorm.
 */
export async function uploadWerkvormAfbeelding(bestand: File): Promise<string> {
  if (!bestand.type.startsWith("image/")) {
    throw new Error("Kies een afbeelding (jpg, png, webp of gif).");
  }

  const blob = await verkleinNaarBlob(bestand, MAX_BREEDTE);
  const pad = bestandsnaam();

  const { error } = await supabase.storage.from(BUCKET).upload(pad, blob, {
    contentType: "image/jpeg",
    cacheControl: "31536000", // een jaar; de naam is uniek dus de inhoud wijzigt nooit
    upsert: false,
  });
  if (error) throw new Error(`Uploaden mislukt: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(pad);
  return data.publicUrl;
}
