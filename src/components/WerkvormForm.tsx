import * as React from "react";
import styles from "./WerkvormForm.module.scss";
import { uploadWerkvormAfbeelding } from "../lib/afbeeldingenApi";
import { Werkvorm, Categorie, Fase, Setting } from "../models/types";

const CATEGORIES: Categorie[] = [
  "Energizer",
  "Divergeren",
  "Convergeren",
  "Besluitvorming",
  "Reflectie",
  "IJsbreker",
  "Liberating Structure",
  "Overig",
];
const FASES: Fase[] = ["Start", "Analyse", "Besluitvorming", "Reflectie", "Afronding"];
const SETTINGS: Setting[] = ["Online", "Hybride", "Fysiek"];

export interface IWerkvormFormProps {
  initial: Werkvorm | null;
  titel: string;
  submitLabel: string;
  /** Melding als het opslaan mislukte. Het formulier blijft dan openstaan. */
  fout?: string | null;
  onSave: (w: Werkvorm) => void;
  onCancel: () => void;
}

function linesToArr(s: string): string[] {
  return s
    .split("\n")
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

const WerkvormForm: React.FC<IWerkvormFormProps> = ({
  initial,
  titel,
  submitLabel,
  fout,
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = React.useState(initial ? initial.title : "");
  const [category, setCategory] = React.useState<string[]>(initial ? initial.category : []);
  const [fase, setFase] = React.useState<string[]>(initial ? initial.fase : []);
  const [settings, setSettings] = React.useState<string[]>(
    initial && initial.settings ? initial.settings : [],
  );
  const [goal, setGoal] = React.useState(initial ? initial.goal : "");
  const [description, setDescription] = React.useState(initial ? initial.description : "");
  const [duration, setDuration] = React.useState(initial ? String(initial.duration) : "");
  const [groupMin, setGroupMin] = React.useState(initial ? String(initial.groupSizeMin) : "");
  const [onbeperkt, setOnbeperkt] = React.useState(initial ? initial.groupSizeMax === 9999 : false);
  const [groupMax, setGroupMax] = React.useState(
    initial && initial.groupSizeMax !== 9999 ? String(initial.groupSizeMax) : "",
  );
  const [materials, setMaterials] = React.useState((initial ? initial.materials : []).join("\n"));
  const [steps, setSteps] = React.useState((initial ? initial.steps : []).join("\n"));
  const [tips, setTips] = React.useState((initial ? initial.tips : []).join("\n"));
  const [tags, setTags] = React.useState((initial ? initial.tags : []).join("\n"));
  const [extraLink, setExtraLink] = React.useState(initial && initial.extraLink ? initial.extraLink : "");
  const [imageUrl, setImageUrl] = React.useState(initial && initial.imageUrl ? initial.imageUrl : "");
  const [error, setError] = React.useState("");

  const [uploadBezig, setUploadBezig] = React.useState(false);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setError("");
    setUploadBezig(true);
    // De afbeelding gaat naar Supabase Storage; in de database komt alleen de
    // URL te staan. Vroeger werd hier een base64 data-URL van gemaakt, en die
    // ging dan mee met élke query op de werkvormen-tabel.
    uploadWerkvormAfbeelding(f)
      .then((url) => setImageUrl(url))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setUploadBezig(false));
  };

  const toggle = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    list: string[],
    val: string,
  ): void => setter(list.indexOf(val) >= 0 ? list.filter((x) => x !== val) : [...list, val]);

  const submit = (): void => {
    if (!title.trim()) {
      setError("Titel is verplicht.");
      return;
    }
    if (category.length === 0) {
      setError("Kies minstens één categorie.");
      return;
    }
    const w: Werkvorm = {
      id: initial ? initial.id : "",
      title: title.trim(),
      category: category as Categorie[],
      fase: fase as Fase[],
      goal: goal.trim(),
      description: description.trim(),
      duration: parseInt(duration, 10) || 0,
      groupSizeMin: parseInt(groupMin, 10) || 0,
      groupSizeMax: onbeperkt ? 9999 : parseInt(groupMax, 10) || 0,
      materials: linesToArr(materials),
      steps: linesToArr(steps),
      tips: linesToArr(tips),
      tags: linesToArr(tags),
      settings: settings.length ? (settings as Setting[]) : undefined,
      extraLink: extraLink.trim() ? extraLink.trim() : undefined,
      imageUrl: imageUrl.trim() ? imageUrl.trim() : undefined,
      // De afbeeldingssleutel hoort niet in het formulier thuis, maar moet wel
      // bewaard blijven — anders raakt een werkvorm bij het bewerken alsnog
      // zijn afbeelding kwijt.
      imageSlug: initial && initial.imageSlug ? initial.imageSlug : undefined,
    };
    onSave(w);
  };

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.head}>
          <h2 className={styles.headTitle}>{titel}</h2>
          <button type="button" className={styles.close} onClick={onCancel} aria-label="Sluiten">
            ×
          </button>
        </div>

        <div className={styles.body}>
          <label className={styles.field}>
            <span>Titel *</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>

          <div className={styles.field}>
            <span>Categorie *</span>
            <div className={styles.checks}>
              {CATEGORIES.map((c) => (
                <label key={c} className={styles.check}>
                  <input type="checkbox" checked={category.indexOf(c) >= 0} onChange={() => toggle(setCategory, category, c)} />
                  {c}
                </label>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <span>Fase</span>
            <div className={styles.checks}>
              {FASES.map((f) => (
                <label key={f} className={styles.check}>
                  <input type="checkbox" checked={fase.indexOf(f) >= 0} onChange={() => toggle(setFase, fase, f)} />
                  {f}
                </label>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <span>Geschikt voor</span>
            <div className={styles.checks}>
              {SETTINGS.map((s) => (
                <label key={s} className={styles.check}>
                  <input type="checkbox" checked={settings.indexOf(s) >= 0} onChange={() => toggle(setSettings, settings, s)} />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <label className={styles.field}>
            <span>Doel</span>
            <textarea value={goal} onChange={(e) => setGoal(e.target.value)} />
          </label>
          <label className={styles.field}>
            <span>Beschrijving</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>

          <div className={styles.row3}>
            <label className={styles.field}>
              <span>Duur (min)</span>
              <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </label>
            <label className={styles.field}>
              <span>Min. deelnemers</span>
              <input type="number" value={groupMin} onChange={(e) => setGroupMin(e.target.value)} />
            </label>
            <label className={styles.field}>
              <span>Max. deelnemers</span>
              <input type="number" value={groupMax} disabled={onbeperkt} onChange={(e) => setGroupMax(e.target.value)} />
              <label className={styles.inlineCheck}>
                <input type="checkbox" checked={onbeperkt} onChange={(e) => setOnbeperkt(e.target.checked)} />
                Onbeperkt
              </label>
            </label>
          </div>

          <label className={styles.field}>
            <span>Stappenplan (één stap per regel)</span>
            <textarea className={styles.tall} value={steps} onChange={(e) => setSteps(e.target.value)} />
          </label>
          <label className={styles.field}>
            <span>Benodigd materiaal (één per regel)</span>
            <textarea value={materials} onChange={(e) => setMaterials(e.target.value)} />
          </label>
          <label className={styles.field}>
            <span>Tips (één per regel)</span>
            <textarea value={tips} onChange={(e) => setTips(e.target.value)} />
          </label>
          <label className={styles.field}>
            <span>Tags (één per regel)</span>
            <textarea value={tags} onChange={(e) => setTags(e.target.value)} />
          </label>
          <label className={styles.field}>
            <span>Meer-informatie-link (optioneel)</span>
            <input value={extraLink} onChange={(e) => setExtraLink(e.target.value)} placeholder="https://..." />
          </label>

          <div className={styles.field}>
            <span>Afbeelding (optioneel)</span>
            {imageUrl && (
              <div className={styles.imgPreviewWrap}>
                <img src={imageUrl} className={styles.imgPreview} alt="Voorbeeld" />
                <button type="button" className={styles.imgRemove} onClick={() => setImageUrl("")}>
                  Verwijderen
                </button>
              </div>
            )}
            <input type="file" accept="image/*" onChange={onFile} disabled={uploadBezig} />
            {uploadBezig && <span className={styles.uploadBezig}>Bezig met uploaden…</span>}
            <input
              value={imageUrl}
              placeholder="of plak een afbeeldings-URL"
              onChange={(e) => setImageUrl(e.target.value)}
            />
            {imageUrl && (
              <button
                type="button"
                className={styles.afbeeldingWeg}
                onClick={() => setImageUrl("")}
                title="Terug naar de standaardafbeelding van deze werkvorm"
              >
                Afbeelding wissen
              </button>
            )}
          </div>

          {error && <p className={styles.error}>{error}</p>}
        </div>

        <div className={styles.footer}>
          {fout && <p className={styles.formFout}>{fout}</p>}
          <button type="button" className={styles.cancel} onClick={onCancel}>
            Annuleren
          </button>
          <button type="button" className={styles.save} onClick={submit}>
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WerkvormForm;
