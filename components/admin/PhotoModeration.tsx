// UTF-8 — Modération enrichie avec filtre par statut
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getUserEmailsFromIds } from "@/lib/userIdMapping";
import { getPublicUrlSafe as getSafePublicUrl } from "@/lib/storageUtils";

interface PhotoWithUser {
  id: string;
  user_id: string;
  url: string | null;
  status: string;
  email: string;
  moderation_note?: string;
}

export default function PhotoModeration() {
  const [photos, setPhotos] = useState<PhotoWithUser[]>([]);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [loading, setLoading] = useState(true);
  const [allChecked, setAllChecked] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [banPopup, setBanPopup] = useState<{ email: string; reason: string } | null>(null);

  const fetchPhotos = async () => {
    setLoading(true);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: rawPhotos, error } = await supabase
      .from("photos")
      .select("id, user_id, url, status, moderation_note")
      .eq("status", statusFilter)
      .range(from, to);

    if (error) {
      console.error("Erreur chargement photos:", error);
      setPhotos([]);
      setLoading(false);
      return;
    }

    const userIds = rawPhotos.map((p) => p.user_id);
    const emailMap = await getUserEmailsFromIds(userIds);

    const enrichedPhotos = rawPhotos.map((photo) => ({
      ...photo,
      email: emailMap[photo.user_id] || "(inconnu)",
      url: getSafePublicUrl(photo.url),
    }));

    const initialNotes: Record<string, string> = {};
    enrichedPhotos.forEach((p) => {
      initialNotes[p.id] = p.moderation_note || "";
    });

    setPhotos(enrichedPhotos);
    setNotes(initialNotes);
    setCheckedIds([]);
    setAllChecked(false);
    setLoading(false);
  };

  useEffect(() => {
    fetchPhotos();
  }, [page, statusFilter]);

  const toggleCheckbox = (id: string) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (allChecked) {
      setCheckedIds([]);
    } else {
      setCheckedIds(photos.map((p) => p.id));
    }
    setAllChecked(!allChecked);
  };

  const handleApproveSelected = async () => {
    if (checkedIds.length === 0) return;
    const { error } = await supabase
      .from("photos")
      .update({ status: "approved" })
      .in("id", checkedIds);
    if (error) alert("❌ Erreur approbation : " + error.message);
    else {
      setPhotos((prev) => prev.filter((p) => !checkedIds.includes(p.id)));
      setCheckedIds([]);
    }
  };

  const handleDeleteSelected = async () => {
    if (checkedIds.length === 0) return;
    const confirmDelete = confirm(`⚠️ Tu vas supprimer ${checkedIds.length} photo(s). Action irréversible. Continuer ?`);
    if (!confirmDelete) return;

    const photosToDelete = photos.filter((p) => checkedIds.includes(p.id));
    const fileNames = photosToDelete
      .map((p) => p.url?.replace(/^.*avatars\/avatars\//, ""))
      .filter(Boolean) as string[];

    const { error: dbError } = await supabase.from("photos").delete().in("id", checkedIds);
    const { error: storageError } = await supabase.storage.from("avatars").remove(fileNames.map((f) => `avatars/${f}`));

    if (dbError || storageError) {
      alert("❌ Erreur suppression : " + (dbError?.message || storageError?.message));
    } else {
      setPhotos((prev) => prev.filter((p) => !checkedIds.includes(p.id)));
      setCheckedIds([]);
    }
  };

  const updateModerationNote = async (id: string) => {
    const note = notes[id];
    if (!note || note.trim().length === 0) return;
    const { error } = await supabase
      .from("photos")
      .update({ moderation_note: note.trim() })
      .eq("id", id);
    if (error) alert("Erreur enregistrement note : " + error.message);
    else alert("Note enregistrée.");
  };

  const confirmBan = async () => {
    if (!banPopup?.email || !banPopup.reason) return;
    const { error } = await supabase.from("banned_emails").insert({
      email: banPopup.email,
      reason: banPopup.reason,
    });
    if (error) alert("❌ Erreur bannissement : " + error.message);
    else alert("✅ Utilisateur banni.");
    setBanPopup(null);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🛡️ Modération enrichie</h1>

      {/* 🔍 Filtre status */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <label htmlFor="filter" className="font-medium">Statut :</label>
        <select
          id="filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="border px-2 py-1 rounded"
        >
          <option value="pending">🕓 En attente</option>
          <option value="approved">✅ Approuvées</option>
          <option value="rejected">❌ Rejetées</option>
        </select>

        <button onClick={toggleAll} className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-1 rounded">
          {allChecked ? "Tout décocher" : "Tout cocher"}
        </button>
        <button onClick={handleApproveSelected} className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded">
          ✅ Approuver la sélection
        </button>
        <button onClick={handleDeleteSelected} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded">
          🗑️ Supprimer la sélection
        </button>
        <div className="ml-auto">
          <label className="mr-2">Photos/page :</label>
          <input
            type="number"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border px-2 py-1 w-20"
          />
        </div>
      </div>

      {/* 🖼️ Grille */}
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-10 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative border rounded overflow-hidden shadow group p-1 bg-white">
              <input
                type="checkbox"
                className="absolute top-2 left-2 z-10 w-5 h-5"
                checked={checkedIds.includes(photo.id)}
                onChange={() => toggleCheckbox(photo.id)}
              />
              {photo.url && (
                <img
                  src={photo.url}
                  alt="photo"
                  className="w-full h-40 object-cover cursor-pointer"
                  onClick={() => setPreviewUrl(photo.url)}
                />
              )}
              <div
                className="text-xs text-center px-2 py-1 text-gray-800 bg-white border-t break-all cursor-text select-text"
                title={photo.email}
              >
                {photo.email}
              </div>
              <div className="text-center text-xs mb-2">
                <button
                  onClick={() => setBanPopup({ email: photo.email, reason: "" })}
                  className="text-red-500 hover:underline"
                >
                  🚫 Bannir
                </button>
              </div>
              <textarea
                placeholder="Note ou raison du refus..."
                value={notes[photo.id] || ""}
                onChange={(e) => setNotes({ ...notes, [photo.id]: e.target.value })}
                className="w-full text-xs border p-1 mb-1"
              />
              <button
                onClick={() => updateModerationNote(photo.id)}
                className="w-full text-xs bg-blue-500 hover:bg-blue-600 text-white py-1 rounded"
              >
                ✉️ Envoyer note
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 🔁 Pagination */}
      <div className="mt-6 flex gap-2">
        <button onClick={() => setPage((prev) => Math.max(prev - 1, 1))} className="bg-gray-200 px-3 py-1 rounded">
          ← Page précédente
        </button>
        <button onClick={() => setPage((prev) => prev + 1)} className="bg-gray-200 px-3 py-1 rounded">
          Page suivante →
        </button>
      </div>

      {/* 🖼️ Popup Preview */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setPreviewUrl(null)}
        >
          <img src={previewUrl} alt="Preview" className="max-w-full max-h-full rounded shadow-lg" />
        </div>
      )}

      {/* 🚫 Popup bannissement */}
      {banPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
            <h2 className="text-xl font-bold mb-2">🚫 Bannir cet utilisateur</h2>
            <p className="mb-2 text-sm break-all">{banPopup.email}</p>
            <textarea
              placeholder="Raison du bannissement (obligatoire)"
              value={banPopup.reason}
              onChange={(e) => setBanPopup({ ...banPopup, reason: e.target.value })}
              className="w-full border p-2 text-sm mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setBanPopup(null)} className="bg-gray-300 hover:bg-gray-400 px-4 py-1 rounded">
                Annuler
              </button>
              <button onClick={confirmBan} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded">
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
