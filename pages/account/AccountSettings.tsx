// -*- coding: utf-8 -*-
// Fichier: AccountSettings.tsx
// Objet: Paramètres du compte — désactivation (placeholder) + suppression totale du compte
// Changements: appel API /api/account/self-delete avec fallback sur RPC 'delete_user' ; déconnexion + redirection sûres
// Dépendances: supabase client (auth.getUser, rpc), Next router
// Sécurité: vérifie l’identité côté API ; aucune clé service côté client
// Dernière MàJ: 2025-11-05 (UTC+1)

import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import { useState } from 'react';

export default function AccountSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const deactivateAccount = async () => {
    const confirmed = confirm("Souhaitez-vous désactiver temporairement votre compte ?");
    if (!confirmed) return;
    alert("Fonction désactivation à venir.");
  };

  // Appelle l'API sécurisée ; si absente (404), fallback vers la RPC existante 'delete_user'
  const deleteAccount = async () => {
    const confirmed = confirm("❌ Supprimer définitivement votre compte ? Cette action est irréversible.");
    if (!confirmed) return;

    setLoading(true);
    try {
      // 1) Récupère l'utilisateur courant (id utilisé par l'API pour vérifier l'identité)
      const { data: { user }, error: uerr } = await supabase.auth.getUser();
      if (uerr || !user) {
        alert("Session invalide. Merci de vous reconnecter.");
        setLoading(false);
        return;
      }

      // 2) Tente l'API serveur (service role)
      const apiRes = await fetch('/api/account/self-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (apiRes.ok) {
        // OK serveur: on déconnecte proprement puis on redirige
        await supabase.auth.signOut();
        router.push('/');
        return;
      }

      if (apiRes.status === 404) {
        // 3) Fallback: RPC existante (ne casse pas l’actuel)
        const { error } = await supabase.rpc('delete_user');
        if (!error) {
          alert("Compte supprimé avec succès.");
          await supabase.auth.signOut();
          router.push('/');
        } else {
          alert("Erreur (RPC) : " + error.message);
        }
      } else {
        const msg = await apiRes.text().catch(() => "");
        alert("Échec de suppression (API) : " + (msg || `HTTP ${apiRes.status}`));
      }
    } catch (e: any) {
      alert("Erreur inattendue : " + (e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
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
        La désactivation est réversible. La suppression est <strong>définitive</strong>.
      </p>
    </section>
  );
}
