// -*- coding: utf-8 -*-
// lib/UploadImageExecutor.ts — Vivaya
//
// CHANGELOG (VIVAYA)
// - 2025-08-21: Exécuteur unique d’upload (compression → Storage → BDD).
// - 2025-08-21: Ajout d’un mode DEBUG (paramètre `debug` ou variable d'env
//   NEXT_PUBLIC_VIVAYA_DEBUG_UPLOAD=1). Logs prefixés "[VIVAYA UPLOAD]".
//
// Règles: code robuste, simple, maintenable, UTF-8, commentaires sobres.

import { supabase } from "@/lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const LOG_PREFIX = "[VIVAYA UPLOAD]";
const dbg = (enabled: boolean, ...args: any[]) => {
  if (enabled) console.log(LOG_PREFIX, ...args);
};

// Compression JPEG (retourne aussi les dimensions avant/après)
async function compressImageDetailed(
  file: File,
  maxSide = 1600,
  quality = 0.82,
  debug = false
): Promise<{ blob: Blob; srcW: number; srcH: number; outW: number; outH: number }> {
  const t0 = performance.now();
  const img = new Image();
  const url = URL.createObjectURL(file);
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = (e) => rej(e);
    img.src = url;
  });

  const srcW = img.width;
  const srcH = img.height;
  const ratio = Math.min(1, maxSide / Math.max(srcW, srcH));
  const outW = Math.round(srcW * ratio);
  const outH = Math.round(srcH * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, outW, outH);

  const blob: Blob = await new Promise((res) =>
    canvas.toBlob((b) => res(b as Blob), "image/jpeg", quality)!
  );

  URL.revokeObjectURL(url);
  const t1 = performance.now();

  dbg(debug, "Compression OK", {
    src: { w: srcW, h: srcH, size: file.size },
    out: { w: outW, h: outH, size: blob.size },
    ms: Math.round(t1 - t0),
  });

  return { blob, srcW, srcH, outW, outH };
}

// Upload avec timeout + 1 retry (réseau capricieux)
async function uploadWithRetry(
  bucket: string,
  path: string,
  file: File | Blob,
  debug = false
) {
  const doUpload = async (ms: number, attempt: number) => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), ms);
    try {
      dbg(debug, `Upload attempt #${attempt}`, { bucket, path, bytes: (file as any).size ?? "?" });
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        // @ts-expect-error — injection d'AbortSignal
        fetch: (url: string, init?: RequestInit) =>
          fetch(url, { ...init, signal: controller.signal }),
      });
      if (error) throw error;
      dbg(debug, "Upload OK");
    } finally {
      clearTimeout(t);
    }
  };

  try {
    await doUpload(30_000, 1);
  } catch (e: any) {
    dbg(debug, "Upload failed (attempt #1)", e?.message || e);
    if (
      e?.name === "AbortError" ||
      e?.message?.includes("Failed to fetch") ||
      e?.message?.includes("Network")
    ) {
      await doUpload(30_000, 2);
    } else {
      throw e;
    }
  }
}

/* ------------------------------------------------------------------ */
/* API publique                                                       */
/* ------------------------------------------------------------------ */

export type UploadResult = {
  path: string;       // ex: "avatars/<uid>_<uuid>.jpg"
  is_main: boolean;
  publicUrl: string;  // URL publique calculée par Supabase
};

export async function uploadImageToStorageAndDB(params: {
  userId: string;
  file: File;
  makeMainIfFirst?: boolean;   // la 1re photo devient principale si true
  debug?: boolean;             // force le mode debug
}): Promise<UploadResult> {
  const { userId, file, makeMainIfFirst = true, debug } = params;
  const DEBUG =
    typeof debug === "boolean"
      ? debug
      : (process.env.NEXT_PUBLIC_VIVAYA_DEBUG_UPLOAD === "1");

  if (!userId) throw new Error("Utilisateur manquant.");
  if (!file) throw new Error("Fichier manquant.");

  const Tstart = performance.now();
  dbg(DEBUG, "Start upload", { userId, name: file.name, bytes: file.size });

  // 1) Compression → JPEG
  const { blob, outW, outH } = await compressImageDetailed(file, 1600, 0.82, DEBUG);
  const lightFile = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
    type: "image/jpeg",
  });

  // 2) Chemin Storage — UNE SEULE occurrence de 'avatars/' côté code
  const unique =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : uuidv4();
  const filename = `${userId}_${unique}.jpg`;
  const path = `avatars/${filename}`;

  dbg(DEBUG, "Computed path", { path });

  // 3) Upload
  await uploadWithRetry("avatars", path, lightFile, DEBUG);

  // 4) Déterminer si principale (si première photo)
  let isMain = false;
  if (makeMainIfFirst) {
    const { count, error: cntErr } = await supabase
      .from("photos")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    if (cntErr) dbg(DEBUG, "Count error (non bloquant):", cntErr.message);
    isMain = (count ?? 0) === 0;
  }
  dbg(DEBUG, "is_main?", isMain);

  // 5) Insertion BDD
  const { error: dbError } = await supabase.from("photos").insert([
    {
      user_id: userId,
      url: path,        // ex: "avatars/uid_uuid.jpg"
      is_main: isMain,
      status: "pending",
    },
  ]);
  if (dbError) {
    dbg(DEBUG, "DB insert FAILED:", dbError.message);
    throw dbError;
  }
  dbg(DEBUG, "DB insert OK");

  // 6) URL publique
  const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
  const publicUrl = pub?.publicUrl || "";
  dbg(DEBUG, "Public URL", { publicUrl });

  const Tend = performance.now();
  dbg(DEBUG, "Done", {
    ms: Math.round(Tend - Tstart),
    final: { path, is_main: isMain, w: outW, h: outH },
  });

  return { path, is_main: isMain, publicUrl };
}
