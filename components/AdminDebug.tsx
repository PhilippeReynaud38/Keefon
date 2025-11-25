// UTF-8 – /components/AdminDebug.tsx
// -----------------------------------------------------------------------------
// Carte "Admin Debug" (lecture seule).
// Correction : on utilise d’abord la RPC `is_admin()` pour refléter le vrai statut
// d’accès ; on garde un fallback via `profiles` si la RPC manque.
// -----------------------------------------------------------------------------

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminDebug() {
  const [email, setEmail] = useState<string | null>(null)
  const [uid, setUid] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [isSuper, setIsSuper] = useState<boolean | null>(null)

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setEmail(user.email || null)
      setUid(user.id)

      // 1) RPC is_admin()
      const { data: ok, error: eRpc } = await supabase.rpc('is_admin')
      if (!eRpc && typeof ok === 'boolean') {
        setIsAdmin(ok)
      }

      // 2) Fallback lecture `profiles`
      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin, is_superadmin")
        .eq("id", user.id)
        .maybeSingle()

      if (!error && data) {
        if (isAdmin === null) setIsAdmin(!!data.is_admin || !!data.is_superadmin)
        setIsSuper(!!data.is_superadmin)
      }
    }
    void check()
  }, [])

  return (
    <div className="mt-10 max-w-md mx-auto p-4 bg-gray-800 border border-gray-700 rounded-lg shadow text-sm text-gray-100">
      <h2 className="font-bold mb-2">🛠️ Admin Debug</h2>
      <p><strong>Email :</strong> {email || "—"}</p>
      <p><strong>User ID :</strong> {uid || "—"}</p>
      <p>
        <strong>is_admin :</strong>{" "}
        {isAdmin === null ? "—" : isAdmin ? "✅ true" : "❌ false"}
      </p>
      <p>
        <strong>is_superadmin :</strong>{" "}
        {isSuper === null ? "—" : isSuper ? "✅ true" : "❌ false"}
      </p>
    </div>
  )
}
