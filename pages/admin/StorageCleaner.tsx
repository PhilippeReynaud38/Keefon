// UTF-8 — pages/admin/StorageCleaner.tsx
// -----------------------------------------------------------------------------
// Objet : Outil admin pour nettoyer les fichiers orphelins du bucket Storage `avatars`.
// Conformité Vivaya : code robuste, simple, logique, très commenté, sans gadgets.
//
// 🔒 AuthN/AuthZ — Guard léger
// - Cette page déclare : `StorageCleanerPage.requireAuth = true`.
// - Le guard dans _app.tsx NE S'APPLIQUE QUE si `Component.requireAuth === true`.
// - Comportement :
//     • non connecté  → redirection /login (gérée par le guard)
//     • inscription incomplète → redirection /presignup (pages protégées uniquement)
//     • après /logout → rester sur '/'
// - 👉 Aucune redirection locale ici. Loader doux tant que la session charge.
// -----------------------------------------------------------------------------
//
// NOTE IMPORTANTE (build error résolu) :
// Cette page utilisait `import { Button } from "@/components/ui/button"` (shadcn/ui).
// Comme ce module n’existe pas dans ton repo, on remplace par un petit bouton local
// `UIButton` stylé Tailwind, sans dépendance externe. AUCUNE AUTRE MODIF.
//
// -----------------------------------------------------------------------------

import type { NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { supabase } from "@/lib/supabaseClient";

// -----------------------------------------------------------------------------
// Petit bouton local (remplace shadcn/ui Button uniquement ici)
// -----------------------------------------------------------------------------
type UIButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "destructive";
};
function UIButton({ variant = "primary", className = "", ...props }: UIButtonProps) {
  const base =
    "inline-flex items-center gap-1 rounded-md px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "destructive"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "bg-blue-600 text-white hover:bg-blue-700";
  return <button className={`${base} ${styles} ${className}`} {...props} />;
}

// -----------------------------------------------------------------------------
// Conteneur de page simple (titre + <main> centré)
// -----------------------------------------------------------------------------
function PageContainer(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full">
      <Head>
        <title>{props.title} • Admin</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-2xl font-semibold mb-4">{props.title}</h1>
        {props.children}
      </main>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Loader doux pendant la résolution de la session
// -----------------------------------------------------------------------------
function SoftLoader() {
  return (
    <div className="py-12 text-center">
      <p>Chargement…</p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Page principale
// -----------------------------------------------------------------------------
type NextPageWithAuth<P = {}> = NextPage<P> & { requireAuth?: boolean };

const StorageCleanerPage: NextPageWithAuth = () => {
  const { isLoading } = useSessionContext();

  const [orphans, setOrphans] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [cleaned, setCleaned] = useState(false);

  // ⚙️ Cibles — ajuste si besoin :
  const bucketName = "avatars"; // nom du bucket
  const folder = "avatars"; // sous-dossier à lister dans le bucket

  // -----------------------------------------------------------------------------
  // Scanner : compare contenu du Storage et table `photos`
  // -----------------------------------------------------------------------------
  const scanStorage = async () => {
    setLoading(true);
    setCleaned(false);

    // 1) Lire les URLs présentes en base (table `photos`)
    const { data: photoData, error: photoError } = await supabase.from("photos").select("url");
    if (photoError) {
      console.error("Erreur récupération table photos :", photoError);
      setLoading(false);
      return;
    }

    const dbUrls = new Set((photoData ?? []).map((p) => p.url));

    // 2) Lister les fichiers présents dans le bucket/sous-dossier
    const { data: files, error: storageError } = await supabase.storage.from(bucketName).list(folder, {
      limit: 1000,
    });
    if (storageError) {
      console.error("Erreur listing storage :", storageError);
      setLoading(false);
      return;
    }

    // 3) Détecter les orphelins (présents dans Storage mais pas référencés en base)
    const unusedFiles = (files ?? [])
      .map((f) => `${folder}/${f.name}`)
      .filter((path) => !dbUrls.has(path));

    setOrphans(unusedFiles);
    setLoading(false);
  };

  // -----------------------------------------------------------------------------
  // Suppression des orphelins détectés
  // -----------------------------------------------------------------------------
  const deleteOrphans = async () => {
    if (orphans.length === 0) return;
    setLoading(true);

    const { error } = await supabase.storage.from(bucketName).remove(orphans);
    if (error) {
      console.error("Erreur suppression fichiers :", error);
    } else {
      setCleaned(true);
      setOrphans([]);
    }
    setLoading(false);
  };

  // Loader de session
  if (isLoading) {
    return (
      <PageContainer title="Administration — StorageCleaner">
        <SoftLoader />
      </PageContainer>
    );
  }

  // Rendu normal
  return (
    <PageContainer title="Administration — StorageCleaner">
      {loading && <p>Chargement...</p>}

      {!loading && (
        <>
          <p>{orphans.length} fichier(s) orphelin(s) détecté(s)</p>

          {orphans.length > 0 && (
            <ul className="my-4 list-disc list-inside">
              {orphans.map((file) => (
                <li key={file} className="text-sm break-all">
                  {file}
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-4 mt-4">
            <UIButton onClick={scanStorage}>🔁 Re-scanner</UIButton>

            <UIButton
              onClick={deleteOrphans}
              variant="destructive"
              disabled={orphans.length === 0}
              aria-disabled={orphans.length === 0}
              title={orphans.length === 0 ? "Aucun fichier orphelin détecté" : "Supprimer les fichiers orphelins"}
            >
              🧹 Supprimer les orphelins
            </UIButton>
          </div>

          {cleaned && <p className="text-green-600 mt-2">Nettoyage effectué ✅</p>}
        </>
      )}
    </PageContainer>
  );
};

StorageCleanerPage.requireAuth = true;
export default StorageCleanerPage;
