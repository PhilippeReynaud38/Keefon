// -*- coding: utf-8 -*-
// pages/signup.tsx — Vivaya
//
// ✅ Correctif : après inscription, on force le passage par /presignup.
//    - Si la session est déjà active → /presignup
//    - Sinon (email à confirmer) → /login?next=/presignup
//
// ✅ Ajout : rappel CGU + Mentions légales sur la page d'inscription.
//    - Texte sous le bouton "S’inscrire" avec liens vers /cgu et /mentions-legales.
//
// Règles projet : code simple, robuste, commentaires sobres, UTF-8, zéro gadget.
// -----------------------------------------------------------------------------

import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function Signup() {
  const router = useRouter();

  // État UI
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Soumission inscription
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Les deux mots de passe sont différents.");
      return;
    }

    setLoading(true);
    try {
      // Inscription email+password
      const { error: signErr } = await supabase.auth.signUp({ email, password });
      if (signErr) {
        setError(signErr.message);
        return;
      }

      // Si confirmation e-mail désactivée → session déjà présente.
      // Si activée → pas de session tant que mail non validé.
      const { data: sess } = await supabase.auth.getSession();
      const hasSession = Boolean(sess?.session);

      if (hasSession) {
        // Session active : on force le parcours presignup
        router.replace("/presignup");
      } else {
        // Pas encore de session : on renvoie vers login avec redirection automatique
        router.replace("/login?next=%2Fpresignup");
      }
    } catch (e: any) {
      setError(e?.message || "Erreur pendant l’inscription.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="h-screen overflow-y-auto bg-blue-200 p-4 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white/80 backdrop-blur p-10 rounded-xl shadow-xl w-full max-w-md space-y-6"
      >
        <h1 className="text-3xl font-extrabold text-pink-600 text-center">
          Créer un compte
        </h1>

        {error && (
          <p className="bg-red-100 border border-red-300 text-red-800 text-sm rounded p-3 text-center">
            {error}
          </p>
        )}

        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Adresse e-mail"
          className="input-field"
          autoComplete="email"
        />

        <input
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          className="input-field"
        />

        <input
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirme le mot de passe"
          className="input-field"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-paleGreen text-white font-semibold py-2 px-4 rounded hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Inscription…" : "S’inscrire"}
        </button>

        {/* Rappel légal : CGU + Mentions légales */}
        <p className="text-xs text-center text-gray-600">
          En créant un compte, tu acceptes nos{" "}
          <Link href="/cgu" className="text-blue-600 hover:underline">
            Conditions Générales d&apos;Utilisation
          </Link>{" "}
          et tu confirmes avoir pris connaissance des{" "}
          <Link
            href="/mentions-legales"
            className="text-blue-600 hover:underline"
          >
            Mentions légales
          </Link>
          .
        </p>

        <p className="text-center text-sm">
          Déjà inscrit ?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Se connecter
          </Link>
        </p>
      </form>
    </main>
  );
}
