import { supabase } from "./supabase";

// Vaste set emoji's, zoals de snelle reacties in Slack of Teams. Bewust een
// korte lijst: bij een vrije emojikiezer wordt het een zootje en kun je niet
// meer in één oogopslag zien wat een bericht doet.
export const EMOJIS = ["👍", "🎉", "💡", "❤️", "🙌"] as const;

export type BerichtType = "Ervaring" | "Tip" | "Bouwplan";

export interface EmojiTelling {
  emoji: string;
  aantal: number;
  /** Of de ingelogde gebruiker deze emoji zelf heeft gegeven. */
  ikOok: boolean;
}

export interface Reactie {
  id: string;
  parentId: string | null;
  auteurId: string;
  auteurNaam: string;
  body: string;
  createdAt: string;
  emojis: EmojiTelling[];
  antwoorden: Reactie[];
}

export interface Bericht {
  id: string;
  auteurId: string;
  auteurNaam: string;
  type: BerichtType;
  title: string;
  body: string;
  werkvormIds: string[];
  createdAt: string;
  emojis: EmojiTelling[];
  reacties: Reactie[];
  aantalReacties: number;
}

interface ProfielMini {
  display_name: string | null;
  email: string;
}

function naam(p: ProfielMini | null): string {
  return p?.display_name || p?.email || "Onbekend";
}

interface ReactieRij {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_id: string;
  body: string;
  created_at: string;
  author: ProfielMini | null;
}

interface EmojiRij {
  post_id: string | null;
  comment_id: string | null;
  user_id: string;
  emoji: string;
}

interface BerichtRij {
  id: string;
  author_id: string;
  type: BerichtType;
  title: string;
  body: string;
  werkvorm_ids: string[];
  created_at: string;
  author: ProfielMini | null;
}

/** Telt emoji's per doel en markeert wat de ingelogde gebruiker zelf gaf. */
function telEmojis(rijen: EmojiRij[], userId: string): EmojiTelling[] {
  const perEmoji = new Map<string, { aantal: number; ikOok: boolean }>();
  rijen.forEach((r) => {
    const huidig = perEmoji.get(r.emoji) || { aantal: 0, ikOok: false };
    perEmoji.set(r.emoji, {
      aantal: huidig.aantal + 1,
      ikOok: huidig.ikOok || r.user_id === userId,
    });
  });
  // Vaste volgorde aanhouden, zodat de knoppen niet verspringen bij elke klik.
  return EMOJIS.filter((e) => perEmoji.has(e)).map((e) => ({
    emoji: e,
    aantal: perEmoji.get(e)!.aantal,
    ikOok: perEmoji.get(e)!.ikOok,
  }));
}

/** Zet een platte lijst reacties om in een boom via parent_id. */
function bouwThread(rijen: ReactieRij[], emojisPerComment: Map<string, EmojiRij[]>, userId: string): Reactie[] {
  const perId = new Map<string, Reactie>();
  rijen.forEach((r) => {
    perId.set(r.id, {
      id: r.id,
      parentId: r.parent_id,
      auteurId: r.author_id,
      auteurNaam: naam(r.author),
      body: r.body,
      createdAt: r.created_at,
      emojis: telEmojis(emojisPerComment.get(r.id) || [], userId),
      antwoorden: [],
    });
  });

  const wortels: Reactie[] = [];
  perId.forEach((reactie) => {
    if (reactie.parentId && perId.has(reactie.parentId)) {
      perId.get(reactie.parentId)!.antwoorden.push(reactie);
    } else {
      // Ook een reactie waarvan het bovenliggende bericht is verwijderd komt
      // hier terecht, in plaats van onzichtbaar te verdwijnen.
      wortels.push(reactie);
    }
  });
  return wortels;
}

/**
 * Haalt de hele feed op: berichten, reacties en emoji's.
 *
 * Drie queries in plaats van één per bericht. Bij dit volume (enkele tientallen
 * berichten) is dat ruim snel genoeg, en het voorkomt tientallen losse
 * verzoeken zodra de feed groeit.
 */
export async function haalFeed(userId: string): Promise<Bericht[]> {
  const { data: berichtRijen, error: fout1 } = await supabase
    .from("posts")
    .select("id, author_id, type, title, body, werkvorm_ids, created_at, author:profiles(display_name, email)")
    .order("created_at", { ascending: false });
  if (fout1) throw new Error(`Kon de berichten niet ophalen: ${fout1.message}`);

  const berichten = berichtRijen as unknown as BerichtRij[];
  if (berichten.length === 0) return [];

  const ids = berichten.map((b) => b.id);

  const { data: reactieRijen, error: fout2 } = await supabase
    .from("post_comments")
    .select("id, post_id, parent_id, author_id, body, created_at, author:profiles(display_name, email)")
    .in("post_id", ids)
    .order("created_at", { ascending: true });
  if (fout2) throw new Error(`Kon de reacties niet ophalen: ${fout2.message}`);
  const reacties = (reactieRijen || []) as unknown as ReactieRij[];

  const commentIds = reacties.map((r) => r.id);
  let emojiRijen: EmojiRij[] = [];
  {
    // Emoji's hangen aan een bericht óf aan een reactie; beide in één query.
    const filter = commentIds.length
      ? `post_id.in.(${ids.join(",")}),comment_id.in.(${commentIds.join(",")})`
      : `post_id.in.(${ids.join(",")})`;
    const { data, error } = await supabase
      .from("post_reactions")
      .select("post_id, comment_id, user_id, emoji")
      .or(filter);
    if (error) throw new Error(`Kon de emoji-reacties niet ophalen: ${error.message}`);
    emojiRijen = (data || []) as EmojiRij[];
  }

  const emojisPerPost = new Map<string, EmojiRij[]>();
  const emojisPerComment = new Map<string, EmojiRij[]>();
  emojiRijen.forEach((e) => {
    const kaart = e.post_id ? emojisPerPost : emojisPerComment;
    const key = (e.post_id || e.comment_id) as string;
    kaart.set(key, [...(kaart.get(key) || []), e]);
  });

  const reactiesPerPost = new Map<string, ReactieRij[]>();
  reacties.forEach((r) => {
    reactiesPerPost.set(r.post_id, [...(reactiesPerPost.get(r.post_id) || []), r]);
  });

  return berichten.map((b) => {
    const eigen = reactiesPerPost.get(b.id) || [];
    return {
      id: b.id,
      auteurId: b.author_id,
      auteurNaam: naam(b.author),
      type: b.type,
      title: b.title,
      body: b.body || "",
      werkvormIds: b.werkvorm_ids || [],
      createdAt: b.created_at,
      emojis: telEmojis(emojisPerPost.get(b.id) || [], userId),
      reacties: bouwThread(eigen, emojisPerComment, userId),
      aantalReacties: eigen.length,
    };
  });
}

export async function plaatsBericht(
  userId: string,
  velden: { type: BerichtType; title: string; body: string; werkvormIds: string[] }
): Promise<void> {
  const { error } = await supabase.from("posts").insert({
    author_id: userId,
    type: velden.type,
    title: velden.title,
    body: velden.body,
    werkvorm_ids: velden.werkvormIds,
  });
  if (error) throw new Error(`Kon het bericht niet plaatsen: ${error.message}`);
}

export async function verwijderBericht(id: string): Promise<void> {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw new Error(`Kon het bericht niet verwijderen: ${error.message}`);
}

export async function plaatsReactie(
  userId: string,
  postId: string,
  body: string,
  parentId: string | null
): Promise<void> {
  const { error } = await supabase
    .from("post_comments")
    .insert({ post_id: postId, parent_id: parentId, author_id: userId, body });
  if (error) throw new Error(`Kon de reactie niet plaatsen: ${error.message}`);
}

export async function verwijderReactie(id: string): Promise<void> {
  const { error } = await supabase.from("post_comments").delete().eq("id", id);
  if (error) throw new Error(`Kon de reactie niet verwijderen: ${error.message}`);
}

/**
 * Emoji aan- of uitzetten. Er wordt nooit een teller bijgewerkt, alleen een
 * regel toegevoegd of verwijderd — dus een telling kan niet scheef raken.
 */
export async function wisselEmoji(
  userId: string,
  doel: { postId?: string; commentId?: string },
  emoji: string,
  staatAan: boolean
): Promise<void> {
  if (staatAan) {
    let query = supabase.from("post_reactions").delete().eq("user_id", userId).eq("emoji", emoji);
    query = doel.postId ? query.eq("post_id", doel.postId) : query.eq("comment_id", doel.commentId!);
    const { error } = await query;
    if (error) throw new Error(`Kon de reactie niet terugnemen: ${error.message}`);
    return;
  }
  const { error } = await supabase.from("post_reactions").insert({
    user_id: userId,
    emoji,
    post_id: doel.postId || null,
    comment_id: doel.commentId || null,
  });
  if (error) throw new Error(`Kon de reactie niet plaatsen: ${error.message}`);
}
