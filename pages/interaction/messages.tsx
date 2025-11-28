// -*- coding: utf-8 -*-
/**
 * Fichier : pages/interaction/messages.tsx
 * Module  : Mes messages (UI + filtres + onglets)
 * Règles  : code robuste, simple, zéro gadget ; commentaires conservés ; UTF-8.
 *
 * Contenu :
 *   • Bouton « ← Retour » réduit (~¼) et « Mes messages » sur la même ligne à droite.
 *   • Avertissement visuel (modale rouge) AVANT le blocage 🛡️ — identique à /profileplus/[id].tsx.
 *   • Filtres “Messages reçus” fixés en sticky, sans fond blanc.
 *   • Mémorisation des filtres (âge min/max, distance) entre sessions via localStorage.
 *   • Filtre antibrouteur : les conversations liées à un antibrouteur disparaissent
 *     de la page pour les victimes, mais restent visibles pour le brouteur lui-même.
 *   • Règle Free / Keefon+ sur “Messages reçus” :
 *        - un Free ne voit pas qui lui a écrit
 *        - sauf si expéditeur Keefon+ (tier "elite"),
 *          ou Keefon (cœurs réciproques non expirés),
 *          ou conversation ouverte via un écho (open_free_conv_log).
 */

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";
import { pickMaskedAvatar } from "@/lib/maskedAvatars";

/* Constantes UI/domaine --------------------------------------------------- */
const AGE_MIN_ABS = 18;
const AGE_MAX_ABS = 99;
const DIST_MAX_ABS = 500;
const TENDER_GREEN = "#2CFF4B"; // actif onglet
const BAR_YELLOW = "#FACC15";   // jaune-400 (barres actives)
const KNOB_GREEN = "#22C55E";   // vert-500 (poignées);
/* Persistance filtres */
const FILTERS_KEY = "vivaya.messages.received.filters.v1";
type SavedFilters = { ageMin:number; ageMax:number; maxKm:number; savedAt:number };

/* Types minimalistes ------------------------------------------------------ */
type RawMsg = {
  id?: string; uuid?: string; message_id?: string;
  sender?: string; receiver?: string;
  content?: string | null;
  seen?: boolean | null;
  created_at?: string; timestamp?: string; inserted_at?: string;
};

type Thread = {
  otherId: string;
  lastText: string;
  lastDateISO: string;
  lastFromMe: boolean;
  myOutboundCount: number;
  otherOutboundCount: number;
  unreadInboundCount: number;
  firstMessageAuthorId: string;
  lastInboundAtISO: string | null;
};

type Peer = {
  id: string;
  username: string | null;
  age: number | null;
  ville: string | null;
  code_postal: string | null;
  lat: number | null;
  lon: number | null;
  avatarUrl: string | null;
  distanceKm?: number | null;
};

/* Utils ------------------------------------------------------------------- */
const asStr = (x: any) => (typeof x === "string" ? x : x == null ? "" : String(x));
const toISO = (s?: string | null) => { const v = asStr(s || ""); const t = Date.parse(v); return Number.isFinite(t) ? new Date(t).toISOString() : ""; };
const cmpDescISO = (a?: string, b?: string) => { const ta = Date.parse(a || ""); const tb = Date.parse(b || ""); if (isNaN(ta) && isNaN(tb)) return 0; if (isNaN(ta)) return 1; if (isNaN(tb)) return -1; return tb - ta; };
const parseISO = (s?: string | null): number | null => { if (!s) return null; const t = Date.parse(s); return Number.isNaN(t) ? null : t; };
function num(v: any): number | null { if (v === null || v === undefined) return null; if (typeof v === "number" && Number.isFinite(v)) return v; const n = Number.parseFloat(String(v)); return Number.isFinite(n) ? n : null; }
function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const la1 = toRad(aLat);
  const la2 = toRad(bLat);
  const x = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/* Chargement threads ------------------------------------------------------ */
async function loadThreadsFromMessages(me: string): Promise<Thread[]> {
  const { data, error } = await supabase.from("messages").select("*");
  if (error) throw error;

  const rows = (data ?? []) as RawMsg[];
  const norm = rows
    .map((r) => {
      const id = asStr(r.id ?? r.uuid ?? r.message_id);
      const from = asStr(r.sender);
      const to = asStr(r.receiver);
      if (!id || !from || !to) return null;
      const text = asStr(r.content ?? "");
      const date = toISO(r.created_at ?? r.timestamp ?? r.inserted_at ?? "");
      const seen = !!r.seen;
      return { id, from, to, text, date, seen };
    })
    .filter(Boolean) as Array<{ id: string; from: string; to: string; text: string; date: string; seen: boolean }>;

  const mine = norm.filter((m) => m.from === me || m.to === me);
  if (!mine.length) return [];

  type Acc = { msgs: typeof mine; myOut: number; otherOut: number; unreadIn: number; lastInboundAtISO: string | null; };
  const byPeer: Record<string, Acc> = {};

  for (const m of mine) {
    const other = m.from === me ? m.to : m.from;
    const acc = (byPeer[other] ??= { msgs: [], myOut: 0, otherOut: 0, unreadIn: 0, lastInboundAtISO: null });
    acc.msgs.push(m);
    if (m.from === me) acc.myOut += 1; else acc.otherOut += 1;
    if (m.to === me && !m.seen) acc.unreadIn += 1;
    if (m.to === me) {
      if (!acc.lastInboundAtISO || cmpDescISO(m.date, acc.lastInboundAtISO) < 0) acc.lastInboundAtISO = m.date;
    }
  }

  const threads: Thread[] = [];
  for (const [otherId, acc] of Object.entries(byPeer)) {
    acc.msgs.sort((a, b) => cmpDescISO(a.date, b.date));
    const last = acc.msgs[0]!;
    const first = acc.msgs[acc.msgs.length - 1]!;
    threads.push({
      otherId,
      lastText: last.text || "…",
      lastDateISO: last.date || "",
      lastFromMe: last.from === me,
      myOutboundCount: acc.myOut,
      otherOutboundCount: acc.otherOut,
      unreadInboundCount: acc.unreadIn,
      firstMessageAuthorId: first.from,
      lastInboundAtISO: acc.lastInboundAtISO,
    });
  }

  return threads.sort((a, b) => cmpDescISO(a.lastDateISO, b.lastDateISO));
}

/* Enrichissement profils + distances ------------------------------------- */
async function loadPeersAndGeo(
  me: string,
  ids: string[]
): Promise<{ peers: Record<string, Peer>, meLoc: {lat:number|null,lon:number|null}, knownCount: number }> {
  const out: Record<string, Peer> = {};
  if (ids.length === 0) return { peers: out, meLoc: { lat: null, lon: null }, knownCount: 0 };

  const { data: adminRows, error: adminErr } = await supabase
    .from("visible_profiles_admin_v")
    .select("id, age, ville, code_postal")
    .in("id", ids);
  if (adminErr) throw adminErr;

  for (const r of (adminRows ?? []) as any[]) {
    out[r.id] = {
      id: r.id,
      username: null,
      age: (typeof r.age === "number" ? r.age : (r.age ? Number(r.age) : null)),
      ville: r.ville ?? null,
      code_postal: r.code_postal ?? null,
      lat: null, lon: null,
      avatarUrl: null,
      distanceKm: null,
    };
  }

  const { data: profs } = await supabase
    .from("profiles").select("id, username").in("id", ids);
  for (const p of (profs ?? []) as any[]) {
    (out[p.id] ??= {
      id: p.id, username: null, age: null, ville: null, code_postal: null, lat: null, lon: null, avatarUrl: null, distanceKm: null
    }).username = (p.username ?? "").trim() || null;
  }

  const { data: photos } = await supabase
    .from("photos").select("user_id, url, is_main")
    .in("user_id", ids).eq("is_main", true);
  for (const ph of (photos ?? []) as any[]) {
    const { data } = supabase.storage.from("avatars").getPublicUrl(ph.url);
    (out[ph.user_id] ??= {
      id: ph.user_id, username: null, age: null, ville: null, code_postal: null, lat: null, lon: null, avatarUrl: null, distanceKm: null
    }).avatarUrl = data?.publicUrl || null;
  }

  const idsWithMe = Array.from(new Set([me, ...ids]));
  const { data: locRows } = await supabase
    .from("user_localisations")
    .select("user_id, lat, lon")
    .in("user_id", idsWithMe);

  let meLoc = { lat: null as number|null, lon: null as number|null };
  for (const r of (locRows ?? []) as any[]) {
    const uid = r.user_id as string;
    const lat = num(r.lat);
    const lon = num(r.lon);
    if (uid === me) {
      meLoc = { lat, lon };
    } else if (out[uid]) {
      out[uid].lat = lat;
      out[uid].lon = lon;
    }
  }

  for (const p of Object.values(out)) {
    p.distanceKm = null;
    if (meLoc.lat != null && meLoc.lon != null && p.lat != null && p.lon != null) {
      p.distanceKm = Math.round(haversineKm(meLoc.lat, meLoc.lon, p.lat, p.lon));
    }
  }

  try {
    const { data: distRows, error: distErr } = await supabase
      .rpc("distances_for_peers_v1", { p_me: me, p_peers: ids });
    if (!distErr && Array.isArray(distRows)) {
      for (const r of distRows as any[]) {
        const uid = asStr(r.user_id);
        const dk  = num(r.distance_km);
        if (uid && dk != null && out[uid]) out[uid].distanceKm = Math.round(dk);
      }
    }
  } catch {}

  const knownCount = Object.values(out).reduce((acc, p) => acc + (p.distanceKm != null ? 1 : 0), 0);
  return { peers: out, meLoc, knownCount };
}

/* Composant principal ----------------------------------------------------- */
export default function MessagesPage() {
  const router = useRouter();

  const [ageMin, setAgeMin] = useState(AGE_MIN_ABS);
  const [ageMax, setAgeMax] = useState(AGE_MAX_ABS);
  const [maxKm, setMaxKm] = useState(DIST_MAX_ABS);

  const [me, setMe] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [peers, setPeers] = useState<Record<string, Peer>>({});
  const [knownDistances, setKnownDistances] = useState(0);

  /* Plan / visibilité pour les Free --------------------------------------- */
  // myTier : "free" | "essential" | "elite" | autre. On ne branche que sur "free".
  const [myTier, setMyTier] = useState<string | null>(null);
  // Quand l'utilisateur est Free, cet ensemble contient les otherId dont
  // l'identité peut quand même être affichée (Keefon+, Keefon réciproque, écho ouvert).
  const [freeCanSeeIds, setFreeCanSeeIds] = useState<Set<string>>(new Set());

  const [tab, setTab] = useState<"ongoing" | "received">("ongoing");

  /* Liste des antibrouteurs (IDs) ----------------------------------------- */
  const [antibrouteurIds, setAntibrouteurIds] = useState<Set<string>>(new Set());

  /* Modale de blocage (identique au modèle de /profileplus/[id].tsx) ------ */
  const [confirmBlockOpen, setConfirmBlockOpen] = useState(false);
  const [blockTargetId, setBlockTargetId] = useState<string | null>(null);

  /* Auth ------------------------------------------------------------------ */
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setMe(user?.id ?? null);
    })();
  }, []);

  /* Chargement des IDs antibrouteurs -------------------------------------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("antibrouteurs_ids_v")
          .select("user_id");
        if (error) throw error;
        const ids = new Set<string>();
        for (const row of (data ?? []) as any[]) {
          if (row.user_id) ids.add(String(row.user_id));
        }
        if (!cancelled) setAntibrouteurIds(ids);
      } catch {
        if (!cancelled) setAntibrouteurIds(new Set());
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* Chargement initial ---------------------------------------------------- */
  const reload = useCallback(async () => {
    if (!me) return;
    setLoading(true); setError(null);
    try {
      const thAll = await loadThreadsFromMessages(me);

      // Si l'utilisateur courant N'EST PAS antibrouteur, on masque les fils
      // dont l'autre participant est antibrouteur.
      let th = thAll;
      if (antibrouteurIds.size > 0 && !antibrouteurIds.has(me)) {
        th = thAll.filter((t) => !antibrouteurIds.has(t.otherId));
      }

      setThreads(th);

      // IDs des autres participants
      const ids = Array.from(new Set(th.map((t) => t.otherId))).filter(Boolean) as string[];

      // Enrichissement profils + distances (inchangé)
      const { peers: enriched, knownCount } = await loadPeersAndGeo(me, ids);
      setPeers(enriched);
      setKnownDistances(knownCount);

      // ───────────────── RÈGLE « un Free ne voit pas qui lui a écrit » ────────────────
      // On récupère d'abord le plan effectif pour moi + pour chaque otherId.
      const allIds = Array.from(new Set([me, ...ids]));
      let tierById: Record<string, string> = {};
      let myTierNext: string | null = null;

      try {
        const { data: planRows, error: planErr } = await supabase
          .from("user_plans_effective_v")
          .select("id,effective_tier")
          .in("id", allIds);
        if (planErr) throw planErr;
        for (const row of (planRows ?? []) as any[]) {
          const id = asStr(row.id);
          const tier = asStr(row.effective_tier).toLowerCase();
          if (id) {
            tierById[id] = tier;
            if (id === me) myTierNext = tier;
          }
        }
      } catch {
        // Si la vue n'est pas accessible, on ne casse pas la page :
        tierById = {};
        myTierNext = null;
      }

      const freeCanSee = new Set<string>();

      // Si je suis Free, on calcule les exceptions où je peux quand même voir l'identité :
      //   • expéditeur en Keefon+ (tier "elite")
      //   • Keefon réciproque (cœurs dans les deux sens, non expirés)
      //   • conversation ouverte via un écho (open_free_conv_log)
      if (myTierNext === "free") {
        // 1) Keefon+ en face (plan "elite" côté expéditeur)
        for (const otherId of ids) {
          if (tierById[otherId] === "elite") {
            freeCanSee.add(otherId);
          }
        }

        // 2) Keefon réciproque (table hearts)
        try {
          const { data: heartRows, error: heartErr } = await supabase
            .from("hearts")
            .select("from_user,to_user,expired")
            .or(`from_user.eq.${me},to_user.eq.${me}`);
          if (!heartErr && Array.isArray(heartRows)) {
            const activeFromMe = new Set<string>();
            const activeToMe = new Set<string>();
            for (const h of heartRows as any[]) {
              const from = asStr(h.from_user);
              const to = asStr(h.to_user);
              const expired = h.expired === true; // NULL ou false = actif
              if (expired) continue;
              if (from === me && ids.includes(to)) activeFromMe.add(to);
              if (to === me && ids.includes(from)) activeToMe.add(from);
            }
            for (const otherId of ids) {
              if (activeFromMe.has(otherId) && activeToMe.has(otherId)) {
                freeCanSee.add(otherId);
              }
            }
          }
        } catch {
          // on ignore les erreurs : au pire le Free verra moins d'identités, jamais plus
        }

        // 3) Conversation ouverte via un écho (open_free_conv_log)
        try {
          const { data: logRows, error: logErr } = await supabase
            .from("open_free_conv_log")
            .select("opener_user_id,target_user_id")
            .or(`opener_user_id.eq.${me},target_user_id.eq.${me}`);
          if (!logErr && Array.isArray(logRows)) {
            for (const r of logRows as any[]) {
              const opener = asStr(r.opener_user_id);
              const target = asStr(r.target_user_id);
              const otherId =
                opener === me && ids.includes(target) ? target :
                target === me && ids.includes(opener) ? opener :
                null;
              if (otherId) freeCanSee.add(otherId);
            }
          }
        } catch {
          // idem : en cas d'erreur, on ne montre pas plus d'identités que prévu
        }
      }

      setMyTier(myTierNext);
      setFreeCanSeeIds(freeCanSee);
      // ──────────────────────────────────────────────────────────────────────
    } catch (e: any) {
      setError(e?.message ?? "Erreur chargement messages");
    } finally {
      setLoading(false);
    }
  }, [me, antibrouteurIds]);

  useEffect(() => { if (me) reload(); }, [me, reload]);

  /* Mémorisation “dernière ouverture” pour le compteur pastille ----------- */
  const [lastOpenedAt, setLastOpenedAt] = useState<number | null>(null);
  useEffect(() => {
    try {
      const prevRaw = localStorage.getItem("vivaya.messages.last_opened_at");
      const prev = prevRaw ? Number(prevRaw) : null;
      setLastOpenedAt(Number.isNaN(prev) ? null : prev);
      localStorage.setItem("vivaya.messages.last_opened_at", String(Date.now()));
    } catch {}
  }, []);

  /* Chargement des filtres mémorisés -------------------------------------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FILTERS_KEY);
      if (!raw) return;
      const s = JSON.parse(raw) as Partial<SavedFilters>;
      const clamp = (v:number, lo:number, hi:number) => Math.min(hi, Math.max(lo, Math.round(v)));
      if (typeof s.ageMin === "number") setAgeMin(clamp(s.ageMin, AGE_MIN_ABS, AGE_MAX_ABS));
      if (typeof s.ageMax === "number") setAgeMax(clamp(s.ageMax, AGE_MIN_ABS, AGE_MAX_ABS));
      if (typeof s.maxKm === "number")  setMaxKm(clamp(s.maxKm, 0, DIST_MAX_ABS));
    } catch { /* ignore */ }
  }, []);

  /* Sauvegarde (debounced) des filtres ------------------------------------ */
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const payload: SavedFilters = { ageMin, ageMax, maxKm, savedAt: Date.now() };
        localStorage.setItem(FILTERS_KEY, JSON.stringify(payload));
      } catch {}
    }, 150);
    return () => clearTimeout(id);
  }, [ageMin, ageMax, maxKm]);

  /* Découpage et tri ------------------------------------------------------ */
  const baseSplit = useMemo(() => {
    const isOngoing = (t: Thread): boolean => {
      if ((t.myOutboundCount ?? 0) > 0) return true;
      const wroteFirst = t.firstMessageAuthorId === (me as string);
      const otherHasNotReplied = (t.otherOutboundCount ?? 0) === 0;
      if (wroteFirst && otherHasNotReplied) return true;
      return false;
    };
    const hasInbound = (t: Thread) => Boolean(t.lastInboundAtISO) || (t.otherOutboundCount ?? 0) > 0;
    const isReceived = (t: Thread): boolean => (t.myOutboundCount ?? 0) === 0 && hasInbound(t);

    const rec = threads
      .filter(isReceived)
      .sort((a, b) => cmpDescISO(a.lastInboundAtISO || a.lastDateISO, b.lastInboundAtISO || b.lastDateISO));
    const ong = threads
      .filter(isOngoing)
      .sort((a, b) => cmpDescISO(a.lastDateISO, b.lastDateISO));

    let counter = 0;
    if (lastOpenedAt) {
      for (const t of rec) {
        const lastIn = parseISO(t.lastInboundAtISO);
        if (lastIn && lastIn > lastOpenedAt) counter += 1;
      }
    }
    return { received: rec, ongoing: ong, receivedNewCountSinceLastOpen: counter };
  }, [threads, me, lastOpenedAt]);

  /* Application des filtres ----------------------------------------------- */
  const receivedFiltered = useMemo(() => {
    const rec = baseSplit.received;
    if (maxKm < DIST_MAX_ABS && knownDistances === 0) return rec;
    return rec.filter((t) => {
      const p = peers[t.otherId];
      if (!p) return true;
      if (p.age != null && (p.age < ageMin || p.age > ageMax)) return false;
      if (maxKm >= DIST_MAX_ABS) return true;
      const d = p.distanceKm;
      if (d == null) return false;
      return d <= maxKm;
    });
  }, [baseSplit.received, peers, ageMin, ageMax, maxKm, knownDistances]);

  const routerBack = () => router.back();

  /* actions carte --------------------------------------------------------- */
  const openChatAndMarkRead = useCallback(async (otherId: string) => {
    if (!me) return;
    try {
      await supabase
        .from("messages")
        .update({ seen: true })
        .eq("receiver", me)
        .eq("sender", otherId)
        .eq("seen", false);

      setThreads(prev =>
        prev
          .map(t => t.otherId === otherId ? { ...t, unreadInboundCount: 0 } : t)
          .sort((a, b) => cmpDescISO(a.lastDateISO, b.lastDateISO))
      );
    } catch {} finally {
      router.push(`/chat/${otherId}`);
    }
  }, [me, router]);

  /* 🛡️ OUVERTURE DE MODALE + CONFIRMATION (identique au modèle) ----------- */
  const openBlockModal = (id: string) => {
    setBlockTargetId(id);
    setConfirmBlockOpen(true);
  };

  const cancelBlock = () => {
    setConfirmBlockOpen(false);
    setBlockTargetId(null);
  };

  const confirmBlock = async () => {
    if (!me || !blockTargetId) return;
    try {
      const { error } = await supabase
        .from("blocks")
        .insert({ user_id: me, blocked_user_id: blockTargetId });

      if (error) {
        const m = String(error.message || "").toLowerCase();
        if (m.includes("unique") || m.includes("duplicate") || m.includes("already")) {
          setThreads((prev) => prev.filter((t) => t.otherId !== blockTargetId));
          cancelBlock();
          alert("Ce profil était déjà bloqué.");
        } else {
          alert("⚠️ Blocage impossible pour le moment.");
        }
        return;
      }

      setThreads((prev) => prev.filter((t) => t.otherId !== blockTargetId));
      cancelBlock();
    } catch {
      alert("Erreur réseau lors du blocage.");
    }
  };

  const onDelete = async (id: string) => {
    if (!me) return;
    const ok = window.confirm(
      "Supprimer ce fil de messages ?\n\nCette action effacera vos messages dans ce fil (selon les règles de sécurité)."
    );
    if (!ok) return;
    try {
      const or = `and(sender.eq.${me},receiver.eq.${id}),and(sender.eq.${id},receiver.eq.${me})`;
      const { error } = await supabase.from("messages").delete().or(or);
      if (error) { alert("Impossible de supprimer ce fil pour le moment."); return; }
      setThreads((prev) => prev.filter((t) => t.otherId !== id));
    } catch { alert("Erreur réseau lors de la suppression."); }
  };

  /* Realtime pastille (inchangé + filtre antibrouteur) -------------------- */
  useEffect(() => {
    if (!me) return;
    const meIsAntibrouteur = antibrouteurIds.has(me);

    const channel = supabase
      .channel(`rt-messages-${me}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `receiver=eq.${me}` },
        (payload) => {
          const row: any = payload.new || {};
          const other = asStr(row.sender);
          if (!other) return;

          // Si je ne suis pas antibrouteur et que l'autre en est un, on ignore.
          if (!meIsAntibrouteur && antibrouteurIds.has(other)) return;

          const iso = toISO(row.created_at ?? row.timestamp ?? row.inserted_at ?? "");
          const txt = asStr(row.content ?? "");
          setThreads(prev => {
            let found = false;
            const next = prev.map(t => {
              if (t.otherId === other) {
                found = true;
                return {
                  ...t,
                  lastText: txt || t.lastText,
                  lastDateISO: iso || t.lastDateISO,
                  lastFromMe: false,
                  otherOutboundCount: (t.otherOutboundCount ?? 0) + 1,
                  unreadInboundCount: (t.unreadInboundCount ?? 0) + 1,
                  lastInboundAtISO: iso || t.lastInboundAtISO,
                };
              }
              return t;
            });
            if (!found) { reload(); return prev; }
            return next.sort((a, b) => cmpDescISO(a.lastDateISO, b.lastDateISO));
          });
        }
      )
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `receiver=eq.${me}` },
        (payload) => {
          const row: any = payload.new || {};
          if (!row.seen) return;
          const other = asStr(row.sender);
          if (!other) return;

          if (!meIsAntibrouteur && antibrouteurIds.has(other)) return;

          setThreads(prev =>
            prev.map(t =>
              t.otherId === other
                ? { ...t, unreadInboundCount: Math.max(0, (t.unreadInboundCount ?? 0) - 1) }
                : t
            )
          );
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [me, reload, antibrouteurIds]);

  /* Rendu ------------------------------------------------------------------ */
  return (
    <>
      <main className="min-h-dvh w-screen overflow-x-hidden bg-no-repeat bg-cover bg-center" style={{ backgroundImage: "url('/bg-messages-ext.png?v=1')" }}>
        <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4 py-4 sm:py-8">

          {/* En-tête : bouton Retour (réduit) + titre sur la même ligne ; onglets conservés */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
            {/* Gauche : Retour + Titre sur une seule ligne */}
            <div className="flex items-center gap-3">
              <button
                onClick={routerBack}
                className="px-2 py-1 text-xs rounded-lg bg-yellowGreen text-black font-semibold shadow-md hover:opacity-90 transition"
                aria-label="Retour"
                title="Retour"
              >
                ← Retour
              </button>

              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-600 bg-clip-text text-transparent">
                Mes messages
              </h1>
            </div>

            {/* Droite : onglets (emplacement inchangé) */}
            <div className="flex flex-wrap gap-2 items-center self-start">
              <TabBtn active={tab === "ongoing"} onClick={() => setTab("ongoing")}>
                Conversations en cours
              </TabBtn>
              <TabBtn active={tab === "received"} onClick={() => setTab("received")}>
                Messages reçus
                {baseSplit.receivedNewCountSinceLastOpen > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center rounded-full min-w-5 h-5 px-1 text-xs ring-1 ring-gray-300">
                    {baseSplit.receivedNewCountSinceLastOpen}
                  </span>
                )}
              </TabBtn>
            </div>
          </div>

          {/* FILTRES — sticky sous les onglets (pas de fond blanc) */}
          {tab === "received" && (
            <div className="sticky top-2 z-20 mt-1">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <label className="flex items-center justify-between text-xs font-medium text-gray-900">
                    <span>Âge</span>
                    <span className="tabular-nums text-gray-700">{ageMin}–{ageMax}</span>
                  </label>
                  <AgeRange
                    min={AGE_MIN_ABS}
                    max={AGE_MAX_ABS}
                    value={{ min: ageMin, max: ageMax }}
                    onChange={(lo, hi) => { setAgeMin(lo); setAgeMax(hi); }}
                    barColor={BAR_YELLOW}
                    knobColor={KNOB_GREEN}
                  />
                </div>

                <div className="hidden sm:block w-px self-stretch bg-white/60" />

                <div className="flex-1 min-w-0">
                  <label className="flex items-center justify-between text-xs font-medium text-gray-900">
                    <span>Distance</span>
                    <span className="tabular-nums text-gray-700">{maxKm} km</span>
                  </label>
                  <DistanceSlider
                    min={0}
                    max={DIST_MAX_ABS}
                    value={maxKm}
                    step={5}
                    onChange={setMaxKm}
                    barColor={BAR_YELLOW}
                    knobColor={KNOB_GREEN}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Listes */}
          {tab === "ongoing" && (
            <SectionList
              title="Conversations en cours"
              showTitle={false}
              loading={loading}
              items={baseSplit.ongoing}
              peers={peers}
              openChat={(id) => openChatAndMarkRead(id)}
              viewProfile={(id) => router.push(`/profileplus/${id}`)}
              onShield={openBlockModal}
              onDelete={onDelete}
              showUnreadDot
            />
          )}

          {tab === "received" && (
            <SectionList
              title="Messages reçus"
              showTitle={false}
              loading={loading}
              items={receivedFiltered}
              peers={peers}
              openChat={(id) => router.push(`/chat/${id}`)}
              viewProfile={(id) => router.push(`/profileplus/${id}`)}
              onShield={openBlockModal}
              onDelete={onDelete}
              hideIdentityForOtherId={(otherId) => {
                // Règle : un Free ne voit pas qui lui a écrit, sauf exceptions calculées dans freeCanSeeIds.
                if (myTier !== "free") return false;
                return !freeCanSeeIds.has(otherId);
              }}
            />
          )}

          {/* Lien légal discret CGU · Mentions légales */}
          <div className="mt-10 text-center text-[11px] text-gray-700">
            Conditions Générales d’Utilisation · Mentions légales
          </div>
        </div>
      </main>

      {/* ────────────────────── MODALE DE BLOCAGE (modèle /profileplus) ────────────────────── */}
      {confirmBlockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
            <h2 className="text-red-700 font-extrabold text-xl mb-3">ATTENTION&nbsp;!</h2>
            <p className="text-red-600 text-base mb-6">
              Bloquer ce profil de façon <b>DÉFINITIVE</b> ?<br />
              Vous ne pourrez plus vous écrire ni vous retrouver dans les recherches/suggestions.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={cancelBlock}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={confirmBlock}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                Bloquer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ──────────────────────────────────────────────────────────────────────────────────── */}
      
    </>
  );
}

/* Bouton d’onglet individuel --------------------------------------------- */
function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: any }) {
  const base = "px-3 py-1.5 text-sm rounded-xl transition font-medium shadow-sm ring-1 ring-gray-200";
  return active ? (
    <button type="button" onClick={onClick} className={`${base} text-black`} style={{ backgroundColor: TENDER_GREEN }}>
      {children}
    </button>
  ) : (
    <button type="button" onClick={onClick} className={`${base} bg-white text-gray-800 hover:bg-gray-50`}>
      {children}
    </button>
  );
}

/* Slider double poignée (Âge) -------------------------------------------- */
function AgeRange({
  min, max, value, onChange, barColor = BAR_YELLOW, knobColor = KNOB_GREEN,
}:{
  min: number; max: number;
  value: { min: number; max: number };
  onChange: (lo:number, hi:number) => void;
  barColor?: string; knobColor?: string;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ which: "min" | "max"; pointerId: number } | null>(null);

  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v)));
  const valueFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return value.min;
    const rect = el.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    return clamp(min + ratio * (max - min));
  };

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      if (e.pointerId !== d.pointerId) return;
      e.preventDefault();
      const v = valueFromClientX(e.clientX);
      if (d.which === "min") {
        const nextLo = Math.min(v, value.max);
        if (nextLo !== value.min) onChange(nextLo, value.max);
      } else {
        const nextHi = Math.max(v, value.min);
        if (nextHi !== value.max) onChange(value.min, nextHi);
      }
    };
    const stop = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      if (e.pointerId !== d.pointerId) return;
      dragRef.current = null;
    };
    window.addEventListener("pointermove", handleMove, { passive: false });
    window.addEventListener("pointerup", stop, { passive: true });
    window.addEventListener("pointercancel", stop, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handleMove as any);
      window.removeEventListener("pointerup", stop as any);
      window.removeEventListener("pointercancel", stop as any);
    };
  }, [value.min, value.max, min, max, onChange]);

  const onTrackPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const v = valueFromClientX(e.clientX);
    const dMin = Math.abs(v - value.min);
    const dMax = Math.abs(v - value.max);
    if (dMin <= dMax) {
      const nextLo = Math.min(v, value.max);
      onChange(nextLo, value.max);
      dragRef.current = { which: "min", pointerId: e.pointerId };
    } else {
      const nextHi = Math.max(v, value.min);
      onChange(value.min, nextHi);
      dragRef.current = { which: "max", pointerId: e.pointerId };
    }
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onKnobPointerDown = (which: "min" | "max") => (e: React.PointerEvent) => {
    e.preventDefault();
    dragRef.current = { which, pointerId: e.pointerId };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onKnobKeyDown = (which: "min" | "max") => (e: React.KeyboardEvent) => {
    const STEP = 1;
    let delta = 0;
    if (e.key === "ArrowLeft") delta = -STEP;
    else if (e.key === "ArrowRight") delta = STEP;
    else if (e.key === "PageDown") delta = -5 * STEP;
    else if (e.key === "PageUp") delta = 5 * STEP;
    else if (e.key === "Home") delta = which === "min" ? (min - value.min) : (value.min - value.max);
    else if (e.key === "End")  delta = which === "max" ? (max - value.max) : (value.max - value.min);
    if (!delta) return;

    e.preventDefault();
    if (which === "min") {
      const nextLo = clamp(Math.min(value.max, value.min + delta));
      onChange(nextLo, Math.max(nextLo, value.max));
    } else {
      const nextHi = clamp(Math.max(value.min, value.max + delta));
      onChange(Math.min(value.min, nextHi), nextHi);
    }
  };

  const loPct = ((value.min - min) / (max - min)) * 100;
  const hiPct = ((value.max - min) / (max - min)) * 100;

  return (
    <div className="relative select-none mt-2">
      <div
        ref={trackRef}
        className="w-full rounded-full bg-white/40"
        style={{ height: 6, touchAction: "none" }}
        onPointerDown={onTrackPointerDown}
      >
        {/* barre active (jaune) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 rounded-full"
          style={{ left: `${loPct}%`, width: `${Math.max(0, hiPct - loPct)}%`, height: 6, backgroundColor: BAR_YELLOW }}
        />
      </div>

      {/* poignées (vertes) */}
      <button
        type="button" role="slider" aria-label="Âge minimum"
        aria-valuemin={min} aria-valuemax={value.max} aria-valuenow={value.min} tabIndex={0}
        onPointerDown={onKnobPointerDown("min")} onKeyDown={onKnobKeyDown("min")}
        className="absolute top-1/2 -translate-y-1/2 grid place-items-center rounded-md border-2 border-white shadow"
        style={{ left: `calc(${loPct}% - 10px)`, width: 20, height: 20, touchAction: "none", backgroundColor: KNOB_GREEN }}
      />
      <button
        type="button" role="slider" aria-label="Âge maximum"
        aria-valuemin={value.min} aria-valuemax={max} aria-valuenow={value.max} tabIndex={0}
        onPointerDown={onKnobPointerDown("max")} onKeyDown={onKnobKeyDown("max")}
        className="absolute top-1/2 -translate-y-1/2 grid place-items-center rounded-md border-2 border-white shadow"
        style={{ left: `calc(${hiPct}% - 10px)`, width: 20, height: 20, touchAction: "none", backgroundColor: KNOB_GREEN }}
      />
    </div>
  );
}

/* Slider simple (Distance) ------------------------------------------------ */
function DistanceSlider({
  min, max, value, onChange, step = 1, barColor = BAR_YELLOW, knobColor = KNOB_GREEN,
}:{
  min: number; max: number; value: number; onChange: (v:number)=>void; step?: number;
  barColor?: string; knobColor?: string;
}) {
  const TRACK_H = 6;
  const KNOB = 20;

  const trackRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step));
  const valueFromClientX = (clientX: number) => {
    const el = trackRef.current; if (!el) return value;
    const rect = el.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    return clamp(min + ratio * (max - min));
  };

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (pointerIdRef.current == null || e.pointerId !== pointerIdRef.current) return;
      e.preventDefault();
      onChange(valueFromClientX(e.clientX));
    };
    const up = (e: PointerEvent) => {
      if (pointerIdRef.current == null || e.pointerId !== pointerIdRef.current) return;
      pointerIdRef.current = null;
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up, { passive: true });
    window.addEventListener("pointercancel", up, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move as any);
      window.removeEventListener("pointerup", up as any);
      window.removeEventListener("pointercancel", up as any);
    };
  }, [onChange]);

  const pct = ((value - min) / (max - min)) * 100;

  const onTrackPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    pointerIdRef.current = e.pointerId;
    onChange(valueFromClientX(e.clientX));
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onKnobPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    pointerIdRef.current = e.pointerId;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onKnobKeyDown = (e: React.KeyboardEvent) => {
    let delta = 0;
    if (e.key === "ArrowLeft") delta = -step;
    else if (e.key === "ArrowRight") delta = step;
    else if (e.key === "PageDown") delta = -5 * step;
    else if (e.key === "PageUp") delta = 5 * step;
    else if (e.key === "Home") delta = min - value;
    else if (e.key === "End")  delta = max - value;
    if (!delta) return;
    e.preventDefault();
    onChange(clamp(value + delta));
  };

  return (
    <div className="relative select-none mt-2">
      <div
        ref={trackRef}
        className="w-full rounded-full bg-white/40"
        style={{ height: TRACK_H, touchAction: "none" }}
        onPointerDown={onTrackPointerDown}
      >
        {/* barre active (jaune) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 rounded-full"
          style={{ left: 0, width: `${pct}%`, height: TRACK_H, backgroundColor: barColor }}
        />
      </div>

      {/* poignée (verte) */}
      <button
        type="button" role="slider" aria-label="Distance maximale"
        aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} tabIndex={0}
        onPointerDown={onKnobPointerDown} onKeyDown={onKnobKeyDown}
        className="absolute top-1/2 -translate-y-1/2 grid place-items-center rounded-md border-2 border-white shadow"
        style={{ left: `calc(${pct}% - 10px)`, width: KNOB, height: KNOB, touchAction: "none", backgroundColor: KNOB_GREEN }}
      />
    </div>
  );
}

/* Listes + cartes --------------------------------------------------------- */
function SectionList({
  title, showTitle = true, loading, items, peers, openChat, viewProfile, onShield, onDelete,
  hideIdentityForOtherId,
  showUnreadDot = false,
}:{
  title: string;
  showTitle?: boolean;
  loading: boolean;
  items: Thread[];
  peers: Record<string, Peer>;
  openChat: (id: string)=>void;
  viewProfile: (id: string)=>void;
  onShield: (id: string)=>void;
  onDelete: (id: string)=>void;
  hideIdentityForOtherId?: (id: string) => boolean;
  showUnreadDot?: boolean;
}) {
  // Même logique que sur /interaction/mes_coups_de_coeur :
  // on varie légèrement les avatars voilés pour casser la monotonie.
  const usedMasked = new Set<number>();

  return (
    <section className="space-y-3 mt-6">
      {showTitle && <h2 className="text-lg font-medium text-white drop-shadow">{title}</h2>}
      {!loading && items.length === 0 && <p className="text-sm text-white/90 text-center py-6">Aucun élément.</p>}

      {!loading && items.length > 0 && (
        <ul className="grid gap-2">
          {items.map((t) => {
            const p = peers[t.otherId];
            const hide = hideIdentityForOtherId ? hideIdentityForOtherId(t.otherId) : false;
            const rawTitle = p?.username?.trim() ? p.username : "Utilisateur";
            const titleTxt = hide ? "Profil confidentiel" : rawTitle;
            const preview = (t.lastText || "…").slice(0, 140);
            const when = t.lastInboundAtISO || t.lastDateISO || "";
            const dateStr = when ? new Date(when).toLocaleString() : "";
            const city = !hide && p?.ville ? p.ville : null;
            const dist = !hide && (p?.distanceKm != null) ? `${p.distanceKm} km` : null;
            const hasUnread = showUnreadDot && (t.unreadInboundCount ?? 0) > 0;
            const maskedAvatar = hide ? pickMaskedAvatar(t.otherId, usedMasked).src : null;

            return (
              <li
                key={t.otherId}
                className="w-full max-w-full overflow-hidden rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  if (hide) {
                    // Profil non dévoilé : on ne va PAS sur /profileplus
                    return;
                  }
                  viewProfile(t.otherId);
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar + 🛡️ dessous */}
                  <div className="shrink-0 flex flex-col items-center">
                    <div className="h-16 w-16 rounded-full overflow-hidden ring-1 ring-gray-200 bg-gray-100">
                      {p?.avatarUrl && !hide ? (
                        <img
                          src={p.avatarUrl}
                          alt={titleTxt || "Avatar"}
                          className="h-full w-full object-cover"
                        />
                      ) : hide ? (
                        maskedAvatar ? (
                          // Avatar voilé multi-couleurs (identité cachée)
                          <img
                            src={maskedAvatar}
                            alt="Profil confidentiel"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          // Fallback très rare si aucun masque n'est dispo
                          <div className="h-full w-full grid place-items-center bg-sky-200 text-sky-800 text-2xl font-semibold">
                            ?
                          </div>
                        )
                      ) : (
                        // Avatar générique quand l'identité n'est PAS cachée mais qu'il n'y a pas encore de photo
                        <div className="h-full w-full grid place-items-center text-gray-400 text-2xl">
                          <span aria-hidden>👤</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      aria-label="Bloquer définitivement"
                      title="Bloquer définitivement"
                      className="mt-2"
                      style={{ background: "transparent" }}
                      onClick={(e) => { e.stopPropagation(); onShield(t.otherId); }}
                    >
                      <span aria-hidden className="text-[1.9rem] leading-none">🛡️</span>
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-base font-semibold text-gray-900">{titleTxt}</div>
                        {(city || dist) && (
                          <div className="mt-0.5 text-sm text-gray-600">
                            {city ?? "—"}{dist ? ` · ${dist}` : ""}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {hasUnread && (
                          <span
                            aria-label="Nouveau message"
                            title="Nouveau message"
                            className="inline-block rounded-full ring-1 ring-white/70"
                            style={{ width: 14, height: 14, backgroundColor: TENDER_GREEN }}
                          />
                        )}
                        <button
                          type="button"
                          aria-label="Ouvrir la conversation"
                          title="Conversation"
                          className="w-9 h-9 grid place-items-center rounded-md bg-yellowGreen text-black ring-1 ring-black/10 hover:brightness-95"
                          onClick={(e) => { e.stopPropagation(); openChat(t.otherId); }}
                        >
                          <span aria-hidden>💬</span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-1 text-sm text-gray-700 line-clamp-2 break-words">{preview}</div>
                    <div className="mt-1 text-xs">{dateStr}</div>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDelete(t.otherId); }}
                        className="text-red-600 hover:text-red-700 text-[11px] sm:text-xs md:text-sm leading-4 font-medium"
                        title="Supprimer ce message"
                        aria-label="Supprimer ce message"
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* Marqueur d’auth front --------------------------------------------------- */
;(MessagesPage as any).requireAuth = true;
