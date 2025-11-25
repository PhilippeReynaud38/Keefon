// -*- coding: utf-8 -*-
// AddPhotoButton.tsx — Vivaya
//
// CHANGELOG (VIVAYA)
// - 2025-08-21: Création du composant "➕ Ajouter une photo".
// - 2025-10-12: Compression locale avant upload (max 1600 px, q=0.82, WebP si possible).
// - 2025-10-12 (fix mobile): Garde-fous iOS/Android : HEIC/HEIF → pas de compression ; fallback toBlob ; fallback global.
// - 2025-10-12 (profil rapide): ⚡ Accélération compression pour Galerie
//      • JPEG uniquement (pas de WebP côté client)
//      • maxDim = 1280, quality = 0.76
//      • skip si fichier < 300 KB
//      • createImageBitmap quand disponible (plus rapide)
//
// Règles projet : code simple, robuste, lisible, zéro gadget, UTF-8.
// Ce composant NE fait qu'une chose : remonter un fichier (compressé si possible) via onFilePicked.

import React, { useRef } from "react";

type Props = {
  onFilePicked: (file: File) => void | Promise<void>;
  disabled?: boolean;
  label?: string;
};

export default function AddPhotoButton({
  onFilePicked,
  disabled = false,
  label = "➕ Ajouter une photo",
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  // ------------------------------------------------------------
  // Helpers locaux compression — pas de fichier additionnel
  // ------------------------------------------------------------

  // Détecte HEIC/HEIF (iOS) → Canvas ne sait pas toujours décoder : on skip la compression.
  const isHeicLike = (file: File) => {
    const t = (file.type || "").toLowerCase();
    const n = (file.name || "").toLowerCase();
    return t.includes("heic") || t.includes("heif") || /\.heic$|\.heif$/i.test(n);
  };

  // DataURL -> Blob (fallback si canvas.toBlob indisponible)
  const dataURLToBlob = (dataURL: string): Blob => {
    const [header, data] = dataURL.split(",");
    const isBase64 = /;base64$/i.test(header);
    const mimeMatch = header.match(/^data:(.*?);/i);
    const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
    const byteString = isBase64 ? atob(data) : decodeURIComponent(data);
    const len = byteString.length;
    const u8 = new Uint8Array(len);
    for (let i = 0; i < len; i++) u8[i] = byteString.charCodeAt(i);
    return new Blob([u8], { type: mime });
  };

  // Lit un File rapidement (ImageBitmap si possible, <img> sinon)
  const loadImg = (file: File): Promise<HTMLImageElement> =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      const cleanup = () => URL.revokeObjectURL(url);
      img.onload = () => { cleanup(); resolve(img); };
      img.onerror = () => { cleanup(); reject(new Error("Image illisible")); };
      img.src = url;
    });

  const loadImgFast = async (file: File): Promise<ImageBitmap | HTMLImageElement> => {
    // createImageBitmap est souvent plus rapide sur mobile
    // @ts-ignore
    if (typeof createImageBitmap === "function") {
      try {
        // @ts-ignore
        return await createImageBitmap(file);
      } catch {
        // fallback <img> si échec
      }
    }
    return await loadImg(file);
  };

  // Dessine en respectant le ratio, avec dimension max
  const drawScaled = (
    src: { width: number; height: number },
    maxDim = 1280
  ) => {
    const w = src.width;
    const h = src.height;
    if (!w || !h) throw new Error("Dimensions invalides");

    const ratio = w / h;
    let outW = w, outH = h;

    if (w > h && w > maxDim) { outW = maxDim; outH = Math.round(maxDim / ratio); }
    else if (h >= w && h > maxDim) { outH = maxDim; outW = Math.round(maxDim * ratio); }

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas non supporté");

    ctx.imageSmoothingEnabled = true;
    // Qualité "medium" = un peu plus rapide que "high"
    // @ts-ignore
    ctx.imageSmoothingQuality = "medium";

    return { canvas, outW, outH, ctx };
  };

  const canvasToBlobSafe = async (
    canvas: HTMLCanvasElement,
    mime: string,
    quality: number
  ): Promise<Blob> => {
    if (typeof canvas.toBlob === "function") {
      return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas→Blob échoué"))), mime, quality);
      });
    }
    const dataURL = canvas.toDataURL(mime, quality);
    return dataURLToBlob(dataURL);
  };

  // ⚡ Compression orientée vitesse (JPEG-only)
  const compressFile = async (
    file: File,
    maxDim = 1280,   // profil rapide galerie
    quality = 0.76   // profil rapide galerie
  ): Promise<File> => {
    // Petits fichiers : inutile de compresser
    if (file.size > 0 && file.size < 300 * 1024) return file;

    // HEIC/HEIF (iOS) : on évite la compression, on envoie l’original
    if (isHeicLike(file)) return file;

    try {
      const imgOrBitmap = await loadImgFast(file);
      const { canvas, ctx } = drawScaled(imgOrBitmap, maxDim);

      // drawImage supporte ImageBitmap et HTMLImageElement
      // @ts-ignore
      ctx.drawImage(imgOrBitmap, 0, 0, canvas.width, canvas.height);

      // JPEG uniquement pour la vitesse
      const mime = "image/jpeg";
      const blob = await canvasToBlobSafe(canvas, mime, quality);
     const safeName = /\.[^.]+$/.test(file.name)
  ? file.name.replace(/\.[^.]+$/, ".jpg")
  : `${file.name}.jpg`;
      return new File([blob], safeName, { type: mime, lastModified: Date.now() });
    } catch {
      // Ne jamais bloquer l’upload
      return file;
    }
  };

  // ------------------------------------------------------------
  // Handler input
  // ------------------------------------------------------------
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const original = e.target.files?.[0];
    if (!original) return;

    try {
      // Compression rapide et non bloquante côté mobile
      const compressed = await compressFile(original, 1280, 0.76);
      await onFilePicked(compressed);
    } finally {
      // Permet de re-sélectionner la même photo immédiatement
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <label
      role="button"
      className={`px-3 py-2 rounded shadow transition ${
        disabled
          ? "bg-green-200/60 cursor-not-allowed opacity-60"
          : "bg-green-200 hover:bg-green-300 cursor-pointer"
      }`}
      aria-disabled={disabled}
    >
      {label}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
    </label>
  );
}
