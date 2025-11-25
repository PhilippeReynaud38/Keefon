// -*- coding: utf-8 -*-
// pages/admin/AbuseReports.tsx
//
// Keefon— Administration : Signalements d’abus
// Règles : robuste, simple, maintenable, 100% UTF-8, commentaires conservés.
// Ajouts/modifs :
//  - Bouton "⚠️ Envoyer un avertissement" : ENVOI SMTP via /api/admin/send-warning (pas de mailto)
//  - Journalisation en base (public.user_warnings) conservée
//  - Garde-fou si note vide (même pop-up que pour Marquer traité / Supprimer / Bannir)
//  - Modèles d’avertissement (sélection par prompt, sujet/corps pré-remplis)
//  - Compteur d’avertissements par utilisateur ciblé (badge “⚠️ N avert.” sur la carte)

import Head from "next/head";
import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";

type AbuseStatus = "pending" | "actioned" | "dismissed";

type AbuseRow = {
  id: string;
  reporter_id: string | null;
  reported_user_id: string | null;
  category: string;
  reason: string;
  status: AbuseStatus;
  admin_note: string | null;
  created_at: string;
  reporter_email: string | null;
  reported_email: string | null;
  reporter_sent_count: number | null;
  reported_received_count: number | null;
};

// -----------------------------------------------------------------------------
// Modèles d’avertissement — simples, clairs, 100% texte brut.
// NB : si une note admin est renseignée, son contenu est proposé en priorité
//      comme corps de message (le modèle sert alors de secours).
const WARNING_TEMPLATES: {
  name: string;
  subject: (reportId: string) => string;
  body: string;
}[] = [
  {
    name: "Avertissement léger",
    subject: (reportId) => `Avertissement suite à un signalement (${reportId})`,
    body:
      "Bonjour,\n\nNous avons reçu un signalement vous concernant. Merci de respecter les règles de Keefon afin de garantir une expérience sereine pour tous.\n\n— L’équipe Keefon",
  },
  {
    name: "Dernier rappel",
    subject: (reportId) => `Dernier rappel — signalement (${reportId})`,
    body:
      "Bonjour,\n\nNous constatons de nouveaux signalements vous concernant. Ceci est un dernier rappel : en cas de récidive, des mesures pourront être prises.\n\n— L’équipe Keefon",
  },
  {
    name: "Mise en demeure",
    subject: (reportId) => `Mise en demeure — non-respect des règles (${reportId})`,
    body:
      "Bonjour,\n\nVos agissements contreviennent aux règles de Keefon. Sans correction immédiate, des mesures disciplinaires pourront être prises (allant jusqu’au bannissement).\n\n— L’équipe Keefon",
  },
];

export default function AbuseReports() {
  const [mounted, setMounted] = useState(false);
  const [rows, setRows] = useState<AbuseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [onlyPending, setOnlyPending] = useState(true);
  const [isSuper, setIsSuper] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [banned, setBanned] = useState<Record<string, boolean>>({});

  // Compteur d'avertissements envoyés par utilisateur (clé=user_id → valeur=nombre)
  const [warningsCount, setWarningsCount] = useState<Record<string, number>>({});

  // Filtre local (utilisé par "Abus émis par / contre")
  const [filterCol, setFilterCol] = useState<null | "reporter_id" | "reported_user_id">(null);
  const [filterUserId, setFilterUserId] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // suis-je superadmin ?
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("is_superadmin").eq("id", user.id).maybeSingle();
      setIsSuper(Boolean(data?.is_superadmin));
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setToast(null); setErr(null);

    let q = supabase
      .from("abuse_reports_admin_view")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);

    if (onlyPending) q = q.eq("status", "pending");
    if (filterCol && filterUserId) q = q.eq(filterCol, filterUserId);

    const { data, error } = await q;
    if (error) { setErr(error.message || "Erreur de chargement."); setRows([]); setLoading(false); return; }
    const list = (data ?? []) as AbuseRow[];
    setRows(list);
    setLoading(false);

    // état "banni" pour badges/boutons
    const ids = Array.from(new Set(list.flatMap(r => [r.reporter_id, r.reported_user_id].filter(Boolean) as string[])));
    if (ids.length) {
      try {
        const { data: bans } = await supabase.from("banned_users").select("user_id").in("user_id", ids);
        const map: Record<string, boolean> = {};
        for (const r of (bans ?? []) as any[]) map[r.user_id] = true;
        setBanned(map);
      } catch { setBanned({}); }

      // ----- Compte des avertissements par utilisateur (pour le badge sur la carte)
      try {
        const { data: warns, error: wErr } = await supabase
          .from("user_warnings")
          .select("target_user_id")
          .in("target_user_id", ids);

        if (!wErr) {
          const wc: Record<string, number> = {};
          (warns ?? []).forEach((w: any) => {
            const k = w?.target_user_id as string | null;
            if (k) wc[k] = (wc[k] || 0) + 1;
          });
          setWarningsCount(wc);
        } else {
          setWarningsCount({});
        }
      } catch {
        setWarningsCount({});
      }
    } else {
      setBanned({});
      setWarningsCount({});
    }
  }, [onlyPending, filterCol, filterUserId]);

  useEffect(() => { void load(); }, [load]);

  async function saveNote(id: string, note: string) {
    setSavingId(id); setToast(null); setErr(null);
    const { error } = await supabase.from("abuse_reports").update({ admin_note: note }).eq("id", id);
    setSavingId(null);
    if (error) { setErr(error.message || "Échec enregistrement note."); return; }
    setToast("Note enregistrée."); await load();
  }

  async function updateStatus(id: string, status: AbuseStatus, admin_note: string) {
    setSavingId(id); setToast(null); setErr(null);
    const { error } = await supabase.from("abuse_reports").update({ status, admin_note }).eq("id", id);
    setSavingId(null);
    if (error) { setErr(error.message || "MàJ statut impossible."); return; }
    setToast("Statut mis à jour."); await load();
  }

  async function deleteReport(id: string) {
    if (!confirm("Supprimer définitivement ce signalement ?")) return;
    setSavingId(id); setToast(null); setErr(null);
    const { error } = await supabase.from("abuse_reports").delete().eq("id", id);
    setSavingId(null);
    if (error) { setErr(error.message || "Échec suppression."); return; }
    setToast("Signalement supprimé."); await load();
  }

  // Bannissement (API puis fallback)
  async function banUser(userId: string | null, reportId: string, reason?: string) {
    if (!userId) { setErr("ID utilisateur manquant."); return; }
    if (!isSuper) { setErr("Action réservée au SUPERADMIN."); return; }
    if (!confirm("Bannir définitivement cet utilisateur (suppression du compte) ?")) return;

    setToast(null); setErr(null);
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) { setErr("Session invalide."); return; }
    const finalReason = (reason?.trim() || `Bannissement suite au signalement ${reportId}`).slice(0, 500);

    try {
      const res = await fetch("/api/admin/ban-user", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId, reason: finalReason }),
      });
      if (res.ok) { setToast("Utilisateur banni (compte supprimé)."); await load(); return; }
      const j = await res.json().catch(() => ({}));
      if (j?.error) console.warn("ban-user API error → fallback RPC:", j.error);
    } catch (e) {
      console.warn("ban-user API unreachable → fallback RPC", e);
    }

    const rpc = await supabase.rpc("admin_flag_ban", { p_user_id: userId, p_reason: finalReason });
    if (!rpc.error) { setToast("Utilisateur banni en base (RPC)."); await load(); return; }
    setErr(`Bannissement refusé : ${rpc.error.message || "API et RPC indisponibles."}`);
  }

  // UNBAN via RPC admin.unban_user_v1 (resté pour compatibilité)
  async function unbanUser(userId: string | null, reason?: string) {
    if (!userId) { setErr("ID utilisateur manquant."); return; }
    if (!isSuper) { setErr("Action réservée au SUPERADMIN."); return; }
    if (!confirm("Annuler le bannissement de cet utilisateur ?")) return;

    const r = (reason ?? "").trim();
    const { error } = await supabase.rpc("admin.unban_user_v1", {
      p_user_id: userId,
      p_reason: r.length ? r.slice(0, 500) : "unban"
    });
    if (error) { setErr(error.message || "Impossible d’annuler le bannissement."); return; }
    setToast("Bannissement annulé."); await load();
  }

  // Avertissement : modèles + ENVOI SMTP via API + log en base (public.user_warnings)
  async function sendWarning(
    targetUserId: string | null,
    targetEmail: string | null,
    defaultBody: string,
    reportId: string
  ) {
    setToast(null); setErr(null);

    // — Archivage optionnel (copie cachée) —
    const BCC_ARCHIVE = "archive@keefon.fr"; // laisse vide si tu ne veux pas de BCC

    // 1) Choix du modèle
    const menu =
      `Modèle d’avertissement :\n` +
      WARNING_TEMPLATES.map((t, i) => `${i + 1}) ${t.name}`).join("\n") +
      `\n\nTape 1, 2 ou 3 (OK = 1)`;
    const choiceStr = prompt(menu, "1");
    if (choiceStr === null) return; // annulé
    const idx = Math.min(Math.max((parseInt(choiceStr, 10) || 1) - 1, 0), WARNING_TEMPLATES.length - 1);
    const tpl = WARNING_TEMPLATES[idx];

    // 2) Sujet (modulable)
    const suggestedSubject = tpl.subject(reportId);
    const subject = prompt("Sujet de l’avertissement :", suggestedSubject);
    if (subject === null) return; // annulé

    // 3) Corps : la note admin prime si elle existe
    const base = (defaultBody || "").trim();
    const suggestedBody = base.length ? base : tpl.body;
    const body = prompt("Message (texte brut) :", suggestedBody);
    if (body === null) return; // annulé

    // 4) Trace en base (journal)
    const { error } = await supabase.from("user_warnings").insert({
      target_user_id: targetUserId,
      target_email: targetEmail,
      subject,
      body,
      sent_via: "smtp",
    });
    if (error) {
      setErr(error.message || "Impossible d’enregistrer l’avertissement.");
      return;
    }

    // 5) Envoi SMTP via l’API interne si une adresse existe
    if (targetEmail) {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) { setErr("Session invalide."); return; }

      try {
        const res = await fetch("/api/admin/send-warning", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            to: targetEmail,
            subject,
            body,
            bcc: BCC_ARCHIVE || undefined,
          }),
        });

        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setErr(j?.detail
            ? `Envoi SMTP impossible : ${j.error} — ${j.detail}`
            : `Envoi SMTP impossible : ${j?.error || "inconnu"}`
          );
          return;
        }

        setToast("Avertissement envoyé depuis contact@keefon.fr (SMTP).");
        await load(); // ← rafraîchir le compteur
      } catch (e: any) {
        setErr(`Envoi SMTP impossible : ${e?.message || "erreur réseau"}`);
      }
    } else {
      setToast("Avertissement enregistré (pas d’email disponible pour l’envoi).");
      await load(); // ← on a loggé, on met à jour le compteur
    }
  }

  // callbacks de filtrage
  function applyFilter(mode: "byReporter" | "against", uid: string | null) {
    if (!uid) return;
    setFilterCol(mode === "byReporter" ? "reporter_id" : "reported_user_id");
    setFilterUserId(uid);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function clearFilter() { setFilterCol(null); setFilterUserId(null); }

  if (!mounted) {
    return (
      <div className="vvy-admin" style={{ backgroundColor: "#111827", color: "#e5e7eb", minHeight: "100vh" }}>
        <Head><title>Administration — Signalements</title><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" /></Head>
        <main className="admin-main" style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Signalements d’abus</h1>
          <p style={{ opacity: .8 }}>Chargement…</p>
        </main>
        <style jsx global>{globalCss}</style>
      </div>
    );
  }

  return (
    <div className="vvy-admin" style={{ backgroundColor: "#111827", color: "#e5e7eb", minHeight: "100vh" }}>
      <Head><title>Administration — Signalements</title><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" /></Head>
      <main className="admin-main" style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
        <div className="admin-toolbar" style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
          <Link href="/admin" className="admin-back"
             style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #374151", background: "#1f2937", color: "#e5e7eb" }}>
            ← Retour
          </Link>
          <h1 className="admin-title" style={{ fontSize: 20, fontWeight: 600 }}>Signalements d’abus</h1>

          <div className="admin-actions" style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ fontSize: 14, display: "flex", alignItems: "center" }}>
              <input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} style={{ marginRight: 8 }} />
              Afficher uniquement “en attente”
            </label>
            <button onClick={() => load()} className="admin-refresh"
                    style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #374151", background: "#1f2937", color: "#e5e7eb" }}>
              ↻ Rafraîchir
            </button>
          </div>
        </div>

        {filterCol && filterUserId && (
          <div style={{ marginBottom: 12, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <span className="admin-pill" style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 8, background: "#1f2937", border: "1px solid #374151", fontSize: 13 }}>
              Filtre : {filterCol === "reporter_id" ? "Abus émis par" : "Abus contre"} — {filterUserId}
            </span>
            <button onClick={clearFilter} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #374151", background: "#1f2937", color: "#e5e7eb" }}>
              Effacer le filtre
            </button>
          </div>
        )}

        {toast && <div style={{ marginBottom: 12, borderRadius: 8, background: "rgba(6,95,70,.25)", border: "1px solid #059669", padding: "8px 12px", fontSize: 14, color: "#d1fae5" }}>{toast}</div>}
        {err   && <div style={{ marginBottom: 12, borderRadius: 8, background: "rgba(127,29,29,.25)", border: "1px solid #dc2626", padding: "8px 12px", fontSize: 14, color: "#fee2e2" }}>{err}</div>}

        {loading ? (
          <p style={{ opacity: .8 }}>Chargement…</p>
        ) : rows.length === 0 ? (
          <p style={{ opacity: .8 }}>Aucun signalement à afficher.</p>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {rows.map((r) => (
              <ReportCard key={r.id}
                row={r}
                saving={savingId === r.id}
                banned={banned}
                warningsCount={warningsCount}   // compteur pour badge
                onSaveNote={saveNote}
                onUpdate={updateStatus}
                onDelete={deleteReport}
                onBan={(uid, reason) => banUser(uid, r.id, reason)}
                onUnban={(uid, reason) => unbanUser(uid, reason)}
                onFilter={(mode, uid) => applyFilter(mode, uid)}
                // ↓ envoi SMTP + log
                onSendWarning={(uid, email, body) => sendWarning(uid, email, body, r.id)}
              />
            ))}
          </div>
        )}
      </main>
      <style jsx global>{globalCss}</style>
    </div>
  );
}

const globalCss = `
  * { box-sizing: border-box; }
  html, body, #__next { width: 100%; height: 100%; margin: 0; padding: 0; }
  html, body { overflow-x: hidden; background: #111827; }
  .vvy-admin { width: 100%; max-width: 100vw; }
  .admin-main { padding: 20px; }
  .admin-toolbar { display: flex; gap: 12px; align-items: center; margin-bottom: 20px; flex-wrap: wrap; width: 100%; max-width: 100%; }
  .admin-title { overflow-wrap: anywhere; }
  .admin-actions { margin-left: auto; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  .admin-card { border: 1px solid #374151; border-radius: 12px; padding: 16px; background: #111827; color: #e5e7eb; }
  .admin-pill { display: inline-flex; padding: 2px 8px; border-radius: 8px; background: #1f2937; border: 1px solid #374151; font-size: 13px; }
  @media (max-width: 640px) {
    .admin-main { padding: 14px; }
    .admin-toolbar { flex-direction: column; align-items: stretch; gap: 10px; }
    .admin-toolbar > * { width: 100%; max-width: 100%; }
    .admin-actions { margin-left: 0; width: 100%; flex-direction: column; align-items: stretch; gap: 8px; }
    .admin-actions > * { width: 100%; max-width: 100%; }
    .admin-card { padding: 12px; }
    .admin-btn-row { gap: 8px; }
    .admin-btn-row button { flex: 1 1 48%; }
    .admin-note textarea { min-height: 90px; }
  }
`;

function ReportCard({
  row, saving, onSaveNote, onUpdate, onDelete, onBan, onUnban, banned,
  warningsCount,
  onFilter,
  onSendWarning,
}: {
  row: AbuseRow;
  saving: boolean;
  onSaveNote: (id: string, note: string) => Promise<void>;
  onUpdate: (id: string, status: AbuseStatus, admin_note: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onBan: (userId: string | null, reason?: string) => Promise<void>;
  onUnban: (userId: string | null, reason?: string) => Promise<void>;
  banned: Record<string, boolean>;
  warningsCount: Record<string, number>;
  onFilter: (mode: "byReporter" | "against", uid: string | null) => void;
  onSendWarning: (userId: string | null, email: string | null, bodyFromNote: string) => Promise<void>;
}) {
  const [note, setNote] = useState(row.admin_note ?? "");
  const date = useMemo(() => new Date(row.created_at).toLocaleString(), [row.created_at]);

  const canViewChat = !!(row.reporter_id && row.reported_user_id);
  const chatHref = canViewChat
    ? `/admin/ChatBetween?a=${encodeURIComponent(row.reporter_id!)}&b=${encodeURIComponent(row.reported_user_id!)}`
    : null;

  const card: React.CSSProperties = { border: "1px solid #374151", borderRadius: 12, padding: 16, background: "#111827", color: "#e5e7eb" };
  const pill: React.CSSProperties  = { display: "inline-flex", padding: "2px 8px", borderRadius: 8, background: "#1f2937", border: "1px solid #374151", fontSize: 13 };

  // Garde-fou : pop-up si aucune note admin
  function guardNoNote(): boolean {
    if ((note ?? "").trim().length === 0) {
      return confirm("attention aucunes notes à était enregistré ?");
    }
    return true;
  }

  const isReportedBanned = row.reported_user_id ? Boolean(banned[row.reported_user_id]) : false;

  return (
    <div className="admin-card" style={card}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span className="admin-pill" style={pill}>{row.category}</span>
        <span className="admin-pill" style={{ ...pill, background: "rgba(146, 64, 14, .25)", border: "1px solid #b45309" }}>{row.status}</span>
        <span style={{ marginLeft: "auto", opacity: .8, fontSize: 14 }}>{date}</span>
      </div>

      <div style={{ marginTop: 12, fontSize: 14 }}>
        <b>De :</b>{" "}
        {row.reporter_email
          ? <a href={`mailto:${row.reporter_email}`} style={{ textDecoration: "underline", color: "#e5e7eb" }}>{row.reporter_email}</a>
          : "—"}
        {typeof row.reporter_sent_count === "number" && (
          <span className="admin-pill" style={{ ...pill, marginLeft: 6 }} title="A dénoncé (envoyés)">
            {row.reporter_sent_count} dénonc.
          </span>
        )}
        {"  /  "}
        <b>Concernant :</b>{" "}
        {row.reported_email
          ? <a href={`mailto:${row.reported_email}`} style={{ textDecoration: "underline", color: "#e5e7eb" }}>{row.reported_email}</a>
          : "—"}
        {typeof row.reported_received_count === "number" && (
          <span className="admin-pill" style={{ ...pill, marginLeft: 6 }} title="A été dénoncé (reçus)">
            {row.reported_received_count} dénoncé(s)
          </span>
        )}
        {row.reported_user_id && (
          <span
            className="admin-pill"
            style={{
              ...pill,
              marginLeft: 6,
              borderColor: "#f59e0b",
              background: "rgba(245,158,11,.25)",
            }}
            title="Nombre d'avertissements envoyés à ce profil"
          >
            ⚠️ {(warningsCount[row.reported_user_id] || 0)} avert.
          </span>
        )}
        {row.reported_user_id && isReportedBanned && (
          <span className="admin-pill" style={{ ...pill, marginLeft: 6, borderColor: "#ef4444", background: "rgba(239,68,68,.25)" }} title="Banni">
            ⛔ banni
          </span>
        )}
      </div>

      <div className="admin-links" style={{ marginTop: 6, display: "flex", gap: 16, fontSize: 12, flexWrap: "wrap" }}>
        {row.reporter_id      && <a href={`/profileplus/${row.reporter_id}`}      target="_blank" rel="noreferrer" style={{ textDecoration: "underline", color: "#e5e7eb" }}>Voir profil émetteur ↗</a>}
        {row.reported_user_id && <a href={`/profileplus/${row.reported_user_id}`} target="_blank" rel="noreferrer" style={{ textDecoration: "underline", color: "#e5e7eb" }}>Voir profil signalé ↗</a>}
        {canViewChat          && <a href={chatHref!}                           target="_blank" rel="noreferrer" style={{ textDecoration: "underline", color: "#e5e7eb" }}>Voir la conversation ↗</a>}
      </div>

      {row.reason && <p style={{ marginTop: 12, whiteSpace: "pre-wrap", fontSize: 14 }}>{row.reason}</p>}

      <div className="admin-note" style={{ marginTop: 16 }}>
        <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Note admin</label>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); void onSaveNote(row.id, note); } }}
          placeholder="Ex: rappel envoyé, capture conservée, etc."
          style={{ width: "100%", borderRadius: 8, border: "1px solid #374151", background: "#111827", color: "#e5e7eb", padding: 10, fontSize: 14 }}
        />

        <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => onSaveNote(row.id, note)} disabled={saving}
                  style={{ padding: "8px 12px", borderRadius: 8, background: "#e5e7eb", color: "#111827", opacity: saving ? .6 : 1 }}>
            {saving ? "Enregistrement…" : "Enregistrer la note"}
          </button>

          {/* Filtres rapides */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => onFilter("byReporter", row.reporter_id)}
              disabled={!row.reporter_id}
              title="Voir tous les abus émis par ce profil"
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #374151", background: "#1f2937", color: "#e5e7eb", opacity: row.reporter_id ? 1 : .5 }}
            >
              Abus émis par ce profil
            </button>
            <button
              onClick={() => onFilter("against", row.reported_user_id)}
              disabled={!row.reported_user_id}
              title="Voir tous les abus contre ce profil"
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #374151", background: "#1f2937", color: "#e5e7eb", opacity: row.reported_user_id ? 1 : .5 }}
            >
              Abus contre ce profil
            </button>
          </div>
        </div>
      </div>

      <div className="admin-btn-row" style={{ marginTop: 16, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {/* Garde-fou : alerte si note vide */}
        <button
          onClick={() => { if (guardNoNote()) void onUpdate(row.id, "actioned", note); }}
          disabled={saving}
          style={{ padding: "8px 12px", borderRadius: 8, background: "#16a34a", color: "#fff", opacity: saving ? .6 : 1 }}
        >
          Marquer traité
        </button>

        <button
          onClick={() => void onUpdate(row.id, "dismissed", note)}
          disabled={saving}
          style={{ padding: "8px 12px", borderRadius: 8, background: "#6b7280", color: "#fff", opacity: saving ? .6 : 1 }}
        >
          Rejeter
        </button>

        <button
          onClick={() => { if (guardNoNote()) void onDelete(row.id); }}
          disabled={saving}
          title="Supprimer définitivement ce signalement"
          style={{ padding: "8px 12px", borderRadius: 8, background: "#dc2626", color: "#fff", opacity: saving ? .6 : 1 }}
        >
          Supprimer
        </button>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {/* Avertissement (SMTP + log + modèles) */}
          <button
            onClick={() => {
              const noteText = (note ?? "").trim();
              if (noteText.length === 0 && !confirm("attention aucunes notes à était enregistré ?")) return;
              void onSendWarning(row.reported_user_id, row.reported_email, noteText);
            }}
            title="Envoyer un avertissement (SMTP + trace en base)"
            style={{ padding: "8px 12px", borderRadius: 8, background: "#f59e0b", color: "#111827", border: "1px solid #b45309" }}
          >
            ⚠️ Envoyer un avertissement
          </button>

          {/* Bannir */}
          <button
            onClick={() => { if (guardNoNote()) void onBan(row.reported_user_id, note); }}
            title="Bannir utilisateur (SUPERADMIN)"
            style={{ padding: "8px 12px", borderRadius: 8, background: "#000", color: "#fff" }}
          >
            ⚠️ Bannir (SUPERADMIN)
          </button>

          {/* Unban (compatibilité “soft”) */}
          {isReportedBanned && (
            <button
              onClick={() => { if (guardNoNote()) void onUnban(row.reported_user_id, note); }}
              title="Annuler le bannissement (SUPERADMIN)"
              style={{ padding: "8px 12px", borderRadius: 8, background: "#1f2937", color: "#e5e7eb", border: "1px solid #374151" }}
            >
              ↩︎ Annuler le bannissement
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
