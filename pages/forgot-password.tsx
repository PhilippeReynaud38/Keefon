// -*- coding: utf-8 -*-
// Keefon — Demande de réinitialisation de mot de passe
// Route : /forgot-password
// Envoie un e-mail Supabase avec un lien vers /reset-password.

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!email) {
      setError("Merci d’indiquer ton e-mail.");
      return;
    }

    setLoading(true);
    try {
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL ?? "";

      const redirectTo = `${origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        console.error("[Keefon] resetPasswordForEmail error", error);
        // Message neutre pour ne pas révéler si l'email existe ou non
        setError(
          "Impossible d’envoyer l’e-mail pour le moment. Merci de réessayer dans quelques instants."
        );
      } else {
        setMessage(
          "Si cet e-mail existe dans Keefon, un lien de réinitialisation vient d’être envoyé."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#bcdcff] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg px-8 py-10">
        <h1 className="text-2xl font-bold text-center text-pink-600 mb-2">
          Mot de passe oublié
        </h1>
        <p className="text-sm text-center text-gray-600 mb-6">
          Entre l’adresse e-mail de ton compte pour recevoir un lien
          de réinitialisation.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-paleGreen"
              placeholder="ton.email@example.com"
              required
            />
          </div>

          {error && (
            <p className="text-xs text-red-600">
              {error}
            </p>
          )}
          {message && (
            <p className="text-xs text-green-600">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-paleGreen text-white font-semibold py-2 text-sm hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Envoi en cours..." : "Envoyer le lien"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-600">
          <Link href="/login" className="underline hover:text-pink-600">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
