// -*- coding: utf-8 -*-
/**
 * Vivaya — pages/profile/more.tsx
 * Encodage: UTF-8
 *
 * Objet:
 *   Profil enrichi (centres d’intérêt). Lecture/écriture table `profile_preferences`.
 *
 * Règles Vivaya:
 *   - Code robuste, simple, logique, facile à maintenir. Commentaires conservés.
 *   - 100% UTF-8, pas d’usine à gaz, pas de gadgets.
 *   - Zéro bug toléré côté UX: champs stables, focus respecté, limites respectées.
 *
 * Historique patchs:
 *   - 2025-10-01: Nettoyage des tableaux (trim/dédoublonnage) + clés stables.
 *   - 2025-10-02 (DB): Backfill + trigger de nettoyage + RLS écriture payants-only.
 *   - 2025-10-02 (UI): FIX "Autre à préciser" — inputs désormais NON-CONTROLÉS pour
 *     empêcher la perte de focus à chaque frappe (bug « une seule lettre »).
 *     Implémentation: useRef + defaultValue + sync onBlur + secours au save().
 *   - 2025-10-30: FIX clé ALLOWED pour les vacances — `ALLOWED.vacations` -> `ALLOWED.vacation_styles` (2 occurrences).
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { supabase } from "../../lib/supabaseClient";

/* ---------------------------- Utils clés uniques ------------------------- */
// Petit utilitaire UTF-8, sans dépendances externes
const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // supprime accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/* ---------------------------- Options par bloc --------------------------- */
const HOBBIES = [
  "Cuisine","Jardinage","Jeux vidéo","Photographie","Musique","Écriture","Bricolage",
  "Regarder des films","Télévision","Jouer de la musique","Recevoir des amis","Sport",
  "Concert","Peinture et Dessin","Lecture","Couture","Sculpture","Voyage","Danse"
];

const SPORTS = [
  "Course à pied","Randonnées","Natation","Patinage","Ping-Pong","Roller","Volley-Ball",
  "Danse Acrobatique","Ski","Plongée","VTT","Musculation","Parapente","Cyclisme","JJB",
  "Grappling","Arts Martiaux","Tennis","Équitation","Salle de Sport","Football","Basket"
];

const CREATIVE = [
  "Bois","Métal","Vidéo sur réseaux","Musique","Électronique","Peinture","Sculpture",
  "Chansons","Botanique","Textile","Bijoux","Upcycling","Cuisine","Art Déco","Écriture"
];

const OUTINGS = [
  "Cinéma","Concerts","Promenades","Karaoké","Danse","Bars","Restaurants","Musées",
  "Soirées entre amis","Pêche","Faire du sport","Virées en moto","Escapade du week-end",
  "Parcs d'attractions","Expositions","Patinoire","Bowling","Shopping","Événements sportifs"
];

const AT_HOME = [
  "Lire","Films / séries","Sport","Ménage","Faire des DIY","Réseaux sociaux","S'occuper de ses animaux",
  "Télétravail","Jeux vidéo","Cuisiner","Musique","Méditation","Bricolage","Streaming"
];

const MOVIES = [
  "Horreur","Thriller","Animés","Drame","Action","Science-fiction","Fantastique",
  "Comédie","Documentaire","Aventure","Animation","Courts métrages"
];

const BOOKS = [
  "Romans","Polars / thrillers","SF","Fantastique","Fantasy","Essais","Développement perso",
  "Manga","BD","Biographies","Non-fiction","Magazines"
];

const VACATIONS = [
  "Camping","Ville","Plage","Randonnées","Routard","Sport d’hiver","Campagne",
  "Plongée","Croisière","Club","Culinaire","Thalasso","Culturelle","Montagne",
  "Mer","Sportive","Chez la Famille","Exotisme","France"
];

/* ------------------------- Limites par section (max) --------------------- */
const LIMITS = {
  hobbies: 5,
  sports: 4,
  creative_activities: 3,
  favorite_outings: 3,
  at_home_activities: 4,
  movie_genres: 2,
  book_genres: 3,
  vacation_styles: 3,
} as const;

/* --------------------------------- Allowlist ----------------------------- */
type PrefsRow = {
  user_id: string;
  hobbies: string[]; hobbies_other: string | null;
  sports: string[]; sports_other: string | null;
  creative_activities: string[]; creative_activities_other: string | null;
  favorite_outings: string[]; favorite_outings_other: string | null;
  at_home_activities: string[]; at_home_activities_other: string | null;
  movie_genres: string[]; movie_genres_other: string | null;
  book_genres: string[]; book_genres_other: string | null;
  vacation_styles: string[]; vacation_styles_other: string | null;
};
const ALLOWED: Partial<Record<keyof PrefsRow, string[]>> = {
  hobbies: HOBBIES,
  sports: SPORTS,
  creative_activities: CREATIVE,
  favorite_outings: OUTINGS,
  at_home_activities: AT_HOME,
  movie_genres: MOVIES,
  book_genres: BOOKS,
  vacation_styles: VACATIONS,
};

/* ------------------------- Vérification d’abonnement --------------------- */
/** Source unique: RPC `get_my_effective_plan_vivaya` */
async function fetchIsPremium(_userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("get_my_effective_plan_vivaya");
    if (error) {
      console.warn("[profile/more] get_my_effective_plan_vivaya error:", error.message);
      return false;
    }
    const plan = String(data ?? "free").toLowerCase();
    return plan === "premium" || plan === "elite";
  } catch (e: any) {
    console.warn("[profile/more] fetchIsPremium exception:", e?.message ?? e);
    return false;
  }
}

/* -------------------------------- Utils ---------------------------------- */
const nonEmpty = (s?: string | null) => !!(s && s.trim() !== "");
function cleanArray(input: unknown, allowed?: string[]): string[] {
  const arr = Array.isArray(input) ? input : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of arr) {
    const s = (raw ?? "").toString().trim();
    if (!s) continue;
    if (allowed && !allowed.includes(s)) continue; // filtre valeurs historiques non reconnues
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}
function nextArrayWithToggle(current: string[], v: string, max?: number): string[] {
  const has = current.includes(v);
  if (has) return current.filter(x => x !== v);
  if (typeof max === "number" && max > 0 && current.length >= max) return current; // refuse si plein
  return [...current, v];
}

/* -------------------------------- Page ----------------------------------- */
export default function ProfileMore() {
  const { session, isLoading } = useSessionContext();
  const userId = useMemo(() => session?.user?.id ?? null, [session]);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [data, setData] = useState<PrefsRow | null>(null);

  // [FIX FOCUS] Buffer non-contrôlé pour les champs "Autre à préciser"
  // Clé = nom du champ *_other ; Valeur = saisie courante
  const othersRef = useRef<Record<string, string>>({});

  // Fix "scroll qui remonte": on mémorise le scroll avant setState
  const lastScrollY = useRef<number>(0);
  const preserveScroll = () => {
    lastScrollY.current = window.scrollY;
    requestAnimationFrame(() => window.scrollTo(0, lastScrollY.current));
  };

  useEffect(() => {
    if (isLoading || !userId) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      setErrorMsg(null);

      const premium = await fetchIsPremium(userId);
      if (!mounted) return;
      setIsPremium(premium);

      const { data: row, error } = await supabase
        .from("profile_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (!mounted) return;
      if (error) {
        console.error("[profile/more] select error:", error);
        setErrorMsg("Impossible de charger vos préférences pour le moment.");
      }

      const blank: PrefsRow = {
        user_id: userId,
        hobbies: [], hobbies_other: null,
        sports: [], sports_other: null,
        creative_activities: [], creative_activities_other: null,
        favorite_outings: [], favorite_outings_other: null,
        at_home_activities: [], at_home_activities_other: null,
        movie_genres: [], movie_genres_other: null,
        book_genres: [], book_genres_other: null,
        vacation_styles: [], vacation_styles_other: null,
      };

      // Nettoyage anti “valeurs fantômes”
      const merged = row ? { ...blank, ...row } : blank;
      const cleaned: PrefsRow = {
        ...merged,
        hobbies: cleanArray(merged.hobbies, ALLOWED.hobbies),
        sports: cleanArray(merged.sports, ALLOWED.sports),
        creative_activities: cleanArray(merged.creative_activities, ALLOWED.creative_activities),
        favorite_outings: cleanArray(merged.favorite_outings, ALLOWED.favorite_outings),
        at_home_activities: cleanArray(merged.at_home_activities, ALLOWED.at_home_activities),
        movie_genres: cleanArray(merged.movie_genres, ALLOWED.movie_genres),
        book_genres: cleanArray(merged.book_genres, ALLOWED.book_genres),
        vacation_styles: cleanArray(merged.vacation_styles, ALLOWED.vacation_styles),
      };

      setData(cleaned);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [isLoading, userId]);

  // Redirection silencieuse des FREE (comportement inchangé)
  useEffect(() => {
    if (!isLoading && !loading && userId && !isPremium) {
      router.replace("/profile");
    }
  }, [isLoading, loading, userId, isPremium, router]);

  // Handlers
  const setArray = (field: keyof PrefsRow, v: string) => {
    if (!data) return;
    const currentRaw = (data[field] as unknown as string[]) ?? [];
    const allowed = ALLOWED[field as keyof PrefsRow];
    const current = cleanArray(currentRaw, allowed);
    const max = (LIMITS as any)[field] as number | undefined;
    const next = nextArrayWithToggle(current, v, max);
    if (next === current) {
      setErrorMsg(`Limite atteinte pour cette section (${current.length}/${max}).`);
      setTimeout(() => setErrorMsg(null), 1200);
      return;
    }
    preserveScroll();
    setData({ ...data, [field]: next as any });
  };

  // ⚠️ Ne pas utiliser preserveScroll ici (casserait le focus)
  // Appelée UNIQUEMENT au blur pour synchroniser l'état "other_*"
  const setOther = (field: keyof PrefsRow, v: string) => {
    setData(prev => (prev ? ({ ...prev, [field]: v } as PrefsRow) : prev));
  };

  const save = async () => {
    if (!data || !userId) return;
    setSaving(true);
    setErrorMsg(null);

    // Helper: récupère la dernière valeur "other" depuis le ref (si pas de blur), sinon depuis l'état
    const getOther = (k: keyof PrefsRow) => {
      const key = k as string;
      const raw = othersRef.current[key] ?? (data as any)?.[key] ?? "";
      const val = typeof raw === "string" ? raw.trim() : "";
      return val || null;
    };

    // Nettoyage AVANT écriture DB
    const payload = {
      ...data,
      hobbies: cleanArray(data.hobbies, ALLOWED.hobbies),
      sports: cleanArray(data.sports, ALLOWED.sports),
      creative_activities: cleanArray(data.creative_activities, ALLOWED.creative_activities),
      favorite_outings: cleanArray(data.favorite_outings, ALLOWED.favorite_outings),
      at_home_activities: cleanArray(data.at_home_activities, ALLOWED.at_home_activities),
      movie_genres: cleanArray(data.movie_genres, ALLOWED.movie_genres),
      book_genres: cleanArray(data.book_genres, ALLOWED.book_genres),
      vacation_styles: cleanArray(data.vacation_styles, ALLOWED.vacation_styles),

      // Champs "Autre" récupérés de façon fiable (blur ou sauvegarde directe)
      hobbies_other: getOther("hobbies_other"),
      sports_other: getOther("sports_other"),
      creative_activities_other: getOther("creative_activities_other"),
      favorite_outings_other: getOther("favorite_outings_other"),
      at_home_activities_other: getOther("at_home_activities_other"),
      movie_genres_other: getOther("movie_genres_other"),
      book_genres_other: getOther("book_genres_other"),
      vacation_styles_other: getOther("vacation_styles_other"),

      user_id: userId,
    };

    const { error } = await supabase
      .from("profile_preferences")
      .upsert(payload, { onConflict: "user_id" });

    if (error) {
      console.error("[profile/more] upsert error:", error);
      setErrorMsg("Échec de l’enregistrement. Réessaie dans un instant.");
    }
    setSaving(false);
  };

  // Complétion
  const done = {
    hobbies: data ? (data.hobbies.length > 0 || nonEmpty(data.hobbies_other)) : false,
    sports: data ? (data.sports.length > 0 || nonEmpty(data.sports_other)) : false,
    creative: data ? (data.creative_activities.length > 0 || nonEmpty(data.creative_activities_other)) : false,
    outings: data ? (data.favorite_outings.length > 0 || nonEmpty(data.favorite_outings_other)) : false,
    home: data ? (data.at_home_activities.length > 0 || nonEmpty(data.at_home_activities_other)) : false,
    movies: data ? (data.movie_genres.length > 0 || nonEmpty(data.movie_genres_other)) : false,
    books: data ? (data.book_genres.length > 0 || nonEmpty(data.book_genres_other)) : false,
    vacations: data ? (data.vacation_styles.length > 0 || nonEmpty(data.vacation_styles_other)) : false,
  };
  const total = 8;
  const completedCount = Object.values(done).filter(Boolean).length;
  const percent = Math.round((completedCount / total) * 100);

  // Rendus de base
  if (isLoading || loading) return <main className="p-4">Chargement…</main>;
  if (!userId) return <main className="p-4">Tu dois être connecté.</main>;
  if (!isPremium) return null; // pendant le redirect silencieux

  // Sous-composant section
  const Section: React.FC<{
    title: string;
    field: keyof PrefsRow;
    otherField: keyof PrefsRow;
    options: string[];
  }> = ({ title, field, otherField, options }) => {
    const selectedRaw = (data as any)[field] as string[];
    const selected = cleanArray(selectedRaw, ALLOWED[field]);
    const otherVal = ((data as any)[otherField] as string | null) ?? "";
    const max = (LIMITS as any)[field] as number | undefined;
    const atLimit = typeof max === "number" && max > 0 && selected.length >= max;

    return (
      <section className="mb-8">
        <div className="flex items-baseline justify-between mb-2">
          <div className="font-semibold">{title}</div>
          {typeof max === "number" && max > 0 && (
            <div className="text-xs text-gray-600">
              {selected.length}/{max}
            </div>
          )}
        </div>
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
          {options.map((opt, idx) => {
            const checked = selected.includes(opt);
            const disabled = atLimit && !checked;
            const key = `opt-${slugify(opt)}-${idx}`;
            return (
              <label key={key} className="flex items-center gap-2 text-sm opacity-100">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => setArray(field, opt)}
                />
                <span className={disabled ? "opacity-50" : ""}>{opt}</span>
              </label>
            );
          })}
        </div>
        <div className="mt-2">
          <label className="text-sm">
            Autre à préciser :
            {/* [FIX FOCUS] input non-contrôlé: defaultValue + sync onBlur + buffer dans othersRef */}
            <input
              type="text"
              defaultValue={otherVal}
              onChange={(e) => { othersRef.current[otherField as string] = e.target.value; }}
              onBlur={(e) => setOther(otherField, e.target.value)}
              className="block w-full border rounded-lg p-2 mt-1"
              placeholder="Si rien ne correspond, précise ici…"
            />
          </label>
        </div>
      </section>
    );
  };

  return (
    <main
      className="min-h-screen bg-cover bg-center px-4 py-6"
      style={{ backgroundImage: `url('/bg-more-ext.png')` }}
    >
      <div className="max-w-4xl mx-auto bg-white/80 rounded-2xl p-4 md:p-6 shadow">
        {/* Retour */}
        <div className="mb-4">
          <Link href="/profile" className="inline-block px-4 py-2 rounded-xl bg-yellowGreen text-black font-semibold shadow-md hover:opacity-90 transition">
            ← Retour
          </Link>
        </div>

        <header className="mb-4">
          <h1 className="text-xl font-bold">En dire plus sur toi</h1>
          <div className="text-sm opacity-80">Profil complété à <strong>{percent}%</strong></div>
          <div className="flex flex-wrap gap-3 mt-2 text-xs">
            <span>{done.hobbies ? "✅" : "⬜"} Hobbies</span>
            <span>{done.sports ? "✅" : "⬜"} Sports</span>
            <span>{done.creative ? "✅" : "⬜"} Créatif</span>
            <span>{done.outings ? "✅" : "⬜"} Sorties</span>
            <span>{done.home ? "✅" : "⬜"} À la maison</span>
            <span>{done.movies ? "✅" : "⬜"} Films</span>
            <span>{done.books ? "✅" : "⬜"} Livres</span>
            <span>{done.vacations ? "✅" : "⬜"} Vacances</span>
          </div>
        </header>

        {errorMsg && <div className="text-red-600 mb-3 text-sm">{errorMsg}</div>}

        {data && (
          <>
            <Section title="Hobbies" field="hobbies" otherField="hobbies_other" options={HOBBIES} />
            <Section title="Sports pratiqués" field="sports" otherField="sports_other" options={SPORTS} />
            <Section title="Qu’aimes-tu créer ?" field="creative_activities" otherField="creative_activities_other" options={CREATIVE} />
            <Section title="Tes sorties préférées" field="favorite_outings" otherField="favorite_outings_other" options={OUTINGS} />
            <Section title="Quand tu es chez toi" field="at_home_activities" otherField="at_home_activities_other" options={AT_HOME} />
            <Section title="Ton genre de films" field="movie_genres" otherField="movie_genres_other" options={MOVIES} />
            <Section title="Livres (catégories que tu lis)" field="book_genres" otherField="book_genres_other" options={BOOKS} />
            <Section title="Vacances préférées" field="vacation_styles" otherField="vacation_styles_other" options={VACATIONS} />
          </>
        )}

        <div className="flex gap-3 mt-4">
          <button onClick={save} disabled={saving} className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-sm">
            {saving ? "Enregistrement…" : "Enregistrer mes préférences"}
          </button>
          <Link href="/profile" className="text-sm underline">Retour au profil</Link>
        </div>
      </div>
    </main>
  );
}
