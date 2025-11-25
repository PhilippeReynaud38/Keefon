// -*- coding: utf-8 -*-
// pages/admin/Conversation/[id].tsx
// Admin — Lecteur de conversation par conversation_id (lecture seule)
// Patch 2025-10-30:
//  • Remplace <link> (HTML) par <Link> (Next) pour la navigation (erreur React #399 au prerender)
//  • Force SSR via getServerSideProps pour éviter toute tentative de SSG export sur cette page admin

import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type Row = {
  id: number | string;
  conversation_id: string;
  sender: string;
  receiver: string;
  content: string;
  created_at: string;
  sender_email?: string | null;
  receiver_email?: string | null;
};

export default function AdminConversation() {
  const router = useRouter();
  const conversationId = (router.query.id as string) || "";

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId) return;
    (async () => {
      setLoading(true);
      setErr(null);

      // Lecture via vue admin (voir SQL ci-dessous)
      const { data, error } = await supabase
        .from("admin.messages_by_conversation_v")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(2000);

      if (error) {
        setErr(error.message || "Erreur de chargement.");
        setRows([]);
      } else {
        setRows((data ?? []) as Row[]);
      }
      setLoading(false);
    })();
  }, [conversationId]);

  const title = useMemo(
    () => `Admin — Conversation ${conversationId.slice(0, 8)}…`,
    [conversationId]
  );

  return (
    <>
      <div className="fixed inset-0 bg-neutral-900 -z-10" />
      <Head>
        <title>{title}</title>
      </Head>

      <main className="mx-auto max-w-4xl px-4 py-6 text-neutral-100">
        <div className="mb-4 flex items-center gap-3">
          {/* ✅ Navigation: Next <Link>, pas <link> HTML */}
          <Link
            href="/admin/AbuseReports"
            className="px-3 py-1.5 rounded border border-neutral-700 bg-neutral-800"
          >
            ← Retour
          </Link>
          <h1 className="text-lg font-semibold">Conversation (admin)</h1>
          <span className="ml-auto text-xs opacity-70">
            {new Date().toLocaleString()}
          </span>
        </div>

        {err && (
          <div className="mb-3 rounded-md bg-red-900/30 border border-red-600 px-3 py-2 text-sm text-red-100">
            {err}
          </div>
        )}
        {loading ? (
          <p className="opacity-80">Chargement…</p>
        ) : rows.length === 0 ? (
          <p className="opacity-80">Aucun message pour cette conversation.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((m) => (
              <div
                key={m.id}
                className="border border-neutral-700 rounded-lg p-3 bg-neutral-900"
              >
                <div className="text-xs text-neutral-400 mb-1">
                  <b>De</b> {m.sender_email || m.sender} <b>→</b>{" "}
                  {m.receiver_email || m.receiver}
                  <span className="ml-2">
                    {new Date(m.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="whitespace-pre-wrap text-sm">{m.content}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

// ✅ Forcer SSR pour éviter le prerender/export statique de cette page admin
export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });
