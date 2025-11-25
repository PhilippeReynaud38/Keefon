// -*- coding: utf-8 -*-
// Vivaya — pages/dashboard.tsx
//
// Objet : tableau de bord avec suggestions proches.
// Règles : code robuste, simple, lisible ; UTF-8 ; commentaires conservés ; pas d’usine à gaz.
//
// Correctifs historiques :
//  - FIN des 400 Bad Request : lecture des colonnes dans les bonnes tables.
//    * Moi (âge/genre/seek) : presignup_data (birthday, genre, genre_recherche)
//    * Moi (CP/ville)       : user_localisations (code_postal, ville)
//    * Candidats (created_at) : profiles(id, created_at) UNIQUEMENT
//  - On conserve la RPC `trouver_profils_proches` (distance/âge).
//  - Filtre les bloqués (moi⇄eux).
//
// 🔒 Confidentialité (07/11) :
//  - Remplacement des lectures directes de user_settings par
//    rpc('get_privacy_flags', { p_ids }) + rpc('get_viewer_is_certified').

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { supabase } from "@/lib/supabaseClient";
import ProfileCard from "@/components/ProfileCard";
import type { ProfileCardDTO } from "@/lib/types";
import { fetchMyPlan } from "@/lib/plans";

type RpcProfil = {
  id: string;
  username: string | null;
  ville: string | null;
  code_postal: string | null;
  birthday: string | null;
  distance_m: number | null;
};

type MeLite = { id: string; age: number; cp: string; genre: string; seek: string };

function calcAge(iso: string | null): number | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a >= 0 && a < 130 ? a : undefined;
}

// 🔒 statut certifié du viewer — via RPC
async function viewerIsCertified(): Promise<boolean> {
  const { data, error } = await supabase.rpc("get_viewer_is_certified");
  if (error) {
    console.error("[dashboard] get_viewer_is_certified:", error);
    return false;
  }
  return data === true;
}

// anti-répétition locale
const SEEN_KEY = "vivaya_dashboard_seen_v1";
const SEEN_LIMIT = 2;
const readSeen = (): Record<string, number> => {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "{}");
  } catch {
    return {};
  }
};
const writeSeen = (map: Record<string, number>) => {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(map));
  } catch {}
};

async function loadBlockedSet(me: string): Promise<Set<string>> {
  const [a, b] = await Promise.all([
    supabase.from("blocks").select("blocked_user_id").eq("user_id", me),
    supabase.from("blocks").select("user_id").eq("blocked_user_id", me),
  ]);
  const s = new Set<string>();
  for (const r of a.data ?? []) s.add(String((r as any).blocked_user_id));
  for (const r of b.data ?? []) s.add(String((r as any).user_id));
  return s;
}

// 🔵 Liste des utilisateurs marqués "antibrouteur" (shadow-ban léger).
// On passe éventuellement une liste de candidats pour limiter la requête.
async function loadAntibrouteurSet(candidateIds?: string[]): Promise<Set<string>> {
  if (!candidateIds || candidateIds.length === 0) return new Set();
  try {
    let query = supabase.from("antibrouteurs_ids_v").select("user_id");
    query = query.in("user_id", candidateIds);
    const { data, error } = await query;
    if (error) {
      console.error("[dashboard] antibrouteurs:", error);
      return new Set();
    }
    return new Set((data ?? []).map((r: any) => String(r.user_id)));
  } catch (e) {
    console.error("[dashboard] antibrouteurs:", e);
    return new Set();
  }
}

// ---------------------------------------------------------------------------
// Garde presignup : on vérifie uniquement que l'inscription est complétée
// (ligne presignup_data présente). On NE BLOQUE PLUS sur l'absence de photo
// principale, pour rester cohérent avec le profil + avatar par défaut.
// ---------------------------------------------------------------------------
function usePresignupGuard() {
  const router = useRouter();
  const { isLoading, session } = useSessionContext();
  const once = useRef(false);

  useEffect(() => {
    if (isLoading || once.current) return;
    once.current = true;

    (async () => {
      const uid = session?.user?.id;
      if (!uid) {
        router.replace("/login");
        return;
      }

      // Vérification minimale : presignup_data doit exister
      const { data: pre, error } = await supabase
        .from("presignup_data")
        .select("user_id")
        .eq("user_id", uid)
        .maybeSingle();

      if (error) {
        console.error("[dashboard] presignup guard:", error);
      }

      if (!pre) {
        // Inscription non terminée → on renvoie terminer le presignup
        router.replace("/presignup");
      }
      // Si presignup ok, on laisse l'accès au dashboard même sans photo principale.
    })();
  }, [isLoading, session, router]);
}

function ProfilesArea() {
  const [newest, setNewest] = useState<RpcProfil[]>([]);
  const [suggested, setSuggested] = useState<RpcProfil[]>([]);
  const [wide, setWide] = useState<RpcProfil[]>([]);
  const [loading, setLoading] = useState(true);

  const [photoMap, setPhotoMap] = useState<Map<string, string>>(new Map());
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set());

  // responsive : limiter "nouveaux"
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 640px)");
    const on = () => setIsMobile(mq.matches);
    on();
    mq.addEventListener ? mq.addEventListener("change", on) : mq.addListener(on);
    return () => {
      mq.removeEventListener ? mq.removeEventListener("change", on) : mq.removeListener(on);
    };
  }, []);
  const NEW_LIMIT = isMobile ? 2 : 4;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth?.user?.id;
        if (!uid) {
          setLoading(false);
          return;
        }

        // === MOI : lire dans les BONNES tables ===
        const [{ data: pre }, { data: loc }] = await Promise.all([
          supabase
            .from("presignup_data")
            .select("birthday, genre, genre_recherche")
            .eq("user_id", uid)
            .maybeSingle(),
          supabase
            .from("user_localisations")
            .select("code_postal, ville")
            .eq("user_id", uid)
            .maybeSingle(),
        ]);

        const myAge = calcAge(pre?.birthday ?? null);
        const myCP = loc?.code_postal ?? null;
        const myGenre = pre?.genre ?? null;
        const mySeek = pre?.genre_recherche ?? null;

        if (!myAge || !myCP || !myGenre || !mySeek) {
          setNewest([]);
          setSuggested([]);
          setWide([]);
          setLoading(false);
          return;
        }

        const me: MeLite = { id: uid, age: myAge!, cp: myCP!, genre: myGenre!, seek: mySeek! };

        // bloqués
        const blocked = await loadBlockedSet(me.id);

        // STRICT — 10 km / ±5 ans
        const { data: rpcStrict, error: rpcErr } = await supabase.rpc("trouver_profils_proches", {
          uid: me.id,
          center_cp: myCP,
          age_min: Math.max(18, me.age - 5),
          age_max: Math.min(99, me.age + 5),
          rayon_m: 10_000,
        });
        if (rpcErr) throw rpcErr;
        let strict = ((rpcStrict ?? []) as RpcProfil[]).filter((r) => !blocked.has(r.id));

        // === 🔒 CONFIDENTIALITÉ via RPC (STRICT) =============================
        if (strict.length) {
          const candidateIds = strict.map((r) => r.id);

          // 1) flags candidats (SECURITY DEFINER)
          const { data: flags, error: fErr } = await supabase.rpc("get_privacy_flags", {
            p_ids: candidateIds,
          });
          if (fErr) throw fErr;

          const fMap = new Map<string, { is_public: boolean; cert_only: boolean }>();

          for (const r of flags ?? []) {
            const row = r as any;
            fMap.set(String(row.user_id), {
              is_public: row.is_public !== false,
              cert_only: !!row.cert_only,
            });
          }

          // 2) viewer certifié ?
          const vCert = await viewerIsCertified();

          // 3) filtre final
          strict = strict.filter((r) => {
            const f = fMap.get(r.id) ?? { is_public: true, cert_only: false };
            return f.is_public && (!f.cert_only || vCert);
          });
        }
        // =====================================================================

        // 🔵 Exclure les profils marqués "antibrouteur" (shadow-ban)
        if (strict.length) {
          const antiSet = await loadAntibrouteurSet(strict.map((r) => r.id));
          if (antiSet.size) {
            strict = strict.filter((r) => !antiSet.has(r.id));
          }
        }

        // created_at pour flag "nouveau" → via profiles(id, created_at)
        const created = new Map<string, string>();
        if (strict.length) {
          const { data: pRows } = await supabase
            .from("profiles")
            .select("id, created_at")
            .in("id", strict.map((r) => r.id));
          for (const r of pRows ?? []) created.set((r as any).id, (r as any).created_at);
        }

        const now = Date.now(),
          RECENT_DAYS = 14;
        const seenMap = readSeen();

        // BLOC 1 — Nouveaux (strict + récents)
        const bloc1 = strict
          .filter((r) => {
            const c = created.get(r.id);
            if (!c) return false;
            const t = Date.parse(c);
            if (Number.isNaN(t)) return false;
            return (now - t) / 86_400_000 <= RECENT_DAYS;
          })
          .filter((r) => (seenMap[r.id] ?? 0) < SEEN_LIMIT)
          .sort((a, b) =>
            String(created.get(b.id) ?? "").localeCompare(String(created.get(a.id) ?? ""))
          )
          .slice(0, NEW_LIMIT);

        setNewest(bloc1);
        if (bloc1.length) {
          const inc = { ...seenMap };
          for (const p of bloc1) inc[p.id] = (inc[p.id] ?? 0) + 1;
          writeSeen(inc);
        }

        // BLOC 2 — Suggested si bloc1 vide
        let bloc2: RpcProfil[] = [];
        if (bloc1.length === 0) {
          const sm = readSeen();
          bloc2 = strict
            .filter((r) => (sm[r.id] ?? 0) < SEEN_LIMIT)
            .sort((a, b) => (a.distance_m ?? Infinity) - (b.distance_m ?? Infinity))
            .slice(0, 8);
          setSuggested(bloc2);
          const inc2 = { ...sm };
          for (const p of bloc2) inc2[p.id] = (inc2[p.id] ?? 0) + 1;
          writeSeen(inc2);
        } else {
          setSuggested([]);
        }

        // BLOC 3 — Large si 1 et 2 vides (100 km / ±15 ans)
        if (bloc1.length === 0 && bloc2.length === 0) {
          const { data: rpcWide } = await supabase.rpc("trouver_profils_proches", {
            uid: me.id,
            center_cp: myCP,
            age_min: Math.max(18, me.age - 15),
            age_max: Math.min(99, me.age + 15),
            rayon_m: 100_000,
          });
          let wide0 = ((rpcWide ?? []) as RpcProfil[]).filter((r) => !blocked.has(r.id));

          // 🔒 CONFIDENTIALITÉ (WIDE)
          if (wide0.length) {
            const candidateIds = wide0.map((r) => r.id);

            const { data: flags, error: fErr } = await supabase.rpc("get_privacy_flags", {
              p_ids: candidateIds,
            });
            if (fErr) throw fErr;

            const fMap = new Map<string, { is_public: boolean; cert_only: boolean }>();

            for (const r of flags ?? []) {
              const row = r as any;
              fMap.set(String(row.user_id), {
                is_public: row.is_public !== false,
                cert_only: !!row.cert_only,
              });
            }

            const vCert = await viewerIsCertified();
            wide0 = wide0.filter((r) => {
              const f = fMap.get(r.id) ?? { is_public: true, cert_only: false };
              return f.is_public && (!f.cert_only || vCert);
            });
          }

          // 🔵 Exclure aussi les "antibrouteurs" dans la recherche large
          if (wide0.length) {
            const antiSet = await loadAntibrouteurSet(wide0.map((r) => r.id));
            if (antiSet.size) {
              wide0 = wide0.filter((r) => !antiSet.has(r.id));
            }
          }

          const bloc3 = wide0
            .filter((r) => (readSeen()[r.id] ?? 0) < SEEN_LIMIT)
            .sort((a, b) => (a.distance_m ?? Infinity) - (b.distance_m ?? Infinity))
            .slice(0, 8);
          setWide(bloc3);
        } else {
          setWide([]);
        }
      } catch (e) {
        console.error("[dashboard] suggestions:", e);
        setNewest([]);
        setSuggested([]);
        setWide([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [NEW_LIMIT]);

  // Photos publiques (main si dispo sinon première)
  useEffect(() => {
    const active: RpcProfil[] = newest.length
      ? newest
      : suggested.length
      ? suggested
      : wide.length
      ? wide
      : [];
    if (!active.length) {
      setPhotoMap(new Map());
      return;
    }
    (async () => {
      try {
        const ids = active.map((r) => r.id);
        const { data: ph } = await supabase
          .from("photos")
          .select("user_id, url, is_main")
          .in("user_id", ids);
        const pick = new Map<string, string>();
        for (const r of ph ?? []) {
          if (r.is_main && r.url) {
            const { data } = supabase.storage.from("avatars").getPublicUrl(r.url);
            const u = data?.publicUrl || null;
            if (u) pick.set(r.user_id, u);
          }
        }
        for (const r of ph ?? []) {
          if (!pick.has(r.user_id) && r.url) {
            const { data } = supabase.storage.from("avatars").getPublicUrl(r.url);
            const u = data?.publicUrl || null;
            if (u) pick.set(r.user_id, u);
          }
        }
        setPhotoMap(pick);
      } catch (e) {
        console.error("[dashboard] photos:", e);
        setPhotoMap(new Map());
      }
    })();
  }, [newest, suggested, wide]);

  // précharger "déjà liké"
  useEffect(() => {
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const me = auth?.user?.id;
        if (!me) {
          setLikedSet(new Set());
          return;
        }

        const active: RpcProfil[] = newest.length
          ? newest
          : suggested.length
          ? suggested
          : wide.length
          ? wide
          : [];
        const ids = active.map((r) => r.id);
        if (!ids.length) {
          setLikedSet(new Set());
          return;
        }

        const { data, error } = await supabase
          .from("likes")
          .select("to_user")
          .eq("from_user", me)
          .in("to_user", ids);
        if (error) throw error;

        setLikedSet(new Set((data ?? []).map((r: any) => r.to_user)));
      } catch (e) {
        console.error("[dashboard] preload likes:", e);
        setLikedSet(new Set());
      }
    })();
  }, [newest, suggested, wide]);

  const toDTO = (r: RpcProfil, showDistance: boolean): ProfileCardDTO => ({
    id: r.id,
    username: r.username ?? "—",
    age: calcAge(r.birthday) ?? 18,
    city: r.ville ?? null,
    postal_code: r.code_postal ?? null,
    distance_km:
      showDistance && r.distance_m != null
        ? Math.round((Number(r.distance_m) / 1000) * 10) / 10
        : null,
    main_photo_url: photoMap.get(r.id) ?? null,
    traits: [],
    certified: false,
  });

  const handleLike = async (target: string, action: "like" | "unlike") => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const me = auth?.user?.id;
      if (!me || me === target) return false;

      if (action === "like") {
        const { data: exists, error: selErr } = await supabase
          .from("likes")
          .select("id")
          .eq("from_user", me)
          .eq("to_user", target)
          .maybeSingle();
        if (selErr && selErr.code !== "PGRST116") return false;
        if (exists?.id) return true;
        const { error } = await supabase
          .from("likes")
          .insert([{ from_user: me, to_user: target }]);
        if (!error) setLikedSet((prev) => new Set(prev).add(target));
        return !error;
      } else {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("from_user", me)
          .eq("to_user", target);
        if (!error)
          setLikedSet((prev) => {
            const s = new Set(prev);
            s.delete(target);
            return s;
          });
        return !error;
      }
    } catch (e) {
      console.error("[dashboard] toggle like:", e);
      return false;
    }
  };

  const rendered = useMemo(() => {
    if (loading) return null;

    let list: RpcProfil[] = [];
    let label = "";
    let showDist = true;

    if (newest.length > 0) {
      list = newest;
      label = "Nouveaux profils près de vous";
    } else if (suggested.length > 0) {
      list = suggested;
      label = "Profils proches (10 km, ±5 ans)";
    } else if (wide.length > 0) {
      list = wide;
      label = "Profils proches qui peuvent t'intéresser";
    } else {
      // Aucun profil à suggérer : texte centré dans le container
      return (
        <section className="mt-6 w-full flex justify-center">
          <p className="text-sm text-gray-800 text-center">
            Aucun profil à suggérer dans vos critères pour l&apos;instant.
          </p>
        </section>
      );
    }
    return (
      <section aria-label="Profils" className="mt-6">
        <p className="text-center text-sm text-gray-800 mb-1">{label}</p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {list.map((p) => (
            <li key={p.id}>
              <ProfileCard
                profile={toDTO(p, showDist)}
                onLike={handleLike}
                initialLiked={likedSet.has(p.id)}
                showEye={false}
                showFav={false}
                showMessage={false}
              />
            </li>
          ))}
        </ul>
      </section>
    );
  }, [loading, newest, suggested, wide, photoMap, likedSet]);

  return rendered;
}

export default function Dashboard() {
  usePresignupGuard();

  const [planLabel, setPlanLabel] = useState<string>("Gratuit");

  useEffect(() => {
    fetchMyPlan(supabase)
      .then((p) => {
        // On ne change le label que si on reçoit un vrai libellé non vide.
        if (p && typeof p.label === "string" && p.label.trim() !== "") {
          setPlanLabel(p.label.trim());
        }
        // Sinon on conserve la valeur actuelle ("Gratuit" ou autre).
      })
      .catch((err) => {
        console.error("[dashboard] fetchMyPlan:", err);
        setPlanLabel("Gratuit");
      });
  }, []);

  const [openMenu, setOpenMenu] = useState<"space" | "interactions" | null>(
    null
  );
  const toggle = (m: "space" | "interactions") =>
    setOpenMenu((prev) => (prev === m ? null : m));

  return (
    <div
      className="min-h-screen bg-cover bg-center p-4 flex flex-col"
      style={{ backgroundImage: "url('/bg-dashboard-ext.png')" }}
    >
      <div>
        <div className="text-center text-xl font-bold text-purple-700 mt-4">
          Bienvenue dans ton espace KEEFON
        </div>

        {/* Badge prononciation Keefon, fond vert compact pour mobile */}
        <div className="mt-2 flex justify-center">
          <p
            className="inline-block text-center text-xs font-semibold rounded-full px-3 py-1"
            style={{ backgroundColor: "#93ef09ff" }}
          >
            <span className="block">Se prononce « qui phone » 📞</span>
            <span className="block">et veut dire « on kiffe   » ❤️</span>
          </p>
        </div>

        {/* Abonnement en haut + bouton Aide visible mobile/desktop */}
        <div className="mt-2 text-sm text-gray-800 w-full max-w-sm mx-auto flex items-center justify-between">
          <span>
            Abonnement : <strong>{planLabel}</strong>
          </span>
          {/* Bouton Aide : lien simple, fond vert paleGreen #59FF72 */}
          <Link
            href="/aide"
            className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-semibold shadow hover:opacity-90 text-green-900"
            style={{ backgroundColor: "#59FF72" }}
          >
            <span className="mr-1 font-bold">?</span>
            Aide
          </Link>
        </div>

        <div className="mt-4 flex flex-col items-center space-y-3">
          <button
            onClick={() => toggle("space")}
            className="bg-green-100 hover:bg-green-200 text-green-800 font-semibold py-2 px-4 rounded-full shadow"
          >
            🧍 Mon espace
          </button>
          <button
            onClick={() => toggle("interactions")}
            className="bg-pink-100 hover:bg-pink-200 text-pink-800 font-semibold py-2 px-4 rounded-full shadow"
          >
            ❤️ Interactions
          </button>
        </div>

        <AnimatePresence>
          {openMenu === "space" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 bg-white/80 p-4 rounded-xl shadow w-full max-w-sm mx-auto"
            >
              <ul className="space-y-2">
                <li>
                  <Link href="/profile" className="block hover:underline">
                    👤 Mon profil
                  </Link>
                </li>
                <li>
                  <Link href="/abonnement" className="block hover:underline">
                    ⭐ Abonnement
                  </Link>
                </li>
                {/* 🛍️ Boutique : nouveau lien entre Abonnement et Paramètres */}
                <li>
                  <Link href="/boutique" className="block hover:underline">
                    🛍️ Boutique
                  </Link>
                </li>
                <li>
                  <Link href="/parametres" className="block hover:underline">
                    ⚙️ Paramètres
                  </Link>
                </li>
                <li>
                  <Link href="/logout" className="block hover:underline">
                    🚪 Déconnexion
                  </Link>
                </li>
              </ul>
            </motion.div>
          )}
          {openMenu === "interactions" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 bg-white/80 p-4 rounded-xl shadow w-full max-w-sm mx-auto"
            >
              <ul className="space-y-2">
                <li>
                  <Link href="/recherche" className="block hover:underline">
                    🔍 Rechercher des profils
                  </Link>
                </li>
                <li>
                  <Link
                    href="/interaction/messages"
                    className="block hover:underline"
                  >
                    ✉️ Mes messages
                  </Link>
                </li>
                <li>
                  <Link
                    href="/interaction/mes-likes"
                    className="block hover:underline"
                  >
                    👍 Mes likes
                  </Link>
                </li>
                <li>
                  <Link
                    href="/interaction/mes_coups_de_coeur"
                    className="block hover:underline"
                  >
                    ❤️ Mes Keefs
                  </Link>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 🔧 ICI : typo corrigée — mx.auto -> mx-auto pour centrer le container */}
      <div className="mt-8 w-full max-w-6xl mx-auto flex-1">
        <ProfilesArea />
      </div>

      {/* ✅ Footer légal discret, présent dans l'espace connecté */}
      <footer className="mt-8 mb-4 text-center text-xs text-gray-700">
        <span>
          <Link href="/cgu" className="hover:underline">
            Conditions Générales d&apos;Utilisation
          </Link>{" "}
          ·{" "}
          <Link href="/mentions-legales" className="hover:underline">
            Mentions légales
          </Link>
        </span>
      </footer>
    </div>
  );
}

// ✅ Un seul export default. On garde le flag d’auth :
;(Dashboard as any).requireAuth = true;
