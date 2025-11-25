// -*- coding: utf-8 -*-
// Fichier: pages/.../delete.tsx
// Objet: Page de suppression/désactivation (avec Layout) — même logique que AccountSettings.tsx
// Changements: appel API /api/account/self-delete + fallback RPC 'delete_user' ; signOut + redirection
// Dépendances: supabase client, Next router, Layout
// Dernière MàJ: 2025-11-05 (UTC+1)

import { useRouter } from 'next/router';
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Layout from '../../components/Layout';

export default function AccountSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const deactivateAccount = async () => {
    const confirmed = confirm("Souhaitez-vous désactiver temporairement votre compte ?");
    if (!confirmed) return;
    alert("Fonction de désactivation à venir bientôt.");
  };

  const deleteAccount = async () => {
    const confirmed = confirm("Supprimer définitivement votre compte ? Cette action est irréversible.");
    if (!confirmed) return;

    setLoading(true);
    try {
      const { data: { user }, error: uerr } = await supabase.auth.getUser();
      if (uerr || !user) {
        alert("Session invalide. Merci de vous reconnecter.");
        setLoading(false);
        return;
      }

      const apiRes = await fetch('/api/account/self-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (apiRes.ok) {
        await supabase.auth.signOut();
        router.push('/');
        return;
      }

      if (apiRes.status === 404) {
        const { error } = await supabase.rpc('delete_user');
        if (!error) {
          alert("Votre compte a été supprimé.");
          await supabase.auth.signOut();
          router.push('/');
        } else {
          alert("Erreur (RPC) : " + error.message);
        }
      } else {
        const msg = await apiRes.text().catch(() => "");
        alert("Échec (API) : " + (msg || `HTTP ${apiRes.status}`));
      }
    } catch (e: any) {
      alert("Erreur inattendue : " + (e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="max-w-lg mx-auto mt-12 p-6 bg-white rounded shadow space-y-6">
        <h1 className="text-2xl font-bold text-pink-600">Paramètres du compte</h1>

        <button
          onClick={deactivateAccount}
          disabled={loading}
          className="text-blue-600 hover:underline block text-sm"
        >
          ⏸ Désactiver temporairement mon compte
        </button>

        <button
          onClick={deleteAccount}
          disabled={loading}
          className="text-red-500 hover:underline block text-sm"
        >
          ❌ Supprimer définitivement mon compte
        </button>

        <p className="text-xs text-gray-400 mt-4">
          La désactivation est réversible. La suppression est <strong>définitive</strong> et effacera toutes vos données.
        </p>
      </section>
    </Layout>
  );
}
