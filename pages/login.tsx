// -*- coding: utf-8 -*-
// Fichier : /pages/login.tsx — Vivaya
// Objet   : Page de connexion. Affiche un BANDEAU haut persistant si ?account_deleted=1,
//           et gère la connexion classique.
// Règles  : simple, robuste, commenté, UTF-8.
// Dernière MàJ : 2025-11-06 (UTC+1)

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

// --- Bandeau dismissible, large et lisible (fixe en haut)
function DismissibleBanner({
  text,
  kind = 'success',
  onClose,
}: {
  text: string;
  kind?: 'success' | 'info' | 'error';
  onClose: () => void;
}) {
  const base =
    'fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,720px)] rounded-xl border px-4 py-3 shadow';
  const style =
    kind === 'success'
      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
      : kind === 'error'
      ? 'bg-red-50 text-red-900 border-red-200'
      : 'bg-blue-50 text-blue-900 border-blue-200';
  return (
    <div role="status" aria-live="polite" className={`${base} ${style}`}>
      <div className="flex items-start gap-3">
        <div className="pt-0.5 text-sm font-medium">{text}</div>
        <button
          type="button"
          aria-label="Fermer ce message"
          onClick={onClose}
          className="ml-auto inline-flex items-center justify-center rounded-md border px-2 py-1 text-xs hover:bg-black/5"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default function Login() {
  const router = useRouter();

  const prefill = typeof router.query.email === 'string' ? router.query.email : '';
  const checkMail = router.query.checkMail === '1';

  const [email, setEmail] = useState(prefill);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // État du bandeau haut
  const [banner, setBanner] = useState<{ text: string; kind?: 'success' | 'info' | 'error' } | null>(null);

  // Si ?account_deleted=1 → afficher un BANNDEAU haut persistant (jusqu’à fermeture),
  // puis nettoyer l’URL sans recharge.
  useEffect(() => {
    if (!router.isReady) return;

    const sp = new URLSearchParams(window.location.search);
    const flag = sp.get('account_deleted');

    if (flag === '1' || flag === 'true') {
      setBanner({
        text: 'Compte supprimé avec succès. Tu peux te reconnecter ou créer un nouveau compte.',
        kind: 'success',
      });

      sp.delete('account_deleted');
      const newUrl = `${router.pathname}${sp.toString() ? '?' + sp.toString() : ''}${window.location.hash}`;
      router.replace(newUrl, undefined, { shallow: true });
    }
  }, [router.isReady]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      if (error.message && error.message.includes('Email not confirmed')) {
        setError('Merci de confirmer ton e-mail avant de te connecter.');
      } else {
        setError('E-mail ou mot de passe incorrect.');
      }
      return;
    }

    // ✅ Redirection après connexion
    router.replace('/dashboard');
  }

  return (
    <main className="h-screen overflow-y-auto bg-blue-200 p-4 flex items-center justify-center">
      {banner && (
        <DismissibleBanner
          {...banner}
          onClose={() => setBanner(null)}
        />
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white/90 backdrop-blur rounded-xl shadow px-10 py-10 w-full max-w-sm space-y-6"
      >
        <h1 className="text-3xl font-extrabold text-pink-600 text-center">Se connecter</h1>

        {checkMail && (
          <p className="bg-green-100 text-green-700 p-3 rounded text-sm text-center">
            Un e-mail de confirmation vient d’être envoyé.
            <br />
            Valide-le, puis connecte-toi !
          </p>
        )}

        {error && (
          <p className="bg-red-100 text-red-700 p-3 rounded text-sm text-center">{error}</p>
        )}

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Email"
          className="input"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Mot de passe"
          className="input"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-paleGreen text-white font-semibold py-2 px-4 rounded hover:opacity-90 disabled:opacity-60"
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>

        <p className="text-center text-sm">
          Pas encore inscrit ?{' '}
          <Link href="/signup" className="text-blue-600 hover:underline">
            Créer un compte
          </Link>
        </p>
      </form>
    </main>
  );
}
