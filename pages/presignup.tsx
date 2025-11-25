// pages/presignup.tsx — Vivaya (UTF-8)
// Presignup robuste + chemin d’upload SANS dossier user : avatars/<userId>_<uuid>.jpg
// ⚠️ Rappel : l’URL publique contiendra automatiquement /storage/v1/object/public/avatars/ + path
//               donc si path = "avatars/<fichier>", l’URL sera .../avatars/avatars/<fichier>

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient"; // ajuste si ton alias @/ n'est pas configuré

// --- Utils -------------------------------------------------------------------

// Compression JPEG (~1600px) pour accélérer l’upload
async function compressImage(file: File, maxSide = 1600, quality = 0.82): Promise<Blob> {
  const img = new Image();
  const url = URL.createObjectURL(file);
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = (e) => rej(e);
    img.src = url;
  });
  const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * ratio);
  canvas.height = Math.round(img.height * ratio);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob: Blob = await new Promise((res) =>
    canvas.toBlob((b) => res(b as Blob), "image/jpeg", quality)!
  );
  URL.revokeObjectURL(url);
  return blob;
}

// Upload avec timeout + retry, et chemin EXACT exigé (SANS sous-dossier user)
async function uploadMainPhotoWithRetry(params: {
  file: File;
  userId: string;
}) {
  const { file, userId } = params;
  if (!userId) throw new Error("userId manquant");

  // ⬇️ Nom final : avatars/<userId>_<uuid>.jpg  (PAS de répertoire /<userId>/)
  const unique =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : String(Date.now());
  const filename = `${userId}_${unique}.jpg`;
  const path = `avatars/${filename}`; // ✅ format demandé (dossier fixe "avatars/", pas de sous-dossier par user)

  const uploadWithTimeout = async (ms: number) => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), ms);
    try {
      const { error } = await supabase.storage.from("avatars").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        // @ts-expect-error — injection AbortSignal supportée par supabase-js
        fetch: (url: string, init?: RequestInit) =>
          fetch(url, { ...init, signal: controller.signal }),
      });
      if (error) throw error;
    } finally {
      clearTimeout(t);
    }
  };

  try {
    await uploadWithTimeout(30_000);
  } catch (e: any) {
    if (
      e?.name === "AbortError" ||
      e?.message?.includes("Failed to fetch") ||
      e?.message?.includes("Network")
    ) {
      await uploadWithTimeout(30_000); // retry 1x
    } else {
      throw e;
    }
  }
  return { path };
}

// Attendre que l’objet soit listé par Storage (évite les 404 juste après upload)
async function waitUntilExists(path: string, tries = 6, delayMs = 700) {
  // Ici on liste le dossier racine "avatars" du bucket, car le fichier n’est plus dans avatars/<userId>
  const parts = path.split("/");
  // path = "avatars/<fichier>" ⇒ dir = "avatars", name = "<fichier>"
  const dir = parts[0]; // "avatars"
  const name = parts[1];
  for (let i = 0; i < tries; i++) {
    const { data, error } = await supabase.storage
      .from("avatars")
      .list(dir, { limit: 1, search: name });
    if (!error && data && data.length) return true;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

// Nettoyage des anciens temporaires UNIQUEMENT pour ce user
// On supprime dans le dossier "avatars" tous les fichiers qui commencent par `${userId}_`, sauf le courant.
async function deleteOldTempsExcept(currentPath: string | null, userId: string) {
  const { data: files, error } = await supabase.storage
    .from("avatars")
    .list("avatars", { limit: 1000 });
  if (error || !files) return;
  const currentName = currentPath ? currentPath.split("/")[1] : null; // "<userId>_<uuid>.jpg"
  const toDelete: string[] = [];
  for (const f of files) {
    // ne touche qu’aux fichiers de ce user
    if (!f.name.startsWith(`${userId}_`)) continue;
    if (currentName && f.name === currentName) continue; // garde le fichier courant
    toDelete.push(`avatars/${f.name}`);
  }
  if (toDelete.length) await supabase.storage.from("avatars").remove(toDelete);
}

// --- Page --------------------------------------------------------------------

export default function Presignup() {
  const router = useRouter();

  // Form
  const [username, setUsername] = useState("");
  const [genre, setGenre] = useState("");
  const [birthday, setBirthday] = useState("");
  const [genreRecherche, setGenreRecherche] = useState("");
  const [acceptCgu, setAcceptCgu] = useState(false);
  const [acceptData, setAcceptData] = useState(false);

  // Photo
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [tempFilePath, setTempFilePath] = useState<string | null>(null);

  // UI
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Redirection si déjà terminé
  useEffect(() => {
    const check = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return;

      const { data: presignup } = await supabase
        .from("presignup_data")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      const { data: photo } = await supabase
        .from("photos")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_main", true)
        .maybeSingle();

      if (presignup && photo) router.replace("/dashboard");
    };
    check();
  }, [router]);

  const getAge = (s: string) => {
    const d = new Date(s),
      t = new Date();
    let a = t.getFullYear() - d.getFullYear();
    const m = t.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--;
    return a;
  };

  // Submit final
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      !username ||
      !genre ||
      !birthday ||
      !genreRecherche ||
      !avatarFile ||
      !tempFilePath
    ) {
      setError("Tous les champs sont obligatoires.");
      return;
    }
    if (!acceptCgu || !acceptData) {
      setError("Vous devez accepter les CGU et l’utilisation des données.");
      return;
    }
    const age = getAge(birthday);
    if (age < 18 || age > 110) {
      setError("L’âge doit être entre 18 et 110 ans.");
      return;
    }

    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté.");

      const exists = await waitUntilExists(tempFilePath);
      if (!exists) throw new Error("Upload terminé mais fichier indisponible. Réessayez.");

      // Nettoyage des anciens temporaires de CE user (dans le dossier fixe "avatars")
      await deleteOldTempsExcept(tempFilePath, user.id);

      await supabase.from("presignup_data").insert([
        {
          user_id: user.id,
          username,
          genre,
          birthday,
          genre_recherche: genreRecherche,
          accepted_cgu: acceptCgu,
          accepted_sensitive_data: acceptData,
        },
      ]);

      await supabase.from("profiles").update({ username }).eq("id", user.id);

      await supabase.from("photos").insert([
        {
          user_id: user.id,
          url: tempFilePath, // on stocke le PATH (avatars/<userId>_<uuid>.jpg)
          is_main: true,
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ]);

      router.push("/dashboard");
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Erreur pendant l’enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  // Choix image
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    setError(null);
    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté.");

      // Compression -> JPEG
 // Compression -> JPEG
const blob = await compressImage(picked);
const lightFile = new File([blob], picked.name, { type: "image/jpeg" });


      // Upload (chemin exact SANS sous-dossier user)
      const { path } = await uploadMainPhotoWithRetry({
        file: lightFile,
        userId: user.id,
      });

      // Nettoyage des anciens temporaires (avatars/<userId>_*.jpg)
      await deleteOldTempsExcept(path, user.id);

      // Attente visibilité avant d’utiliser l’image
      const ok = await waitUntilExists(path);
      if (!ok) throw new Error("Fichier non disponible immédiatement. Réessayez.");

      setTempFilePath(path);
      setAvatarFile(lightFile);
      setAvatarPreview(URL.createObjectURL(lightFile));
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Erreur lors de l’upload de la photo.");
    } finally {
      setUploading(false);
    }
  };

  // Rendu
  return (
    <main className="min-h-screen bg-blue-200">
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white/80 backdrop-blur rounded-xl p-6 shadow">
          <h1
            className="text-xl font-bold text-center mb-4"
            style={{ color: "var(--paleGreen, #98FB98)" }}
          >
            Finalise ton inscription
          </h1>

          {error && (
            <p className="bg-red-100 text-red-700 p-3 mb-4 rounded text-sm text-center">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="w-full border px-3 py-2 rounded"
              type="text"
              placeholder="Pseudo"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <select
              className="w-full border px-3 py-2 rounded"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              required
            >
              <option value="">Sélectionne ton genre</option>
              <option value="homme">Homme</option>
              <option value="femme">Femme</option>
            </select>

            <select
              className="w-full border px-3 py-2 rounded"
              value={genreRecherche}
              onChange={(e) => setGenreRecherche(e.target.value)}
              required
            >
              <option value="">Je recherche</option>
              <option value="homme">un Homme</option>
              <option value="femme">une Femme</option>
            </select>

            <input
              className="w-full border px-3 py-2 rounded"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              required
            />

            {/* Photo principale : on veut une photo de toi (visage adulte).
                Photos refusées : visages d'enfants, nudité ou contenu sexuel,
                violence ou armes, captures d'écran, dessins ou images de célébrités. */}
            <input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              required
            />
            <label
              htmlFor="avatar"
              className="block text-center border border-dashed border-gray-400 p-4 rounded cursor-pointer bg-white hover:bg-orange-50 text-gray-600"
            >
              {uploading
                ? "Envoi en cours…"
                : avatarFile
                ? `Photo sélectionnée : ${avatarFile.name}`
                : "Choisis une photo ou fais-la glisser ici"}
            </label>

            {/* Petit texte visible pour expliquer les règles photos */}
            <p className="text-xs text-gray-600 mt-1">
              Nous attendons une photo de toi, avec ton visage d’adulte
              clairement visible. Les photos suivantes pourront être refusées :
              visages d&apos;enfants, nudité ou contenu sexuel, scènes de
              violence ou avec des armes, captures d&apos;écran, images de
              célébrités ou uniquement des dessins.
            </p>

            {avatarPreview && (
              <img
                src={avatarPreview}
                alt="Aperçu"
                className="w-24 h-24 rounded-full mx-auto"
              />
            )}

            <div className="space-y-2 text-sm">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={acceptCgu}
                  onChange={(e) => setAcceptCgu(e.target.checked)}
                />
                <span>
                  J’accepte les CGU (
                  <Link href="/mentions-legales" className="underline">
                    voir les mentions légales
                  </Link>
                  )
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={acceptData}
                  onChange={(e) => setAcceptData(e.target.checked)}
                />
                <span>
                  J’accepte que mes données sensibles soient utilisées dans le
                  cadre du site
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={uploading || submitting}
              className="w-full py-2 rounded text-white hover:opacity-90 disabled:opacity-60"
              style={{ background: "var(--paleGreen, #98FB98)" }}
            >
              {submitting ? "Enregistrement…" : "Terminer"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
