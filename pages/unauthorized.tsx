// -*- coding: utf-8 -*-
// /pages/unauthorized.tsx — Vivaya
// -----------------------------------------------------------------------------
// Rôle : Page d'accès non autorisé + (si admin) petit panneau debug photos certifiées.
// Règles : code minimal, robuste, UTF-8, commentaires sobres. Aucun changement
//          fonctionnel hors correction de typage pour AdminDebug.
// Patch 2025-10-30 : AdminDebug est importé sans types de props → TS pensait que le
// composant n'acceptait aucun prop (IntrinsicAttributes). On caste localement le
// composant pour déclarer les props attendues (email, id, isAdmin) sans toucher au
// fichier du composant AdminDebug.
// -----------------------------------------------------------------------------

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import AdminDebug from "../components/AdminDebug";

// ✅ Typage local du composant AdminDebug pour éviter l'erreur IntrinsicAttributes
const AdminDebugTyped = AdminDebug as unknown as React.ComponentType<{
  email: string;
  id: string;
  isAdmin: boolean;
}>;

// ✅ Interface locale pour représenter les données utilisateur récupérées
interface UserProfile {
  email: string;
  is_admin: boolean;
}

// ✅ Interface locale pour les données de photo certifiée
interface CertifiedPhoto {
  id: string;
  user_id: string;
  url: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export default function AdminRoles() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [photos, setPhotos] = useState<CertifiedPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ✅ Récupère les infos utilisateur et photos en attente
  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/unauthorized");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email, is_admin")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        router.push("/unauthorized");
        return;
      }

      setUserProfile(profile);

      if (profile.is_admin) {
        const { data: pendingPhotos, error: photoError } = await supabase
          .from("certified_photos")
          .select("*")
          .neq("status", "approved")
          .order("created_at", { ascending: false });

        if (!photoError) setPhotos(pendingPhotos);
      } else {
        router.push("/unauthorized");
      }

      setLoading(false);
    };

    fetchData();
  }, [router]);

  if (loading) return <div className="text-center mt-10">Chargement...</div>;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-xl font-bold mb-4">📋 Vérification des photos certifiées</h1>

      {photos.length === 0 ? (
        <p>Aucune photo à examiner.</p>
      ) : (
        photos.map((photo) => (
          <div
            key={photo.id}
            className="bg-white rounded-lg shadow p-4 mb-4 border"
          >
            <img
              src={`https://your-project.supabase.co/storage/v1/object/public/${photo.url}`}
              alt="Photo à vérifier"
              className="w-32 h-32 object-cover mb-2"
            />
            <p>
              <strong>ID utilisateur :</strong> {photo.user_id}
            </p>
            <p>
              <strong>Soumise :</strong> {new Date(photo.created_at).toLocaleString()}
            </p>
            <p>
              <strong>Statut :</strong> {photo.status}
            </p>
            <div className="mt-2 space-x-2">
              <button className="bg-green-500 text-white px-3 py-1 rounded">
                ✓ Valider
              </button>
              <button className="bg-red-500 text-white px-3 py-1 rounded">
                ✗ Refuser
              </button>
            </div>
          </div>
        ))
      )}

      {/* 🔧 Debug admin (types fixés localement) */}
      <AdminDebugTyped
        email={userProfile?.email || ""}
        id={userProfile ? String(userProfile.is_admin) : "false"}
        isAdmin={userProfile?.is_admin || false}
      />
    </div>
  );
}
