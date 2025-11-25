// -*- coding: utf-8 -*-
// Fichier : components/ProfilePreferencesPublic.tsx — Vivaya (Keefon)
// Rôle : Afficher en PUBLIC l’extension du profil (préférences) provenant de
//        la table `profile_preferences` (éditée par la page more.tsx).
// Règles : code robuste, simple, logique ; zéro bug ; UTF-8 ; commentaires conservés.
// Remarques : lecture seule ; n’affiche rien si aucune donnée ; style sobre.

import * as React from "react";
import { supabase } from "@/lib/supabaseClient";

type PrefsRow = {
  user_id: string;

  // Listes (JSON[] en DB) + champs "autre"
  hobbies: string[] | null;
  hobbies_other: string | null;

  sports: string[] | null;
  sports_other: string | null;

  creative_activities: string[] | null;
  creative_activities_other: string | null;

  favorite_outings: string[] | null;
  favorite_outings_other: string | null;

  at_home_activities: string[] | null;
  at_home_activities_other: string | null;

  movie_genres: string[] | null;
  movie_genres_other: string | null;

  book_genres: string[] | null;
  book_genres_other: string | null;

  vacation_styles: string[] | null;
  vacation_styles_other: string | null;
};

// Nettoyage léger : array sûr, trim + dédoublonnage
function asCleanArray(v: unknown): string[] {
  const arr = Array.isArray(v) ? v : [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of arr) {
    const s = String(x ?? "").trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function hasAnyContent(r: PrefsRow | null): boolean {
  if (!r) return false;
  const fields = [
    ...asCleanArray(r.hobbies), r.hobbies_other,
    ...asCleanArray(r.sports), r.sports_other,
    ...asCleanArray(r.creative_activities), r.creative_activities_other,
    ...asCleanArray(r.favorite_outings), r.favorite_outings_other,
    ...asCleanArray(r.at_home_activities), r.at_home_activities_other,
    ...asCleanArray(r.movie_genres), r.movie_genres_other,
    ...asCleanArray(r.book_genres), r.book_genres_other,
    ...asCleanArray(r.vacation_styles), r.vacation_styles_other,
  ];
  return fields.some(v => {
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "string") return v.trim().length > 0;
    return Boolean(v);
  });
}

function Chips({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((x, i) => (
        <span key={`${x}-${i}`} className="px-2 py-1 text-sm rounded-full bg-white/40 shadow">
          {x}
        </span>
      ))}
    </div>
  );
}

function Section({
  title,
  items,
  other,
}: {
  title: string;
  items: string[];
  other?: string | null;
}) {
  if (items.length === 0 && !other) return null;
  return (
    <div className="rounded-xl bg-white/25 backdrop-blur p-4 shadow">
      <p className="text-sm font-semibold mb-2">{title}</p>
      <Chips items={items} />
      {other && other.trim() && (
        <p className="text-base mt-2">
          <span className="text-black/70 italic">Autre :</span> {other}
        </p>
      )}
    </div>
  );
}

export default function ProfilePreferencesPublic({ userId }: { userId: string }) {
  const [row, setRow] = React.useState<PrefsRow | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);

      // Lecture depuis `profile_preferences` (cohérent avec more.tsx)
      const { data, error } = await supabase
        .from("profile_preferences")
        .select(
          [
            "user_id",
            "hobbies", "hobbies_other",
            "sports", "sports_other",
            "creative_activities", "creative_activities_other",
            "favorite_outings", "favorite_outings_other",
            "at_home_activities", "at_home_activities_other",
            "movie_genres", "movie_genres_other",
            "book_genres", "book_genres_other",
            "vacation_styles", "vacation_styles_other",
          ].join(", ")
        )
        .eq("user_id", userId)
        .maybeSingle();

      if (!alive) return;
      if (error) {
        console.warn("[ProfilePreferencesPublic] read error:", error.message);
        setRow(null);
      } else if (data) {
        // ✅ Patch minimal : sécuriser le spread si `data` n'est pas un objet strict
        const base: Record<string, any> =
          data && typeof data === "object" ? (data as Record<string, any>) : {};

        // Normalisation minimale
        setRow({
          ...base,
          hobbies: asCleanArray(base.hobbies),
          sports: asCleanArray(base.sports),
          creative_activities: asCleanArray(base.creative_activities),
          favorite_outings: asCleanArray(base.favorite_outings),
          at_home_activities: asCleanArray(base.at_home_activities),
          movie_genres: asCleanArray(base.movie_genres),
          book_genres: asCleanArray(base.book_genres),
          vacation_styles: asCleanArray(base.vacation_styles),
        } as PrefsRow);
      } else {
        setRow(null);
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [userId]);

  if (loading) return null;         // pas de clignotement
  if (!hasAnyContent(row)) return null; // n’affiche rien si vide

  return (
    <div className="mt-6 w-full max-w-3xl space-y-4 text-black">
      <Section title="Hobbies" items={row?.hobbies ?? []} other={row?.hobbies_other ?? null} />
      <Section title="Sports pratiqués" items={row?.sports ?? []} other={row?.sports_other ?? null} />
      <Section title="Qu’aimes-tu créer ?" items={row?.creative_activities ?? []} other={row?.creative_activities_other ?? null} />
      <Section title="Tes sorties préférées" items={row?.favorite_outings ?? []} other={row?.favorite_outings_other ?? null} />
      <Section title="Quand tu es chez toi" items={row?.at_home_activities ?? []} other={row?.at_home_activities_other ?? null} />
      <Section title="Ton genre de films" items={row?.movie_genres ?? []} other={row?.movie_genres_other ?? null} />
      <Section title="Livres (catégories que tu lis)" items={row?.book_genres ?? []} other={row?.book_genres_other ?? null} />
      <Section title="Vacances préférées" items={row?.vacation_styles ?? []} other={row?.vacation_styles_other ?? null} />
    </div>
  );
}
