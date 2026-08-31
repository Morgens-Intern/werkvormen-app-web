import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import { bouwplanTemplateBase64 } from "../data/bouwplanTemplate";
import { IBouwplan } from "../models/bouwplan";

const WORD_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function exportBouwplanToWord(plan: IBouwplan): void {
  const zip = new PizZip(base64ToUint8Array(bouwplanTemplateBase64));
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.render({
    bijeenkomst: plan.bijeenkomst,
    datum: plan.datum,
    locatie: plan.locatie,
    doel: plan.doel,
    deelnemers: plan.deelnemers,
    vw_acties: plan.voorbereidingWorkshop.acties,
    vw_materiaal: plan.voorbereidingWorkshop.materiaal,
    vw_begeleider: plan.voorbereidingWorkshop.begeleider,
    vm_acties: plan.voorbereidingMeenemen.acties,
    vm_materiaal: plan.voorbereidingMeenemen.materiaal,
    vm_begeleider: plan.voorbereidingMeenemen.begeleider,
    vl_acties: plan.voorbereidingLocatie.acties,
    vl_materiaal: plan.voorbereidingLocatie.materiaal,
    vl_begeleider: plan.voorbereidingLocatie.begeleider,
    nl_acties: plan.nazorgLocatie.acties,
    nl_materiaal: plan.nazorgLocatie.materiaal,
    nl_begeleider: plan.nazorgLocatie.begeleider,
    nn_acties: plan.nazorgNa.acties,
    nn_materiaal: plan.nazorgNa.materiaal,
    nn_begeleider: plan.nazorgNa.begeleider,
    agenda: plan.agenda.map((it) => ({
      tijd: [it.startTijd, it.eindTijd].filter((x) => x).join(" - "),
      onderwerp: it.onderwerp,
      resultaat: it.resultaat,
      gedrag: it.gedrag,
      aanpak: it.aanpak,
      materiaal: it.materiaal,
      begeleider: it.begeleider,
    })),
  });

  const blob = doc.getZip().generate({
    type: "blob",
    mimeType: WORD_MIME,
  });

  const naam =
    (plan.bijeenkomst || "Bouwplan").replace(/[^a-z0-9 _-]/gi, "").trim() ||
    "Bouwplan";
  saveAs(blob, `${naam}.docx`);
}
