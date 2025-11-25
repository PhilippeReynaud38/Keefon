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
  const [toast, setToast] = useState<{ text: string; kind: ToastKind } | null>(null);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Connexion requise.");
        setLoading(false);
        return;
      }
      setUserId(user.id);
      setUserEmail(user.email ?? null);

      const provider = (user as any)?.app_metadata?.provider;
      setCanChangePassword(!provider || provider === "email");

      // 2) Détection abonné (RPC > fallback profiles.subscription_tier)
      try {
        const { data: planStr, error: planErr } = await supabase.rpc("get_my_effective_plan_vivaya");
        if (!planErr && planStr) {
          const plan = String(planStr).toLowerCase();
          setIsSubscriber(plan === "premium" || plan === "elite" || plan === "essentiel");
        } else {
          const { data: prof } = await supabase
            .from("profiles")
            .select("subscription_tier")
            .eq("id", user.id)
            .maybeSingle();
          const p = String((prof as any)?.subscription_tier ?? "").toLowerCase();
          setIsSubscriber(p === "premium" || p === "elite" || p === "essentiel");
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
          const certOnly = row.visible_to_certified_only ?? (row.visibility_scope === "certified");
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
  const upsertUserSettings = async (payloadWithScope: any, payloadFallback: any) => {
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
    if (!silent) { setSaving(true); setInfo(null); setError(null); }

    try {
      const scope: "all" | "certified" =
        next.visible_to_certified_only ? "certified" : "all";

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
    if (loading) { showToast("La page charge encore, réessaie dans un instant.", "info"); return; }

    let email = userEmail;
    if (!email) {
      const { data: { user } } = await supabase.auth.getUser();
      email = user?.email ?? null;
      if (!email) { showToast("Utilisateur introuvable.", "error"); return; }
      setUserEmail(email);
    }

    const currentPwd = prompt("Mot de passe ACTUEL :"); if (currentPwd === null) return;
    const nextPwd    = prompt("NOUVEAU mot de passe (min. 8 caractères) :"); if (nextPwd === null) return;
    const confirmPwd = prompt("Confirme le nouveau mot de passe :"); if (confirmPwd === null) return;

    if (nextPwd !== confirmPwd) { showToast("Les deux mots de passe ne correspondent pas.", "error"); return; }
    if (nextPwd.length < 8) { showToast("Minimum 8 caractères.", "error"); return; }

    setSaving(true);
    try {
      const { error: signErr } = await supabase.auth.signInWithPassword({ email: email!, password: currentPwd });
      if (signErr) { showToast("Mot de passe actuel incorrect.", "error"); return; }
      const { error: updErr } = await supabase.auth.updateUser({ password: nextPwd });
      if (updErr) { showToast("Échec de la mise à jour.", "error"); return; }
      setInfo("Mot de passe mis à jour.");
      showToast("Mot de passe mis à jour.", "success");
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // Désinscription : double confirmation + POST /api/account/self-delete
  const requestAccountDeletion = async () => {
    if (!userId) return;
    if (!confirm("⚠️ Désinscription : ton compte sera supprimé. Continuer ?")) return;
    if (!confirm("Confirmer la suppression définitive du compte ?")) return;

    setSaving(true);
    setInfo(null);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const tokenFromSession = sessionData.session?.access_token ?? null;

      let token = tokenFromSession;
      if (!token && typeof window !== "undefined") {
        const k = Object.keys(localStorage).find((x) => /sb-.*-auth-token/.test(x));
        if (k) {
          try {
            const j = JSON.parse(localStorage.getItem(k) || "null");
            token = j?.currentSession?.access_token || j?.access_token || null;
          } catch { /* ignore */ }
        }
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/account/self-delete", {
        method: "POST",
        headers,
        credentials: "same-origin",
        body: JSON.stringify({ user_id: userId }),
      });

      if (res.ok) {
        setInfo("Demande de suppression envoyée.");
        showToast("Suppression demandée. Déconnexion dans 3 secondes…", "success");
        window.setTimeout(async () => {
          try { await supabase.auth.signOut(); } catch {}
          router.replace("/login?account_deleted=1");
        }, 3500);
      } else if (res.status === 404) {
        showToast("La suppression n’est pas encore branchée côté serveur.", "info");
      } else {
        const t = await res.text();
        showToast("Échec de la demande : " + t, "error");
      }
    } catch {
      showToast("Impossible d’envoyer la demande pour le moment.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================================
  // Render
  // ==========================================================================
  return (
    <>
      <Head>
        <title>Paramètres — Vivaya</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      {/* Toast (fixe en bas-centre) */}
      {toast && (
        <div aria-live="polite" className="fixed left-1/2 -translate-x-1/2 bottom-6 z-50">
          <div
            className={[
              "px-4 py-2 rounded-xl shadow-lg text-sm font-medium",
              toast.kind === "success" ? "bg-emerald-600 text-white" :
              toast.kind === "error"   ? "bg-red-600 text-white" :
                                         "bg-blue-600 text-white",
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
              <h2 className="text-lg font-semibold text-gray-900">Paramètres — tout le monde</h2>
              {userEmail && <p className="text-sm text-gray-700 mt-1">Connecté en tant que <b>{userEmail}</b></p>}
            </header>

            {loading ? (
              <p>Chargement…</p>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-900">E-mails & nouveautés</label>
                  <div className="mt-2">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="accent-blue-600"
                        checked={newsletter}
                        onChange={async (e) => {
                          const next = e.target.checked;
                          setNewsletter(next);
                          await saveSettings({
                            is_public: isPublic,
                            newsletter: next,
                            visible_to_certified_only: visibleToCertifiedOnly,
                          }, true);
                          setInfo("Préférence newsletter enregistrée.");
                          showToast("Préférence newsletter enregistrée.", "success");
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
                  {info && <span className="text-sm text-emerald-700">{info}</span>}
                  {error && <span className="text-sm text-red-600">{error}</span>}
                </div>
              </form>
            )}
          </section>

          {/* 2 — Abonnés : confidentialité */}
          <section className="rounded-2xl bg-white/90 p-6 shadow-sm ring-1 ring-gray-200">
            <header className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Paramètres — réservés aux abonnés</h2>
              {!isSubscriber && <span className="text-xs text-gray-500">Réservé aux abonnés</span>}
            </header>

            {/* Mode privé */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-900">Confidentialité du profil</label>
              <p className="text-xs text-gray-600 mb-2">
                Par défaut, ton profil est <b>visible</b>. Tu peux activer le mode privé pour le cacher.
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
              {!isSubscriber && <div className="text-xs text-gray-500 mt-1">(Réservé aux abonnés)</div>}
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
                    const next = e.target.checked;
                    setVisibleToCertifiedOnly(next);
                    await saveSettings({ ...current, visible_to_certified_only: next }, true);
                    setInfo("Visibilité enregistrée.");
                    showToast("Visibilité enregistrée.", "success");
                  }}
                />
                Seuls les profils certifiés peuvent me voir
              </label>
              {!isSubscriber && <div className="text-xs text-gray-500 mt-1">(Réservé aux abonnés)</div>}
            </div>
          </section>

          {/* 3 — Icône Keefon sur l'écran d'accueil (permanent) */}
          <section className="rounded-2xl bg-white/90 p-6 shadow-sm ring-1 ring-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Icône sur l’écran d’accueil</h3>
            <p className="text-xs text-gray-600 mt-1 mb-3">
              Ajoute Keefon sur l’écran de ton téléphone pour y accéder comme une appli.
            </p>
            <InstallIconButton />
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
                    ? (loading ? "Chargement en cours…" : "Mettre à jour le mot de passe")
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
            <div id="desinscription" ref={deleteSectionRef} className="mt-6">
              <details ref={deleteDetailsRef} className="group">
                <summary className="text-xs text-blue-400 opacity-60 hover:opacity-90 focus:opacity-90 cursor-pointer select-none decoration-transparent">
                  suppression de compte (avertissement)
                </summary>

                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-4">
                  <h4 className="text-sm font-semibold text-red-800"></h4>
                  <p className="text-xs text-red-700 mt-1">
                    La suppression de compte est définitive. Tes données pourront être anonymisées selon notre politique.
                  </p>
                  <button
                    onClick={requestAccountDeletion}
                    disabled={saving}
                    className="mt-3 rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
                  >
                    Supprimer mon compte
                  </button>
                </div>
              </details>
            </div>
          </section>

          {/* 5 — Légal (lien discret bleu très clair, sans soulignement) */}
          <section className="rounded-2xl bg-white/90 p-6 shadow-sm ring-1 ring-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Légal</h3>
            <ul className="mt-2 list-disc list-inside text-sm text-blue-700">
              <li><Link className="underline hover:no-underline" href="/mentions-legales">Mentions légales</Link></li>
              <li><Link className="underline hover:no-underline" href="/cgu">Conditions Générales d’Utilisation</Link></li>
              <li><Link className="underline hover:no-underline" href="/confidentialite">Politique de confidentialité</Link></li>
            </ul>
          </section>

          {/* 6 — Langue */}
          <section className="rounded-2xl bg-white/90 p-6 shadow-sm ring-1 ring-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Langue</h3>
            <div className="mt-2">
              <select
                disabled
                className="rounded-md border px-3 py-2 text-sm text-gray-500 bg-gray-100 cursor-not-allowed"
                defaultValue="fr"
                title="Bientôt disponible"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Bientôt disponible.</p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

// Flag auth
;(Parametres as any).requireAuth = true;
