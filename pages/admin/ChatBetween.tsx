// -*- coding: utf-8 -*-
// pages/admin/ChatBetween.tsx
// Admin — Conversation a ↔ b via vue publique, rendu client-only (No-SSR), simple et robuste.

import dynamic from "next/dynamic";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type Row = {
  id: number | string;
  sender: string;
  receiver: string;
  content: string;
  created_at: string;
  sender_email?: string | null;
  receiver_email?: string | null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function ChatBetweenInner() {
  const router = useRouter();
  const a = (router.query.a as string) || "";
  const b = (router.query.b as string) || "";

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!UUID_RE.test(a) || !UUID_RE.test(b)) {
      setErr("Paramètres a/b invalides."); setLoading(false); return;
    }
    (async () => {
      setLoading(true); setErr(null);
      const { data, error } = await supabase
        .from("messages_between_admin_view")
        .select("*")
        .or(`and(sender.eq.${a},receiver.eq.${b}),and(sender.eq.${b},receiver.eq.${a})`)
        .order("created_at", { ascending: true })
        .limit(1000);
      if (error) { setErr(error.message || "Erreur de chargement."); setRows([]); }
      else       { setRows((data ?? []) as Row[]); }
      setLoading(false);
    })();
  }, [a, b]);

  return (
    <div style={{ backgroundColor: "#111827", color: "#e5e7eb", minHeight: "100vh" }}>
      <Head><title>Admin — Conversation</title></Head>
      <main style={{ maxWidth: 880, margin: "0 auto", padding: 24 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
          <link href="/admin/AbuseReports" style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #374151", background: "#1f2937", color: "#e5e7eb" }}>← Retour</link>
          <h1 style={{ fontSize: 18, fontWeight: 600 }}>Conversation (admin)</h1>
        </div>

        {err && <div style={{ marginBottom: 12, borderRadius: 8, background: "rgba(127,29,29,.3)", border: "1px solid #dc2626", padding: "8px 12px", fontSize: 14, color: "#fee2e2" }}>{err}</div>}
        {loading ? (
          <p style={{ opacity: .8 }}>Chargement…</p>
        ) : rows.length === 0 ? (
          <p style={{ opacity: .8 }}>Aucun message entre ces deux utilisateurs.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {rows.map((m) => (
              <div key={m.id} style={{ border: "1px solid #374151", borderRadius: 10, padding: 12, background: "#111827" }}>
                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6 }}>
                  <b>De</b> {m.sender_email || m.sender} <b>→</b> {m.receiver_email || m.receiver}
                  <span style={{ marginLeft: 8 }}>{new Date(m.created_at).toLocaleString()}</span>
                </div>
                <div style={{ whiteSpace: "pre-wrap", fontSize: 14 }}>{m.content}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Export client-only (No-SSR) pour éliminer toute hydratation côté serveur.
export default dynamic(() => Promise.resolve(ChatBetweenInner), { ssr: false });
