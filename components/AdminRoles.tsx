// -*- coding: utf-8 -*-
// -----------------------------------------------------------------------------
// AdminRoles.tsx — Vivaya (page /admin, bloc “Gestion des administrateurs”)
// -----------------------------------------------------------------------------
// Règles projet :
//   1) Code robuste, simple, modulaire. Pas d’usine à gaz.
//   2) Zéro bug toléré, tout en UTF-8.
//   3) Ne JAMAIS retirer des commentaires utiles. (J’ajoute ici des commentaires
//      détaillés pour documenter chaque étape du composant.)
//   4) Affichage lisible sur fond sombre.
// -----------------------------------------------------------------------------
//
// But : lister les comptes ayant des rôles admin/superadmin.
// Source de vérité : vue REST *publique* `public.admin_users_v` (exposée par Supabase),
// avec RLS qui autorise la lecture UNIQUEMENT si l’utilisateur connecté est admin.
//
// NOTE IMPORTANTE :
//   - On interroge *une vue* (table virtuelle) plutôt que les tables brutes.
//   - Les politiques RLS sont portées par les tables source `public.*`,
//     donc un non-admin verra 0 ligne même si la vue est exposée en REST.
//   - La vue utilisée ici doit exister côté base : `public.admin_users_v`
//     avec les colonnes : id, email, username, is_admin, is_superadmin, created_at.
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

// Typage minimal aligné avec la vue `public.admin_users_v`.
type AdminRow = {
  id: string
  email: string | null
  username: string | null
  is_admin: boolean | null
  is_superadmin: boolean | null
  created_at?: string | null
}

export default function AdminRoles() {
  // État local : liste, recherche, chargement, id user courant.
  const [rows, setRows] = useState<AdminRow[]>([])
  const [q, setQ] = useState("") // filtre local (email OU pseudo)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // ⮕ Récupère l’utilisateur connecté (pour le badge “vous”).
  useEffect(() => {
    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (!error && data?.user?.id) setCurrentUserId(data.user.id)
    }
    void loadUser()
  }, [])

  // ⮕ Charge les admins depuis la vue `public.admin_users_v`.
  //    - On ne met AUCUN filtre côté SQL (déjà filtré par la vue).
  //    - On ordonne juste par email pour une lecture plus claire.
  useEffect(() => {
    let alive = true

    const load = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from("admin_users_v") // ← vue publique, pas “admin.users_v”
        .select("id, email, username, is_admin, is_superadmin, created_at")
        .order("email", { ascending: true })

      if (!alive) return

      if (error) {
        // En cas d’erreur (RLS mal configurée, vue absente, etc.)
        console.error("[AdminRoles] fetch error:", error.message)
        setRows([])
      } else {
        setRows((data ?? []) as AdminRow[])
      }

      setLoading(false)
    }

    void load()
    return () => {
      alive = false
    }
  }, [])

  // ⮕ Filtrage local (champ de recherche) : email OU pseudo.
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter(
      r =>
        (r.email ?? "").toLowerCase().includes(s) ||
        (r.username ?? "").toLowerCase().includes(s)
    )
  }, [q, rows])

  // -----------------------------------------------------------------------------
  // Rendu
  //   - Ligne 1 : email en monospace (lisible/tronquable).
  //   - Ligne 2 : badges (vous / super-admin / admin) + pseudo à droite.
  //   - Pas d’actions (lecture seule). Les mutations de rôle se feront sur une
  //     page dédiée si on en a besoin (évite artefacts sur mobile).
  // -----------------------------------------------------------------------------
  return (
    <section aria-labelledby="admins-heading" className="space-y-3">
      <h2 id="admins-heading" className="text-xl font-semibold text-gray-100">
        👩‍💻 Gestion des administrateurs
      </h2>

      {/* Champ de recherche (fond sombre) */}
      <div className="flex gap-2">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un email ou un pseudo (admins uniquement)"
          className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 placeholder-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Rechercher un administrateur"
        />
      </div>

      {/* Liste */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-gray-300">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-300">Aucun administrateur trouvé.</div>
        ) : (
          filtered.map((r) => {
            const isSelf = r.id === currentUserId
            return (
              <div
                key={r.id}
                className="flex items-center justify-between rounded border border-gray-700 bg-gray-800 px-3 py-2"
              >
                <div className="min-w-0">
                  {/* Ligne principale : email */}
                  <div className="truncate text-gray-100 font-medium leading-tight font-mono">
                    {r.email || "(sans email)"}
                  </div>

                  {/* Ligne secondaire : badges + pseudo (à droite) */}
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                    {isSelf && (
                      <span className="rounded bg-slate-200 text-slate-900 text-xs px-2 py-0.5">
                        vous
                      </span>
                    )}
                    {r.is_superadmin && (
                      <span className="rounded bg-purple-200 text-purple-900 text-xs px-2 py-0.5">
                        super-admin
                      </span>
                    )}
                    {r.is_admin && !r.is_superadmin && (
                      <span className="rounded bg-green-200 text-green-900 text-xs px-2 py-0.5">
                        admin
                      </span>
                    )}
                    {r.username && <span className="text-gray-300">— {r.username}</span>}
                  </div>
                </div>

                {/* Lecture seule : aucun bouton ici → pas d’artefact mobile */}
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
