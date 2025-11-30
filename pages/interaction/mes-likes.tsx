// -*- coding: utf-8 -*-
// pages/interaction/mes-likes.tsx — Vivaya/Keefon
//
// Liste des profils que J'AI likés.
// Schéma likes confirmé : from_user uuid, to_user uuid, created_at timestamptz.
// RLS attendue (lecture/suppression) : USING (auth.uid() = from_user)
//
// Changement :
//  - Filtrage antibrouteur en front : les victimes ne voient plus leurs likes
//    vers un antibrouteur dans cette page.
//    • Si JE SUIS antibrouteur -> je vois tous mes likes (rien ne change).
//    • Sinon -> les lignes où to_user est dans antibrouteurs_ids_v disparaissent.
//
// Aucun changement sur le reste (UI, suppression des likes, Footer, etc.).

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";
import Footer from "@/components/Footer";

type LikeRow = { to_user: string; created_at: string };
type ProfileRow = {
  id: string;
  username: string | null;
  ville: string | null;
  birthday: string | null;
};
type PhotoRow = { user_id: string; url: string; is_main: boolean | null };

type Item = {
  id: string;
  name: string;
  city?: string;
  age?: number;
  likedAt: string;
  avatarUrl?: string;
};

function calcAge(birthdayISO: string | null): number | undefined {
  if (!birthdayISO) return undefined;
  const d = new Date(birthdayISO);
  if (Number.isNaN(d.getTime())) return undefined;
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a >= 0 && a < 130 ? a : undefined;
}

export default function MesLikes() {
  const router = useRouter();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      setItems([]);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setError("Utilisateur non connecté.");
          setLoading(false);
          return;
        }

        // 1) Mes likes → from_user / to_user
        const { data: likes, error: e1 } = await supabase
          .from("likes")
          .select("to_user, created_at")
          .eq("from_user", user.id)
          .order("created_at", { ascending: false })
          .limit(200);
        if (e1) throw e1;

        // Liste brute de likes
        const likedRaw = (likes ?? []) as LikeRow[];

        // 1bis) Liste des antibrouteurs (IDs)
        // On réutilise la vue public.antibrouteurs_ids_v.
        let antibrouteurs = new Set<string>();
        try {
          const { data: antiRows, error: eAnti } = await supabase
            .from("antibrouteurs_ids_v")
            .select("user_id");
          if (!eAnti && antiRows) {
            const s = new Set<string>();
            for (const row of antiRows as any[]) {
              if (row.user_id) s.add(String(row.user_id));
            }
            antibrouteurs = s;
          }
        } catch {
          // En cas d'erreur, on considère qu'il n'y a pas d'antibrouteur
          antibrouteurs = new Set<string>();
        }

        // 1ter) Filtrage antibrouteur :
        //  - Si JE SUIS antibrouteur -> je garde tout.
        //  - Sinon -> je masque les likes dont la cible est antibrouteur.
        const liked: LikeRow[] =
          antibrouteurs.size > 0 && !antibrouteurs.has(user.id)
            ? likedRaw.filter((l) => !antibrouteurs.has(l.to_user))
            : likedRaw;

        const ids = Array.from(new Set(liked.map((l) => l.to_user)));
        if (ids.length === 0) {
          setItems([]);
          setLoading(false);
          return;
        }

        // 2) Profils ciblés
        const { data: profs, error: e2 } = await supabase
          .from("public_full_profiles")
          .select("id, username, ville, birthday")
          .in("id", ids);
        if (e2) throw e2;
        const byId = new Map<string, ProfileRow>();
        (profs ?? []).forEach((p) => byId.set((p as any).id, p as any));

        // 3) Photos principales
        const { data: photos, error: e3 } = await supabase
          .from("photos")
          .select("user_id, url, is_main")
          .in("user_id", ids)
          .eq("is_main", true);
        if (e3) throw e3;
        const avatarByUser = new Map<string, string>();
        for (const ph of (photos ?? []) as PhotoRow[]) {
          const { data } = supabase.storage.from("avatars").getPublicUrl(ph.url);
          if (data?.publicUrl) avatarByUser.set(ph.user_id, data.publicUrl);
        }

        // 4) Mapping final
        const out: Item[] = liked.map((l) => {
          const p = byId.get(l.to_user);
          return {
            id: l.to_user,
            name: (p?.username ?? "—").trim(),
            city: p?.ville ?? undefined,
            age: calcAge(p?.birthday ?? null),
            likedAt: l.created_at,
            avatarUrl: avatarByUser.get(l.to_user),
          };
        });

        setItems(out);
      } catch (e: any) {
        console.error("[mes-likes] erreur:", e);
        setError(e?.message ?? "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Suppression d’un like (from_user = moi ; to_user = id ciblé)
  async function deleteLike(targetId: string) {
    // ⚠️ Confirmation avant suppression définitive
    if (typeof window !== "undefined") {
      const ok = window.confirm("Supprimer ce like de ta liste ?");
      if (!ok) return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("from_user", user.id)
        .eq("to_user", targetId);
      if (error) throw error;
      setItems((prev) => prev.filter((it) => it.id !== targetId));
    } catch (e) {
      console.error("[mes-likes] delete:", e);
    }
  }

  const hasData = useMemo(() => items.length > 0, [items]);

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('/bg-mes-likes-ext.png')" }}
    >
      {/* ❌ voile retiré : on n'ajoute plus de calque blanc au-dessus du fond */}
      <div className="min-h-screen">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
          <div className="mb-4">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-xl bg-yellowGreen text-black font-semibold shadow-md hover:opacity-90 transition"
              aria-label="Retour"
            >
              ← Retour
            </button>
          </div>

          <h1
            className="flex items-center gap-3 text-3xl md:text-4xl font-extrabold
                       bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-600
                       bg-clip-text text-transparent"
          >
            <span role="img" aria-label="pouce">
              👍
            </span>
            Mes Likes
          </h1>

          <p className="mt-2 text-lg md:text-xl text-black/70">
            Les profils que tu as likés récemment.
          </p>

          {/* Plus de texte "Chargement…" : on affiche seulement une erreur éventuelle,
             puis l'état vide ou la liste une fois le chargement terminé. */}
          {error && <p className="text-2xl text-red-600">Erreur : {error}</p>}

          {!loading && !error && !hasData && (
            <p className="text-2xl text-gray-700">Tu n’as encore liké personne.</p>
          )}

          {!loading && !error && hasData && (
            <ul className="space-y-3">
              {items.map((it) => (
                <li
                  key={it.id + it.likedAt}
                  onClick={() => router.push(`/profileplus/${it.id}`)}
                  className="cursor-pointer rounded-2xl bg-[#d1fff0] ring-1 ring-gray-200 shadow-sm p-3 flex items-center gap-4 hover:shadow hover:bg-gray-50 transition"
                >
                  <div className="h-12 w-12 md:h-14 md:w-14 rounded-full overflow-hidden ring-1 ring-gray-200 bg-gray-100 shrink-0">
                    {it.avatarUrl ? (
                      <img
                        src={it.avatarUrl}
                        alt={it.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full grid place-items-center text-gray-400 text-xl md:text-2xl">
                        —
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-xl md:text-2xl font-semibold text-gray-900">
                        {it.name}
                        {typeof it.age === "number" && (
                          <span className="ml-2 font-normal text-gray-700">
                            · {it.age} ans
                          </span>
                        )}
                        {it.city && (
                          <span className="ml-2 font-normal text-gray-700">
                            · {it.city}
                          </span>
                        )}
                      </div>

                      {/* ✅ Seule la corbeille ; le clic sur la carte ouvre déjà le profil */}
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteLike(it.id);
                          }}
                          className="p-2 rounded-full hover:bg-orange-100"
                          title="Supprimer ce like"
                          aria-label="Supprimer ce like"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="mt-0.5 text-base md:text-lg text-gray-600">
                      Aimé le {new Date(it.likedAt).toLocaleDateString()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

// Page protégée
;(MesLikes as any).requireAuth = true;
