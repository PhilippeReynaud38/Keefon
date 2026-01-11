// -*- coding: utf-8 -*-
// Fichier : components/recherche/SearchResultCard.tsx
// Projet  : Vivaya / Keefon
//
// Changements (13/11/2025) :
//   • Suppression du bouton "💬" (ouverture chat) sur la carte de recherche.
//   • AUCUNE autre logique modifiée.
//   • Toute la carte reste cliquable → profil public (/profileplus/[id]).
//   • Bouton 👍 conservé tel quel.
//
// Rappels :
//   - On s’appuie encore sur Supabase pour l’état "déjà liké".
//   - Pas de dépendance supplémentaire, pas d’import inutile.

import * as React from "react";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { supabase } from "@/lib/supabaseClient";

export type ProfileCardData = {
  id: string;            // = user_id (alias possible)
  user_id: string;
  username: string;
  age?: number;
  city?: string;
  distance_km?: number;
  traits?: string[];
  photos: { url: string; is_main?: boolean }[];
  certified?: boolean;     // alias moderne
  is_certified?: boolean;  // compat
};

type Props = { data: ProfileCardData };

// Sélectionne l’URL de la photo principale
function pickMain(photos: ProfileCardData["photos"]): string | null {
  if (!Array.isArray(photos) || photos.length === 0) return null;
  const sorted = [...photos].sort((a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0));
  return sorted[0]?.url ?? null;
}

// Transforme une URL publique Supabase "object" en URL "render" (redimensionnée).
// Ça améliore nettement le rendu (évite le flou sur certains zoom/DPR) car le navigateur
// reçoit directement une image à la bonne taille.
function toSupabaseRenderUrl(
  rawUrl: string,
  opts: { width: number; height: number; quality?: number }
): { src: string; srcSet?: string } {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  if (!supabaseUrl) return { src: rawUrl };

  try {
    const u = new URL(rawUrl);
    const marker = "/storage/v1/object/public/";
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return { src: rawUrl };
    if (!u.origin.startsWith(supabaseUrl)) return { src: rawUrl };

    // bucket/path après le marker
    const publicPath = u.pathname.slice(idx + marker.length).replace(/^\//, "");
    const q = opts.quality ?? 80;

    const v = u.searchParams.get("v");
    const base = `${supabaseUrl}/storage/v1/render/image/public/${publicPath}`;

    const src1 = `${base}?width=${opts.width}&height=${opts.height}&quality=${q}${v ? `&v=${encodeURIComponent(v)}` : ""}`;
    const src2 = `${base}?width=${opts.width * 2}&height=${opts.height * 2}&quality=${q}${v ? `&v=${encodeURIComponent(v)}` : ""}`;
    return { src: src1, srcSet: `${src1} 1x, ${src2} 2x` };
  } catch {
    return { src: rawUrl };
  }
}

export default function SearchResultCard({ data }: Props) {
  const router = useRouter();
  const { session } = useSessionContext();
  const me = session?.user?.id || null;

  const mainUrl = useMemo(() => pickMain(data.photos), [data.photos]);

  // Image rendue par Supabase (1x/2x) pour un rendu plus net, surtout sur mobile.
  const rawImgSrc = mainUrl || "/default-avatar.png";
  const img1x = toSupabaseRenderUrl(rawImgSrc, {
    width: 360,
    height: 480,
    quality: 80,
  });
  const img2x = toSupabaseRenderUrl(rawImgSrc, {
    width: 720,
    height: 960,
    quality: 80,
  });
  const imgSrc = img1x.src;
  const imgSrcSet =
    img2x.src !== img1x.src ? `${img1x.src} 1x, ${img2x.src} 2x` : img1x.srcSet;
  const isCertified = Boolean(data.is_certified ?? data.certified);

  const [likeLoading, setLikeLoading] = useState(false);
  const [liked, setLiked] = useState(false);

  // Précharge l’état "déjà liké"
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!me || me === data.user_id) return;
      try {
        const { data: existing, error } = await supabase
          .from("likes")
          .select("id")
          .eq("from_user", me)
          .eq("to_user", data.user_id)
          .maybeSingle();
        if (!cancelled && !error && existing?.id) setLiked(true);
      } catch {
        /* no-op */
      }
    })();
    return () => { cancelled = true; };
  }, [me, data.user_id]);

  // Envoi / retrait du like
  async function toggleLike(e?: React.MouseEvent<HTMLButtonElement>) {
    e?.stopPropagation(); // n’ouvre pas le profil quand on clique 👍
    if (!me) return router.push("/login");
    if (me === data.user_id || likeLoading) return;

    setLikeLoading(true);
    try {
      const { data: existing } = await supabase
        .from("likes")
        .select("id")
        .eq("from_user", me)
        .eq("to_user", data.user_id)
        .maybeSingle();

      if (existing?.id) {
        const { error } = await supabase.from("likes").delete().eq("id", existing.id);
        if (!error) setLiked(false);
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({ from_user: me, to_user: data.user_id, seen: false, hidden: false });
        if (!error) setLiked(true);
      }
    } finally {
      setLikeLoading(false);
    }
  }

  // Navigation vers le profil public
  function gotoProfile() {
    router.push(`/profileplus/${data.user_id}`).catch(() => {});
  }

  // Accessibilité clavier pour la carte cliquable
  const onCardKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      gotoProfile();
    }
  };

  const likeTitle = likeLoading ? "Envoi du like…" : liked ? "Déjà liké" : "Envoyer un like";

  return (
    <article
      className="relative w-full overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5 cursor-pointer"
      aria-label={`Ouvrir le profil de ${data.username}`}
      role="link"
      tabIndex={0}
      onClick={gotoProfile}
      onKeyDown={onCardKeyDown}
      title={`Voir le profil de ${data.username}`}
    >
      {/* IMAGE */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        srcSet={imgSrcSet}
        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 220px"
        alt={mainUrl ? `Photo de ${data.username}` : "Aucune photo disponible"}
        className="block h-full w-full object-cover pointer-events-none select-none"
        draggable={false}
        // Ajuste le point focal pour limiter les têtes coupées (sans changer le layout).
        style={{ aspectRatio: "3/4", objectPosition: "50% 15%" }}
        loading="lazy"
      />

      {/* dégradé bas */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

      {/* Infos : nom, âge, ville, etc. */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-2 text-white drop-shadow">
        <div className="flex items-center justify-between">
          <div className="max-w-[75%] truncate text-[13px] font-semibold leading-tight">
            {data.username} {typeof data.age === "number" ? `• ${data.age} ans` : ""}
          </div>
          {isCertified && (
            <div className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-black/10">
              Certifié
            </div>
          )}
        </div>

        <div className="mt-0.5 text-[11px] opacity-95">
          {data.city ?? "—"}
          {typeof data.distance_km === "number" ? ` · ${data.distance_km} km` : ""}
        </div>

        {Array.isArray(data.traits) && data.traits.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-2">
            {data.traits.slice(0, 2).map((t) => (
              <span key={t} className="text-[10px] font-medium text-white drop-shadow">
                {t}
              </span>
            ))}
            {data.traits.length > 2 && (
              <span className="text-[10px] text-white/80 drop-shadow">
                +{data.traits.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Boutons — coin haut-droit (💬 retiré) */}
      <div className="absolute right-2 top-2 z-10 flex items-center gap-2">
        <button
          onClick={toggleLike}
          aria-label={likeTitle}
          title={likeTitle}
          disabled={likeLoading || !me || me === data.user_id}
          className={`p-1 text-white drop-shadow transition-transform hover:scale-[1.08] ${
            likeLoading ? "opacity-70" : ""
          } ${!me || me === data.user_id ? "opacity-50 cursor-not-allowed" : ""}`}
          style={{ fontSize: "20px" }}
        >
          {likeLoading ? "⏳" : liked ? "✅" : "👍"}
        </button>
        {/* (aucun bouton message ici) */}
      </div>
    </article>
  );
}
