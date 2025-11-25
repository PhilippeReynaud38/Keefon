// -*- coding: utf-8 -*-
// pages/profile.tsx — Vivaya
//
// CHANGELOG ciblé (galerie + CTA):
// - [Galerie] Chemin Storage propre + cache-buster + realtime + réaffectation automatique de la main photo.
// - [CTA rétabli] Bouton "En dire plus sur toi →" en bas de page.
//   • Si l’utilisateur est abonné (tier ≠ "free") → /profile/more
//   • Sinon → /abonnement
// - [2025-10-12] FIX mobile : remplacement de crypto.randomUUID() par safeUUID() (compatible iOS/Android/WebView).
// - [2025-11-05] FIX: suppression de getUserSubscriptionTier (inexistant) et
//   lecture unifiée du plan effectif via RPC get_my_effective_plan_vivaya
//   (fallback vue user_plans_effective_v). Code minime, rien d’autre modifié.
// - [2025-11-18] Comportement sans photo principale :
//   • On n’exige plus de "main photo" pour accéder au profil (seulement presignup_data).
//   • Si la photo principale manque, on affiche un avatar par défaut + message d’avertissement.
//   • Aucun changement SQL/RLS, uniquement côté front.
//
// Règles Vivaya : code simple, robuste, commenté, UTF-8, pas d’usine à gaz.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { supabase } from "../lib/supabaseClient";
import UploadCertificationPhoto from "@/components/UploadCertificationPhoto";
import ProfileForm from "@/components/ProfileForm";
import ProfileLayout from "@/components/ProfileLayout";
import AddPhotoButton from "@/components/AddPhotoButton";
import Footer from "@/components/Footer"; // ✅ Footer légal commun

// -------------------------------- Helpers ---------------------------------

/**
 * Normalise une chaîne de plan vers l'énum UI.
 */
function normalizeTier(raw: string | null | undefined): "free" | "essential" | "elite" {
  const s = String(raw ?? "free").trim().toLowerCase();
  if (s === "elite") return "elite";
  if (s === "essentiel" || s === "essential" || s === "premium") return "essential";
  return "free";
}

/**
 * Plan effectif pour l'utilisateur courant.
 * 1) Essaie l'RPC `get_my_effective_plan_vivaya`
 * 2) Fallback vers la vue `user_plans_effective_v`
 * 3) Défaut "free" si indisponible
 */
async function getEffectiveTier(): Promise<"free" | "essential" | "elite"> {
  // 1) RPC recommandé
  try {
    const { data, error } = await supabase.rpc("get_my_effective_plan_vivaya");
    if (!error && data != null) return normalizeTier(String(data));
  } catch {
    /* silencieux */
  }
  // 2) Vue de secours
  try {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id;
    if (uid) {
      const { data, error } = await supabase
        .from("user_plans_effective_v")
        .select("effective_tier")
        .eq("id", uid)
        .single();
      if (!error && data?.effective_tier) return normalizeTier(data.effective_tier);
    }
  } catch {
    /* silencieux */
  }
  // 3) Free par défaut
  return "free";
}

/**
 * UUID v4 "safe" pour tous les navigateurs (mobile inclus).
 * - Utilise crypto.randomUUID si dispo
 * - Sinon, crypto.getRandomValues (RFC 4122 v4)
 * - Fallback ultime horodaté si crypto indisponible (anciens WebViews)
 */
function safeUUID(): string {
  const g: any = (globalThis as any).crypto;
  if (g?.randomUUID) return g.randomUUID();

  if (g?.getRandomValues) {
    const buf = new Uint8Array(16);
    g.getRandomValues(buf);
    // RFC 4122 variant/version
    buf[6] = (buf[6] & 0x0f) | 0x40;
    buf[8] = (buf[8] & 0x3f) | 0x80;
    const hex = Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
      16,
      20
    )}-${hex.slice(20)}`;
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Convertit un URL public Supabase → clé Storage interne attendue par remove()
 * - Supprime le préfixe ".../storage/v1/object/public/avatars/"
 * - Ne touche pas au dossier interne "avatars/" (chez toi, il est volontaire)
 */
function toStorageKey(raw: string): string {
  return String(raw || "")
    .replace(/^https?:\/\/[^]+?\/storage\/v1\/object\/public\/avatars\//i, "")
    .replace(/^\/+/, "");
}

/** Donne un public URL propre (optionnellement avec cache-buster) depuis une clé Storage. */
function publicUrlFromKey(key: string, bust?: string | number): string {
  const { data } = supabase.storage.from("avatars").getPublicUrl(key);
  const u = data?.publicUrl || "/default-avatar.png";
  return bust ? `${u}?v=${bust}` : u;
}

/** Traduction ultra-légère des messages d'erreur DB vers FR pour l'UI */
function prettyErrorFR(msg: string, prefix?: string) {
  const m = String(msg || "").toLowerCase();

  if (m.includes("photo_quota_exceeded")) {
    return `${prefix ? prefix + " — " : ""}Tu as atteint la limite de photos autorisée.`;
  }

  if (m.includes("duplicate key") && m.includes("photos_pkey")) {
    return `${
      prefix ? prefix + " — " : ""
    }Conflit d’identifiant de photo. Réessaie l’ajout.`;
  }
  if (m.includes("payload too large") || m.includes("too large")) {
    return `${
      prefix ? prefix + " — " : ""
    }Fichier trop volumineux. Choisis une image plus légère.`;
  }
  return `${prefix ? prefix + ": " : ""}${msg}`; // défaut : message brut
}

// ------------- Auto-réaffectation "main photo" (robustesse UX) -------------
/**
 * Si la photo principale manque (ex: modération), on tente d’en (ré)assigner une
 * : d’abord la plus récente "approved", sinon la plus récente non-rejetée.
 * S’exécute avec les droits utilisateur (RLS OK).
 */
async function ensureMainPhotoExistsForCurrentUser(userId: string) {
  const { data: main } = await supabase
    .from("photos")
    .select("id")
    .eq("user_id", userId)
    .eq("is_main", true)
    .maybeSingle();
  if (main) return;

  let candidate = await supabase
    .from("photos")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!candidate.data) {
    candidate = await supabase
      .from("photos")
      .select("id")
      .eq("user_id", userId)
      .neq("status", "rejected")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
  }
  const candidateId = candidate.data?.id;
  if (!candidateId) return;

  const rpc = await supabase.rpc("set_main_photo", { p_user: userId, p_photo_id: candidateId });
  if (!rpc.error) return;

  await supabase.from("photos").update({ is_main: false }).eq("user_id", userId);
  await supabase.from("photos").update({ is_main: true }).eq("id", candidateId);
}

// ---------------- Galerie (listage + remplacer + suppression) --------------
function GalleryWithActions({
  userId,
  onChanged,
  refreshKey = 0,
}: {
  userId: string;
  onChanged: () => void;
  refreshKey?: number;
}) {
  type Row = { id: string; url: string; is_main: boolean; status?: string | null };
  const [photos, setPhotos] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchPhotos = async () => {
    setError(null);
    const { data, error } = await supabase
      .from("photos")
      .select("id, url, is_main, status")
      .eq("user_id", userId)
      // .neq("status", "rejected") // décommente si tu veux masquer côté UI
      .order("created_at", { ascending: true });

    if (error) setError("Erreur chargement photos : " + error.message);
    else setPhotos((data || []) as Row[]);
  };

  useEffect(() => {
    if (userId) fetchPhotos();
  }, [userId, refreshKey]);

  // Bascule principale (RPC atomique + MAJ locale)
  const replaceMain = async (photoId: string) => {
    if (busyId) return;
    setBusyId(photoId);
    try {
      const { error } = await supabase.rpc("set_main_photo", {
        p_user: userId,
        p_photo_id: photoId,
      });
      if (error) {
        setError("Impossible de remplacer la photo principale (RLS/DB).");
        return;
      }
      setPhotos((prev) => prev.map((p) => ({ ...p, is_main: p.id === photoId })));
      onChanged();
    } finally {
      setBusyId(null);
    }
  };

  // Suppression (Storage → DB), interdite pour la principale
  const handleDelete = async (photoId: string, photoUrl: string) => {
    const target = photos.find((p) => p.id === photoId);
    if (!target) return;
    if (target.is_main) {
      setError("❌ Impossible de supprimer la photo principale.");
      return;
    }

    const key = toStorageKey(photoUrl);
    const st = await supabase.storage.from("avatars").remove([key]);
    if (st.error) {
      setError("Erreur suppression Storage : " + st.error.message);
      return;
    }

    const db = await supabase.from("photos").delete().eq("id", photoId).eq("user_id", userId);
    if (db.error) {
      setError("Erreur suppression BDD : " + db.error.message);
      return;
    }

    await fetchPhotos();
    onChanged();
  };

  // On AFFICHE seulement les non principales
  const nonMain = photos.filter((p) => !p.is_main);

  return (
    <>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
        {nonMain.map((p) => {
          const key = toStorageKey(p.url);
          const publicUrl = publicUrlFromKey(key, refreshKey); // cache-buster
          return (
            <div
              key={p.id}
              className="relative rounded-lg ring-1 ring-gray-200 overflow-hidden bg-white/70"
              style={{ aspectRatio: "4 / 5" }}
            >
              <img
                src={publicUrl}
                alt="Photo de la galerie"
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/default-avatar.png";
                }}
              />
              <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 bg-gradient-to-t from-white/90 to-transparent p-2">
                <button
                  onClick={() => replaceMain(p.id)}
                  className="text-xs text-blue-700 hover:underline disabled:opacity-60"
                  disabled={!!busyId}
                  title="Définir comme photo principale"
                >
                  {busyId === p.id ? "…" : ""} Remplacer la photo principale
                </button>
                <button
                  onClick={() => handleDelete(p.id, p.url)}
                  className="text-xs text-red-600 hover:underline disabled:opacity-60"
                  disabled={!!busyId}
                  title="Supprimer cette photo"
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ---- Garde légère : complétion presignup (sans exiger de main photo) ----
function useProtectedCompletedSignup() {
  const router = useRouter();
  const { isLoading, session } = useSessionContext();
  const checkedRef = useRef(false);

  const checkCompleted = async () => {
    if (!session) return;
    const uid = session.user.id;

    // On vérifie seulement que les données presignup existent.
    // On ne force plus la présence d’une photo principale ici :
    // si elle manque, on affichera un avatar par défaut côté UI.
    const { data: pre } = await supabase
      .from("presignup_data")
      .select("user_id")
      .eq("user_id", uid)
      .maybeSingle();

    if (!pre) {
      router.replace("/presignup");
      return;
    }

    // On garde la tentative de réaffectation automatique d’une main photo,
    // mais même si ça échoue, on laisse l’accès à la page profil.
    await ensureMainPhotoExistsForCurrentUser(uid);
  };

  useEffect(() => {
    if (isLoading) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (!checkedRef.current) {
      checkedRef.current = true;
      checkCompleted();
    }
  }, [isLoading, session]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") checkCompleted();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);
}

// --------------------------------- Page -----------------------------------
function ProfilePage() {
  const router = useRouter();
  const { session, isLoading } = useSessionContext();

  const [userId, setUserId] = useState<string | null>(null);
  const [galleryKey, setGalleryKey] = useState(0);

  const [username, setUsername] = useState<string | null>(null);
  const [birthday, setBirthday] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [certified, setCertified] = useState(false);
  const [mainPhotoUrl, setMainPhotoUrl] = useState<string | null>(null);
  // Indique si la photo principale est encore en cours de chargement.
  // Cela évite d'afficher l’avatar par défaut + le message d’avertissement
  // pendant le bref instant où la vraie photo n’a pas encore été récupérée.
  const [isMainPhotoLoading, setIsMainPhotoLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useProtectedCompletedSignup();

  useEffect(() => {
    if (isLoading) return;
    if (!session?.user?.id) return;

    const uid = session.user.id;
    setUserId(uid);

    const fetchData = async () => {
      const { data: prof } = await supabase
        .from("profiles")
        .select("username, certified_status")
        .eq("id", uid)
        .maybeSingle();
      setUsername(prof?.username ?? null);
      setCertified(prof?.certified_status === "approved");

      const { data: v } = await supabase
        .from("public_full_profiles")
        .select("ville")
        .eq("id", uid)
        .maybeSingle();
      setCity(v?.ville ?? null);

      const { data: pre } = await supabase
        .from("presignup_data")
        .select("birthday")
        .eq("user_id", uid)
        .maybeSingle();
      setBirthday(pre?.birthday ?? null);

      // Chargement de la photo principale : on active le flag de chargement
      // pour éviter un flash de l’avatar par défaut avant que la vraie photo
      // n’arrive depuis Supabase.
      setIsMainPhotoLoading(true);

      const { data: photo } = await supabase
        .from("photos")
        .select("url")
        .eq("user_id", uid)
        .eq("is_main", true)
        .maybeSingle();

      if (photo?.url) {
        const key = toStorageKey(photo.url);
        setMainPhotoUrl(publicUrlFromKey(key, galleryKey)); // cache-buster
      } else {
        setMainPhotoUrl(null);
      }

      // Qu’il y ait une photo ou non, le chargement est terminé.
      setIsMainPhotoLoading(false);
    };

    fetchData();
  }, [galleryKey, session, isLoading]);

  // Realtime : rafraîchir + tenter une réassignation de main si besoin
  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`photos-live-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "photos", filter: `user_id=eq.${userId}` },
        async () => {
          setGalleryKey((k) => k + 1);
          await ensureMainPhotoExistsForCurrentUser(userId);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId]);

  const calculateAge = (dob: string | null): number | null => {
    if (!dob) return null;
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };
  const age = calculateAge(birthday);

  // ------------------------ CTA premium-aware (rétabli) ---------------------
  const goToMore = async () => {
    if (!userId) return; // garde légère : on s’assure d’avoir une session
    const tier = await getEffectiveTier(); // ✅ source unique (RPC → vue)
    // si abonné → page "profil enrichi", sinon → page "abonnement"
    if (tier !== "free") router.push("/profile/more");
    else router.push("/abonnement");
  };

  if (isLoading || !session) {
    return (
      <div className="text-center mt-12 text-gray-600">
        Chargement du profil…
      </div>
    );
  }

  return (
    <ProfileLayout>
      {/* Bouton retour */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-xl bg-yellowGreen text-black font-semibold shadow-md hover:opacity-90 transition"
        >
          ← Retour
        </button>
      </div>

      {/* Menu */}
      <div className="absolute top-4 right-4 z-10">
        <details className="group relative inline-block">
          <summary className="px-4 py-2 rounded-xl bg-yellowGreen text-black font-semibold shadow-md hover:opacity-90 transition cursor-pointer">
            ☰ Menu
          </summary>
          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-20">
            <button
              onClick={() => router.push("/dashboard")}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              Tableau de bord
            </button>
            <button
              onClick={() => router.push("/recherche")}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              Recherche
            </button>
            <button
              onClick={() => userId && router.push(`/profileplus/${userId}`)}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              Voir mon profil public
            </button>
            <button
              onClick={() => router.push("/abonnement")}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              Mon abonnement
            </button>
          </div>
        </details>
      </div>

      {/* Contenu */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Photo principale + infos */}
        <div className="flex flex-col items-center space-y-2">
          {isMainPhotoLoading ? (
            // Placeholder discret pendant le chargement de la vraie photo
            <div className="w-32 h-32 rounded-full object-cover border border-gray-200 bg-gray-100 animate-pulse" />
          ) : mainPhotoUrl ? (
            <img
              src={mainPhotoUrl}
              alt="Photo principale"
              className="w-32 h-32 rounded-full object-cover"
            />
          ) : (
            <img
              src="/default-avatar.png"
              alt="Avatar par défaut"
              className="w-32 h-32 rounded-full object-cover border border-gray-200 bg-white"
            />
          )}

          {/* Message d’avertissement si aucune photo principale n’est disponible */}
          {!isMainPhotoLoading && !mainPhotoUrl && (
            <p className="mt-1 text-xs text-yellow-800 bg-yellow...order border-yellow-200 rounded px-3 py-2 text-center max-w-xs">
              Ta photo principale est manquante ou a été refusée par la modération.
              Ton compte reste actif, mais merci d’ajouter une nouvelle photo qui respecte
              les règles (pas de visages d’enfants, pas de nudité, pas de violence, pas de célébrités).
            </p>
          )}

{username && (
            <>
              <p className="text-base font-semibold text-gray-700 flex items-center justify-center gap-2">
                {username}
                {certified && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-paleGreen/90 text-black text-xs font-semibold shadow-sm">
                    ✔ certifié
                  </span>
                )}
              </p>
              {(age !== null || city) && (
                <p className="text-sm text-gray-600">
                  {age !== null && `${age} ans`}
                  {age !== null && city ? " • " : ""}
                  {city}
                </p>
              )}
            </>
          )}
        </div>

        {/* Bouton "Ajouter une photo" */}
        {error && (
          <p className="mt-2 text-center text-green-600 text-base font-medium">
            {error}
          </p>
        )}
        {userId && (
          <div className="text-center">
            <AddPhotoButton
              label="➕ Ajouter une photo"
              onFilePicked={async (file) => {
                setError(null);
                try {
                  // Extension fiable depuis le type ou le nom
                  const ext =
                    file.type === "image/webp"
                      ? "webp"
                      : file.type === "image/jpeg"
                      ? "jpg"
                      : (file.name.split(".").pop() || "jpg").toLowerCase();

                  // 🔒 UUID cross-browser (remplace crypto.randomUUID())
                  const filename = `${safeUUID()}.${ext}`;
                  const storageKey = `avatars/${filename}`; // UN seul "avatars/"

                  const up = await supabase.storage
                    .from("avatars")
                    .upload(storageKey, file, {
                      upsert: false,
                      contentType: file.type || "image/jpeg",
                    });
                  if (up.error) {
                    setError("Upload Storage: " + up.error.message);
                    return;
                  }

                  const ins = await supabase.from("photos").insert({
                    id: safeUUID(), // ← remplace crypto.randomUUID()
                    user_id: userId,
                    url: storageKey, // on stocke la CLE, pas l’URL
                    is_main: false,
                    status: "pending",
                    created_at: new Date().toISOString(),
                  });
                  if (ins.error) {
                    setError(prettyErrorFR(ins.error.message));
                    return;
                  }
                  setGalleryKey((k) => k + 1);
                } catch (e: any) {
                  setError("Erreur ajout photo: " + (e?.message ?? e));
                }
              }}
            />
          </div>
        )}

        {/* Galerie (non principale) */}
        <div className="pt-4">
          {userId && (
            <GalleryWithActions
              userId={userId}
              refreshKey={galleryKey}
              onChanged={() => setGalleryKey((k) => k + 1)}
            />
          )}
        </div>

        <div className="pt-4 border-none">
          {userId && <UploadCertificationPhoto userId={userId} />}
        </div>

        <div className="pt-4 border-none">
          {userId && <ProfileForm userId={userId} />}
        </div>

        {/* CTA profil enrichi (premium-aware) — RÉTABLI */}
        <div className="pt-4 border-none">
          <div className="flex justify-center">
            <button
              type="button"
              onClick={goToMore}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-yellowGreen text-black font-semibold shadow-md hover:opacity-90 transition"
              title="Compléter tes centres d’intérêt (réservé aux abonnés)"
            >
              En dire plus sur toi →
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-gray-500">
            L’édition avancée des centres d’intérêt est réservée aux abonnés. Tout
            le monde peut voir le résultat sur ton profil public.
          </p>
        </div>
      </div>

      {/* ✅ Footer légal commun (CGU, Mentions légales, etc.) */}
      <Footer />
    </ProfileLayout>
  );
}

ProfilePage.requireAuth = true;
export default ProfilePage;
