// pages/admin/ProfilesAvatarParDefaut.tsx
//
// Page admin : Profils avec avatar par défaut
// ------------------------------------------------------------
// Source SQL : admin.audit_profiles_avatar_par_defaut_v
//
// Colonnes réelles dans la vue :
// - user_id (uuid)              : identifiant du user
// - email (text)                : email du user
// - username (text)             : pseudo du profil
// - created_at (timestamptz)    : date d’inscription / de création du profil
// - ville (text)                : ville issue de user_localisations
// - code_postal (text)          : code postal issu de user_localisations
// - weeks_since_signup (int4)   : nombre de semaines depuis l’inscription
// - avatar_par_defaut (bool)    : indicateur “avatar par défaut” (TRUE ici)
// - age (int4)                  : âge du profil
// - genre (text)                : genre du profil
// - genre_recherche (text)      : ce que la personne recherche
//
// Objectif :
//   - Lister les profils COMPLETS (âge + genre remplis)
//     qui n'ont pas encore de photo principale validée
//     et qui utilisent donc encore un avatar par défaut.
//   - Permettre à un admin de PURGER plusieurs comptes en une fois.
//
// ⚠️ Backend associé :
//   - Vue SQL  : admin.audit_profiles_avatar_par_defaut_v
//   - API Next : pages/api/admin/purge-profiles-avatar-default.ts
//     => POST avec body { user_ids: string[] }
//     => Header Authorization: Bearer <access_token>
//
// Règles Vivaya : code simple, robuste, commenté, UTF-8, zéro gadget.
//

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSessionContext } from '@supabase/auth-helpers-react';

// Client Supabase générique
const supabase = createClientComponentClient();

type AuditAvatarRow = {
  user_id: string;
  email: string | null;
  username: string | null;
  created_at: string | null;
  ville: string | null;
  code_postal: string | null;
  weeks_since_signup: number | null;
  avatar_par_defaut: boolean | null;
  age: number | null;
  genre: string | null;
  genre_recherche: string | null;
};

function formatSemaines(semaines: number | null): string {
  if (semaines === null || semaines === undefined) return '—';
  if (semaines <= 0) return '0';
  if (semaines === 1) return '1 semaine';
  return `${semaines} semaines`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR');
  } catch {
    return dateStr;
  }
}

function formatVilleCp(ville: string | null, codePostal: string | null): string {
  if (!ville && !codePostal) return '—';
  if (!ville) return codePostal ?? '—';
  if (!codePostal) return ville;
  return `${ville} (${codePostal})`;
}

const ProfilesAvatarParDefautPage = () => {
  const { session } = useSessionContext();
  const [rows, setRows] = useState<AuditAvatarRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Sélection pour la purge
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [purgeLoading, setPurgeLoading] = useState<boolean>(false);
  const [purgeError, setPurgeError] = useState<string | null>(null);
  const [purgeSuccess, setPurgeSuccess] = useState<string | null>(null);

  // Chargement des données depuis la vue d’audit admin
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        // Lecture depuis la vue d’audit côté schéma admin
        const { data, error: supaError } = await supabase
          .schema('admin')
          .from('audit_profiles_avatar_par_defaut_v')
          .select('*')
          .order('created_at', { ascending: false });

        if (!isMounted) return;

        if (supaError) {
          console.error(
            'Erreur Supabase audit_profiles_avatar_par_defaut_v:',
            supaError
          );
          setLoadError('Impossible de charger la liste pour le moment.');
          setRows([]);
          return;
        }

        setRows((data || []) as AuditAvatarRow[]);
        setSelectedIds([]); // reset sélection si la liste change
      } catch (e: any) {
        console.error('Erreur inattendue ProfilesAvatarParDefautPage:', e);
        if (isMounted) {
          setLoadError('Une erreur inattendue est survenue.');
          setRows([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (session) {
      fetchData();
    } else {
      setLoading(false);
      setRows([]);
    }

    return () => {
      isMounted = false;
    };
  }, [session]);

  const count = rows.length;

  // Helpers sélection
  const allIds = rows.map((r) => r.user_id);
  const allSelected =
    allIds.length > 0 &&
    allIds.every((id) => selectedIds.includes(id)) &&
    selectedIds.length === allIds.length;

  const toggleSelect = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allIds);
    }
  };

  // Appel API purge
  const handlePurgeSelection = async () => {
    if (!session) {
      setPurgeError('Session invalide (non connecté).');
      return;
    }
    if (selectedIds.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Tu t'apprêtes à purger définitivement ${selectedIds.length} compte(s).\n\nCette action est irréversible.\n\nContinuer ?`
    );
    if (!confirmed) return;

    try {
      setPurgeLoading(true);
      setPurgeError(null);
      setPurgeSuccess(null);

      const accessToken =
        (session as any).access_token || (session as any).accessToken;

      if (!accessToken) {
        setPurgeError('Impossible de récupérer le token de session.');
        return;
      }

      const res = await fetch('/api/admin/purge-profiles-avatar-default', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ user_ids: selectedIds }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        const errMsg =
          json?.error || 'Erreur lors de la purge (voir logs serveur).';
        setPurgeError(errMsg);
        return;
      }

      const deletedIds: string[] = json.deleted_ids || [];
      const failed = (json.failed_ids || []) as { id: string; error: string }[];

      setPurgeSuccess(
        `Purge terminée : ${deletedIds.length} compte(s) supprimé(s), ${failed.length} échec(s).`
      );

      if (deletedIds.length > 0) {
        // On retire les lignes supprimées de la liste
        setRows((prev) => prev.filter((r) => !deletedIds.includes(r.user_id)));
      }

      // On enlève les IDs supprimés de la sélection
      setSelectedIds((prev) => prev.filter((id) => !deletedIds.includes(id)));

      if (failed.length > 0) {
        console.warn(
          '[purge-profiles-avatar-default] Échecs pour :',
          failed
        );
      }
    } catch (e: any) {
      console.error('Erreur purge-profiles-avatar-default:', e);
      setPurgeError(e?.message || 'Erreur inattendue lors de la purge.');
    } finally {
      setPurgeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Bouton retour */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700 transition"
          >
            ← Retour au tableau de bord
          </Link>
        </div>

        {/* Titre + sous-titre */}
        <h1 className="text-3xl font-bold text-yellow-300 mb-2">
          Profils avec avatar par défaut
        </h1>
        <p className="text-sm text-slate-300 mb-6">
          Cette liste affiche les profils{' '}
          <span className="font-semibold">complets</span> (âge + genre
          remplis) qui n&apos;ont pas encore de{' '}
          <span className="font-semibold">photo principale validée</span> et
          qui utilisent donc encore un{' '}
          <span className="font-semibold">avatar par défaut</span>.
        </p>
        <p className="text-xs text-slate-500 mb-4">
          Source :{' '}
          <code className="font-mono">
            admin.audit_profiles_avatar_par_defaut_v
          </code>
        </p>

        {/* Encadré compteur */}
        <div className="mb-4 rounded-xl bg-slate-900 border border-slate-800 p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-400">
              Nombre de profils concernés
            </div>
            <div className="text-3xl font-bold text-yellow-300 mt-1">
              {count}
            </div>
          </div>
          <div className="text-right text-xs text-slate-400 max-w-xs">
            Profils complets sans photo principale validée, identifiés via la
            vue d&apos;audit (avatar par défaut = TRUE).
          </div>
        </div>

        {/* Zone actions purge */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handlePurgeSelection}
            disabled={
              purgeLoading || selectedIds.length === 0 || rows.length === 0
            }
            className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition ${
              purgeLoading || selectedIds.length === 0 || rows.length === 0
                ? 'bg-red-900/40 text-red-200/60 cursor-not-allowed'
                : 'bg-red-700 text-red-50 hover:bg-red-600'
            }`}
          >
            {purgeLoading ? 'Purge en cours…' : 'Purger la sélection'}
          </button>
          <span className="text-xs text-slate-400">
            {selectedIds.length > 0
              ? `${selectedIds.length} profil(s) sélectionné(s).`
              : 'Sélectionne un ou plusieurs profils pour les purger.'}
          </span>
        </div>

        {/* Messages liés au chargement initial */}
        {loading && (
          <div className="mb-2 text-sm text-slate-300">
            Chargement des profils…
          </div>
        )}
        {loadError && (
          <div className="mb-2 rounded-md bg-red-900/40 border border-red-700 px-3 py-2 text-sm text-red-100">
            {loadError}
          </div>
        )}

        {/* Messages liés à la purge */}
        {purgeError && (
          <div className="mb-2 rounded-md bg-red-900/40 border border-red-700 px-3 py-2 text-sm text-red-100">
            {purgeError}
          </div>
        )}
        {purgeSuccess && (
          <div className="mb-2 rounded-md bg-emerald-900/40 border border-emerald-700 px-3 py-2 text-sm text-emerald-100">
            {purgeSuccess}
          </div>
        )}

        {/* Tableau */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900/80">
                <tr>
                  {/* Colonne sélection */}
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-slate-500 bg-slate-900"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    UUID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Pseudo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Ville / CP
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Âge
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Genre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Recherche
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Semaines
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Inscription
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rows.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-4 py-6 text-center text-slate-400 text-sm"
                    >
                      Aucun profil concerné pour le moment.
                    </td>
                  </tr>
                )}

                {rows.map((row) => (
                  <tr key={row.user_id}>
                    {/* Checkbox sélection */}
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.user_id)}
                        onChange={() => toggleSelect(row.user_id)}
                        className="h-4 w-4 rounded border-slate-500 bg-slate-900"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {row.user_id}
                    </td>
                    <td className="px-4 py-3 text-slate-100">
                      {row.email || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {row.username || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      {formatVilleCp(row.ville, row.code_postal)}
                    </td>
                    <td className="px-4 py-3">
                      {row.age ?? '—'}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {row.genre || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {row.genre_recherche || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {formatSemaines(row.weeks_since_signup)}
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(row.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center rounded-full bg-slate-800/70 px-3 py-1 text-xs text-slate-200">
                        Lecture + purge
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Remarque bas de page */}
        <p className="mt-4 text-xs text-slate-500">
          Remarque : la purge supprime définitivement le compte (auth +
          données liées selon la logique de{' '}
          <code className="font-mono">
            purge-profiles-avatar-default.ts
          </code>
          ). Pour une suppression manuelle ou un cas particulier, utilise
          plutôt la page admin principale.
        </p>
      </div>
    </div>
  );
};

// Marqueur utilisé par ton système d’auth admin côté front (si tu l’utilises déjà sur d’autres pages)
(ProfilesAvatarParDefautPage as any).requireAuth = true;

export default ProfilesAvatarParDefautPage;
