// -*- coding: utf-8 -*-
// /pages/profileplus/[id].tsx — Vivaya
// -----------------------------------------------------------------------------
// Rôle : Affiche un profil public + actions (❤️ coup-de-cœur, 📣🧡 écho, 👍 like,
// 💬 chat, 🛡️ bloquer, 🚩 signaler).
// Correction 21/11 : quand on ouvre le chat depuis ce profil, tous les messages
// entrants de cette personne sont marqués comme lus (messages.seen = true).
// [2025-11-24] Galerie : affichage limité à 4 photos sur la page publique,
// avec bouton “+X photos” EN DESSOUS de la grille (petit, vert #93ef09ff).
// -----------------------------------------------------------------------------
//
// FIX (30/01/2026) — Cadrage photos : appliquer le focus enregistré en base
// - On garde object-cover (pas de bandes noires)
// - On ajuste uniquement le point focal (object-position) via les colonnes
//   focus_x / focus_y sur la table `photos` (valeurs 0..100).
// - Important : pour que object-position ait un effet, il ne faut PAS que
//   Supabase "crop" déjà l'image côté CDN. On évite donc d'envoyer un couple
//   width+height (qui force souvent un cover/crop), et on laisse le navigateur
//   faire le recadrage final via CSS.

import * as React from "react";
import Head from "next/head";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { supabase } from "@/lib/supabaseClient";
import CertifiedBadge from "@/components/CertifiedBadge";
import ReportAbuseButton from "@/components/admin/ReportAbuseButton";
import ProfilePreferencesPublic from "@/components/ProfilePreferencesPublic";
import { HeartButton, EchoHeartButton, LikeChatReport } from "@/components/LikeAndHeartButtons";
import Link from "next/link";

const TILE_RATIO = "4 / 5" as const;

/**
 * ---- Image rendering (Supabase) ----
 * Objectif : éviter que le navigateur "floute" certaines images (ex: PNG Copilot),
 * surtout quand elles sont redimensionnées très fort (mobile / Retina).
 *
 * On convertit l'URL "public object" :
 *   /storage/v1/object/public/<bucket>/<path>
 * en URL "render" (image transform CDN) :
 *   /storage/v1/render/image/public/<bucket>/<path>?width=...&height=...&quality=...
 *
 * Important : on NE met PAS `format=` (chez toi, ça a déjà provoqué des 400).
 */
type RenderOpts = { width: number; height?: number; quality?: number };

// ---------------------------------------------------------------------------
// IMPORTANT (30/01/2026) — Qualité vs Focus (object-position)
// ---------------------------------------------------------------------------
// Supabase propose un endpoint "render" (CDN) pour redimensionner/compresser
// les images à la volée : /storage/v1/render/image/public/...
//
// On a DEUX objectifs :
// 1) Conserver un rendu NET (surtout sur écrans Retina / desktop).
// 2) Permettre le recadrage via focus_x/focus_y côté navigateur (object-position).
//
// ⚠️ Si on envoie width+height au CDN, il peut "crop" déjà l'image côté serveur,
// ce qui casse le focus (il ne reste plus de marge à déplacer).
//
// ✅ Choix ici : on RÉACTIVE le CDN "render" pour la netteté,
// mais on n'envoie QUE `width` (pas de height) :
// - le CDN fait un simple redimensionnement (sans crop)
// - le navigateur fait le crop FINAL via CSS (object-fit + object-position)
//
// => L'image stockée ne change jamais. On ne fait que choisir la meilleure URL
// à télécharger pour l'affichage.
// ---------------------------------------------------------------------------
const USE_SUPABASE_RENDER_CDN = true;

const AVATAR_RENDER: RenderOpts = { width: 512, quality: 90 }; // avatar rond (CSS ≈160px -> x3 pour Retina, sans height pour éviter le crop CDN)
const TILE_RENDER: RenderOpts = { width: 960, quality: 90 };   // tuile galerie (large sur desktop -> haute résolution, sans height pour éviter le crop CDN)

// Données "photo" prêtes à être rendues (URL publique + focus normalisé 0..100).
type DisplayPhoto = {
  publicUrl: string;
  focusX: number;
  focusY: number;
};

function clamp0to100(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, n));
}

function toDisplayPhoto(
  publicUrl: string,
  focus_x: unknown,
  focus_y: unknown,
  defaults: { x: number; y: number }
): DisplayPhoto {
  return {
    publicUrl,
    focusX: clamp0to100(focus_x, defaults.x),
    focusY: clamp0to100(focus_y, defaults.y),
  };
}

function supabaseRenderUrlFromPublicObjectUrl(publicUrl: string, opts: RenderOpts): string {
  if (!publicUrl) return publicUrl;

  try {
    const u = new URL(publicUrl);

    // Priorité à la variable d'env (prod), sinon on dérive l'origin depuis l'URL fournie.
    const origin = process.env.NEXT_PUBLIC_SUPABASE_URL || u.origin;

    // Si c'est déjà une URL "render", on met juste à jour les params.
    if (u.pathname.includes("/storage/v1/render/image/public/")) {
      const out = new URL(publicUrl);
      out.searchParams.set("width", String(opts.width));
      // Si on ne passe pas de height, on la SUPPRIME pour éviter tout crop CDN résiduel.
      if (opts.height) out.searchParams.set("height", String(opts.height));
      else out.searchParams.delete("height");
      out.searchParams.set("quality", String(opts.quality ?? 80));
      return out.toString();
    }

    const marker = "/storage/v1/object/public/";
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return publicUrl; // URL externe -> on ne touche pas

    // Exemple rest: "avatars/avatars/dfd66...png"
    const rest = u.pathname.slice(idx + marker.length);

    const out = new URL(`${origin}/storage/v1/render/image/public/${rest}`);
    out.searchParams.set("width", String(opts.width));
    // Si on ne passe pas de height, on ne la met pas (évite le crop serveur).
    if (opts.height) out.searchParams.set("height", String(opts.height));
    out.searchParams.set("quality", String(opts.quality ?? 80));
    return out.toString();
  } catch {
    // URL invalide -> on renvoie tel quel
    return publicUrl;
  }
}

/**
 * Source finale pour une photo.
 * - Mode par défaut : on sert l'URL publique (qualité 100% inchangée).
 * - Mode optimisation (optionnel) : on passe par le CDN Supabase "render".
 */
function getPhotoSrc(publicUrl: string, opts: RenderOpts): string {
  return USE_SUPABASE_RENDER_CDN ? supabaseRenderUrlFromPublicObjectUrl(publicUrl, opts) : publicUrl;
}


// Helpers (âge + oui/non)
function calculateAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function toYesNo(v: unknown): "oui" | "non" | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "boolean") return v ? "oui" : "non";
  const s = String(v).trim().toLowerCase();
  if (!s) return null;
  if (["oui", "yes", "true", "vrai", "1"].includes(s)) return "oui";
  if (["non", "no", "false", "faux", "0"].includes(s)) return "non";
  return (s as "oui" | "non") || null;
}

const PublicProfile: NextPage & { requireAuth?: boolean } = () => {
  const router = useRouter();
  const routeId = typeof router.query.id === "string" ? router.query.id : null;

  const { isLoading: authLoading, session } = useSessionContext();
  const sessionUserId = session?.user?.id ?? null;

  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<any>(null);
  // Photo principale + galerie avec focus (object-position) appliqué côté navigateur.
  const [avatar, setAvatar] = React.useState<DisplayPhoto | null>(null);
  const [gallery, setGallery] = React.useState<DisplayPhoto[]>([]);
  const [postal, setPostal] = React.useState<string | null>(null);
  const [isBlockedEitherWay, setIsBlockedEitherWay] = React.useState(false);

  const [msg, setMsg] = React.useState<string | null>(null);
  const [msgTone, setMsgTone] = React.useState<"success" | "error">("success");

  const [reportOpen, setReportOpen] = React.useState(false);
  const [confirmBlockOpen, setConfirmBlockOpen] = React.useState(false);

  // Limite d’affichage de la galerie
  const [showAllGallery, setShowAllGallery] = React.useState(false);
  const MAX_VISIBLE_GALLERY = 4;

  // Chargement du profil + galerie
  React.useEffect(() => {
    let alive = true;

    const load = async (userId: string) => {
      try {
        setLoading(true);

        const { data: p } = await supabase
          .rpc("get_visible_profile_by_id", { p_id: userId })
          .single();

        if (!alive) return;
        setProfile(p ?? null);
        if (!p) return;

        // fetch main + photos + localisation en parallèle
        // NOTE : on récupère aussi focus_x/focus_y pour appliquer le cadrage (object-position).
        const [{ data: main }, { data: photos }, { data: loc }] = await Promise.all([
          supabase
            .from("photos")
            .select("url,focus_x,focus_y")
            .eq("user_id", userId)
            .eq("is_main", true)
            .maybeSingle(),
          supabase
            .from("photos")
            .select("url,is_main,focus_x,focus_y")
            .eq("user_id", userId),
          supabase
            .from("user_localisations")
            .select("code_postal")
            .eq("user_id", userId)
            .maybeSingle(),
        ]);

        if (!alive) return;

        // Avatar principal (photo main) + focus
        if (main?.url) {
          const { data } = supabase.storage.from("avatars").getPublicUrl(main.url);
          const publicUrl = data?.publicUrl || null;

          // Par défaut, on remonte un peu le focus vertical pour l'avatar rond.
          setAvatar(
            publicUrl
              ? toDisplayPhoto(publicUrl, (main as any).focus_x, (main as any).focus_y, { x: 50, y: 10 })
              : null
          );
        } else {
          setAvatar(null);
        }

        // Galerie (non principales) + focus
        if (Array.isArray(photos)) {
          const items: DisplayPhoto[] = photos
            .filter((ph: any) => !ph.is_main)
            .map((ph: any) => {
              const u = supabase.storage.from("avatars").getPublicUrl(ph.url).data?.publicUrl;
              if (!u) return null;
              return toDisplayPhoto(u, ph.focus_x, ph.focus_y, { x: 50, y: 15 });
            })
            .filter((x: DisplayPhoto | null): x is DisplayPhoto => !!x);

          // Dé-duplication (au cas où) en gardant le premier focus associé.
          const uniq = new Map<string, DisplayPhoto>();
          for (const it of items) if (!uniq.has(it.publicUrl)) uniq.set(it.publicUrl, it);

          setGallery(Array.from(uniq.values()));
          setShowAllGallery(false);
        } else {
          setGallery([]);
        }

        // Code postal
        setPostal(loc?.code_postal ?? null);

        // Blocages
        if (alive && sessionUserId && userId) {
          const [a, b] = await Promise.all([
            supabase
              .from("blocks")
              .select("id")
              .eq("user_id", sessionUserId)
              .eq("blocked_user_id", userId),
            supabase
              .from("blocks")
              .select("id")
              .eq("user_id", userId)
              .eq("blocked_user_id", sessionUserId),
          ]);
          setIsBlockedEitherWay(Boolean(a.data?.length || b.data?.length));
        } else if (alive) {
          setIsBlockedEitherWay(false);
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    if (routeId) load(routeId);
    return () => {
      alive = false;
    };
  }, [routeId, sessionUserId]);

  // Identifiant stable du profil
  const profileId: string | null =
    (typeof profile?.id === "string" && profile.id) ||
    (typeof profile?.user_id === "string" && profile.user_id) ||
    routeId;

  // Marquer les messages comme lus quand on part vers /chat/[profileId]
  React.useEffect(() => {
    if (!sessionUserId || !profileId) return;

    const handleRouteChangeStart = async (url: string) => {
      try {
        if (!url.startsWith(`/chat/${profileId}`)) return;

        await supabase
          .from("messages")
          .update({ seen: true })
          .eq("receiver", sessionUserId)
          .eq("sender", profileId)
          .eq("seen", false);
      } catch (error) {
        console.error("Erreur mark-as-read depuis /profileplus :", error);
      }
    };

    router.events.on("routeChangeStart", handleRouteChangeStart);
    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
    };
  }, [router, sessionUserId, profileId]);

  // --- NOUVEAU : écran de chargement avec le même layout ---
  if (loading) {
    return (
      <>
        <Head>
          <title>Profil — Vivaya</title>
          <meta name="robots" content="noindex,nofollow" />
        </Head>

        <div
          aria-hidden
          className="fixed inset-0 bg-no-repeat bg-cover bg-center pointer-events-none z-0"
          style={{ backgroundImage: "url('/bg-profileplus-ext.png')" }}
        />

        <div className="relative z-10 min-h-screen flex flex-col items-center px-4 pt-6 pb-16">
          {/* Barre haute skeleton */}
          <div className="w-full flex justify-between mb-4 items-center">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-xl bg-yellowGreen text-black"
            >
              ← Retour
            </button>
            <div className="h-4 w-40 rounded-full bg-white/60 animate-pulse" />
            <div className="h-8 w-20 rounded-xl bg-white/60 animate-pulse" />
          </div>

          {/* Avatar + textes skeleton */}
          <div className="w-40 h-40 rounded-full bg-white/60 animate-pulse mb-4" />
          <div className="h-6 w-48 rounded-full bg-white/70 animate-pulse mb-2" />
          <div className="h-4 w-32 rounded-full bg-white/60 animate-pulse" />
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <p className="text-center mt-10 text-black">
        Profil non trouvé.
      </p>
    );
  }

  const isOwn = !!sessionUserId && !!profileId && sessionUserId === profileId;
  const age = calculateAge(profile?.birthday);

  const handleLikeMobile = async () => {
    if (!sessionUserId || !profileId || isBlockedEitherWay) return;
    const { error } = await supabase.from("likes").insert([{ from_user: sessionUserId, to_user: profileId }]);
    if (error) {
      const m = String(error.message || "").toLowerCase();
      if (m.includes("unique") || m.includes("duplicate") || m.includes("already")) {
        setMsg("Tu as déjà liké ce profil.");
        setMsgTone("success");
      } else {
        setMsg("Impossible d’envoyer le like pour le moment.");
        setMsgTone("error");
      }
    } else {
      setMsg("Like en favoris !");
      setMsgTone("success");
      setTimeout(() => setMsg(null), 1500);
    }
  };

  const handleChatMobile = async () => {
    if (!sessionUserId || !profileId || isBlockedEitherWay) return;

    try {
      const { data: allowed, error } = await supabase.rpc("can_chat_with_v2", { target_user: profileId });
      if (!error && allowed) {
        await router.push(`/chat/${profileId}`);
        return;
      }

      const [{ data: authRes }, { data: quota, error: qErr }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("my_open_free_quota_v").select("*").single(),
      ]);

      const uid = authRes?.user?.id;
      if (!uid) {
        setMsg("Connecte-toi pour continuer.");
        setMsgTone("error");
        return;
      }
      if (qErr || !quota) {
        setMsg("Cette conversation n’est pas ouverte, abonne-toi si tu veux envoyer un message.");
        setMsgTone("error");
        return;
      }

      const remainingWeek = (quota as any).remaining_week ?? 0;
      const remainingMonth = (quota as any).remaining_month ?? 0;
      if (remainingWeek <= 0 || remainingMonth <= 0) {
        setMsg("Cette conversation n’est pas ouverte, abonne-toi si tu veux envoyer un message.");
        setMsgTone("error");
        return;
      }

      const { error: insErr } = await supabase.from("open_free_conv_log").insert({
        opener_user_id: uid,
        target_user_id: profileId,
      });
      if (insErr) {
        setMsg("Cette conversation n’est pas ouverte, abonne-toi si tu veux envoyer un message.");
        setMsgTone("error");
        return;
      }

      await router.push(`/chat/${profileId}`);
    } catch {
      setMsg("Cette conversation n’est pas ouverte, abonne-toi si tu veux envoyer un message.");
      setMsgTone("error");
    }
  };

  const openBlockModal = () => {
    if (!sessionUserId || !profileId) return;
    setConfirmBlockOpen(true);
  };

  const handleBlockConfirmed = async () => {
    if (!sessionUserId || !profileId) return;
    const { error } = await supabase.from("blocks").insert({ user_id: sessionUserId, blocked_user_id: profileId });
    if (error) {
      if (String(error.message || "").toLowerCase().includes("unique")) {
        setIsBlockedEitherWay(true);
        setConfirmBlockOpen(false);
        alert("Profil déjà bloqué.");
      } else {
        alert("⚠️ Blocage impossible pour le moment.");
      }
      return;
    }
    setIsBlockedEitherWay(true);
    setConfirmBlockOpen(false);
  };

  // Galerie limitée
  const visibleGallery = showAllGallery ? gallery : gallery.slice(0, MAX_VISIBLE_GALLERY);
  const hasMoreGallery = !showAllGallery && gallery.length > MAX_VISIBLE_GALLERY;
  const remainingCount = hasMoreGallery ? gallery.length - MAX_VISIBLE_GALLERY : 0;

  return (
    <>
      <Head>
        <title>Profil — Vivaya</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div
        aria-hidden
        className="fixed inset-0 bg-no-repeat bg-cover bg-center pointer-events-none z-0"
        style={{ backgroundImage: "url('/bg-profileplus-ext.png')" }}
      />

      <div className="relative z-10 min-h-screen flex flex-col items-center px-4 pt-6 pb-16">
        {/* Barre haute */}
        <div className="w-full flex justify-between mb-4 items-center">
          <button onClick={() => router.back()} className="px-4 py-2 rounded-xl bg-yellowGreen text-black">
            ← Retour
          </button>

          {!authLoading && !isOwn && profileId && (
            <div className="flex items-center gap-5">
              {!isBlockedEitherWay && (
                <>
                  <div className="hidden sm:block">
                    <HeartButton targetUserId={profileId} />
                  </div>
                  <div className="hidden sm:block">
                    <EchoHeartButton targetUserId={profileId} />
                  </div>
                </>
              )}

              {!isBlockedEitherWay && (
                <div className="hidden sm:flex">
                  <LikeChatReport targetUserId={profileId} setMsg={setMsg} setTone={setMsgTone} />
                </div>
              )}

              <button
                onClick={openBlockModal}
                className="text-xl"
                title="Bloquer définitivement"
                aria-label="Bloquer définitivement ce profil"
              >
                🛡️
              </button>
              <button
                onClick={() => setReportOpen(true)}
                className="text-xl"
                title="Signaler"
                aria-label="Signaler ce profil"
              >
                🚩
              </button>
            </div>
          )}
        </div>

        {avatar?.publicUrl && (
          <div className="w-40 h-40 rounded-full overflow-hidden shadow-lg mb-4">
            <img
              // ⚠️- On ne modifie pas la photo : on choisit juste quelle URL charger.
              // Par défaut : URL publique brute (qualité intacte).
              src={getPhotoSrc(avatar.publicUrl, AVATAR_RENDER)}
              alt="Photo principale"
              className="w-full h-full object-cover"
              // Focus dynamique (0..100) pour limiter les têtes coupées.
              style={{ objectPosition: `${avatar.focusX}% ${avatar.focusY}%` }}
            />
          </div>
        )}

        <h2 className="text-2xl font-bold text-black flex items-center justify-center gap-2">
          {profile.username}
          {age !== null && <span className="text-lg font-normal text-black/80">, {age} ans</span>}
        </h2>

        <p className="text-base text-black/90 flex items-center gap-2">
          <span>
            {profile.ville}
            {postal ? ` (${postal})` : ""}
          </span>
          <CertifiedBadge userId={profile.id} />
        </p>

        {/* Actions mobile */}
        {!authLoading && !isOwn && profileId && (
          <div className="mt-3 w-full sm:hidden">
            <div className="flex items-center justify-center gap-8 relative z-20 pointer-events-auto">
              <button
                onClick={handleLikeMobile}
                disabled={isBlockedEitherWay}
                title={isBlockedEitherWay ? "Blocage actif" : "Like"}
                className="text-2xl disabled:opacity-50"
                aria-label="Like"
              >
                👍
              </button>
              {!isBlockedEitherWay ? (
                <>
                  <HeartButton targetUserId={profileId} />
                  <EchoHeartButton targetUserId={profileId} />
                </>
              ) : (
                <span className="text-2xl opacity-50">❤️</span>
              )}
              <button
                onClick={handleChatMobile}
                disabled={isBlockedEitherWay}
                title={isBlockedEitherWay ? "Blocage actif" : "Envoyer un message"}
                className="text-2xl disabled:opacity-50"
                aria-label="Message"
              >
                💬
              </button>
            </div>
          </div>
        )}

        {msg && (
          <p className={`mt-2 text-sm ${msgTone === "success" ? "text-green-600" : "text-red-600"}`}>
            {msg}
          </p>
        )}

        {/* 🎨 Galerie : 4 photos + petit bouton en dessous */}
        {gallery.length > 0 && (
          <div className="mt-6 w-full max-w-4xl">
            <h3 className="text-center text-xl font-semibold text-black mb-4">Galerie</h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {visibleGallery.map((ph, i) => (
                <div
                  key={ph.publicUrl || i}
                  className="relative w-full overflow-hidden rounded-md shadow"
                  style={{ aspectRatio: TILE_RATIO }}
                >
                  <img
                    // ⚠️ Même logique : on ne "crop" pas côté CDN par défaut.
                    src={getPhotoSrc(ph.publicUrl, TILE_RENDER)}
                    alt={`Photo ${i + 1}`}
                    className="absolute inset-0 w-full h-full object-cover"
                    // Focus dynamique (0..100) pour limiter les têtes coupées.
                    style={{ objectPosition: `${ph.focusX}% ${ph.focusY}%` }}
                  />
                </div>
              ))}
            </div>

            {hasMoreGallery && (
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowAllGallery(true)}
                  className="inline-flex items-center justify-center rounded-full text-xs font-semibold text-black shadow-sm hover:opacity-90 transition"
                  style={{ backgroundColor: "#93ef09ff", padding: "4px 12px" }}
                >
                  +{remainingCount} photos
                </button>
              </div>
            )}
          </div>
        )}

        {profile.traits && (
          <p className="text-base text-black italic mt-4 text-center">{profile.traits}</p>
        )}

        <div className="mt-6 space-y-1 text-black text-base text-center">
          {profile.taille && <p>Taille : {profile.taille}</p>}
          {profile.religion && <p>Religion : {profile.religion}</p>}
          {profile.origines && <p>Origines : {profile.origines}</p>}
          {profile.situation && <p>Situation actuelle : {profile.situation}</p>}
          {toYesNo(profile?.a_des_enfants) !== null && (
            <p>Enfants : {toYesNo(profile?.a_des_enfants)}</p>
          )}
          {toYesNo(profile?.souhaite_enfants) !== null && (
            <p>Souhaite des enfants : {toYesNo(profile?.souhaite_enfants)}</p>
          )}
          {profile.niveau_etude && <p>Niveau d’étude : {profile.niveau_etude}</p>}
          {profile.animaux && <p>Animaux : {profile.animaux}</p>}
          {profile.musique && <p>Musique : {profile.musique}</p>}
          {profile.fume && <p>Fume : {profile.fume}</p>}
          {profile.alcool && <p>Alcool : {profile.alcool}</p>}
        </div>

        {(profile.description ||
          profile.qualites_recherchees ||
          profile.vision_relation ||
          profile.bio) && (
          <div className="mt-6 w-full max-w-3xl space-y-4 text-black">
            {profile.description && (
              <div className="rounded-xl bg-white/25 backdrop-blur p-4 shadow">
                <p className="text-sm font-semibold mb-1">Décris-toi librement</p>
                <p className="text-base whitespace-pre-line">{profile.description}</p>
              </div>
            )}
            {profile.qualites_recherchees && (
              <div className="rounded-xl bg-white/25 backdrop-blur p-4 shadow">
                <p className="text-sm font-semibold mb-1">🧡Les qualités que j’apprécie</p>
                <p className="text-base whitespace-pre-line">
                  {profile.qualites_recherchees}
                </p>
              </div>
            )}
            {profile.vision_relation && (
              <div className="rounded-xl bg-white/25 backdrop-blur p-4 shadow">
                <p className="text-sm font-semibold mb-1">Une relation pour moi c’est…</p>
                <p className="text-base whitespace-pre-line">
                  {profile.vision_relation}
                </p>
              </div>
            )}
            {profile.bio && (
              <div className="rounded-xl bg-white/25 backdrop-blur p-4 shadow">
                <p className="text-sm font-semibold mb-1">Bio</p>
                <p className="text-base whitespace-pre-line">{profile.bio}</p>
              </div>
            )}
          </div>
        )}

        {profileId && <ProfilePreferencesPublic userId={profileId} />}

        <div className="mt-8 text-[11px] text-center text-black/80">
          <Link href="/cgu" className="hover:underline">
            Conditions Générales d&apos;Utilisation
          </Link>
          {" · "}
          <Link href="/mentions-legales" className="hover:underline">
            Mentions légales
          </Link>
        </div>
      </div>

      {/* Modale blocage */}
      {confirmBlockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
            <h2 className="text-red-700 font-extrabold text-xl mb-3">ATTENTION&nbsp;!</h2>
            <p className="text-red-600 text-base mb-6">
              Bloquer ce profil de façon <b>DÉFINITIVE</b> ?<br />
              Vous ne pourrez plus vous écrire ni vous retrouver dans les recherches/suggestions.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setConfirmBlockOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleBlockConfirmed}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                Bloquer définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale signalement */}
      {profileId && (
        <ReportAbuseButton
          reportedUserId={profileId}
          open={reportOpen}
          onOpenChange={setReportOpen}
        />
      )}
    </>
  );
};

PublicProfile.requireAuth = true;
export default PublicProfile;
