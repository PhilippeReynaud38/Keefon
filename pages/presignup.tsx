// pages/presignup.tsx — Keefon / Vivaya (UTF-8)
// Page de finalisation d'inscription avec upload photo (clic + drag & drop).
// - Récupère l'utilisateur une seule fois au montage, stocke son userId.
// - Upload de la photo principale dans le bucket "avatars" au chemin avatars/<userId>_<timestamp>.jpg
// - Nettoie les anciennes photos temporaires de ce user dans le même bucket.
// - Ne touche pas aux photos de galerie.

import React, { useEffect, useState, type ChangeEvent, type DragEvent } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

// --- Utils -------------------------------------------------------------------

// Calcul d'âge simple à partir d'une date ISO (YYYY-MM-DD)
function getAgeFromISO(dateStr: string): number {
  const d = new Date(dateStr);
  const t = new Date();
  let age = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) {
    age--;
  }
  return age;
}

// Compression JPEG (~1600px) pour accélérer l'upload
async function compressImage(
  file: File,
  maxSide = 1600,
  quality = 0.82
): Promise<Blob> {
  const img = new Image();
  const url = URL.createObjectURL(file);

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (e) => reject(e);
    img.src = url;
  });

  const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * ratio);
  canvas.height = Math.round(img.height * ratio);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    URL.revokeObjectURL(url);
    return file;
  }

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob: Blob = await new Promise((resolve) => {
    canvas.toBlob(
      (b) => resolve(b as Blob),
      "image/jpeg",
      quality
    );
  });

  URL.revokeObjectURL(url);
  return blob;
}

// Upload dans le bucket "avatars" sous la forme avatars/<userId>_<timestamp>.jpg
async function uploadAvatar(file: File, userId: string): Promise<string> {
  const fileName = `${userId}_${Date.now()}.jpg`;
  const path = `avatars/${fileName}`;

  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw error;
  }
  return path;
}

// Attendre que le fichier soit visible dans Storage (évite certains 404 juste après upload)
async function waitUntilFileExists(
  path: string,
  maxTries = 6,
  delayMs = 700
): Promise<boolean> {
  const parts = path.split("/");
  const dir = parts[0]; // "avatars"
  const name = parts[1];

  for (let i = 0; i < maxTries; i++) {
    const { data, error } = await supabase.storage
      .from("avatars")
      .list(dir, { limit: 1, search: name });

    if (!error && data && data.length) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
}

// Supprime les anciennes photos temporaires de ce user dans le bucket "avatars"
async function deleteOldAvatars(userId: string, keepPath?: string | null) {
  const { data: files, error } = await supabase.storage
    .from("avatars")
    .list("avatars", { limit: 1000 });

  if (error || !files) return;

  const keepName = keepPath ? keepPath.split("/")[1] : null;
  const toDelete: string[] = [];

  for (const f of files) {
    if (!f.name.startsWith(`${userId}_`)) continue;
    if (keepName && f.name === keepName) continue;
    toDelete.push(`avatars/${f.name}`);
  }

  if (toDelete.length) {
    await supabase.storage.from("avatars").remove(toDelete);
  }
}

// --- Composant principal -----------------------------------------------------

const PresignupPage: React.FC = () => {
  const router = useRouter();

  // User
  const [userId, setUserId] = useState<string | null>(null);
  const [checkingUser, setCheckingUser] = useState(true);

  // Formulaire
  const [username, setUsername] = useState("");
  const [genre, setGenre] = useState("");
  const [genreRecherche, setGenreRecherche] = useState("");
  const [birthday, setBirthday] = useState("");
  const [acceptCgu, setAcceptCgu] = useState(false);
  const [acceptData, setAcceptData] = useState(false);

  // Photo
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);

  // UI
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Récupération utilisateur + éventuel redirect vers dashboard si déjà complété
  useEffect(() => {
    const checkUserAndProgress = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          router.replace("/login");
          return;
        }

        setUserId(user.id);

        // Déjà complété ? → dashboard
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

        if (presignup && photo) {
          router.replace("/dashboard");
          return;
        }
      } finally {
        setCheckingUser(false);
      }
    };

    checkUserAndProgress();
  }, [router]);

  // Traitement commun d'un fichier (clic ou drag & drop)
  const processPickedFile = async (file: File) => {
    if (!userId) {
      setError("Ta session a expiré. Merci de te reconnecter.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Compression JPEG
      const compressedBlob = await compressImage(file);
      const jpegFile = new File([compressedBlob], file.name, {
        type: "image/jpeg",
      });

      // Upload
      const path = await uploadAvatar(jpegFile, userId);

      // Nettoyage des anciens avatars de ce user (sauf celui-ci)
      await deleteOldAvatars(userId, path);

      // On attend que le fichier soit bien visible
      const ok = await waitUntilFileExists(path);
      if (!ok) {
        throw new Error(
          "La photo a été envoyée mais n'est pas encore disponible. Réessaie dans quelques secondes."
        );
      }

      // Mise à jour UI
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarFile(jpegFile);
      setAvatarPath(path);
      setAvatarPreview(URL.createObjectURL(jpegFile));
    } catch (e: any) {
      console.error(e);
      setError(
        e?.message || "Erreur lors du téléchargement de la photo. Réessaie."
      );
    } finally {
      setUploading(false);
    }
  };

  // Clic classique sur input file
  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (uploading) return;
    const file = e.target.files?.[0];
    if (!file) return;
    await processPickedFile(file);
  };

  // Drag & drop sur la zone de label (optionnel, même si tu ne le mentionnes plus dans le texte)
  const handleDrop = async (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processPickedFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
  };

  // Submit final
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userId) {
      setError("Ta session a expiré. Merci de te reconnecter.");
      return;
    }

    if (
      !username ||
      !genre ||
      !genreRecherche ||
      !birthday ||
      !avatarFile ||
      !avatarPath
    ) {
      setError("Tous les champs sont obligatoires.");
      return;
    }

    if (!acceptCgu || !acceptData) {
      setError("Tu dois accepter les CGU et l'utilisation de tes données.");
      return;
    }

    const age = getAgeFromISO(birthday);
    if (age < 18 || age > 110) {
      setError("L'âge doit être entre 18 et 110 ans.");
      return;
    }

    setSubmitting(true);

    try {
      // On s'assure que la photo existe bien dans le bucket
      const exists = await waitUntilFileExists(avatarPath);
      if (!exists) {
        throw new Error(
          "Ta photo principale n'est pas encore disponible. Réessaie dans quelques secondes."
        );
      }

      // On garde uniquement la dernière photo temporaire de ce user
      await deleteOldAvatars(userId, avatarPath);

      // Enregistrement presignup_data
      const { error: presignupError } = await supabase
        .from("presignup_data")
        .insert([
          {
            user_id: userId,
            username,
            genre,
            birthday,
            genre_recherche: genreRecherche,
            accepted_cgu: acceptCgu,
            accepted_sensitive_data: acceptData,
          },
        ]);

      if (presignupError) throw presignupError;

      // Màj profil (pseudo)
      await supabase
        .from("profiles")
        .update({ username })
        .eq("id", userId);

      // Enregistrement de la photo principale
      const { error: photoError } = await supabase.from("photos").insert([
        {
          user_id: userId,
          url: avatarPath, // on stocke le PATH interne (avatars/...)
          is_main: true,
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ]);

      if (photoError) throw photoError;

      router.push("/dashboard");
    } catch (e: any) {
      console.error(e);
      setError(
        e?.message || "Erreur pendant l'enregistrement de ton inscription."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingUser) {
    return (
      <main className="min-h-screen bg-blue-200 flex items-center justify-center">
        <p className="text-sm text-gray-700">Chargement…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-blue-200">
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white/80 backdrop-blur rounded-xl p-6 shadow">
          <h1 className="text-xl font-bold text-center mb-4 text-lime-500">
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

            {/* IMPORTANT : valeurs identiques à l'ancien presignup
                genre = "homme" | "femme" */}
            <select
              className="w-full border px-3 py-2 rounded"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              required
            >
              <option value="">Genre</option>
              <option value="femme">Femme</option>
              <option value="homme">Homme</option>
            </select>

            {/* IMPORTANT : genre_recherche = "homme" | "femme"
                (les labels restent "un Homme" / "une Femme") */}
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

            {/* Upload photo principale */}
            <input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <label
              htmlFor="avatar"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="block text-center border border-dashed border-gray-400 p-4 rounded cursor-pointer bg-white hover:bg-orange-50 text-gray-600"
            >
              {uploading
                ? "Envoi en cours…"
                : avatarFile
                ? `Photo sélectionnée : ${avatarFile.name}`
                : "Choisis une photo depuis ton téléphone ou ton ordinateur"}
            </label>

            <p className="text-xs text-gray-600 mt-1">
              Nous attendons une photo de toi, avec ton visage d&apos;adulte
              clairement visible. Les photos suivantes pourront être refusées :
              visages d&apos;enfants, nudité ou contenu sexuel, scènes de
              violence ou avec des armes, captures d&apos;écran, images de
              célébrités ou uniquement des dessins.
            </p>

            {avatarPreview && (
              <img
                src={avatarPreview}
                alt="Aperçu de la photo"
                className="w-24 h-24 rounded-full mx-auto mt-2 object-cover"
              />
            )}

            <div className="space-y-2 text-sm mt-2">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={acceptCgu}
                  onChange={(e) => setAcceptCgu(e.target.checked)}
                />
                <span>
                  J&apos;accepte les CGU (
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
                  J&apos;accepte que mes données sensibles soient utilisées dans
                  le cadre du site.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={uploading || submitting}
              className="w-full py-2 rounded text-white hover:opacity-90 disabled:opacity-60"
              style={{ background: "#59FF72" }} // paleGreen
            >
              {submitting ? "Enregistrement…" : "Terminer"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default PresignupPage;
