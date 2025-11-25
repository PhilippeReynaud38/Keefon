// -*- coding: utf-8 -*-
// pages/admin/PhotoModeration.tsx — Vivaya (mode compact + interactions email)
//
// RÔLE
//   Modération des photos (table `photos`) avec :
//   • Filtre par statut (pending/approved/rejected)
//   • Sélection multiple, Approbation/Suppression en lot
//   • Pagination simple
//   • 📧 Email propriétaire par photo (mapping user_id -> email)
//   • 🧱 Grille compacte (densité réglable) + lazy-loading
//   • 🖱️ Email interactif : clic GAUCHE = OUVRIR le profil public, clic DROIT = COPIER l’email
//
// Règles Vivaya : robustesse, simplicité, UTF-8, commentaires conservés, pas d’usine à gaz.
//
// NOTE de correction (build): `getSafePublicUrl` est exporté par défaut par "@/lib/storageUtils",
// il faut donc l’importer SANS accolades.

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getUserEmailsFromIds } from "@/lib/userIdMapping";
import getSafePublicUrl from "@/lib/storageUtils";

interface PhotoWithUser {
  id: string;
  user_id: string;
  url: string | null; // clé Storage -> URL publique via helper
  status: "pending" | "approved" | "rejected";
  moderation_note?: string | null;
  email: string;
}

type DensityKey = "xcompact" | "compact" | "standard";

/** Largeur colonne minimale selon densité (en px). Plus c’est petit, plus il y a de colonnes. */
const DENSITY_WIDTH: Record<DensityKey, number> = {
  xcompact: 120, // très compact
  compact: 160,  // compact
  standard: 200, // standard
};

// --- Helper presse-papiers sûr (fallback DOM si API indisponible) ---
async function copyToClipboardSafe(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* noop, on tente fallback */
  }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.left = "-9999px";
    el.setAttribute("readonly", "true");
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    return true;
  } catch {
    return false;
  }
}

export default function PhotoModeration() {
  // --- État UI principal ---
  const [photos, setPhotos] = useState<PhotoWithUser[]>([]);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [loading, setLoading] = useState(true);
  const [allChecked, setAllChecked] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [error, setError] = useState<string | null>(null);

  // --- Contrôles compacité ---
  const [density, setDensity] = useState<DensityKey>("xcompact"); // par défaut super compact
  const [compactView, setCompactView] = useState<boolean>(true);   // masque détails (chemin + note)

  // --- Feedback "copié" ---
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // --- bornes pagination ---
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // --- chargement page courante ---
  const fetchPhotos = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: rawPhotos, error } = await supabase
        .from("photos")
        .select("id, user_id, url, status, moderation_note, created_at")
        .eq("status", statusFilter)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      const safeRows = (rawPhotos || []) as Array<{
        id: string;
        user_id: string;
        url: string | null;
        status: any;
        moderation_note?: string | null;
      }>;

      // mapping user_id -> email via helper
      const userIds = safeRows.map((p) => p.user_id);
      const emailMap = await getUserEmailsFromIds(userIds);

      // enrichissement + URL publique via helper
      const enriched: PhotoWithUser[] = safeRows.map((p) => ({
        id: p.id,
        user_id: p.user_id,
        url: getSafePublicUrl(p.url),
        status: p.status,
        moderation_note: p.moderation_note ?? "",
        email: emailMap[p.user_id] || "(email inconnu)",
      }));

      // init notes locales
      const initialNotes: Record<string, string> = {};
      enriched.forEach((p) => {
        initialNotes[p.id] = p.moderation_note || "";
      });

      setPhotos(enriched);
      setNotes(initialNotes);
      setCheckedIds([]);
      setAllChecked(false);
    } catch (e: any) {
      setPhotos([]);
      setError(e?.message || "Erreur chargement des photos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, pageSize]);

  // --- sélection ---
  const toggleCheckbox = (id: string) => {
    setCheckedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    if (allChecked) {
      setCheckedIds([]);
      setAllChecked(false);
    } else {
      setCheckedIds(photos.map((p) => p.id));
      setAllChecked(true);
    }
  };

  const selectedCount = checkedIds.length;

  // --- actions ---
  const handleApproveSelected = async () => {
    if (!selectedCount) return;
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.from("photos").update({ status: "approved" }).in("id", checkedIds);
      if (error) throw error;
      await fetchPhotos();
    } catch (e: any) {
      setError(e?.message || "Erreur approbation.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedCount) return;
    if (!confirm(`Supprimer ${selectedCount} photo(s) ?`)) return;

    setLoading(true);
    setError(null);
    try {
      // 1) Normaliser les clés "avatars/…" depuis l’URL affichée
      const keys: string[] = photos
        .filter((p) => checkedIds.includes(p.id))
        .map((p) => (p.url || "").replace(/^.*\/avatars\//, "avatars/"))
        .filter(Boolean);

      if (keys.length) {
        const st = await supabase.storage.from("avatars").remove(keys);
        if (st.error) throw new Error("Storage: " + st.error.message);
      }

      // 2) Suppression en BDD
      const { error } = await supabase.from("photos").delete().in("id", checkedIds);
      if (error) throw error;

      await fetchPhotos();
    } catch (e: any) {
      setError(e?.message || "Erreur suppression.");
    } finally {
      setLoading(false);
    }
  };

  const updateModerationNote = async (id: string) => {
    const note = (notes[id] || "").trim();
    if (!note) return;
    const { error } = await supabase.from("photos").update({ moderation_note: note }).eq("id", id);
    if (error) alert("Erreur enregistrement note : " + error.message);
    else alert("Note enregistrée.");
  };

  // --- calculs UI ---
  const minCol = DENSITY_WIDTH[density]; // largeur mini de colonne (px)
  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: `repeat(auto-fill, minmax(${minCol}px, 1fr))`,
  };

  // --- rendu ---
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-3 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* header */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <button
            onClick={() => history.back()}
            className="px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700"
          >
            ← Retour
          </button>
          <h1 className="text-lg sm:text-xl font-semibold">Administration — Modération des photos</h1>
        </div>

        {/* barre d’actions */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <label className="flex items-center gap-2">
            <span className="text-slate-200">Statut :</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setPage(1);
                setStatusFilter(e.target.value as PhotoWithUser["status"]);
              }}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1"
            >
              <option value="pending">En attente</option>
              <option value="approved">Approuvées</option>
              <option value="rejected">Rejetées</option>
            </select>
          </label>

          <button
            onClick={toggleAll}
            className="px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600 border border-slate-600"
          >
            {allChecked ? "Tout décocher" : "Tout cocher"}
          </button>

          <button
            onClick={handleApproveSelected}
            disabled={!selectedCount || loading}
            className="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
          >
            ✅ Approuver la sélection
          </button>

          <button
            onClick={handleDeleteSelected}
            disabled={!selectedCount || loading}
            className="px-3 py-2 rounded-md bg-red-600 hover:bg-red-500 disabled:opacity-50"
          >
            🗑️ Supprimer la sélection
          </button>

          {/* Densité + Vue compacte */}
          <div className="ml-auto flex items-center gap-3">
            <label className="flex items-center gap-2">
              <span>Densité :</span>
              <select
                value={density}
                onChange={(e) => setDensity(e.target.value as DensityKey)}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1"
              >
                <option value="xcompact">Très compact</option>
                <option value="compact">Compact</option>
                <option value="standard">Standard</option>
              </select>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={compactView}
                onChange={(e) => setCompactView(e.target.checked)}
                className="accent-emerald-500"
              />
              <span>Vue compacte</span>
            </label>

            <label className="flex items-center gap-2">
              <span>Photos/page :</span>
              <input
                type="number"
                min={50}
                step={50}
                value={pageSize}
                onChange={(e) => {
                  const v = Math.max(50, Number(e.target.value) || 50);
                  setPage(1);
                  setPageSize(v);
                }}
                className="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-1"
              />
            </label>
          </div>
        </div>

        {error && <div className="mb-4 p-3 rounded bg-red-900/40 border border-red-700 text-red-200">{error}</div>}

        {/* grille compacte */}
        {loading ? (
          <div className="text-slate-300">Chargement…</div>
        ) : (
          <div className="grid gap-3" style={gridStyle}>
            {photos.map((p) => (
              <div key={p.id} className="relative bg-slate-800 border border-slate-700 rounded-md overflow-hidden">
                {/* Bandeau haut : checkbox + EMAIL INTERACTIF */}
                <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-2 bg-slate-900/70 px-1.5 py-1">
                  <input
                    type="checkbox"
                    checked={checkedIds.includes(p.id)}
                    onChange={() => toggleCheckbox(p.id)}
                    className="accent-emerald-500"
                    title="Sélectionner"
                  />

                  {/* EMAIL : clic GAUCHE = ouvrir profil ; clic DROIT = copier l’email */}
                  <span
                    role="button"
                    tabIndex={0}
                    className="text-[11px] text-slate-100 truncate underline decoration-dotted cursor-pointer"
                    title="Clic : ouvrir le profil — Clic droit : copier l’email"
                    onClick={(e) => {
                      e.preventDefault();
                      window.open(`/profileplus/${p.user_id}`, "_blank", "noopener,noreferrer");
                    }}
                    onContextMenu={async (e) => {
                      e.preventDefault();
                      const ok = await copyToClipboardSafe(p.email);
                      if (ok) {
                        setCopiedId(p.id);
                        setTimeout(() => setCopiedId((prev) => (prev === p.id ? null : prev)), 1200);
                      } else {
                        alert("Impossible de copier l’adresse (permissions navigateur).");
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        window.open(`/profileplus/${p.user_id}`, "_blank", "noopener,noreferrer");
                      }
                    }}
                  >
                    {p.email}
                  </span>

                  {/* Feedback "Copié ✓" (apparaît après clic droit) */}
                  {copiedId === p.id && <span className="ml-1 text-[11px] text-emerald-300">Copié ✓</span>}
                </div>

                {/* Image */}
                <div className="w-full aspect-[4/5] bg-slate-900">
                  {p.url ? (
                    <img
                      src={p.url}
                      alt="Photo à modérer"
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onClick={() => setPreviewUrl(p.url!)}
                      onError={(e) => ((e.target as HTMLImageElement).src = "/default-avatar.png")}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">—</div>
                  )}
                </div>

                {/* Bas de carte : détails (affichés si vue compacte désactivée) */}
                {!compactView && (
                  <div className="p-2 border-t border-slate-700 space-y-2">
                    <div className="text-[11px] text-slate-300 truncate" title={p.url || ""}>
                      {p.url || "—"}
                    </div>
                    <div>
                      <textarea
                        placeholder="Note ou raison du refus…"
                        value={notes[p.id] || ""}
                        onChange={(e) => setNotes({ ...notes, [p.id]: e.target.value })}
                        className="w-full text-xs bg-slate-900 border border-slate-700 rounded p-1 text-slate-100"
                      />
                      <button
                        onClick={() => updateModerationNote(p.id)}
                        className="mt-1 w-full text-xs bg-blue-600 hover:bg-blue-500 text-white py-1 rounded"
                      >
                        ✉️ Enregistrer la note
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* pagination */}
        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50"
          >
            ← Page précédente
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={photos.length < pageSize || loading}
            className="px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50"
          >
            Page suivante →
          </button>
        </div>
      </div>

      {/* aperçu plein écran */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setPreviewUrl(null)}
        >
          <img src={previewUrl} alt="Preview" className="max-w-full max-h-full rounded shadow-lg" />
        </div>
      )}
    </div>
  );
}
