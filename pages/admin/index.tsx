// -*- coding: utf-8 -*-
// File: /pages/admin/index.tsx
// Purpose: Tableau de bord Admin + outils existants.
// Ajout/MAJ :
//  - AdminProfileLookup : si input = UUID ⇒ fetch via RPC find_profile_by_id (retourne aussi email/username)
//  - Bouton "Ouvrir le profil" ouvre dans un nouvel onglet (target="_blank").
//  - ✅ Rappel constant sous le titre du bloc Lookup : "Effectuer la recherche avec Admin, pas SuperAdmin".
//  - ✅ Compteur "Profils avec avatar par défaut" basé sur la vue admin.audit_profiles_avatar_par_defaut_v,
//       affiché sur la même ligne que les compteurs de photos (AdminStatsBar).
//  - ✅ Bouton bas de page "Avatars par défaut" vers /admin/ProfilesAvatarParDefaut.
//  - ✅ Section Anti-brouteurs : compteur "Brouteurs suspectés" basé sur RPC admin_count_anti_brouteurs_suspects().
// Règles Vivaya: robustesse, simplicité, commentaires conservés, UTF-8.

'use client';

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSessionContext } from '@supabase/auth-helpers-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import GeoFlagsMVP from '@/components/admin/GeoFlagsMVP'
import AdminDebug from '@/components/AdminDebug'
import AdminRoles from '@/components/AdminRoles'
import AdminStatsBar from '@/components/admin/AdminStatsBar'
import PlanCounters from '@/components/admin/PlanCounters'
import PlanCountersFiltered from '@/components/admin/PlanCountersFiltered'
import OfferEssentielCard from '@/components/admin/OfferEssentielCard'
import FiltersBar, { type Filters } from '@/components/admin/FiltersBar'

// -----------------------------------------------------------------------------
// Supabase client (côté client uniquement)
const supabase = createClientComponentClient()

// util: nettoyage léger des filtres (retire champs vides)
function sanitizeFilters(raw: Filters | null | undefined): Filters {
  const f: Record<string, unknown> = { ...(raw ?? {}) }
  const isEmpty = (v: unknown) =>
    v == null ||
    (typeof v === 'string' && v.trim() === '') ||
    (Array.isArray(v) && v.length === 0)

  const cleaned: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(f)) if (!isEmpty(v)) cleaned[k] = v
  return cleaned as Filters
}

// -----------------------------------------------------------------------------
// ⚙️  Mini-outil: Lookup profil (email ou UUID) → lien /profileplus/[id]
// -----------------------------------------------------------------------------
function AdminProfileLookup() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ id: string; email?: string; username?: string } | null>(null)

  // Détecteur UUID v4
  const isUuid = (s: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s.trim())

  // RPC email → profil (v2 si présente, sinon v1)
  async function callFindByEmail(email: string) {
    let r = await supabase.rpc('find_profile_by_email_v2', { p_email: email })
    if (r.error && (r.error.code === '42883' || /find_profile_by_email_v2/.test(String(r.error.message || '')))) {
      r = await supabase.rpc('find_profile_by_email', { p_email: email })
    }
    return r
  }

  // ✅ RPC : lookup par UUID (admin)
  async function callFindById(id: string) {
    const r = await supabase.rpc('find_profile_by_id', { p_id: id })
    return r
  }

  async function runLookup() {
    setError(null)
    setResult(null)
    const q = input.trim()
    if (!q) return

    setLoading(true)
    try {
      if (isUuid(q)) {
        // UUID → appelle RPC admin pour récupérer email/username
        const { data, error } = await callFindById(q)
        if (error) { setError('Recherche UUID impossible (RPC).'); return }
        const row = Array.isArray(data) ? (data[0] ?? null) : (data ?? null)
        if (!row || !row.id) { setError('Aucun profil pour cet UUID.'); return }
        setResult({ id: row.id, email: row.email ?? undefined, username: row.username ?? undefined })
      } else {
        // Email → appelle RPC admin email→profil
        const { data, error } = await callFindByEmail(q)
        if (error) { setError(`RPC: ${error.code ?? ''} ${error.message ?? ''}`.trim()); return }

        const row = Array.isArray(data) ? (data[0] ?? null) : (data ?? null)
        if (!row || !row.id) { setError('Aucun profil pour cet email.'); return }
        setResult({ id: row.id, email: row.email ?? undefined, username: row.username ?? undefined })
      }
    } catch {
      setError('Erreur réseau.')
    } finally {
      setLoading(false)
    }
  }

  const link = result?.id ? `/profileplus/${result.id}` : null

  const copyLink = async () => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(
        (typeof location !== 'undefined' ? location.origin : '') + link
      )
    } catch { /* best effort */ }
  }

  return (
    <section aria-label="Lookup profil" className="mb-8 rounded-xl border border-gray-700 bg-gray-900 p-4">
      <h3 className="mb-1 text-center text-lg font-semibold text-gray-100">Lookup profil (email ou UUID)</h3>

      {/* ✅ Rappel constant demandé : Admin, pas SuperAdmin */}
      <p className="mb-3 text-center text-xs text-amber-300">
        Rappel&nbsp;: effectuer la recherche avec <span className="font-semibold">Admin</span>, pas <span className="font-semibold">SuperAdmin</span>.
      </p>

      <div className="flex flex-col md:flex-row gap-2 items-stretch">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ex: user@example.com  ou  6f0d0b59-7a7e-4e6d-8d0e-9c6b2f6d1b3a"
          className="flex-1 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 outline-none focus:ring-2 focus:ring-yellowGreen"
          aria-label="Email ou UUID"
        />
        <button
          onClick={runLookup}
          disabled={!input.trim() || loading}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${
            input.trim() && !loading ? 'bg-yellowGreen text-black hover:opacity-90' : 'bg-gray-700 text-gray-300'
          }`}
        >
          {loading ? 'Recherche…' : 'Trouver'}
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      {result && (
        <div className="mt-3 rounded-lg border border-gray-700 bg-gray-800 p-3 text-sm text-gray-100">
          <div className="mb-1">
            <span className="text-gray-400">ID :</span>{' '}
            <code className="break-all">{result.id}</code>
          </div>
          {result.username && (
            <div className="mb-1"><span className="text-gray-400">Pseudo :</span> {result.username}</div>
          )}
          {result.email && (
            <div className="mb-1"><span className="text-gray-400">Email :</span> {result.email}</div>
          )}

          <div className="mt-2 flex gap-2">
            {link && (
              <>
                {/* 🔗 Ouvre dans un nouvel onglet */}
                <Link
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-500"
                >
                  Ouvrir le profil
                </Link>
                <button
                  onClick={copyLink}
                  className="rounded bg-gray-700 px-3 py-1 text-gray-100 hover:bg-gray-600"
                >
                  Copier le lien
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

// -----------------------------------------------------------------------------
// GEO Flags (MVP FR 01–95, stockage local + RPC)
// -----------------------------------------------------------------------------
// NOTE: composant historique conservé pour compatibilité (utilisation de GeoFlagsMVP
// plus bas). La logique FR_DEPARTEMENTS_01_95 et AdminGeoFlagsMVP reste intacte.

const FR_DEPARTEMENTS_01_95: Record<string, string> = {
  "01":"Ain","02":"Aisne","03":"Allier","04":"Alpes-de-Haute-Provence","05":"Hautes-Alpes","06":"Alpes-Maritimes","07":"Ardèche","08":"Ardennes","09":"Ariège","10":"Aube","11":"Aude","12":"Aveyron","13":"Bouches-du-Rhône","14":"Calvados","15":"Cantal","16":"Charente","17":"Charente-Maritime","18":"Cher","19":"Corrèze",
  "21":"Côte-d’Or","22":"Côtes-d’Armor","23":"Creuse","24":"Dordogne","25":"Doubs","26":"Drôme","27":"Eure","28":"Eure-et-Loir","29":"Finistère","30":"Gard","31":"Haute-Garonne","32":"Gers","33":"Gironde","34":"Hérault","35":"Ille-et-Vilaine","36":"Indre","37":"Indre-et-Loire","38":"Isère","39":"Jura","40":"Landes","41":"Loir-et-Cher","42":"Loire","43":"Haute-Loire","44":"Loire-Atlantique","45":"Loiret","46":"Lot","47":"Lot-et-Garonne","48":"Lozère","49":"Maine-et-Loire","50":"Manche","51":"Marne","52":"Haute-Marne","53":"Mayenne","54":"Meurthe-et-Moselle","55":"Meuse","56":"Morbihan","57":"Moselle","58":"Nièvre","59":"Nord","60":"Oise","61":"Orne","62":"Pas-de-Calais","63":"Puy-de-Dôme","64":"Pyrénées-Atlantiques","65":"Hautes-Pyrénées","66":"Pyrénées-Orientales","67":"Bas-Rhin","68":"Haut-Rhin","69":"Rhône","70":"Haute-Saône","71":"Saône-et-Loire","72":"Sarthe","73":"Savoie","74":"Haute-Savoie","75":"Paris","76":"Seine-Maritime","77":"Seine-et-Marne","78":"Yvelines","79":"Deux-Sèvres","80":"Somme","81":"Tarn","82":"Tarn-et-Garonne","83":"Var","84":"Vaucluse","85":"Vendée","86":"Vienne","87":"Haute-Vienne","88":"Vosges","89":"Yonne","90":"Territoire de Belfort","91":"Essonne","92":"Hauts-de-Seine","93":"Seine-Saint-Denis","94":"Val-de-Marne","95":"Val-d’Oise"
};
const LS_KEY_FR = 'vivaya_admin_geo_flags_FR' // { countryOn:boolean, depsOn:string[] }

function AdminGeoFlagsMVP({ className }: { className?: string }) {
  const [country] = useState<'FR'>('FR')
  const [countryOn, setCountryOn] = useState(false)
  const [depsOn, setDepsOn] = useState<string[]>([])
  const [depToAdd, setDepToAdd] = useState<string>('')

  // charge l’état local
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(LS_KEY_FR) : null
      if (raw) {
        const s = JSON.parse(raw)
        setCountryOn(Boolean(s?.countryOn))
        setDepsOn(Array.isArray(s?.depsOn) ? s.depsOn.filter((x: unknown) => typeof x === 'string') : [])
      }
    } catch {}
  }, [])

  // persiste l’état local
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LS_KEY_FR, JSON.stringify({ countryOn, depsOn }))
      }
    } catch {}
  }, [countryOn, depsOn])

  const allDeps = useMemo(
    () => Object.entries(FR_DEPARTEMENTS_01_95).map(([code, name]) => ({ code, name })),
    []
  )

  // RPC — pays
  const rpcSetCountry = async (on: boolean) => {
    const { error } = await supabase.rpc('admin_set_essential_by_country', {
      p_on: on,
      p_country: 'FR',
    })
    if (error) throw error
  }
  // RPC — département
  const rpcSetDepartment = async (code: string, on: boolean) => {
    const { error } = await supabase.rpc('admin_set_essential_by_department', {
      p_on: on,
      p_country: 'FR',
      p_department: code,
    })
    if (error) throw error
  }

  // Actions UI (optimistes + rollback si erreur)
  const toggleCountry = async () => {
    const prev = countryOn
    setCountryOn(!prev)
    try {
      await rpcSetCountry(!prev)
    } catch (e) {
      setCountryOn(prev)
      console.error(e)
      alert('Échec de l’enregistrement côté serveur (pays).')
    }
  }

  const handleAddDep = async () => {
    const code = depToAdd.padStart(2, '0')
    if (!/^\d{2}$/.test(code)) return
    if (!(code in FR_DEPARTEMENTS_01_95)) return
    if (depsOn.includes(code)) return

    const prev = depsOn
    setDepsOn([...prev, code].sort())
    setDepToAdd('')
    try {
      await rpcSetDepartment(code, true)
    } catch (e) {
      setDepsOn(prev)
      console.error(e)
      alert('Échec de l’enregistrement côté serveur (département).')
    }
  }

  const handleRemoveDep = async (code: string) => {
    const prev = depsOn
    setDepsOn(prev.filter(c => c !== code))
    try {
      await rpcSetDepartment(code, false)
    } catch (e) {
      setDepsOn(prev)
      console.error(e)
      alert('Échec de l’enregistrement côté serveur (département).')
    }
  }

  return (
    <section className={className}>
      <h3 className="mb-3 text-center text-lg font-semibold text-gray-100">GEO Flags (MVP)</h3>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-semibold text-gray-100">Pays</label>
        <select
          value={country}
          onChange={() => {}}
          className="w-64 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 outline-none focus:ring-2 focus:ring-yellowGreen"
          aria-label="Sélectionner un pays"
        >
          <option value="FR">France (FR)</option>
        </select>
      </div>

      <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-100">
            France <span className="text-sm text-gray-400">(01–95)</span>
          </div>
          <button
            type="button"
            onClick={toggleCountry}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              countryOn ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-200'
            }`}
            aria-pressed={countryOn}
            aria-label="Basculer France ON/OFF"
            title="Basculer France ON/OFF"
          >
            {countryOn ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="mb-3">
          <label className="mb-1 block text-sm font-semibold text-gray-100">Ajouter un département (01–95)</label>
          <div className="flex items-center gap-2">
            <select
              value={depToAdd}
              onChange={(e) => setDepToAdd(e.target.value)}
              className="w-80 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 outline-none focus:ring-2 focus:ring-yellowGreen"
            >
              <option value="">— choisir —</option>
              {allDeps.map(({ code, name }) => (
                <option key={code} value={code}>
                  {code} · {name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddDep}
              disabled={!depToAdd}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                depToAdd ? 'bg-yellowGreen text-black hover:opacity-90' : 'bg-gray-700 text-gray-300'
              }`}
            >
              Ajouter
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-400">Par défaut tout est OFF. Les départements ajoutés passent en ON.</p>
        </div>

        <div className="mt-4">
          <div className="mb-2 text-sm font-semibold text-gray-100">
            Départements ON : <span className="text-gray-300">{depsOn.length}</span>
          </div>
          {depsOn.length === 0 ? (
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-3 text-sm text-gray-300">
              Aucun département activé.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {depsOn.map(code => (
                <span
                  key={code}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-3 py-1 text-xs font-semibold text-white"
                >
                  {code} · {FR_DEPARTEMENTS_01_95[code] ?? '—'}
                  <button
                    type="button"
                    onClick={() => handleRemoveDep(code)}
                    className="rounded bg-white/20 px-1.5 py-0.5 text-[11px] hover:bg-white/30"
                    title="Retirer"
                    aria-label={`Retirer ${code}`}
                  >
                    Retirer
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-gray-400">
          Enregistré via RPC admin_set_essential_by_country / admin_set_essential_by_department.
        </p>
      </div>
    </section>
  )
}

// -----------------------------------------------------------------------------
// Carte compteur : Profils avec avatar par défaut
// -----------------------------------------------------------------------------

function DefaultAvatarCounterCard() {
  // Client Supabase (sans typage générique explicite, suffisant pour ce compteur)
  const supabase = createClientComponentClient();

  // Valeur actuelle du compteur
  const [count, setCount] = useState<number | null>(null);

  // Message d'erreur éventuel (affiché sous le compteur)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchCount() {
      if (!isMounted) return;

      try {
        // 🔹 RPC publique qui encapsule la vue admin côté serveur
        const { data, error } = await supabase.rpc(
          'count_profiles_avatar_par_defaut'
        );

        if (!isMounted) return;

        if (error) {
          console.error(
            'Erreur lors du comptage des profils avec avatar par défaut :',
            error
          );
          setErrorMessage(
            error.message || "Erreur lors du chargement du compteur."
          );
          setCount(0);
          return;
        }

        setCount(typeof data === 'number' ? data : 0);
        setErrorMessage(null);
      } catch (err: any) {
        if (!isMounted) return;
        console.error(
          'Erreur inattendue lors du comptage des profils avec avatar par défaut :',
          err
        );
        setErrorMessage("Erreur inattendue lors du chargement du compteur.");
        setCount(0);
      }
    }

    void fetchCount();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  return (
    <div className="rounded-2xl bg-slate-900/60 px-6 py-4 shadow-md border border-slate-800 flex flex-col justify-between">
      <div>
        <h3 className="text-slate-100 text-lg font-semibold">
          Profils avec avatar par défaut
        </h3>
        <p className="text-slate-400 text-xs mt-1">
          Profils complets sans photo principale validée.
        </p>
      </div>

      <div className="mt-4 flex items-baseline gap-3">
        <span className="text-4xl font-bold text-yellow-300">
          {count === null ? '…' : count}
        </span>
      </div>

      <p className="text-slate-500 text-[11px] mt-2">
        Source : <code className="text-slate-400">
          admin.audit_profiles_avatar_par_defaut_v
        </code>
      </p>

      {errorMessage && (
        <p className="text-[11px] text-red-400 mt-1">
          Impossible de charger le compteur (voir console).
        </p>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Carte compteur : Brouteurs suspectés (Anti-brouteurs)
// -----------------------------------------------------------------------------

function AntiBrouteursCounterCard() {
  const supabase = createClientComponentClient();

  const [count, setCount] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchCount() {
      if (!isMounted) return;

      try {
        // RPC admin sécurisée : admin_count_anti_brouteurs_suspects()
        const { data, error } = await supabase.rpc(
          'admin_count_anti_brouteurs_suspects'
        );

        if (!isMounted) return;

        if (error) {
          console.error(
            'Erreur lors du comptage des brouteurs suspectés :',
            error
          );
          setErrorMessage(
            error.message || "Erreur lors du chargement du compteur."
          );
          setCount(0);
          return;
        }

        setCount(typeof data === 'number' ? data : 0);
        setErrorMessage(null);
      } catch (err: any) {
        if (!isMounted) return;
        console.error(
          'Erreur inattendue lors du comptage des brouteurs suspectés :',
          err
        );
        setErrorMessage("Erreur inattendue lors du chargement du compteur.");
        setCount(0);
      }
    }

    void fetchCount();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  return (
    <div className="rounded-2xl bg-slate-900/60 px-6 py-4 shadow-md border border-slate-800 flex flex-col justify-between">
      <div>
        <h3 className="text-slate-100 text-lg font-semibold">
          Brouteurs suspectés
        </h3>
        <p className="text-slate-400 text-xs mt-1">
          Profils ayant reçu plusieurs signalements (≥ 3).
        </p>
      </div>

      <div className="mt-4 flex items-baseline gap-3">
        <span className="text-4xl font-bold text-red-400">
          {count === null ? '…' : count}
        </span>
      </div>

      <p className="text-slate-500 text-[11px] mt-2">
        Source : <code className="text-slate-400">
          admin.anti_brouteurs_stats_v
        </code>
      </p>

      {errorMessage && (
        <p className="text-[11px] text-red-400 mt-1">
          Impossible de charger le compteur (voir console).
        </p>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Page Admin
// -----------------------------------------------------------------------------
const AdminDashboard: React.FC & { requireAuth?: boolean } = () => {
  const { isLoading } = useSessionContext()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  const [filters, setFilters] = useState<Filters>({ country: 'FR' })
  const [appliedFilters, setAppliedFilters] = useState<Filters | null>(null)

  const appliedPayload = useMemo<Filters | null>(() => {
    if (!appliedFilters) return null
    return sanitizeFilters(appliedFilters)
  }, [appliedFilters])

  // Garde d’accès — via RPC vivaya_is_admin()
  useEffect(() => {
    let cancelled = false
    const check = async () => {
      try {
        const { data, error } = await supabase.rpc('vivaya_is_admin')
        if (cancelled) return
        if (error) { setIsAuthorized(false); return }
        setIsAuthorized(Boolean(data))
      } catch {
        if (!cancelled) setIsAuthorized(false)
      }
    }
    if (!isLoading) void check()
    return () => { cancelled = true }
  }, [isLoading])

  if (isLoading || isAuthorized === null) {
    return (
      <div className="min-h-screen w-full bg-gray-900 text-white flex items-center justify-center px-4">
        <div className="text-center text-gray-300">Chargement admin…</div>
      </div>
    )
  }
  if (!isAuthorized) {
    return (
      <div className="min-h-screen w-full bg-gray-900 text-white flex items-center justify-center px-4">
        <div className="text-center text-red-300">⛔ Accès restreint. Réservé aux administrateurs.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white py-12 px-4">
      <h1 className="text-3xl font-bold text-center text-green-400 mb-6">Tableau de bord Admin</h1>

      {/* Compteurs globaux */}
      <div className="max-w-5xl mx-auto mb-6">
        <PlanCounters />
      </div>

      {/* Barre de filtres */}
      <div className="max-w-5xl mx-auto mb-4">
        <FiltersBar
          value={filters}
          onChange={setFilters}
          onApply={(f) => setAppliedFilters(sanitizeFilters(f))}
          onReset={() => { setFilters({ country: 'FR' }); setAppliedFilters(null) }}
        />
      </div>

      {/* Compteurs filtrés */}
      <div className="max-w-5xl mx-auto mb-10">
        {appliedPayload ? (
          <PlanCountersFiltered key={JSON.stringify(appliedPayload)} filters={appliedPayload} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg bg-gray-800 border border-gray-700 p-6">Free (filtré) : 0</div>
            <div className="rounded-lg bg-gray-800 border border-gray-700 p-6">Essentiel (filtré) : 0</div>
            <div className="rounded-lg bg-gray-800 border border-gray-700 p-6">Élite (filtré) : 0</div>
          </div>
        )}
      </div>

      {/* Stats & outils existants + section avatars par défaut + Anti-brouteurs */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {/* Les 2 cartes existantes restent dans AdminStatsBar (photos de galerie + photos à certifier) */}
          <div className="md:col-span-2">
            <AdminStatsBar />
          </div>
          {/* Colonne droite : avatars par défaut + anti-brouteurs */}
          <div className="flex flex-col gap-4">
            <DefaultAvatarCounterCard />
            <AntiBrouteursCounterCard />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <AdminDebug />
        <AdminRoles />
      </div>

      {/* Outils avancés */}
      <div className="mt-16 max-w-5xl mx-auto">
        <h2 className="text-xl font-semibold text-center mb-4 text-gray-100">Outils avancés</h2>

        {/* ✅ Lookup profil */}
        <AdminProfileLookup />

        {/* Carte cadeau Essentiel (existante) */}
        <OfferEssentielCard />

        {/* Bouton de test réseau (existant) */}
        <button
          type="button"
          onClick={async () => {
            try {
              const supabase = createClientComponentClient();
              const { error } = await supabase.from('profiles').select('id').limit(1)
              alert(error ? `Err: ${error.message}` : 'OK (requête partie)')
            } catch (e: any) {
              alert(`Client KO: ${e?.message ?? e}`)
            }
          }}
          className="mt-2 rounded bg-gray-700 px-2 py-1 text-xs text.white"
        >
          Test réseau
        </button>

        {/* GEO Flags — FR local + RPC (composant historique) */}
        <div className="mb-6">
          <GeoFlagsMVP />
        </div>

        <div className="mt-8" />
      </div>

      {/* Liens existants + lien vers la liste des avatars par défaut + Anti-brouteurs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-8 max-w-5xl mx.auto">
        <Link
          href="/admin/certifications"
          className="block rounded-lg border border-gray-700 bg-gray-800 p-4 hover:bg-gray-700"
        >
          📜 Certifications
        </Link>
        <Link
          href="/admin/AbuseReports"
          className="block rounded-lg border border-gray-700 bg-gray-800 p-4 hover:bg-gray-700"
        >
          🚩 Signalements d’abus
        </Link>
        <Link
          href="/admin/PhotoModeration"
          className="block rounded-lg border border-gray-700 bg-gray-800 p-4 hover:bg-gray-700"
        >
          🗂️ Fichiers Storage
        </Link>
        <Link
          href="/admin/OrphanScanner"
          className="block rounded-lg border border-gray-700 bg-gray-800 p-4 hover:bg-gray-700"
        >
          🧹 Orphelins
        </Link>
        {/* 🔗 Liste des profils avec avatar par défaut */}
        <Link
          href="/admin/ProfilesAvatarParDefaut"
          className="block rounded-lg border border-gray-700 bg-gray-800 p-4 hover:bg-gray-700"
        >
          👤 Avatars par défaut
        </Link>
        {/* 🔗 Nouvelle entrée : Anti-brouteurs */}
        <Link
          href="/admin/AntiBrouteurs"
          className="block rounded-lg border border-gray-700 bg-gray-800 p-4 hover:bg-gray-700"
        >
          🛡️ Anti-brouteurs
        </Link>
      </div>
    </div>
  )
}

AdminDashboard.requireAuth = true
export default AdminDashboard
