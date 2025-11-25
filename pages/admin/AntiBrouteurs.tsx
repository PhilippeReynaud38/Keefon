// -*- coding: utf-8 -*-
// pages/admin/AntiBrouteurs.tsx
//
// Keefon — Administration : Profils "brouteurs" suspects.
// Règles : robuste, simple, maintenable, 100 % UTF-8, commentaires conservés.
//
// Source SQL : public.anti_brouteurs_admin_view
//  - Vue basée sur admin.anti_brouteurs_v (reported_id, nb_signalements, dernier_signalement_at)
//  - Join sur public.profiles pour récupérer email / username
//
// Objectif :
//  - Lister les profils ayant reçu plusieurs signalements (>= 3 dans la tuile du dashboard).
//  - Donner un accès rapide au profil et aux signalements d’abus existants.
//  - Ajouter des actions d’administration ciblées : "Antibrouteur" (shadow-ban) et "Bannir".
//
// Rappels sécurité :
//  - Actions sensibles réservées au SUPERADMIN (même logique que sur /admin/AbuseReports).
//  - "Antibrouteur" = inscrit dans public.banned_users avec mode = 'antibrouteur'.
//    → l’utilisateur continue à "voir" ses messages, mais plus personne ne reçoit ceux qu’il envoie.
//  - "Bannir" = appelle admin_flag_ban (ban classique, que tu utilises déjà).

import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type AntiBrouteurRow = {
  reported_id: string;
  nb_signalements: number;
  dernier_signalement_at: string | null;
  reported_email: string | null;
  reported_username: string | null;
};

// -----------------------------------------------------------------------------
// Composant principal
// -----------------------------------------------------------------------------

export default function AntiBrouteursPage() {
  const [rows, setRows] = useState<AntiBrouteurRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [isSuper, setIsSuper] = useState(false);

  // suis-je superadmin ? (même logique que sur AbuseReports)
  useEffect(() => {
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase
          .from("profiles")
          .select("is_superadmin")
          .eq("id", user.id)
          .maybeSingle();
        if (error) {
          console.error("[AntiBrouteurs] Erreur check superadmin :", error);
          return;
        }
        setIsSuper(Boolean(data?.is_superadmin));
      } catch (e) {
        console.error("[AntiBrouteurs] Erreur inattendue check superadmin :", e);
      }
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);

    const { data, error } = await supabase
      .from("anti_brouteurs_admin_view")
      .select("*")
      .order("nb_signalements", { ascending: false })
      .order("dernier_signalement_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("[AntiBrouteurs] Erreur chargement vue :", error);
      setErr(error.message || "Erreur de chargement.");
      setRows([]);
      setLoading(false);
      return;
    }

    setRows((data ?? []) as AntiBrouteurRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Helper format date
  function fmtDate(iso: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("fr-FR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Actions admin : bannir / antibrouteur
  async function handleFlag(
    userId: string,
    mode: "hard" | "antibrouteur"
  ): Promise<void> {
    if (!userId) return;
    if (!isSuper) {
      setErr("Action réservée au SUPERADMIN.");
      return;
    }

    const isHard = mode === "hard";

    const ok = window.confirm(
      isHard
        ? "Confirmer le BAN définitif de ce profil ?\n\nEffet : le compte sera désactivé (même logique que sur la page des signalements d’abus)."
        : 'Confirmer le mode "antibrouteur" pour ce profil ?\n\nEffet : ses messages ne seront plus visibles pour les autres utilisateurs, mais lui continuera à penser que tout fonctionne normalement.'
    );
    if (!ok) return;

    const reason = isHard
      ? "Bannissement définitif depuis /admin/AntiBrouteurs"
      : "Marqué en mode antibrouteur (brouteur suspect) depuis /admin/AntiBrouteurs";

    try {
      if (isHard) {
        // Ban classique : on réutilise la RPC existante admin_flag_ban
        const { error } = await supabase.rpc("admin_flag_ban", {
          p_user_id: userId,
          p_reason: reason,
        });
        if (error) throw error;
        alert("Profil banni (ban définitif).");
      } else {
        // Anti-brouteur : nécessite la fonction SQL admin_flag_antibrouteur(uuid, text)
        const { error } = await supabase.rpc("admin_flag_antibrouteur", {
          p_user_id: userId,
          p_reason: reason,
        });
        if (error) throw error;
        alert(
          'Profil marqué en mode "antibrouteur". Ses messages ne seront plus visibles des autres utilisateurs.'
        );
      }

      await load();
    } catch (e: any) {
      console.error("[AntiBrouteurs] handleFlag error:", e);
      setErr(
        e?.message ||
          "Erreur lors de la mise à jour du statut (ban / antibrouteur)."
      );
    }
  }

  return (
    <>
      <Head>
        <title>Administration — Brouteurs suspects</title>
      </Head>

      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Bouton retour dashboard */}
          <div className="mb-6">
            <Link
              href="/admin"
              className="inline-flex items-center px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-sm"
            >
              ← Retour au tableau de bord
            </Link>
          </div>

          <header className="mb-6">
            <h1 className="text-3xl font-semibold mb-2">
              Brouteurs suspects (anti-brouteur)
            </h1>
            <p className="text-sm text-slate-300">
              Profils ayant reçu plusieurs signalements. Liste en lecture seule
              pour les admins classiques ; actions de bannissement et mode
              antibrouteur réservées au SUPERADMIN.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Source : <code>public.anti_brouteurs_admin_view</code>
            </p>
          </header>

          {/* État erreur / chargement */}
          {err && (
            <div className="mb-4 rounded-md bg-red-900/40 border border-red-500 px-4 py-3 text-sm">
              Erreur : {err}
            </div>
          )}

          {loading && (
            <div className="text-sm text-slate-300">Chargement…</div>
          )}

          {!loading && rows.length === 0 && !err && (
            <div className="text-sm text-slate-300">
              Aucun profil suspect pour le moment.
            </div>
          )}

          {!loading && rows.length > 0 && (
            <section className="space-y-4 mt-4">
              {rows.map((r) => (
                <article
                  key={r.reported_id}
                  className="rounded-lg border border-slate-800 bg-slate-900/60 p-4"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <div className="text-lg font-semibold">
                        {r.reported_username || "Pseudo inconnu"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {r.reported_email || "Email inconnu"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 break-all">
                        UUID : <code>{r.reported_id}</code>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-rose-400">
                        {r.nb_signalements}
                      </div>
                      <div className="text-xs text-slate-400">
                        signalement
                        {r.nb_signalements > 1 ? "s" : ""} reçu
                        {r.nb_signalements > 1 ? "s" : ""}.
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Dernier signalement :{" "}
                        {fmtDate(r.dernier_signalement_at)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 text-sm">
                    <Link
                      href={`/profileplus/${r.reported_id}`}
                      target="_blank"
                      className="px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700"
                    >
                      Voir le profil public
                    </Link>

                    <Link
                      href={`/admin/AbuseReports?userId=${r.reported_id}`}
                      className="px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700"
                    >
                      Ouvrir la liste des signalements
                    </Link>

                    <button
                      type="button"
                      onClick={() => void load()}
                      className="px-3 py-1 rounded-md bg-slate-900 border border-slate-700 text-xs"
                    >
                      Rafraîchir
                    </button>

                    {/* Bouton Antibrouteur */}
                    <button
                      type="button"
                      disabled={!isSuper}
                      onClick={() =>
                        void handleFlag(r.reported_id, "antibrouteur")
                      }
                      className={`px-3 py-1 rounded-md text-xs font-semibold ${
                        isSuper
                          ? "bg-blue-700 hover:bg-blue-600 text-white"
                          : "bg-slate-800 text-slate-500 cursor-not-allowed"
                      }`}
                      title={
                        isSuper
                          ? 'Marquer ce profil en mode "antibrouteur".'
                          : "Réservé au SUPERADMIN."
                      }
                    >
                      🟠 Antibrouteur
                    </button>

                    {/* Bouton Bannir (hard ban) */}
                    <button
                      type="button"
                      disabled={!isSuper}
                      onClick={() => void handleFlag(r.reported_id, "hard")}
                      className={`px-3 py-1 rounded-md text-xs font-semibold ${
                        isSuper
                          ? "bg-red-800 hover:bg-red-700 text-white"
                          : "bg-slate-800 text-slate-500 cursor-not-allowed"
                      }`}
                      title={
                        isSuper
                          ? "Bannir ce profil (ban définitif)."
                          : "Réservé au SUPERADMIN."
                      }
                    >
                      ⚠️ Bannir
                    </button>
                  </div>
                </article>
              ))}
            </section>
          )}
        </div>
      </main>
    </>
  );
}
