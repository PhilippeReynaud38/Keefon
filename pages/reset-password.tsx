// -*- coding: utf-8 -*-
// Keefon — Réinitialisation du mot de passe
// Route : /reset-password
// Appelée depuis le lien contenu dans l'e-mail Supabase.

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { supabase } from "@/lib/supabaseClient";

type Status = "checking" | "ready" | "saving" | "done" | "error";



export default function ResetPasswordPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  // afficher / masquer les mots de passe
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  // Vérifier que le lien est valide (session de recovery active)
  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        console.error("[Keefon] getUser error/reset", error);
        setError(
          "Ce lien de réinitialisation n’est plus valide. Merci de refaire une demande de mot de passe oublié."
        );
        setStatus("error");
      } else {
        setStatus("ready");
      }
    };

    checkUser();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== password2) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setStatus("saving");

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        const raw = String(error.message || "").toLowerCase();
        let msg =
          "Impossible de mettre à jour le mot de passe. Merci de réessayer.";

        if (raw.includes("new password should be different")) {
          msg = "Le nouveau mot de passe doit être différent de l’ancien.";
        }

        console.error("[Keefon] updateUser error/reset", error);
        setError(msg);
        setStatus("ready");
      } else {
        setStatus("done");
      }
    } catch (err: any) {
      const raw = String(err?.message || "").toLowerCase();
      let msg =
        "Impossible de mettre à jour le mot de passe. Merci de réessayer.";

      if (raw.includes("new password should be different")) {
        msg = "Le nouveau mot de passe doit être différent de l’ancien.";
      }

      console.error("[Keefon] updateUser exception/reset", err);
      setError(msg);
      setStatus("ready");
    }
  };

  const disabled =
    status === "checking" || status === "saving" || status === "done";

  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
        <title>Keefon</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-[#bcdcff] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg px-8 py-10">
        <h1 className="text-2xl font-bold text-center text-pink-600 mb-4">
          Nouveau mot de passe
        </h1>

        {status === "checking" && (
          <p className="text-center text-sm text-gray-600">
            Vérification du lien en cours…
          </p>
        )}

        {status === "error" && (
          <>
            <p className="text-center text-sm text-red-600 mb-4">{error}</p>
            <p className="text-center text-xs text-gray-600">
              <Link
                href="/forgot-password"
                className="underline hover:text-pink-600"
              >
                Refaire une demande de lien
              </Link>
            </p>
          </>
        )}

        {(status === "ready" || status === "saving" || status === "done") && (
          <>
            {status !== "done" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Champ nouveau mot de passe + œil */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nouveau mot de passe
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-paleGreen pr-10"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute bottom-2.5 right-2 flex items-center text-xs text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>

                {/* Champ confirmation + œil */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type={showPassword2 ? "text" : "password"}
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-paleGreen pr-10"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword2
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                    onClick={() => setShowPassword2((v) => !v)}
                    className="absolute bottom-2.5 right-2 flex items-center text-xs text-gray-500 hover:text-gray-700"
                  >
                    {showPassword2 ? "🙈" : "👁"}
                  </button>
                </div>

                {error && (
                  <p className="text-xs text-red-600">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={disabled}
                  className="w-full rounded-md bg-paleGreen text-white font-semibold py-2 text-sm hover:opacity-90 disabled:opacity-60"
                >
                  {status === "saving"
                    ? "Mise à jour…"
                    : "Mettre à jour le mot de passe"}
                </button>
              </form>
            )}

            {status === "done" && (
              <>
                <p className="text-center text-sm text-green-600 mb-4">
                  Ton mot de passe a été mis à jour avec succès.
                </p>
                <p className="text-center text-xs text-gray-600">
                  Tu peux maintenant{" "}
                  <Link href="/login" className="underline hover:text-pink-600">
                    te connecter à Keefon
                  </Link>
                  .
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  </>
  );
}
