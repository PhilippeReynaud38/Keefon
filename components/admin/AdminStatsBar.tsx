// UTF-8 — components/AdminStatsBar.tsx
// -----------------------------------------------------------------------------
// Barre de stats Admin :
//  - Galerie à modérer  = public.admin_photos_v  (photos.status in 'pending','to_review')
//  - Certif à vérifier  = public.admin_certified_photos_v  (certified_photos.status in 'pending','to_review')
// Règles Vivaya : code simple, robuste, sans gadgets, commentaires conservés.
// Dépendances : React, supabase client (../lib/supabaseClient), Tailwind pour le style.
// Sécurité : ces vues sont "Unrestricted" côté DB (captures fournies).
// Dernière MAJ : 2025-11-08
// -----------------------------------------------------------------------------

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type CountPair = {
  galleryPending: number;
  certPending: number;
};

export default function AdminStatsBar() {
  const [counts, setCounts] = useState<CountPair>({ galleryPending: 0, certPending: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // -- Charge les compteurs depuis les VUES admin (lecture seule)
  const fetchCounts = async () => {
    setErrorMsg(null);

    // Galerie (photos)
    const { count: galleryCount, error: e1 } = await supabase
      .from("admin_photos_v")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "to_review"]);

    // Certif (certified_photos)
    const { count: certCount, error: e2 } = await supabase
      .from("admin_certified_photos_v")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "to_review"]);

    if (e1 || e2) {
      setErrorMsg(
        `Erreur chargement compteurs${
          e1 ? ` [galerie: ${e1.message}]` : ""
        }${e2 ? ` [certif: ${e2.message}]` : ""}`
      );
      return;
    }

    setCounts({
      galleryPending: galleryCount ?? 0,
      certPending: certCount ?? 0,
    });
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      await fetchCounts();
      if (alive) setLoading(false);
    })();

    // Realtime : si une photo (galerie ou certif) change, on recalcule
    const ch = supabase
      .channel("admin-stats-live")
      // Table photos (galerie)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "photos" },
        () => fetchCounts()
      )
      // Table certified_photos (certification)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "certified_photos" },
        () => fetchCounts()
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(ch);
    };
  }, []);

  // -- UI très sobre (2 cartes)
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <StatCard
        title="Photos de galerie à modérer"
        value={counts.galleryPending}
        loading={loading}
        note="Statut: pending / to_review (admin_photos_v)"
      />
      <StatCard
        title="Photos à certifier en attente"
        value={counts.certPending}
        loading={loading}
        note="Statut: pending / to_review (admin_certified_photos_v)"
      />

      {errorMsg && (
        <div className="md:col-span-2 text-red-500 text-sm border border-red-500/40 rounded p-2">
          {errorMsg}
        </div>
      )}
    </div>
  );
}

// -- Composant tuile
function StatCard({
  title,
  value,
  loading,
  note,
}: {
  title: string;
  value: number;
  loading: boolean;
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-4">
      <div className="text-slate-200 text-sm">{title}</div>
      <div className="mt-2 text-4xl font-semibold text-slate-50">
        {loading ? "…" : value}
      </div>
      {note ? <div className="mt-2 text-xs text-slate-400">{note}</div> : null}
    </div>
  );
}
