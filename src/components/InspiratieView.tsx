import * as React from "react";
import styles from "./InspiratieView.module.scss";
import { IPost, PostType } from "../models/post";
import { Werkvorm } from "../models/types";
import { IBouwplan } from "../models/bouwplan";
import { HeartIcon } from "./icons";

const POSTS_KEY = "mw_posts_v1";
const PLANS_KEY = "mw_bouwplannen";
const TYPES: PostType[] = ["Ervaring", "Tip", "Bouwplan"];

function loadPosts(): IPost[] {
  try {
    const raw = localStorage.getItem(POSTS_KEY);
    return raw ? (JSON.parse(raw) as IPost[]) : [];
  } catch {
    return [];
  }
}
function savePosts(list: IPost[]): void {
  try {
    localStorage.setItem(POSTS_KEY, JSON.stringify(list));
  } catch {
    /* negeren */
  }
}
function loadPlans(): IBouwplan[] {
  try {
    const raw = localStorage.getItem(PLANS_KEY);
    return raw ? (JSON.parse(raw) as IBouwplan[]) : [];
  } catch {
    return [];
  }
}
function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export interface IInspiratieViewProps {
  userDisplayName: string;
  werkvormen: Werkvorm[];
  onShowWerkvorm: (w: Werkvorm) => void;
}

const InspiratieView: React.FC<IInspiratieViewProps> = ({
  userDisplayName,
  werkvormen,
  onShowWerkvorm,
}) => {
  const [posts, setPosts] = React.useState<IPost[]>(loadPosts);
  const [filter, setFilter] = React.useState<string>("");
  const [writing, setWriting] = React.useState(false);

  const [type, setType] = React.useState<PostType>("Ervaring");
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [linkedWv, setLinkedWv] = React.useState<string[]>([]);
  const [linkedPlan, setLinkedPlan] = React.useState("");
  const [error, setError] = React.useState("");

  const plans = React.useMemo(loadPlans, [writing]);

  const persist = (list: IPost[]): void => {
    setPosts(list);
    savePosts(list);
  };

  const resetForm = (): void => {
    setType("Ervaring");
    setTitle("");
    setBody("");
    setLinkedWv([]);
    setLinkedPlan("");
    setError("");
  };

  const submit = (): void => {
    if (!title.trim() || !body.trim()) {
      setError("Vul een titel en een bericht in.");
      return;
    }
    const plan = plans.filter((p) => p.id === linkedPlan)[0];
    const post: IPost = {
      id: "p-" + Math.random().toString(36).slice(2, 9),
      type,
      title: title.trim(),
      body: body.trim(),
      author: userDisplayName || "Onbekend",
      date: Date.now(),
      werkvormIds: linkedWv,
      bouwplanId: linkedPlan || undefined,
      bouwplanTitel: plan ? plan.bijeenkomst || "(zonder titel)" : undefined,
      likes: 0,
      likedByMe: false,
    };
    persist([post, ...posts]);
    resetForm();
    setWriting(false);
  };

  const toggleLike = (id: string): void =>
    persist(
      posts.map((p) =>
        p.id === id
          ? { ...p, likedByMe: !p.likedByMe, likes: p.likes + (p.likedByMe ? -1 : 1) }
          : p,
      ),
    );

  const remove = (id: string): void => {
    if (window.confirm("Dit bericht verwijderen?")) {
      persist(posts.filter((p) => p.id !== id));
    }
  };

  const toggleWv = (id: string): void =>
    setLinkedWv((prev) => (prev.indexOf(id) >= 0 ? prev.filter((x) => x !== id) : [...prev, id]));

  const shown = filter ? posts.filter((p) => p.type === filter) : posts;

  return (
    <div className={styles.inspiratie}>
      <div className={styles.headRow}>
        <div>
          <h2 className={styles.title}>Inspiratie</h2>
          <p className={styles.sub}>
            Deel je ervaringen, tips en bouwplannen met collega&#39;s.
          </p>
        </div>
        <button type="button" className={styles.newBtn} onClick={() => setWriting(true)}>
          + Bericht schrijven
        </button>
      </div>

      <div className={styles.filters}>
        <button
          type="button"
          className={filter === "" ? `${styles.filterChip} ${styles.filterActive}` : styles.filterChip}
          onClick={() => setFilter("")}
        >
          Alles ({posts.length})
        </button>
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            className={filter === t ? `${styles.filterChip} ${styles.filterActive}` : styles.filterChip}
            onClick={() => setFilter(t)}
          >
            {t} ({posts.filter((p) => p.type === t).length})
          </button>
        ))}
      </div>

      {writing && (
        <div className={styles.editor}>
          <div className={styles.editorRow}>
            <label className={styles.field}>
              <span>Type bericht</span>
              <select value={type} onChange={(e) => setType(e.target.value as PostType)}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className={`${styles.field} ${styles.grow}`}>
              <span>Titel</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Waar gaat het over?" />
            </label>
          </div>

          <label className={styles.field}>
            <span>Je verhaal</span>
            <textarea
              className={styles.bodyInput}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Wat heb je gedaan, wat werkte goed, wat zou je een volgende keer anders doen?"
            />
          </label>

          {plans.length > 0 && (
            <label className={styles.field}>
              <span>Bouwplan koppelen (optioneel)</span>
              <select value={linkedPlan} onChange={(e) => setLinkedPlan(e.target.value)}>
                <option value="">Geen bouwplan</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.bijeenkomst || "(zonder titel)"}</option>
                ))}
              </select>
            </label>
          )}

          <div className={styles.field}>
            <span>Werkvormen koppelen (optioneel)</span>
            <div className={styles.wvPicker}>
              {werkvormen.slice(0, 60).map((w) => (
                <button
                  key={w.id}
                  type="button"
                  className={linkedWv.indexOf(w.id) >= 0 ? `${styles.wvChip} ${styles.wvChipOn}` : styles.wvChip}
                  onClick={() => toggleWv(w.id)}
                >
                  {w.title}
                </button>
              ))}
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.editorActions}>
            <button type="button" className={styles.cancel} onClick={() => { resetForm(); setWriting(false); }}>
              Annuleren
            </button>
            <button type="button" className={styles.publish} onClick={submit}>
              Plaatsen
            </button>
          </div>
        </div>
      )}

      {shown.length === 0 ? (
        <p className={styles.empty}>
          Nog geen berichten. Schrijf het eerste bericht en deel je ervaring met collega&#39;s.
        </p>
      ) : (
        <div className={styles.list}>
          {shown.map((p) => (
            <article key={p.id} className={styles.post}>
              <div className={styles.postHead}>
                <span className={styles.typeTag}>{p.type}</span>
                <h3 className={styles.postTitle}>{p.title}</h3>
              </div>
              <p className={styles.meta}>
                {p.author} · {fmtDate(p.date)}
              </p>
              <p className={styles.body}>{p.body}</p>

              {p.bouwplanTitel && (
                <p className={styles.linkedPlan}>📋 Bouwplan: {p.bouwplanTitel}</p>
              )}

              {p.werkvormIds.length > 0 && (
                <div className={styles.linkedWv}>
                  {p.werkvormIds.map((id) => {
                    const w = werkvormen.filter((x) => x.id === id)[0];
                    if (!w) return null;
                    return (
                      <button key={id} type="button" className={styles.wvLink} onClick={() => onShowWerkvorm(w)}>
                        {w.title}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className={styles.postFooter}>
                <button
                  type="button"
                  className={p.likedByMe ? `${styles.likeBtn} ${styles.likeOn}` : styles.likeBtn}
                  onClick={() => toggleLike(p.id)}
                >
                  <HeartIcon size={15} filled={p.likedByMe} />
                  {p.likes > 0 ? p.likes : ""} Nuttig
                </button>
                <button type="button" className={styles.delBtn} onClick={() => remove(p.id)}>
                  Verwijderen
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default InspiratieView;
