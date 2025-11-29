// -*- coding: utf-8 -*-
// Fichier : /pages/signup.tsx — Vivaya / Keefon
// Objet   : Page de création de compte (e-mail + mot de passe).
//           - Valide la complexité du mot de passe côté client.
//           - Affiche des messages d’erreur clairs.
//           - Bloque les e-mails jetables UNIQUEMENT quand le site
//             tourne sur keefon.com (prod réelle).
// Règles  : simple, robuste, commenté, UTF-8, pas d’usine à gaz.
// Dernière MàJ : 2025-11-29 (UTC+1)

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

// --- Règle de complexité : 8+ caractères, 1 minuscule, 1 majuscule, 1 chiffre, 1 spécial.
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

// --- Quelques domaines classiques d'e-mails jetables.
const DISPOSABLE_EMAIL_DOMAINS: string[] = [
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'mailinator.com',
  'mailinator.net',
  'maildrop.cc',
  '10minutemail.com',
  '10minutemail.net',
  'tempmail.com',
  'tempmail.net',
];

// Vérifie si l'adresse e-mail ressemble à un e-mail jetable.
function isDisposableEmail(email: string): boolean {
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1].toLowerCase().trim();
  if (!domain) return false;

  return DISPOSABLE_EMAIL_DOMAINS.some(
    (bad) => domain === bad || domain.endsWith('.' + bad),
  );
}

// Active le blocage des e-mails jetables UNIQUEMENT sur le vrai domaine.
function isDisposableBanEnabledOnHost(): boolean {
  if (typeof window === 'undefined') {
    // Côté serveur : on ne bloque jamais, la vérif sera refaite côté client.
    return false;
  }
  const host = window.location.hostname.toLowerCase();

  // À adapter si tu ajoutes d'autres domaines (www, sous-domaines…)
  return host === 'keefon.com' || host === 'www.keefon.com';
}

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [loading, setLoading] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Reset des erreurs
    setFormError(null);
    setEmailError(null);
    setPasswordError(null);

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password || !passwordConfirm) {
      setFormError('Merci de remplir tous les champs.');
      return;
    }

    if (password !== passwordConfirm) {
      setPasswordError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      setPasswordError(
        'Ton mot de passe doit contenir au minimum 8 caractères, ' +
          'dont au moins une lettre minuscule, une lettre majuscule, ' +
          'un chiffre et un caractère spécial.',
      );
      return;
    }

    // Blocage des e-mails jetables uniquement sur keefon.com
    if (isDisposableBanEnabledOnHost() && isDisposableEmail(trimmedEmail)) {
      setEmailError(
        'Les adresses e-mail jetables (type Yopmail, Mailinator, 10minutemail…) ' +
          "ne sont pas acceptées. Merci d’utiliser une adresse stable (Gmail, Outlook, etc.).",
      );
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });

      if (error) {
        setFormError(
          "Impossible de créer le compte pour l’instant. " +
            `Détail technique : ${error.message}`,
        );
        return;
      }

      // Redirection classique vers le début du parcours profil.
      await router.push('/presignup');
    } catch (err: any) {
      setFormError(
        "Une erreur inconnue s’est produite pendant l’inscription.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-blue-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-xl px-8 py-10 w-full max-w-md"
      >
        <h1 className="text-3xl font-bold text-center text-pink-500 mb-6">
          Créer un compte
        </h1>

        {/* Erreur globale en haut du formulaire */}
        {formError && (
          <div className="mb-4 rounded-lg bg-red-100 text-red-700 px-4 py-3 text-sm">
            {formError}
          </div>
        )}

        {/* Erreur spécifique e-mail jetable */}
        {emailError && (
          <div className="mb-4 rounded-lg bg-red-100 text-red-700 px-4 py-3 text-sm">
            {emailError}
          </div>
        )}

        <label className="block text-sm font-medium mb-1" htmlFor="email">
          Adresse e-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="mb-3 w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-paleGreen"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="block text-sm font-medium mb-1" htmlFor="password">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className="mb-3 w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-paleGreen"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label
          className="block text-sm font-medium mb-1"
          htmlFor="passwordConfirm"
        >
          Confirme le mot de passe
        </label>
        <input
          id="passwordConfirm"
          type="password"
          autoComplete="new-password"
          className="mb-3 w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-paleGreen"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          required
        />

        {/* Erreur spécifique mot de passe */}
        {passwordError && (
          <p className="mb-3 text-sm text-red-600">{passwordError}</p>
        )}

        {/* Petit texte d’explication sous les champs */}
        <p className="text-xs text-gray-600 mb-2">
          Ton mot de passe doit contenir au minimum 8 caractères, dont au moins
          une lettre minuscule, une lettre majuscule, un chiffre et un caractère
          spécial.
        </p>
        <p className="text-xs text-gray-600 mb-4">
          Les adresses e-mail jetables ne
          sont pas acceptées sur la version publique de Keefon.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-paleGreen text-white font-semibold py-2 px-4 rounded hover:opacity-90 disabled:opacity-60"
        >
          {loading ? 'Inscription…' : "S’inscrire"}
        </button>

        <p className="mt-4 text-center text-xs text-gray-600">
          En créant un compte, tu acceptes nos{' '}
          <Link
            href="/cgu"
            className="text-blue-600 hover:underline"
            target="_blank"
          >
            Conditions Générales d’Utilisation
          </Link>{' '}
          et tu confirmes avoir pris connaissance des{' '}
          <Link
            href="/mentions-legales"
            className="text-blue-600 hover:underline"
            target="_blank"
          >
            Mentions légales
          </Link>
          .
        </p>

        <p className="mt-4 text-center text-sm">
          Déjà inscrit ?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Se connecter
          </Link>
        </p>
      </form>
    </main>
  );
}
