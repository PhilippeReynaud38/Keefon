// components/admin/GeoFlagsMVP.tsx
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const COUNTRY = 'FR'
const FEATURE = 'essentiel_offert'

// Dictionnaire FR (01–95)
const FR_DEPARTEMENTS_01_95: Record<string, string> = {
  '01':'Ain','02':'Aisne','03':'Allier','04':'Alpes-de-Haute-Provence','05':'Hautes-Alpes','06':'Alpes-Maritimes','07':'Ardèche','08':'Ardennes','09':'Ariège','10':'Aube','11':'Aude','12':'Aveyron','13':'Bouches-du-Rhône','14':'Calvados','15':'Cantal','16':'Charente','17':'Charente-Maritime','18':'Cher','19':'Corrèze','21':'Côte-d’Or','22':'Côtes-d’Armor','23':'Creuse','24':'Dordogne','25':'Doubs','26':'Drôme','27':'Eure','28':'Eure-et-Loir','29':'Finistère','30':'Gard','31':'Haute-Garonne','32':'Gers','33':'Gironde','34':'Hérault','35':'Ille-et-Vilaine','36':'Indre','37':'Indre-et-Loire','38':'Isère','39':'Jura','40':'Landes','41':'Loir-et-Cher','42':'Loire','43':'Haute-Loire','44':'Loire-Atlantique','45':'Loiret','46':'Lot','47':'Lot-et-Garonne','48':'Lozère','49':'Maine-et-Loire','50':'Manche','51':'Marne','52':'Haute-Marne','53':'Mayenne','54':'Meurthe-et-Moselle','55':'Meuse','56':'Morbihan','57':'Moselle','58':'Nièvre','59':'Nord','60':'Oise','61':'Orne','62':'Pas-de-Calais','63':'Puy-de-Dôme','64':'Pyrénées-Atlantiques','65':'Hautes-Pyrénées','66':'Pyrénées-Orientales','67':'Bas-Rhin','68':'Haut-Rhin','69':'Rhône','70':'Haute-Saône','71':'Saône-et-Loire','72':'Sarthe','73':'Savoie','74':'Haute-Savoie','75':'Paris','76':'Seine-Maritime','77':'Seine-et-Marne','78':'Yvelines','79':'Deux-Sèvres','80':'Somme','81':'Tarn','82':'Tarn-et-Garonne','83':'Var','84':'Vaucluse','85':'Vendée','86':'Vienne','87':'Haute-Vienne','88':'Vosges','89':'Yonne','90':'Territoire de Belfort','91':'Essonne','92':'Hauts-de-Seine','93':'Seine-Saint-Denis','94':'Val-de-Marne','95':'Val-d’Oise'
}

type DeptFlag = {
  department_code: string
  enabled: boolean
  note: string | null
  updated_at: string
}

export default function GeoFlagsMVP({ className }: { className?: string }) {
  const supabase = createClientComponentClient()

  // Pays ON/OFF
  const [loadingCountry, setLoadingCountry] = useState(true)
  const [savingCountry, setSavingCountry] = useState(false)
  const [countryOn, setCountryOn] = useState<boolean>(false)

  // Départements (uniquement actifs à l’affichage)
  const [loadingDepts, setLoadingDepts] = useState(true)
  const [deptFlags, setDeptFlags] = useState<DeptFlag[]>([])
  const [depToAdd, setDepToAdd] = useState<string>('')

  const allDeps = useMemo(
    () => Object.entries(FR_DEPARTEMENTS_01_95).map(([code, name]) => ({ code, name })),
    []
  )
  const availableToAdd = useMemo(() => {
    const alreadyOn = new Set(deptFlags.map(d => d.department_code))
    return allDeps.filter(d => !alreadyOn.has(d.code))
  }, [allDeps, deptFlags])

  // --- Loaders
  const loadCountry = useCallback(async () => {
    setLoadingCountry(true)
    const { data, error } = await supabase.rpc('get_essentiel_offert_global')
    if (!error) setCountryOn(!!data)
    setLoadingCountry(false)
  }, [supabase])

  const loadDepts = useCallback(async () => {
    setLoadingDepts(true)
    // Récupère TOUS les flags puis filtre côté front pour n’afficher que enabled = true
    const { data, error } = await supabase.rpc('list_department_flags', { p_country: COUNTRY })
    if (!error && Array.isArray(data)) {
      const onlyEnabled = (data as DeptFlag[]).filter(d => d.enabled)
      setDeptFlags(onlyEnabled.sort((a, b) => a.department_code.localeCompare(b.department_code)))
    }
    setLoadingDepts(false)
  }, [supabase])

  // --- Effects
  useEffect(() => {
    loadCountry()
    loadDepts()

    const ch = supabase
      .channel('geo-flags-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'geo_country_flags' }, () => {
        loadCountry()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'geo_department_flags' }, () => {
        loadDepts()
      })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [loadCountry, loadDepts, supabase])

  // --- Actions PAYS
  async function setCountry(on: boolean) {
    if (savingCountry) return
    setSavingCountry(true)
    const { error } = await supabase.rpc('admin_set_essential_by_country', {
      p_country: COUNTRY,
      p_on: on,
    })
    if (error) alert(`Erreur serveur (pays ${on ? 'ON' : 'OFF'}) : ${error.message}`)
    await loadCountry()
    setSavingCountry(false)
  }

  // --- Actions DÉPARTEMENTS
  async function addDepartment(code: string) {
    if (!code) return
    const { error } = await supabase.rpc('admin_set_essential_by_department', {
      p_country: COUNTRY,
      p_department: code,
      p_enabled: true,
      p_note: 'via admin_set_essential_by_department',
    })
    if (error) return alert(`Échec ajout ${code} : ${error.message}`)
    setDepToAdd('')
    await loadDepts()
  }

  async function disableDepartment(code: string) {
    const { error } = await supabase.rpc('admin_set_essential_by_department', {
      p_country: COUNTRY,
      p_department: code,
      p_enabled: false,
      p_note: 'désactivé via admin',
    })
    if (error) return alert(`Échec désactivation ${code} : ${error.message}`)
    await loadDepts()
  }

  return (
    <section className={className}>
      <h3 className="mb-3 text-center text-lg font-semibold text-gray-100">GEO Flags (MVP)</h3>

      <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
        {/* Ligne PAYS */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-100">
            France <span className="text-sm text-gray-400">(01–95)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              className={`rounded-full px-6 py-2 font-bold shadow ${countryOn ? 'bg-emerald-600 text-white' : 'bg-emerald-700/60 text-white/90 hover:bg-emerald-700'} ${savingCountry ? 'opacity-60' : ''}`}
              disabled={savingCountry || (countryOn && !loadingCountry)}
              onClick={() => setCountry(true)}
              title="Activer Essentiel offert pour FR"
            >
              ON
            </button>
            <button
              className={`rounded-full px-3 py-1 text-xs font-semibold shadow ${!countryOn ? 'bg-gray-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'} ${savingCountry ? 'opacity-60' : ''}`}
              disabled={savingCountry || (!countryOn && !loadingCountry)}
              onClick={() => setCountry(false)}
              title="Désactiver Essentiel offert pour FR"
            >
              OFF
            </button>
          </div>
        </div>

        {/* Bandeau état pays */}
        {!loadingCountry && (
          <div className={`mb-4 rounded-lg px-3 py-2 text-sm ${countryOn ? 'bg-emerald-800/40 text-emerald-200' : 'bg-gray-800 text-gray-300'}`}>
            {countryOn
              ? 'Essentiel offert : ACTIF — Actuellement, les abonnements sont offerts.'
              : 'Essentiel offert : INACTIF — Aucun cadeau pays.'}
          </div>
        )}

        {/* Sélecteur d’ajout de département */}
        <div className="mb-2">
          <label className="mb-1 block text-sm font-semibold text-gray-100">
            Ajouter un département éligible (01–95)
          </label>
          <div className="flex items-center gap-2">
            <select
              className="w-80 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 outline-none focus:ring-2 focus:ring-yellowGreen"
              value={depToAdd}
              onChange={(e) => setDepToAdd(e.target.value)}
            >
              <option value="">— choisir —</option>
              {availableToAdd.map(({ code, name }) => (
                <option key={code} value={code}>{code} · {name}</option>
              ))}
            </select>
            <button
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${depToAdd ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-gray-700 text-gray-300 cursor-not-allowed'}`}
              disabled={!depToAdd}
              onClick={() => addDepartment(depToAdd)}
            >
              Ajouter
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Par défaut tout est OFF. Les départements ajoutés passent en ON.
          </p>
        </div>

        {/* Liste des départements ACTIFS uniquement */}
        <div className="mt-4">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-gray-200 font-semibold">Départements ON : {loadingDepts ? '…' : deptFlags.length}</span>
          </div>

          <div className="rounded-lg bg-gray-800/60 p-3">
            {loadingDepts ? (
              <div className="text-sm text-gray-400">Chargement…</div>
            ) : deptFlags.length === 0 ? (
              <div className="text-sm text-gray-400">Aucun département activé.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {deptFlags.map((d) => (
                  <div
                    key={d.department_code}
                    className="group inline-flex items-center gap-2 rounded-full border border-emerald-600 bg-emerald-900/40 px-3 py-1 text-emerald-200"
                  >
                    <span className="font-semibold">
                      {d.department_code} {FR_DEPARTEMENTS_01_95[d.department_code] ? `· ${FR_DEPARTEMENTS_01_95[d.department_code]}` : ''}
                    </span>
                    <button
                      className="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-200 hover:bg-gray-600"
                      title="Désactiver ce département"
                      onClick={() => disableDepartment(d.department_code)}
                    >
                      OFF
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          Lecture via RPC <code>get_essentiel_offert_global</code> / <code>list_department_flags</code> ; écriture via
          <code> admin_set_essential_by_country</code> / <code>admin_set_essential_by_department</code>.
        </p>
      </div>
    </section>
  )
}
