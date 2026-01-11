// -*- coding: utf-8 -*-
// components/ProfileCard.tsx — Vivaya
//
// Modifs ciblées (04/11/2025) :
//   2) Rendre toute la carte cliquable (clic + Enter/Espace) vers /profileplus/[id].
//      • onClick + onKeyDown sur <article>
//      • e.stopPropagation() sur les autres boutons (💛, 👍, ✉️) pour éviter d’ouvrir le profil.
//   3) Aucune autre logique n’est modifiée.
//
// Historique : ajout antérieur d’une garde pour le bouton “✉️ Message” via RPC can_chat_with().

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import DbCertifiedBadge from "@/components/CertifiedBadge";
import type { ProfileCardDTO } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  profile: ProfileCardDTO;
  onLike?: (id: string, action: "like" | "unlike") => Promise<boolean> | boolean;
  onFav?: (id: string) => void;
  onMessage?: (id: string) => void;  // gardé pour compat, fallback intégré
  showEye?: boolean;                 // conservé pour compat mais ignoré visuellement
  showFav?: boolean;
  showMessage?: boolean;
  actionsSlot?: React.ReactNode;
  initialLiked?: boolean;
};

const formatDistance = (km: number | null | undefined) => {
  if (km == null) return "";
  const v = Math.round(km * 10) / 10;
  return `${v} km`;
};

const InlineCertifiedBadge: React.FC<{ certified?: boolean }> = ({ certified }) =>
  certified ? (
    <span className="ml-2 inline-flex items-center text-xs px-2 py-0.5 rounded-full" style={{ background: "secondary" }}>
      Certifié
    </span>
  ) : null;

/**
 * Convertit une URL publique Supabase Storage (/object/public/...) en URL "render" pour servir une image
 * redimensionnée (meilleur rendu et chargement, surtout sur mobile/écrans Retina).
 */
function supabaseRenderUrlFromPublicObjectUrl(
  publicUrl: string,
  opts: { width: number; height: number; quality?: number }
): string {
  try {
    const u = new URL(publicUrl);
    const marker = "/storage/v1/object/public/";
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return publicUrl;

    // ex: /storage/v1/object/public/avatars/avatars/xxx.png
    const objectPath = u.pathname.slice(idx + marker.length);
    const base = `${u.origin}/storage/v1/render/image/public/${objectPath}`;

    const params = new URLSearchParams();
    params.set("width", String(opts.width));
    params.set("height", String(opts.height));
    params.set("quality", String(opts.quality ?? 80));

    return `${base}?${params.toString()}`;
  } catch {
    return publicUrl;
  }
}

const Photo: React.FC<{ src: string | null | undefined; alt: string }> = ({ src, alt }) => {
  const baseW = 360;
  const baseH = 450; // ratio 4/5
  const q = 80;

  const img1x = src ? supabaseRenderUrlFromPublicObjectUrl(src, { width: baseW, height: baseH, quality: q }) : null;
  const img2x = src ? supabaseRenderUrlFromPublicObjectUrl(src, { width: baseW * 2, height: baseH * 2, quality: q }) : null;

  return (
    <div className="w-full aspect-[4/5] overflow-hidden rounded-xl bg-gray-100 border border-gray-200">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img1x ?? src}
          srcSet={img1x && img2x ? `${img1x} 1x, ${img2x} 2x` : undefined}
          alt={alt}
          className="w-full h-full object-cover"
          // Ajuste le point focal pour limiter les têtes coupées (sans changer le layout).
          style={{ objectPosition: "50% 15%" }}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">Aucune photo</div>
      )}
    </div>
  );
};

/** Boutons d’action (inclut la garde can_chat_with pour “Message”). */
const Actions: React.FC<{
  id: string;
  onLike?: (id: string, action: "like" | "unlike") => Promise<boolean> | boolean;
  onFav?: (id: string) => void;
  onMessage?: (id: string) => void;
  showEye?: boolean;        // ignoré visuellement (œil retiré)
  showFav?: boolean;
  showMessage?: boolean;
  initialLiked?: boolean;
}> = ({ id, onLike, onFav, onMessage, showFav, showMessage, initialLiked }) => {
  const [likeState, setLikeState] = useState<"idle" | "pending" | "done">(initialLiked ? "done" : "idle");
  useEffect(() => { setLikeState(prev => (prev === "pending" ? prev : initialLiked ? "done" : "idle")); }, [initialLiked]);

  const likeLabel = useMemo(
    () => (likeState === "pending" ? "Traitement…" : likeState === "done" ? "Retirer mon like" : "Envoyer un like"),
    [likeState]
  );

  async function handleClickLike() {
    if (!onLike || likeState === "pending") return;
    const action: "like" | "unlike" = likeState === "done" ? "unlike" : "like";
    setLikeState("pending");
    try {
      const ok = await onLike(id, action);
      setLikeState(ok ? (action === "like" ? "done" : "idle") : (action === "like" ? "idle" : "done"));
    } catch {
      setLikeState(action === "like" ? "idle" : "done");
    }
  }

  // Garde sécurisée pour le bouton Message (évite d’ouvrir une page non autorisée)
  const goMessage = async () => {
    try {
      const { data: ok, error } = await supabase.rpc("can_chat_with", { target_user: id });
      if (!error && ok) {
        onMessage ? onMessage(id) : (window.location.href = `/chat/${id}`);
      } else {
        window.location.href = `/abonnement?reason=chat-locked`;
      }
    } catch {
      window.location.href = `/abonnement?reason=chat-locked`;
    }
  };

  return (
    <div className="absolute top-2 right-2 flex gap-1">
      {/* 👁️ retiré : plus d’icône œil */}

      {showFav !== false && (
        <button
          className="rounded-lg bg-white/90 border px-2 py-1 text-sm hover:bg-white"
          aria-label="Ajouter en favori"
          onClick={(e) => { e.stopPropagation(); onFav?.(id); }}
        >
          💛
        </button>
      )}

      <button
        className={`rounded-lg bg-white/90 border px-2 py-1 text-sm ${likeState === "pending" ? "opacity-70 cursor-default" : "hover:bg-white"}`}
        aria-label={likeLabel}
        aria-pressed={likeState === "done"}
        title={likeLabel}
        onClick={(e) => { e.stopPropagation(); handleClickLike(); }}
        disabled={likeState === "pending"}
      >
        {likeState === "pending" ? "⏳" : likeState === "done" ? "✅" : "👍"}
      </button>

      {showMessage !== false && (
        <button
          className="rounded-lg bg-white/90 border px-2 py-1 text-sm hover:bg-white"
          aria-label="Envoyer un message"
          onClick={(e) => { e.stopPropagation(); goMessage(); }}
        >
          ✉️
        </button>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Carte
// -----------------------------------------------------------------------------
const ProfileCard: React.FC<Props> = ({
  profile,
  onFav,
  onLike,
  onMessage,
  showEye = false,   // conservé pour compat mais ignoré
  showFav = true,
  showMessage = true,
  actionsSlot,
  initialLiked = false,
}) => {
  const router = useRouter();
  const { id, username, age, city, postal_code, distance_km, certified, main_photo_url, traits } = profile;

  const openProfile = () => { router.push(`/profileplus/${id}`).catch(() => {}); };
  const onCardKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openProfile(); }
  };

  return (
    <article
      className="relative p-3 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      role="link"
      aria-label={`Ouvrir le profil de ${username}`}
      tabIndex={0}
      onClick={openProfile}
      onKeyDown={onCardKeyDown}
      title={`Voir le profil de ${username}`}
    >
      <div className="relative">
        <Photo src={main_photo_url} alt={`Photo de ${username}`} />
        {actionsSlot ? (
          <div className="absolute top-2 right-2">{actionsSlot}</div>
        ) : (
          <Actions
            id={id}
            onFav={onFav}
            onLike={onLike}
            onMessage={onMessage}
            showEye={false}         // œil désactivé
            showFav={showFav}
            showMessage={showMessage}
            initialLiked={initialLiked}
          />
        )}
      </div>

      <header className="mt-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center flex-wrap">
          <h3 className="text-base font-semibold mr-2">{username}</h3>
          {age != null && <span className="text-base text-gray-700">• {age} ans</span>}
          {typeof certified === "boolean" ? <InlineCertifiedBadge certified={certified} /> : <DbCertifiedBadge userId={id} />}
        </div>
        <div className="text-sm text-gray-600 mt-1">
          {city ?? ""}{city && postal_code ? ` (${postal_code})` : ""}{distance_km != null ? ` • ${formatDistance(distance_km)}` : ""}
        </div>
      </header>

      {Array.isArray(traits) && traits.length > 0 && (
        <div aria-label="Traits principaux" className="flex flex-wrap gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
          {traits.slice(0, 3).map((t, i) => (
            <span key={i} className="text-sm px-2 py-1 rounded-full bg-gray-100 border border-gray-200">{t}</span>
          ))}
          {traits.length > 3 && (
            <span className="text-sm px-2 py-1 rounded-full bg-gray-50 border border-gray-200">+{traits.length - 3} autres</span>
          )}
        </div>
      )}
    </article>
  );
};

export default ProfileCard;
