// pages/forgot-password.tsx
// Page "Mot de passe oublié" — envoie un email de réinitialisation via Supabase
// Le lien dans l'email renvoie vers /reset-password.

import { useState, FormEvent } from "react";
import Head from "next/head";
import type { NextPage } from "next";
import { supabase } from "../lib/supabaseClient";

const ForgotPasswordPage: NextPage = () => {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setSuccessMessage(null);
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage("Merci d’entrer ton e-mail.");
      return;
    }

    setLoading(true);

    try {
      // 1) On privilégie l'URL du site déclarée dans les variables d'env
      // NEXT_PUBLIC_SITE_URL (prod Vercel).
      // 2) Sinon on tombe sur l'origin du navigateur (localhost, etc.).
      // 3) Sinon on finit sur le domaine public Keefon.
      const baseUrlRaw =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (typeof window !== "undefined" ? window.location.origin : "") ||
        "https://www.keefon.com";

      // On enlève un éventuel "/" final pour éviter "//reset-password".
      const baseUrl = baseUrlRaw.replace(/\/$/, "");

      const redirectTo = `${baseUrl}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo,
        }
      );

      if (error) {
        setErrorMessage(error.message || "Une erreur est survenue.");
        return;
      }

      setSuccessMessage(
        "Si cet e-mail existe dans Keefon, un lien de réinitialisation vient d’être envoyé."
      );
    } catch (err) {
      console.error("forgot-password error:", err);
      setErrorMessage(
        "Une erreur est survenue. Merci de réessayer dans quelques instants."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Mot de passe oublié – Keefon</title>
      </Head>

      <div className="min-h-screen bg-[#bfe5ff] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg px-8 py-10">
            <h1 className="text-2xl font-bold text-center text-pink-500 mb-2">
              Mot de passe oublié
            </h1>
            <p className="text-center text-sm text-gray-700 mb-2">
              Entre l’adresse e-mail de ton compte pour recevoir un lien de
              réinitialisation.
            </p>
            <p className="text-center text-[11px] text-gray-500 mb-6">
              Si tu ne reçois pas de mail, pense à vérifier tes spams. Si le
              lien ne fonctionne pas malgré tout, écris-nous pour récupérer ton
              accès.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-lime-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {errorMessage && (
                <p className="text-sm text-red-600">{errorMessage}</p>
              )}

              {successMessage && (
                <p className="text-sm text-green-600">{successMessage}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-lime-400 hover:bg-lime-500 transition-colors text-white font-semibold py-2.5 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Envoi en cours…" : "Envoyer le lien"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => (window.location.href = "/login")}
              className="mt-4 w-full text-center text-xs text-gray-600 hover:underline"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
