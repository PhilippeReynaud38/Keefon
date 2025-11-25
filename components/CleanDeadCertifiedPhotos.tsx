
// UTF-8 – CleanDeadCertifiedPhotos.tsx – Admin : suppression des entrées orphelines (certified_photos)

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getSafePublicUrl } from "../lib/getSafePublicUrl";

export default function CleanDeadCertifiedPhotos() {
  const [log, setLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const append = (line: string) => setLog((prev) => [...prev, line]);

  const handleScanAndClean = async () => {
    setLog([]);
    setLoading(true);
    append("📦 Chargement des certified_photos depuis Supabase...");

    const { data: photos, error } = await supabase.from("certified_photos").select("id, url");
    if (error || !photos) {
      append("❌ Erreur lors du chargement des photos certifiées.");
      setLoading(false);
      return;
    }

    const missing: { id: string; url: string }[] = [];

    for (const photo of photos) {
const fullUrl = getSafePublicUrl(photo.url);
      if (!fullUrl) {
        append(`❌ URL invalide : ${photo.url}`);
        missing.push(photo);
        continue;
      }

      try {
        const response = await fetch(fullUrl, { method: "HEAD" });
        if (!response.ok) {
          append(`❌ Fichier introuvable : ${photo.url}`);
          missing.push(photo);
        }
      } catch {
        append(`❌ Erreur réseau : ${photo.url}`);
        missing.push(photo);
      }
    }

    if (missing.length === 0) {
      append("✅ Aucun fichier manquant détecté.");
      setLoading(false);
      return;
    }

    append(`🧹 Suppression de ${missing.length} entrées mortes (certified_photos)...`);

    const { error: deleteError } = await supabase
      .from("certified_photos")
      .delete()
      .in("id", missing.map(p => p.id));

    if (deleteError) {
      append("❌ Erreur lors de la suppression.");
    } else {
      append("✅ Suppression terminée avec succès.");
    }

    setLoading(false);
  };

  return (
    <div className="mt-6 border p-4 rounded">
      <h3 className="text-lg font-semibold mb-2">🧼 Nettoyage des entrées mortes (certified_photos)</h3>
      <button
        onClick={handleScanAndClean}
        className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-1 rounded disabled:opacity-50"
        disabled={loading}
      >
        Scanner et supprimer
      </button>

      <pre className="mt-4 text-xs text-gray-800 bg-gray-100 p-2 rounded max-h-64 overflow-auto whitespace-pre-wrap">
        {log.join("\n")}
      </pre>
    </div>
  );
}
