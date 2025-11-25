// UTF-8
// components/admin/EssentielGlobalToggle.tsx
// Composant 2 boutons ON/OFF pour "Essentiel offert (global)"
// - Lecture : rpc('get_essentiel_offert_global')
// - Ecriture : rpc('admin_set_essentiel_offert_global', { p_on: true|false })
// Hypothèse : utilisation @supabase/auth-helpers-nextjs ou client SSR/CSR standard.

import { useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function EssentielGlobalToggle() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flag, setFlag] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.rpc('get_essentiel_offert_global');
    if (error) {
      setError(error.message);
      setFlag(null);
    } else {
      setFlag(Boolean(data));
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const setValue = async (value: boolean) => {
    setSaving(true);
    setError(null);
    const { data, error } = await supabase.rpc('admin_set_essentiel_offert_global', { p_on: value });
    if (error) {
      setError(error.message);
    } else if (data && data.length > 0) {
      setFlag(Boolean(data[0].essentiel_offert_global));
      setUpdatedAt(new Date(data[0].updated_at).toLocaleString());
    }
    setSaving(false);
  };

  return (
    <div className="p-4 rounded-2xl border shadow-sm bg-white">
      <h3 className="text-lg font-semibold">Essentiel offert (global)</h3>
      <p className="text-sm text-gray-600">
        Active/désactive l’accès <em>Essentiel</em> pour tout le monde, sans toucher aux offres individuelles.
      </p>

      {loading ? (
        <p className="mt-3 text-sm">Chargement…</p>
      ) : error ? (
        <p className="mt-3 text-sm text-red-600">Erreur : {error}</p>
      ) : (
        <>
          <div className="mt-3 inline-flex items-center gap-2">
            <span className="text-sm">Statut :</span>
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                flag ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {flag ? 'ON' : 'OFF'}
            </span>
            {updatedAt && (
              <span className="text-xs text-gray-500">• maj {updatedAt}</span>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50 disabled:opacity-50"
              onClick={() => setValue(false)}
              disabled={saving || flag === false}
              title="Désactiver Essentiel offert global"
            >
              OFF
            </button>
            <button
              className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50 disabled:opacity-50"
              onClick={() => setValue(true)}
              disabled={saving || flag === true}
              title="Activer Essentiel offert global"
            >
              ON
            </button>
          </div>

          {saving && <p className="mt-2 text-xs text-gray-500">Enregistrement…</p>}
        </>
      )}
    </div>
  );
}
