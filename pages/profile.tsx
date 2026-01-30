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
// - [2026-01-30] Ajout recadrage utilisateur (non destructif) sur la page profil :
//   • Modal "Recadrer" (drag + sliders) → enregistre focus_x/focus_y (0..100) dans `photos`.
//   • Affichage avatar + galerie : resize=contain côté Supabase + crop via CSS (object-fit:cover + object-position).
//   • Par défaut : focus 50/15.
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
 * Focus par défaut pour le recadrage (en %).
 * - x=50 : centré horizontalement
 * - y=15 : légèrement vers le haut (évite de couper le haut du visage)
 *
 * IMPORTANT : on ne modifie jamais le fichier image (pas de crop destructif, pas de zoom ajouté).
 * On enregistre uniquement un point de focus (focus_x/focus_y) et on l'applique via `object-position`.
 */
const DEFAULT_FOCUS_X = 50;
const DEFAULT_FOCUS_Y = 15;

type FocusPoint = { x: number; y: number };

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Coerce un focus DB (nullable) vers un % valide. */
function normalizeFocus(value: unknown, fallback: number) {
  const v = Number(value);
  if (!Number.isFinite(v)) return fallback;
  return clamp(Math.round(v), 0, 100);
}

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

/**
 * Image "render" URL (Supabase Image Transform).
 * Goal: avoid blurry rendering on desktop (Chrome) by always serving a bigger image than the card size (DPR aware-ish).
 * We DO NOT force `format=` because your Supabase returns 400 for some formats.
 */
function renderUrlFromKey(
  key: string,
  opts: { width: number; height: number; resize?: "cover" | "contain"; quality?: number },
  bust?: string | number
) {
  const publicUrl = publicUrlFromKey(key);
  // /object/public -> /render/image/public
  const base = publicUrl.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");

  const params = new URLSearchParams();
  params.set("width", String(Math.round(opts.width)));
  params.set("height", String(Math.round(opts.height)));
  params.set("resize", opts.resize ?? "cover");
  params.set("quality", String(opts.quality ?? 85));
  if (bust !== undefined && bust !== null && bust !== "") params.set("v", String(bust));

  return `${base}?${params.toString()}`;
}

const GALLERY_RENDER = { width: 720, height: 900, quality: 85 } as const; // 4/5 ratio
const AVATAR_RENDER = { width: 384, height: 384, quality: 90 } as const; // circle

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

// ----------------------------- UI: Recadrage --------------------------------

/**
 * Modal léger de recadrage "non destructif".
 * - L'utilisateur déplace l'image (drag) dans un cadre fixe (ratio imposé)
 * - On enregistre uniquement focus_x / focus_y (0..100) pour piloter object-position
 *
 * ⚠️ Aucun traitement sur le fichier (pas de compression, pas de zoom ajouté, pas de re-upload).
 */
function PhotoCropModal({
  open,
  title,
  imageSrc,
  aspectRatio,
  circle,
  initialFocus,
  onClose,
  onSave,
}: {
  open: boolean;
  title: string;
  imageSrc: string;
  aspectRatio: number; // ex: 1 pour avatar, 4/5 pour cartes
  circle?: boolean;
  initialFocus: FocusPoint;
  onClose: () => void;
  onSave: (next: FocusPoint) => void;
}) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const naturalRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const dragRef = useRef<{
    dragging: boolean;
    startX: number;
    startY: number;
    startFocus: FocusPoint;
    rangeX: number;
    rangeY: number;
  } | null>(null);

  const [focus, setFocus] = useState<FocusPoint>(initialFocus);
  const [ranges, setRanges] = useState<{ rangeX: number; rangeY: number } | null>(null);

  /**
   * Ajuste l'"amplitude" du drag.
   * But : éviter de devoir faire 3 mètres de drag pour changer le focus sur des photos
   * très "hautes" (rangeY important). On ne change PAS la qualité ni le zoom, juste
   * la sensibilité de l'interaction.
   */
  const DRAG_SENSITIVITY_X = 1.6;
  // Plus élevé car tu as constaté que le déplacement vertical était trop faible.
  // Ça ne change PAS le recadrage possible (0..100), juste la vitesse pour y arriver.
  const DRAG_SENSITIVITY_Y = 3.6;

  /**
   * Taille du cadre dans le viewport.
   * Problème constaté : la carte (modal) pouvait devenir trop haute et sortir de l'écran.
   * Solution : on calcule un cadre (w/h) qui respecte le ratio et qui tient dans la fenêtre.
   */
  const [framePx, setFramePx] = useState<{ w: number; h: number } | null>(null);

  // À chaque ouverture (ou changement de cible), on repart du focus actuel.
  useEffect(() => {
    if (!open) return;
    setFocus({ x: initialFocus.x, y: initialFocus.y });
  }, [open, initialFocus.x, initialFocus.y]);

  // Calcule une taille de cadre qui tient à l'écran (évite une modal trop grande).
  useEffect(() => {
    if (!open) return;

    const compute = () => {
      // Marges globales du backdrop (p-4) + un peu de confort.
      const horizontalPadding = 32;

      // Réserve approximative pour : header + boutons + paddings.
      // (On a supprimé les sliders Focus X/Y, donc c'est plus compact.)
      const reservedVertical = 210;

      // On cappe volontairement la largeur (sinon la carte devient "immense" sur desktop).
      const maxW = Math.max(260, Math.min(window.innerWidth - horizontalPadding, 360));
      const maxH = Math.max(260, window.innerHeight - reservedVertical);

      // aspectRatio = width / height  =>  height = width / aspectRatio  =>  width = height * aspectRatio
      const w = Math.min(maxW, maxH * aspectRatio);
      const h = w / aspectRatio;
      setFramePx({ w: Math.round(w), h: Math.round(h) });
    };

    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [open, aspectRatio]);

  // Recalcule les "ranges" nécessaires au drag (dépend du cadre ET des dims naturelles).
  const recomputeRanges = () => {
    const box = boxRef.current;
    const nat = naturalRef.current;
    if (!box || !nat.w || !nat.h) return;

    const rect = box.getBoundingClientRect();
    const cw = Math.max(1, rect.width);
    const ch = Math.max(1, rect.height);

    // Même logique que object-fit: cover
    const scale = Math.max(cw / nat.w, ch / nat.h);
    const dw = nat.w * scale;
    const dh = nat.h * scale;

    // Ranges négatifs (ou nuls) : (container - image)
    const rangeX = cw - dw;
    const rangeY = ch - dh;

    setRanges({ rangeX, rangeY });
  };

  // Responsive : si le cadre change de taille (mobile / resize), on recalc.
  useEffect(() => {
    if (!open) return;
    const box = boxRef.current;
    if (!box) return;
    // Certaines WebViews anciennes peuvent ne pas supporter ResizeObserver.
    // Dans ce cas on retombe sur un écouteur window.resize (moins fin mais suffisant ici).
    if (typeof (globalThis as any).ResizeObserver === "undefined") {
      const onResize = () => recomputeRanges();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    const ro = new ResizeObserver(() => recomputeRanges());
    ro.observe(box);
    return () => ro.disconnect();
  }, [open]);

  // ESC pour fermer (UX)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
      {/*
        Conteneur de modal volontairement plus compact :
        - évite de sortir de l'écran
        - pas de scrollbars inutiles
      */}
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Glisse l’image pour ajuster le cadrage (on enregistre seulement le focus, la photo n’est pas modifiée).
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-gray-100 hover:bg-gray-200"
            title="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Cadre de recadrage */}
          <div
            ref={boxRef}
            className={`relative mx-auto bg-gray-100 overflow-hidden ring-1 ring-gray-200 select-none touch-none ${
              circle ? "rounded-full" : "rounded-xl"
            }`}
            // Cadre dimensionné pour tenir dans le viewport.
            // On ne dépend pas de scroll / hauteur de contenu.
            style={{
              width: framePx ? `${framePx.w}px` : "100%",
              height: framePx ? `${framePx.h}px` : undefined,
              // Fallback instantané (avant le compute()) pour éviter un cadre "0px" sur le 1er render.
              aspectRatio: framePx ? undefined : aspectRatio,
            }}
            // Important : permet un drag fluide sur mobile (sinon le scroll intercepte).
            onPointerDown={(e) => {
              // On ne démarre le drag que si on a des ranges calculés.
              if (!ranges) return;
              (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
              dragRef.current = {
                dragging: true,
                startX: e.clientX,
                startY: e.clientY,
                startFocus: { ...focus },
                rangeX: ranges.rangeX,
                rangeY: ranges.rangeY,
              };
            }}
            onPointerMove={(e) => {
              const d = dragRef.current;
              if (!d?.dragging) return;

              const dx = e.clientX - d.startX;
              const dy = e.clientY - d.startY;

              // Mapping pixel -> % basé sur la formule CSS d'object-position:
              // offset = (container - image) * (pos% / 100)
              // => pos% = pos%_start + dx * 100 / (container - image)
              const nextX =
                d.rangeX !== 0
                  ? d.startFocus.x + (dx * 100 * DRAG_SENSITIVITY_X) / d.rangeX
                  : d.startFocus.x;
              const nextY =
                d.rangeY !== 0
                  ? d.startFocus.y + (dy * 100 * DRAG_SENSITIVITY_Y) / d.rangeY
                  : d.startFocus.y;

              setFocus({
                x: clamp(Math.round(nextX), 0, 100),
                y: clamp(Math.round(nextY), 0, 100),
              });
            }}
            onPointerUp={() => {
              dragRef.current = null;
            }}
            onPointerCancel={() => {
              dragRef.current = null;
            }}
          >
            <img
              src={imageSrc}
              alt="Recadrage"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: `${focus.x}% ${focus.y}%` }}
              draggable={false}
              // Quand l'image est chargée, on récupère les dimensions naturelles et on recalc.
              onLoad={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                naturalRef.current = { w: img.naturalWidth || 0, h: img.naturalHeight || 0 };
                recomputeRanges();
              }}
            />

            {/* Petite grille d'aide (discrète) */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
              <div className="absolute left-1/3 top-0 bottom-0 w-px bg-black" />
              <div className="absolute left-2/3 top-0 bottom-0 w-px bg-black" />
              <div className="absolute top-1/3 left-0 right-0 h-px bg-black" />
              <div className="absolute top-2/3 left-0 right-0 h-px bg-black" />
            </div>
          </div>

          {/*
            NOTE : on a volontairement retiré les sliders Focus X / Focus Y.
            Tu as demandé qu'ils n'apparaissent pas.
            Le réglage se fait uniquement par drag (plus naturel + moins de UI en bas).
          */}

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setFocus({ x: DEFAULT_FOCUS_X, y: DEFAULT_FOCUS_Y })}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold"
              title="Revenir au focus par défaut"
            >
              Réinitialiser
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-sm font-semibold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => onSave({ x: focus.x, y: focus.y })}
                className="px-4 py-2 rounded-xl bg-yellowGreen text-black font-semibold shadow-md hover:opacity-90 transition"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- Galerie (listage + remplacer + suppression) --------------
function GalleryWithActions({
  userId,
  onChanged,
  refreshKey = 0,
  onRequestCrop,
}: {
  userId: string;
  onChanged: () => void;
  refreshKey?: number;
  onRequestCrop?: (p: { id: string; url: string; is_main: boolean; focus_x?: number | null; focus_y?: number | null }) => void;
}) {
  type Row = {
    id: string;
    url: string;
    is_main: boolean;
    status?: string | null;
    focus_x?: number | null;
    focus_y?: number | null;
  };
  const [photos, setPhotos] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchPhotos = async () => {
    setError(null);
    const { data, error } = await supabase
      .from("photos")
      // focus_x/focus_y : point de focus (0..100) utilisé pour object-position.
      .select("id, url, is_main, status, focus_x, focus_y")
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
          // ⚠️ IMPORTANT : on passe en resize=contain côté Supabase pour éviter un crop serveur.
          // Le recadrage se fait côté CSS via object-fit:cover + object-position (focus_x/y).
          // => permet à l'utilisateur de choisir son cadrage sans altérer le fichier.
          const publicUrl = renderUrlFromKey(
            key,
            { ...GALLERY_RENDER, resize: "contain" },
            refreshKey
          ); // cache-buster

          const fx = normalizeFocus(p.focus_x, DEFAULT_FOCUS_X);
          const fy = normalizeFocus(p.focus_y, DEFAULT_FOCUS_Y);
          return (
            <div key={p.id} className="flex flex-col">
              {/*
                IMPORTANT UX : "Recadrer" est placé SOUS la photo (pas en overlay) pour rester lisible partout.
                Aucune modification du fichier image : on enregistre uniquement focus_x/focus_y.
              */}
              <div
                className="relative rounded-lg ring-1 ring-gray-200 overflow-hidden bg-white/70"
                style={{ aspectRatio: "4 / 5" }}
              >
                <img
                  src={publicUrl}
                  alt="Photo de la galerie"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ objectPosition: `${fx}% ${fy}%` }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/default-avatar.png";
                  }}
                />
            
                {/* Actions gardées en overlay (remplacer/supprimer) : déjà contrastées. */}
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
            
              {/* Bouton Recadrer sous la photo : lisible sur tous les fonds */}
              <div className="mt-2 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => onRequestCrop?.(p)}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-white/90 text-gray-900 shadow-sm ring-1 ring-black/10 hover:bg-white disabled:opacity-60"
                  disabled={!!busyId}
                  title="Recadrer cette photo (non destructif)"
                >
                  <span aria-hidden className="text-yellow-500">✂️</span>
                  <span className="text-sm font-semibold">Recadrer</span>
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
  const [mainPhotoId, setMainPhotoId] = useState<string | null>(null);
  const [mainPhotoKey, setMainPhotoKey] = useState<string | null>(null);
  const [mainFocus, setMainFocus] = useState<FocusPoint>({
    x: DEFAULT_FOCUS_X,
    y: DEFAULT_FOCUS_Y,
  });
  const [error, setError] = useState<string | null>(null);
  const [isMainPhotoLoading, setIsMainPhotoLoading] = useState<boolean>(true);

  // Recadrage: cible (photo) actuellement en cours d'édition
  const [cropTarget, setCropTarget] = useState<
    | null
    | {
        photoId: string;
        key: string; // clé storage (avatars/xxx.jpg)
        focus: FocusPoint;
        mode: "avatar" | "gallery";
      }
  >(null);

  useProtectedCompletedSignup();

  useEffect(() => {
    if (isLoading) return;
    if (!session?.user?.id) return;

    const uid = session.user.id;
    setUserId(uid);

    const fetchData = async () => {
      setIsMainPhotoLoading(true);
      try {
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

        // Main photo + focus (recadrage)
        // NOTE : resize=contain côté Supabase pour éviter un crop serveur.
        // Le cadrage est piloté par CSS via object-position (focus_x/y).
        const { data: photo } = await supabase
          .from("photos")
          .select("id, url, focus_x, focus_y")
          .eq("user_id", uid)
          .eq("is_main", true)
          .maybeSingle();

        if (photo?.url) {
          const key = toStorageKey(photo.url);
          setMainPhotoId(photo.id ?? null);
          setMainPhotoKey(key);
          setMainFocus({
            x: normalizeFocus((photo as any).focus_x, DEFAULT_FOCUS_X),
            y: normalizeFocus((photo as any).focus_y, DEFAULT_FOCUS_Y),
          });
          setMainPhotoUrl(
            renderUrlFromKey(key, { ...AVATAR_RENDER, resize: "contain" }, galleryKey)
          ); // cache-buster
        } else {
          setMainPhotoUrl(null);
          setMainPhotoId(null);
          setMainPhotoKey(null);
          setMainFocus({ x: DEFAULT_FOCUS_X, y: DEFAULT_FOCUS_Y });
        }
      } finally {
        setIsMainPhotoLoading(false);
      }
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

  // -------------------------- Recadrage (focus_x/y) -------------------------
  /** Ouvre le recadrage pour la photo principale (avatar). */
  const requestCropAvatar = () => {
    if (!mainPhotoId || !mainPhotoKey) return;
    setCropTarget({
      photoId: mainPhotoId,
      key: mainPhotoKey,
      focus: { ...mainFocus },
      mode: "avatar",
    });
  };

  /** Ouvre le recadrage pour une photo de la galerie (ratio 4/5). */
  const requestCropGallery = (p: {
    id: string;
    url: string;
    focus_x?: number | null;
    focus_y?: number | null;
  }) => {
    const key = toStorageKey(p.url);
    setCropTarget({
      photoId: p.id,
      key,
      focus: {
        x: normalizeFocus(p.focus_x, DEFAULT_FOCUS_X),
        y: normalizeFocus(p.focus_y, DEFAULT_FOCUS_Y),
      },
      mode: "gallery",
    });
  };

  /** Sauvegarde le focus dans la table `photos` (non destructif). */
  const saveCrop = async (next: FocusPoint) => {
    if (!userId || !cropTarget) return;
    setError(null);

    const { error } = await supabase
      .from("photos")
      .update({ focus_x: next.x, focus_y: next.y })
      .eq("id", cropTarget.photoId)
      .eq("user_id", userId);

    if (error) {
      setError("❌ Recadrage non enregistré : " + error.message);
      return;
    }

    // UX : feedback + rafraîchissement.
    setError("✅ Recadrage enregistré.");

    // Si on vient d'éditer la photo principale, on met à jour le state local aussi.
    if (cropTarget.photoId === mainPhotoId) setMainFocus({ ...next });

    setCropTarget(null);
    setGalleryKey((k) => k + 1);
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
      {/*
        Recadrage (modal) — non destructif.
        IMPORTANT : on utilise resize=contain côté Supabase pour éviter le crop serveur.
        Le cadrage final dépend uniquement de object-position (focus_x/y).
      */}
      {cropTarget && (
        <PhotoCropModal
          open={true}
          title={
            cropTarget.mode === "avatar" ? "Recadrer ta photo principale" : "Recadrer une photo de la galerie"
          }
          imageSrc={renderUrlFromKey(
            cropTarget.key,
            {
              width: cropTarget.mode === "avatar" ? 1200 : 1200,
              height: cropTarget.mode === "avatar" ? 1200 : 1500,
              resize: "contain",
              quality: 92,
            },
            // on réutilise galleryKey pour casser le cache si besoin
            galleryKey
          )}
          aspectRatio={cropTarget.mode === "avatar" ? 1 : 4 / 5}
          circle={cropTarget.mode === "avatar"}
          initialFocus={cropTarget.focus}
          onClose={() => setCropTarget(null)}
          onSave={saveCrop}
        />
      )}

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
          {/* On n’affiche la zone photo **qu’une fois le chargement terminé** */}
          {!isMainPhotoLoading && (
            <>
              {mainPhotoUrl ? (
                <>
                  <img
                    src={mainPhotoUrl}
                    alt="Photo principale"
                    className="w-32 h-32 rounded-full object-cover"
                    // object-position piloté par focus_x/focus_y (non destructif)
                    style={{ objectPosition: `${mainFocus.x}% ${mainFocus.y}%` }}
                  />
                  {/* Recadrage (focus) */}
                  {mainPhotoId && mainPhotoKey && (
                    <button
                      type="button"
                      onClick={requestCropAvatar}
                      className="text-xs text-gray-800 hover:underline"
                      title="Recadrer ta photo principale (sans modifier le fichier)"
                    >
                      ✂️ Recadrer
                    </button>
                  )}
                </>
              ) : (
                <img
                  src="/default-avatar.png"
                  alt="Avatar par défaut"
                  className="w-32 h-32 rounded-full object-cover border border-gray-200 bg-white"
                />
              )}

              {/* Message d’avertissement si aucune photo principale n’est disponible */}
              {!mainPhotoUrl && (
                <p className="mt-1 text-xs text-yellow-800 bg-yellow-50 border border-yellow-200 rounded px-3 py-2 text-center max-w-xs">
                  Ta photo principale est manquante ou a été refusée par la modération.
                  Ton compte reste actif, mais merci d’ajouter une nouvelle photo qui respecte
                  les règles ( pas de visages d’enfants, pas de nudité, pas de violence, pas de célébrités ... ).
                </p>
              )}
            </>
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
                    // Focus par défaut : centré X, Y un peu plus haut (évite les têtes coupées)
                    focus_x: DEFAULT_FOCUS_X,
                    focus_y: DEFAULT_FOCUS_Y,
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
              onRequestCrop={requestCropGallery}
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
