// -*- coding: utf-8 -*-
// UploadCertificationPhoto.tsx — Vivaya
//
// Règle métier : la photo de certification doit être prise EN DIRECT depuis la caméra.
// - Sur MOBILE : on autorise uniquement la capture via caméra (capture="environment").
// - Sur DESKTOP : pas d’upload possible → on affiche un message explicite.
// - Le reste du flux (compression, upload Storage, BDD) reste identique.
//
// Règles projet : simple, lisible, maintenable, UTF-8, pas d’usine à gaz.

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Props = { userId: string };
type CertStatus = "approved" | "pending" | "rejected" | null;

// --- Utils -------------------------------------------------------------------

// Détection "mobile caméra only" : heuristique simple et robuste.
function isMobileLike(): boolean {
  if (typeof navigator === "undefined" || typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  const uaMobile = /Android|iPhone|iPad|iPod|SamsungBrowser|Mobile/i.test(ua);
  const coarse = typeof window.matchMedia === "function" && window.matchMedia("(pointer:coarse)").matches;
  const touch = (navigator as any).maxTouchPoints > 0;
  return uaMobile || coarse || touch;
}

// Nettoie une clé Storage (évite URL publiques complètes, slashes en trop, etc.)
function cleanKey(raw: string): string {
  let s = String(raw || "").trim();
  s = s.replace(/^https?:\/\/[^]+?\/storage\/v1\/object\/public\/avatars\//i, "");
  s = s.replace(/^\/+/, "");
  s = s.replace(/^avatars\/avatars\//, "avatars/");
  return s;
}

// Compression JPEG (~1600px côté long)
async function compressJPEG(file: File, maxSide = 1600, quality = 0.82): Promise<Blob> {
  const img = new Image();
  const url = URL.createObjectURL(file);
  await new Promise<void>((ok, ko) => {
    img.onload = () => ok();
    img.onerror = (e) => ko(e as any);
    img.src = url;
  });

  const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);

  const blob: Blob = await new Promise((res) =>
    canvas.toBlob((b) => res(b as Blob), "image/jpeg", quality)!
  );
  URL.revokeObjectURL(url);
  return blob;
}

// Upload avec timeout + 1 retry
async function uploadWithTimeout(bucket: string, path: string, file: File | Blob, upsert = true) {
  const doUpload = async (ms: number) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    try {
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert,
        // @ts-expect-error: inject AbortSignal
        fetch: (url: string, init?: RequestInit) => fetch(url, { ...init, signal: ctrl.signal }),
      });
      if (error) throw error;
    } finally {
      clearTimeout(timer);
    }
  };
  try {
    await doUpload(30_000);
  } catch (e: any) {
    if (e?.name === "AbortError" || e?.message?.includes("Network")) {
      await doUpload(30_000);
    } else {
      throw e;
    }
  }
}

// Attendre la visibilité dans la liste (évite liens morts immédiats)
async function waitListed(bucket: string, fullPath: string, tries = 6, delay = 700) {
  const dir = fullPath.includes("/") ? fullPath.slice(0, fullPath.lastIndexOf("/")) : "";
  const name = fullPath.split("/").pop()!;
  for (let i = 0; i < tries; i++) {
    const { data, error } = await supabase.storage.from(bucket).list(dir || undefined, { search: name, limit: 1 });
    if (!error && data && data.length) return true;
    await new Promise((r) => setTimeout(r, delay));
  }
  return false;
}

// URL publique (bucket public)
function publicUrl(bucket: string, pathInBucket: string): string | null {
  const key = cleanKey(pathInBucket);
  const { data } = supabase.storage.from(bucket).getPublicUrl(key);
  return data?.publicUrl ?? null;
}

const MAX_MB = 15;

// --- Mapping d’erreurs lisibles ---------------------------------------------
// (équivalent “prettyError” minimal et local à ce composant)
function prettyError(err: unknown): string {
  const raw = typeof err === "string" ? err : (err as any)?.message || (err as any)?.error_description || "";
  const txt = String(raw || "").toLowerCase();

  if (txt.includes("photo_quota_exceeded") || txt.includes("quota") || txt.includes("limit"))
    return "Tu as atteint la limite de photos pour ton offre actuelle.";

  if (txt.includes("payload too large") || txt.includes("413"))
    return `Fichier trop lourd (> ${MAX_MB} Mo).`;

  if (txt.includes("file type") || txt.includes("mime") || txt.includes("invalid") || txt.includes("unsupported"))
    return "Format non supporté. Utilise JPEG, PNG ou WebP.";

  if (txt.includes("network") || txt.includes("timeout") || txt.includes("abort"))
    return "Problème réseau. Réessaie dans un instant.";

  if (txt.includes("permission") || txt.includes("forbidden") || txt.includes("401") || txt.includes("403"))
    return "Accès refusé. Reconnecte-toi puis réessaie.";

  return raw || "Une erreur est survenue.";
}

// --- Composant ---------------------------------------------------------------

export default function UploadCertificationPhoto({ userId }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [status, setStatus] = useState<CertStatus>(null); // approved | pending | rejected | null
  const [path, setPath] = useState<string | null>(null); // ex: "avatars/certif_<uid>.jpg"
  const [preview, setPreview] = useState<string | null>(null); // URL publique (avec cache-bust)

  // Détection mobile au 1er render (mémoïsée)
  const isMobile = useMemo(() => isMobileLike(), []);

  // Charger statut + photo existante
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data: prof } = await supabase
        .from("profiles")
        .select("certified_status")
        .eq("id", userId)
        .maybeSingle();
      setStatus((prof as any)?.certified_status ?? null);

      const { data: row } = await supabase
        .from("certified_photos")
        .select("url")
        .eq("user_id", userId)
        .maybeSingle();
      const p = (row as any)?.url ?? null;
      if (p) {
        const safe = cleanKey(p);
        setPath(safe);
        const pub = publicUrl("avatars", safe);
        setPreview(pub ? `${pub}?v=${Date.now()}` : null);
      } else {
        setPath(null);
        setPreview(null);
      }
    })().catch((e) => setErr(prettyError(e)));
  }, [userId]);

  // Upload + mise à jour BDD
  const onUpload = async () => {
    if (!file || !userId || busy) return;
    setBusy(true);
    setErr(null);
    try {
      // 0) validations basiques
      if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type)) {
        throw new Error("Format non supporté. Utilisez JPEG/PNG/WebP.");
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        throw new Error(`Fichier trop lourd (> ${MAX_MB} Mo).`);
      }

      // 1) Compression
      const blob = await compressJPEG(file, 1600, 0.82);
      const light = new File([blob], "certif.jpg", { type: "image/jpeg" });

      // 2) Chemin
      const newPath = cleanKey(`avatars/certif_${userId}.jpg`);

      // 3) Upload (écrase l’ancienne)
      await uploadWithTimeout("avatars", newPath, light, true);

      // 4) Attente visibilité
      await waitListed("avatars", newPath);

      // 5) BDD
      await supabase.from("certified_photos").delete().eq("user_id", userId);
      await supabase
        .from("certified_photos")
        .insert({ user_id: userId, url: newPath, status: "pending" });
      await supabase.from("profiles").update({ certified_status: "pending" }).eq("id", userId);

      // 6) UI
      setStatus("pending");
      setPath(newPath);
      const pub = publicUrl("avatars", newPath);
      setPreview(pub ? `${pub}?v=${Date.now()}` : null);
      setFile(null);
    } catch (e: any) {
      console.error(e);
      setErr(prettyError(e));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const target = cleanKey(path || `avatars/certif_${userId}.jpg`);
      try {
        await supabase.storage.from("avatars").remove([target]);
      } catch {
        /* ignore */
      }
      await supabase.from("certified_photos").delete().eq("user_id", userId);
      await supabase.from("profiles").update({ certified_status: null }).eq("id", userId);
      setStatus(null);
      setPath(null);
      setPreview(null);
      setFile(null);
    } catch (e: any) {
      console.error(e);
      setErr(prettyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6">
      <h2 className="font-semibold text-lg mb-1">📷 Photo de certification</h2>
      <p className="text-sm text-gray-600">👁 Les autres profils ne verront pas la photo.</p>

      {status === "approved" && (
        <p className="mt-2 text-green-600 font-medium">✔ Votre photo a été validée</p>
      )}
      {status === "pending" && (
        <p className="mt-2 text-amber-600 font-medium">⏳ Votre photo est en attente de validation</p>
      )}
      {status === "rejected" && (
        <p className="mt-2 text-rose-600 font-medium">❌ Votre photo a été refusée</p>
      )}
      {status == null && (
        <p className="mt-2 text-gray-600">💡 Faites certifier votre profil pour plus de fiabilité</p>
      )}

      {preview && (
        <div className="mt-3">
          <img
            src={preview}
            alt="Photo de certification"
            className="h-40 w-40 object-cover rounded-lg ring-1 ring-gray-200"
            loading="lazy"
          />
          <a
            href={preview}
            target="_blank"
            rel="noreferrer"
            className="block text-xs text-blue-600 underline mt-1"
          >
            Ouvrir l’image dans un nouvel onglet
          </a>
        </div>
      )}

      {!isMobile && (
        <p className="mt-3 text-sm text-gray-700">
          📵 La photo de certification doit être prise en direct avec la caméra d’un smartphone.
          Merci d’ouvrir cette page sur votre téléphone pour procéder à la capture.
        </p>
      )}

      {isMobile && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="file"
            accept="image/*"
            {...({ capture: "environment" } as any)}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-sm"
          />
          <button
            onClick={() => void onUpload()}
            disabled={!file || busy}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? "Téléchargement…" : "Télécharger"}
          </button>

          {preview && (
            <button
              onClick={() => void onDelete()}
              disabled={busy}
              className="rounded bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              Supprimer
            </button>
          )}
        </div>
      )}

      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
    </div>
  );
}
