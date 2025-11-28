// -*- coding: utf-8 -*-
// Fichier : /pages/parametres.tsx — Vivaya
//
// Objet : Page Paramètres (newsletter autosave, options abonnés,
//         sécurité du compte : changer mot de passe, déconnexion, désinscription).
//
// Rèles Vivaya : code simple, robuste, commenté, pas d’usine à gaz, UTF-8.
// Invariants : self-delete via /api/account/self-delete, aucune clé secrète exposée côté client.
// Dernière MàJ : 2025-11-07 (UTC+1)

import { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";
import { InstallIconButton } from "@/components/InstallIconButton"; // Bouton permanent icône Keefon

// --- Types --- //
type Settings = {
  is_public: boolean;
  newsletter: boolean;
  visible_to_certified_only?: boolean;
  visibility_scope?: "all" | "certified";
};

type ToastKind = "success" | "info" | "error";

const BG_URL = "/bg-parametres-ext.png";

// ============================================================================
export default function Parametres() {
  const router = useRouter();

  // --- UI state --- //
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Toast minimal --- //
  const [toast, setToast] = useState<{ text: string; kind: ToastKind } | null>(
    null
  );
  const showToast = (text: string, kind: ToastKind = "success") => {
    setToast({ text, kind });
    window.setTimeout(() => setToast(null), 3000);
  };

  // --- Session --- //
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [canChangePassword, setCanChangePassword] = useState(true);

  // Abonné ? (tiers: premium / elite / essentiel)
  const [isSubscriber, setIsSubscriber] = useState(false);

  // --- Settings (UI) --- //
  const [isPublic, setIsPublic] = useState(true);
  const [newsletter, setNewsletter] = useState<boolean>(true);
  const [visibleToCertifiedOnly, setVisibleToCertifiedOnly] = useState(false);

  // --- Désinscription : <details> accessible même sans JS --- //
  const deleteSectionRef = useRef<HTMLDivElement>(null);
  const deleteDetailsRef = useRef<HTMLDetailsElement>(null);
  const openDelete = (e?: React.MouseEvent<HTMLAnchorElement>) => {
    if (e) e.preventDefault();
    if (deleteDetailsRef.current) deleteDetailsRef.current.open = true;
    window.location.hash = "desinscription";
    requestAnimationFrame(() => {
      deleteSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  // ==========================================================================
  // Chargement session + paramètres
  // ==========================================================================
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      setInfo(null);

      // 1) Session
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Connexion requise.");
        setLoading(false);
        return;
      }
      setUserId(user.id);
      setUserEmail(user.email ?? null);

      const provider = (user as any)?.app_metadata?.provider;
      setCanChangePassword(!provider || provider === "email");

      // 2) Détection abonné (basée UNIQUEMENT sur le plan de base)
      // Règle actuelle : seuls les vrais abonnés (plan de base ≠ free) ont accès
      // aux réglages réservés. Les accès offerts partiels (overrides e-mail,
      // périodes d’essai, etc.) NE doivent PAS débloquer ce bloc.
      try {
        const { data: prof, error: profErr } = await supabase
          .from("profiles")
          .select("subscription_tier")
          .eq("id", user.id)
          .maybeSingle();

        if (!profErr && prof) {
          const base = String((prof as any)?.subscription_tier ?? "").toLowerCase();
          setIsSubscriber(
            base === "premium" || base === "elite" || base === "essentiel"
          );
        } else {
          setIsSubscriber(false);
        }
      } catch {
        setIsSubscriber(false);
      }

      // 3) Lecture paramètres (user_settings)
      try {
        let row: any = null;

        const q1 = await supabase
          .from("user_settings")
          .select("is_public, newsletter, visible_to_certified_only, visibility_scope")
          .eq("user_id", user.id)
          .maybeSingle();

        if (q1.data) {
          row = q1.data;
        } else {
          const q2 = await supabase
            .from("user_settings")
            .select("is_public, newsletter, visible_to_certified_only")
            .eq("user_id", user.id)
            .maybeSingle();
          row = q2.data ?? null;
        }

        if (row) {
          setIsPublic(row.is_public !== false);
          setNewsletter(!!row.newsletter);
          const certOnly =
            row.visible_to_certified_only ??
            (row.visibility_scope === "certified");
          setVisibleToCertifiedOnly(!!certOnly);
          setInfo("Paramètres chargés.");
        } else {
          setInfo("Paramètres par défaut.");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ==========================================================================
  // Helpers
  // ==========================================================================
  const upsertUserSettings = async (
    payloadWithScope: any,
    payloadFallback: any
  ) => {
    const { error: upErr } = await supabase
      .from("user_settings")
      .upsert(payloadWithScope, { onConflict: "user_id" });
    if (upErr) {
      const { error: upErr2 } = await supabase
        .from("user_settings")
        .upsert(payloadFallback, { onConflict: "user_id" });
      if (upErr2) throw upErr2;
    }
  };

  const saveSettings = async (next: Settings, silent = false) => {
    if (!userId) return;
    if (!silent) {
      setSaving(true);
      setInfo(null);
      setError(null);
    }

    try {
      const scope: "all" | "certified" = next.visible_to_certified_only
        ? "certified"
        : "all";

      const payloadWithScope = {
        user_id: userId,
        is_public: next.is_public,
        newsletter: next.newsletter,
        visible_to_certified_only: !!next.visible_to_certified_only,
        visibility_scope: scope, // peut ne pas exister en base
      };

      const payloadFallback = {
        user_id: userId,
        is_public: next.is_public,
        newsletter: next.newsletter,
        visible_to_certified_only: !!next.visible_to_certified_only,
      };

      await upsertUserSettings(payloadWithScope, payloadFallback);

      if (!silent) {
        setInfo("Paramètres enregistrés.");
        showToast("Paramètres enregistrés.", "success");
      }
    } catch {
      if (!silent) {
        setError("Enregistrement impossible pour le moment.");
        showToast("Enregistrement impossible pour le moment.", "error");
      }
    } finally {
      if (!silent) setSaving(false);
    }
  };

  const current: Settings = useMemo(
    () => ({
      is_public: isPublic,
      newsletter,
      visible_to_certified_only: visibleToCertifiedOnly,
      visibility_scope: visibleToCertifiedOnly ? "certified" : "all",
    }),
    [isPublic, newsletter, visibleToCertifiedOnly]
  );

  // ==========================================================================
  // Actions compte
  // ==========================================================================
  const changePassword = async () => {
    if (!canChangePassword) {
      showToast("Indisponible pour les connexions sociales.", "info");
      return;
    }
    if (loading) {
      showToast("La page charge encore, réessaie dans un instant.", "info");
      return;
    }

    let email = userEmail;
    if (!email) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      email = user?.email ?? null;
      if (!email) {
        showToast("Utilisateur introuvable.", "error");
        return;
      }
      setUserEmail(email);
    }

    const currentPwd = prompt("Mot de passe ACTUEL :");
    if (currentPwd === null) return;
    const nextPwd = prompt("NOUVEAU mot de passe (min. 6 caractères) :");
    if (nextPwd === null) return;

    if (!currentPwd || !nextPwd) {
      showToast("Changement annulé (mot de passe vide).", "info");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: nextPwd,
      });
      if (error) throw error;
      showToast("Mot de passe mis à jour.", "success");
    } catch {
      showToast(
        "Impossible de changer le mot de passe pour le moment.",
        "error"
      );
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch {
      showToast("Déconnexion impossible pour le moment.", "error");
    }
  };

  const deleteAccount = async () => {
    const sure = window.confirm(
      "Supprimer ton compte Keefon ?\n\n" +
        "Cette action est irréversible. Tes messages et tes données\n" +
        "seront supprimés (ou anonymisés) selon nos règles de sécurité."
    );
    if (!sure) return;

    try {
      const res = await fetch("/api/account/self-delete", { method: "POST" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      showToast("Compte supprimé. À bientôt peut-être.", "success");
      await supabase.auth.signOut();
      router.push("/");
    } catch {
      showToast(
        "Impossible de supprimer le compte pour le moment.",
        "error"
      );
    }
  };

  // ==========================================================================
  // Rendu
  // ==========================================================================
  return (
    <>
      <Head>
        <title>Paramètres | Keefon</title>
        <meta
          name="description"
          content="Gère tes paramètres de compte, confidentialité et notifications."
        />
      </Head>

      {/* Toast flottant */}
      {toast && (
        <div className="fixed inset-x-0 top-4 flex justify-center z-50 px-4">
          <div
            className={[
              "rounded-2xl px-4 py-2 text-sm shadow-lg",
              toast.kind === "success"
                ? "bg-emerald-600 text-white"
                : toast.kind === "error"
                ? "bg-red-600 text-white"
                : "bg-blue-600 text-white",
            ].join(" ")}
          >
            {toast.text}
          </div>
        </div>
      )}

      <div
        className="min-h-screen px-4 pt-6 pb-16"
        style={{
          backgroundImage: `url('${BG_URL}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between mb-6">
          <div style={{ width: 110 }} />
          <h1 className="text-xl font-bold text-black">Paramètres</h1>
          <Link
            href="/dashboard"
            aria-label="Menu"
            className="px-4 py-2 rounded-xl bg-yellowGreen text-black font-semibold shadow-md hover:opacity-90 transition"
          >
            ☰ Retour
          </Link>
        </div>

        <div className="mx-auto max-w-3xl space-y-8">
          {/* 1 — Tout le monde */}
          <section className="rounded-2xl bg-white/90 p-6 shadow-sm ring-1 ring-gray-200">
            <header className="mb-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Paramètres — tout le monde
              </h2>
              {userEmail && (
                <p className="text-sm text-gray-700 mt-1">
                  Connecté en tant que <b>{userEmail}</b>
                </p>
              )}
            </header>

            {loading ? (
              <p>Chargement…</p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                }}
                className="space-y-6"
              >
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    E-mails & nouveautés
                  </label>
                  <div className="mt-2">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="accent-blue-600"
                        checked={newsletter}
                        onChange={async (e) => {
                          const next = e.target.checked;
                          setNewsletter(next);
                          await saveSettings(
                            {
                              is_public: isPublic,
                              newsletter: next,
                              visible_to_certified_only: visibleToCertifiedOnly,
                            },
                            true
                          );
                          setInfo("Préférence newsletter enregistrée.");
                          showToast(
                            "Préférence newsletter enregistrée.",
                            "success"
                          );
                        }}
                      />
                      Recevoir des conseils & actus
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await saveSettings({
                        is_public: isPublic,
                        newsletter,
                        visible_to_certified_only: visibleToCertifiedOnly,
                      });
                    }}
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                  >
                    {saving ? "Enregistrement…" : "Enregistrer"}
                  </button>
                  {info && (
                    <span className="text-sm text-emerald-700">{info}</span>
                  )}
                  {error && (
                    <span className="text-sm text-red-600">{error}</span>
                  )}
                </div>
              </form>
            )}
          </section>

          {/* 2 — Icône Keefon sur l'écran d'accueil (permanent) */}
          <section className="rounded-2xl bg-white/90 p-6 shadow-sm ring-1 ring-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Icône sur l’écran d’accueil
            </h3>
            <p className="text-xs text-gray-600 mt-1 mb-3">
              Ajoute Keefon sur l’écran de ton téléphone pour y accéder comme
              une appli.
            </p>
            <InstallIconButton />
          </section>

          {/* 3 — Abonnés : confidentialité */}
          <section className="rounded-2xl bg-white/90 p-6 shadow-sm ring-1 ring-gray-200">
            <header className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Paramètres — réservés aux abonnés
              </h2>
              {!isSubscriber && (
                <span className="text-xs text-gray-500">
                  Réservé aux abonnés
                </span>
              )}
            </header>

            {/* Mode privé */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-900">
                Confidentialité du profil
              </label>
              <p className="text-xs text-gray-600 mb-2">
                Par défaut, ton profil est <b>visible</b>. Tu peux activer le
                mode privé pour le cacher.
              </p>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="accent-blue-600"
                  checked={!isPublic}
                  disabled={!isSubscriber}
                  onChange={async (e) => {
                    if (!isSubscriber) return;
                    const toPrivate = e.target.checked; // coché = cacher
                    setIsPublic(!toPrivate ? true : false);
                    await saveSettings(
                      {
                        is_public: !toPrivate ? true : false,
                        newsletter,
                        visible_to_certified_only: visibleToCertifiedOnly,
                      },
                      true
                    );
                    setInfo("Confidentialité enregistrée.");
                    showToast("Confidentialité enregistrée.", "success");
                  }}
                />
                Cacher mon profil (mode privé)
              </label>
              {!isSubscriber && (
                <div className="text-xs text-gray-500 mt-1">
                  (Réservé aux abonnés)
                </div>
              )}
            </div>

            {/* Certifiés seulement */}
            <div className="mb-2">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="accent-blue-600"
                  checked={visibleToCertifiedOnly}
                  disabled={!isSubscriber}
                  onChange={async (e) => {
                    if (!isSubscriber) return;
                    const next = e.target.checked;
                    setVisibleToCertifiedOnly(next);
                    await saveSettings(
                      { ...current, visible_to_certified_only: next },
                      true
                    );
                    setInfo("Visibilité enregistrée.");
                    showToast("Visibilité enregistrée.", "success");
                  }}
                />
                Seuls les profils certifiés peuvent me voir
              </label>
              {!isSubscriber && (
                <div className="text-xs text-gray-500 mt-1">
                  (Réservé aux abonnés)
                </div>
              )}
            </div>
          </section>

          {/* 4 — Compte (désinscription en <details> avec style discret) */}
          <section className="rounded-2xl bg-white/90 p-6 shadow-sm ring-1 ring-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Compte</h3>

            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <button
                onClick={changePassword}
                disabled={!canChangePassword || saving || loading}
                title={
                  canChangePassword
                    ? loading
                      ? "Chargement en cours…"
                      : "Mettre à jour le mot de passe"
                    : "Indisponible pour les connexions via réseaux sociaux"
                }
                className={`rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50 ${
                  canChangePassword && !loading ? "" : "cursor-not-allowed"
                }`}
              >
                Changer de mot de passe
              </button>

              <button
                onClick={signOut}
                className="rounded-lg border border-rose-300 text-rose-700 px-3 py-1.5 text-sm hover:bg-rose-50"
              >
                Se déconnecter
              </button>
            </div>

            {/* Panneau désinscription replié par défaut */}
            <div
              id="desinscription"
              ref={deleteSectionRef}
              className="mt-6"
            >
              <details ref={deleteDetailsRef} className="group">
                <summary className="cursor-pointer select-none text-sm text-gray-600 group-open:text-red-700">
                  <span className="underline">Supprimer mon compte</span>{" "}
                  (définitif)
                </summary>
                <div className="mt-3 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-800 space-y-2">
                  <p>
                    Cette action est <b>difficilement réversible</b>. Tes
                    messages et données seront supprimés (ou anonymisés) selon
                    nos règles de sécurité.
                  </p>
                  <button
                    type="button"
                    onClick={deleteAccount}
                    className="rounded-lg bg-red-600 text-white px-3 py-1.5 text-sm font-semibold hover:bg-red-700"
                  >
                    Confirmer la suppression
                  </button>
                </div>
              </details>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
