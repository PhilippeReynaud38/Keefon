// -*- coding: utf-8 -*-
//
// Fichier : pages/interaction/mes_coups_de_coeur.tsx
// Projet  : Vivaya
//
// Objet   : Page "Mes keefs" (anciennement "Mes Coups de Cœur")
//           — UI uniquement, aucun changement de schéma/BDD/RPC.
//           — Libellés harmonisés : "Tes keefons", "Tes keefs reçus",
//             "Tes keefs envoyés", messages vides, tooltips, etc.
//
// Correctifs précédents (25–26/10)
// - Poubelle des cartes RÉVÉLÉES : z-index + pointer-events none sur décors.
// - Poubelle AJOUTÉE sur cartes VOILÉES : archive receiver_archived=true (fallback inclus).
// - Anti "carte fantôme" : on purge les états locaux après archive et on ne rend
//   les révélés que s’ils sont encore présents côté actifs.
//
// Invariants Vivaya
// 1) Code robuste, simple, lisible (UTF-8, commentaires sobres, pas d’usine à gaz)
// 2) Aucun effet de bord non maîtrisé ; tout est réversible
// 3) Aucune modification SQL/RLS : **UI seulement**
//
// Dernière mise à jour : 2025-10-29

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";
import { pickMaskedAvatar } from "@/lib/maskedAvatars";

// ----------------------------- Types -----------------------------
type RpcRow = {
  direction: "received" | "sent";
  other_user: string;
  created_at: string;
  can_reveal: boolean;
  username: string | null;
  age: number | null;
  city: string | null;
  photo_path: string | null;
};

type PublicRow = {
  id: string;
  username: string | null;
  ville: string | null;
  birthday: string | null;
};

type Enriched = {
  direction: "received" | "sent";
  other_user: string;
  created_at: string;
  username: string | null;
  ville: string | null;
  age: number | null;
  avatar: string | null;
};

// ----------------------- Utilitaires ----------------------
function publicUrl(path: string | null): string | null {
  if (!path) return null;
  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl ?? null;
}

function ageFromISO(b?: string | null) {
  if (!b) return null;
  const d = new Date(b);
  if (isNaN(d.getTime())) return null;
  const n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  const m = n.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < d.getDate())) a--;
  return a;
}

async function enrichProfiles(ids: string[]) {
  const byId = new Map<string, PublicRow>();
  const avatar = new Map<string, string>();
  if (!ids.length) return { byId, avatar };

  const view = await supabase
    .from("public_full_profiles")
    .select("id, username, ville, birthday")
    .in("id", ids);
  if (view.error) throw view.error;
  (view.data ?? []).forEach((r) => byId.set((r as any).id, r as PublicRow));

  const photos = await supabase
    .from("photos")
    .select("user_id, url, is_main")
    .in("user_id", ids)
    .eq("is_main", true);
  if (photos.error) throw photos.error;
  for (const ph of photos.data ?? []) {
    if (!ph?.url) continue;
    const u = supabase.storage.from("avatars").getPublicUrl(ph.url).data.publicUrl;
    if (u) avatar.set((ph as any).user_id, u);
  }
  return { byId, avatar };
}

// ------------------------- Cartes UI -------------------------

function RevealedCard({
  row,
  onArchive,
  priority,
}: {
  row: RpcRow | Enriched;
  onArchive: () => void;
  priority?: boolean;
}) {
  const img =
    "photo_path" in row ? publicUrl(row.photo_path) : (row as any).avatar ?? null;
  const username = "username" in row ? row.username : (row as any).username;
  const city = "city" in row ? row.city : (row as any).ville;
  const age = "age" in row ? row.age : (row as any).age;

  return (
    <Link href={`/profileplus/${row.other_user}`} className="group block focus:outline-none">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5">
        {img ? (
          <Image
            src={img}
            alt={username ?? "Profil"}
            fill
            sizes="(max-width: 768px) 50vw, 240px"
            priority={priority}
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gray-200" />
        )}

        {/* Décors : ne doivent jamais intercepter les clics */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent pointer-events-none z-0" />
        <div className="absolute inset-0 scale-100 transition-transform group-hover:scale-[1.02] pointer-events-none z-0" />

        {/* Bouton corbeille au-dessus de tout */}
        <button
          type="button"
          title="Mettre à la corbeille"
          aria-label="Mettre à la corbeille"
          className="absolute right-2 top-2 inline-flex items-center justify-center
                     p-0 bg-transparent shadow-none text-white/95 z-20
                     hover:scale-110 transition-transform
                     focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onArchive();
          }}
        >
          <span aria-hidden className="text-[22px] leading-none">🗑️</span>
        </button>

        <div className="absolute inset-x-0 bottom-0 p-3 z-10 pointer-events-none">
          <div className="text-white drop-shadow">
            <div className="font-semibold leading-tight">{username ?? "Profil"}</div>
            <div className="text-sm opacity-90">
              {(city as string) ?? "—"}
              {age !== null && age !== undefined ? ` · ${age} ans` : ""}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Carte voilée + bouton Écho + bouton Poubelle
function MaskedCard({
  mockSrc,
  otherUser,
  hasOffer,
  offered,
  sending,
  onSendEcho,
  onArchive,
  priority,
}: {
  mockSrc: string | null;
  otherUser: string;
  hasOffer: boolean;
  offered: boolean;
  sending: boolean;
  onSendEcho: () => void;
  onArchive: () => void;
  priority?: boolean;
}) {
  return (
    <div
      className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5 select-none"
      data-other-user={otherUser}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mockSrc ?? ""}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
      <div className="absolute inset-0 backdrop-blur-[2px] bg-black/55 pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(transparent_40%,rgba(0,0,0,0.85)_100%)] pointer-events-none z-0" />

      {/* Poubelle sur cartes voilées */}
      <button
        type="button"
        title="Mettre à la corbeille"
        aria-label="Mettre à la corbeille"
        className="absolute right-2 top-2 inline-flex items-center justify-center
                   p-0 bg-transparent shadow-none text-white/95 z-20
                   hover:scale-110 transition-transform
                   focus-visible:outline-none focus-visible:ring-2
                   focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onArchive();
        }}
      >
        <span aria-hidden className="text-[22px] leading-none">🗑️</span>
      </button>

      <div className="absolute inset-x-0 bottom-0 p-3 space-y-2 z-10">
        <div className="rounded-md bg-white/85 px-2 py-1 text-center text-[13px] leading-5">
          <div className="font-semibold">Keef reçu ❤️</div>
          <div className="text-[12px] text-gray-700">identité cachée</div>
        </div>

        {hasOffer && (
          <button
            type="button"
            disabled={offered || sending}
            onClick={onSendEcho}
            className={`w-full h-9 rounded-full text-white font-semibold transition 
                       ${offered ? "bg-emerald-500/80" : "bg-paleGreen hover:brightness-95"}
                       disabled:opacity-70 disabled:cursor-not-allowed`}
            title={offered ? "Écho 🧡 déjà proposé" : "Envoyer l’Écho 🧡"}
          >
            {offered ? "Écho 🧡 proposé ✅" : sending ? "Envoi…" : "Envoyer l’Écho 🧡"}
          </button>
        )}
      </div>
    </div>
  );
}

function CounterCard({ count, onClick }: { count: number; onClick?: () => void }) {
  const Wrapper: any = onClick ? "button" : "div";
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-label={onClick ? `Voir ${count} autres keefs voilés` : undefined}
      className={
        "relative aspect-[4/5] w-full overflow-hidden rounded-2xl ring-1 ring-black/5 " +
        (onClick
          ? "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black/30"
          : "")
      }
    >
      <div className="absolute inset-0 bg-white/15 backdrop-blur-md pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(transparent_55%,rgba(0,0,0,0.35)_100%)] pointer-events-none" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center transition-transform duration-200 will-change-transform hover:scale-105">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span aria-hidden className="text-2xl">❤️</span>
            <span className="text-3xl md:text-4xl font-extrabold text-gray-900 drop-shadow">
              +{count}
            </span>
          </div>
          <div className="text-xs md:text-sm text-gray-800/90">autres keefs voilés</div>
        </div>
      </div>
    </Wrapper>
  );
}

// -------------------------- Composant principal ---------------------------
export default function MesCoupsDeCoeur() {
  const router = useRouter();

  const [me, setMe] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<RpcRow[]>([]);
  const [loadingActifs, setLoadingActifs] = React.useState(true);

  // Historique (archivés)
  const [recusHist, setRecusHist] = React.useState<Enriched[]>([]);
  const [envoyesHist, setEnvoyesHist] = React.useState<Enriched[]>([]);
  const [loadingHist, setLoadingHist] = React.useState(false);
  const [showHist, setShowHist] = React.useState(false);
  const [historyUnavailable, setHistoryUnavailable] = React.useState(false);

  // Écho
  const [sendingFor, setSendingFor] = React.useState<string | null>(null);
  const [offeredEcho, setOfferedEcho] = React.useState<Set<string>>(new Set());
  const [incomingEchoOffers, setIncomingEchoOffers] = React.useState<Set<string>>(new Set());

  // Révélations persistées et locales
  const [echoRevealedSet, setEchoRevealedSet] = React.useState<Set<string>>(new Set());
  const [revealedInPlace, setRevealedInPlace] = React.useState<Set<string>>(new Set());
  const [promotedInfo, setPromotedInfo] = React.useState<
    Record<string, { username: string | null; ville: string | null; age: number | null; avatar: string | null }>
  >({});

  // Erreur globale
  const [error, setError] = React.useState<string | null>(null);

  // Liste des antibrouteurs (IDs)
  const [antibrouteurIds, setAntibrouteurIds] = React.useState<Set<string>>(new Set());

  function isBenignHistoryError(err: any): boolean {
    const code = String((err && err.code) ?? "");
    const msg = String((err && err.message) ?? "").toLowerCase();
    return (
      code === "42501" ||
      msg.includes('row-level security policy for table "profiles"') ||
      msg.includes("rls")
    );
  }

  React.useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        setError(error.message);
        return;
      }
      setMe(data?.user?.id ?? null);
    })();
  }, []);

  // Chargement des IDs antibrouteurs
  React.useEffect(() => {
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
    return () => {
      cancelled = true;
    };
  }, []);

  const loadActifs = React.useCallback(async (uid: string) => {
    setLoadingActifs(true);
    setError(null);
    const { data, error } = await supabase.rpc("my_hearts", { p_viewer: uid });
    if (error) {
      setRows([]);
      setError(error.message);
    } else setRows((data as RpcRow[]) ?? []);
    setLoadingActifs(false);
  }, []);

  React.useEffect(() => {
    if (me) void loadActifs(me);
  }, [me, loadActifs]);

  React.useEffect(() => {
    if (!me) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("echo_offers")
          .select("from_user")
          .eq("to_user", me)
          .eq("status", "offered");
        if (error) throw error;
        const s = new Set<string>();
        for (const r of (data ?? []) as any[]) s.add((r as any).from_user as string);
        setIncomingEchoOffers(s);
      } catch {
        setIncomingEchoOffers(new Set());
      }
    })();
  }, [me, rows.length]);

  React.useEffect(() => {
    if (!me) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("echo_views")
          .select("other_user")
          .eq("viewer", me);
        if (error) throw error;
        const s = new Set<string>();
        for (const r of (data ?? []) as any[]) s.add((r as any).other_user as string);
        setEchoRevealedSet(s);
      } catch {
        setEchoRevealedSet(new Set());
      }
    })();
  }, [me]);

  React.useEffect(() => {
    const ids = Array.from(echoRevealedSet);
    if (!ids.length) return;
    (async () => {
      try {
        const { byId, avatar } = await enrichProfiles(ids);
        setPromotedInfo((prev) => {
          const next = { ...prev } as any;
          for (const id of ids) {
            if (next[id]) continue;
            const v = byId.get(id);
            next[id] = {
              username: v?.username ?? null,
              ville: v?.ville ?? null,
              age: ageFromISO(v?.birthday),
              avatar: v ? avatar.get(id) ?? null : null,
            };
          }
          return next;
        });
      } catch {
        /* non bloquant */
      }
    })();
  }, [echoRevealedSet]);

  // Filtrage antibrouteur : on cache les keefs liés à un antibrouteur pour les victimes.
  const rowsFiltered = React.useMemo(() => {
    if (!rows.length) return rows;
    if (!me) return rows;
    if (antibrouteurIds.size === 0) return rows;
    // Si c'est moi le brouteur → je vois tout normalement.
    if (antibrouteurIds.has(me)) return rows;
    // Sinon, je ne vois pas les keefs dont l'autre est antibrouteur.
    return rows.filter((r) => !antibrouteurIds.has(r.other_user));
  }, [rows, antibrouteurIds, me]);

  const receivedAll = React.useMemo(
    () => rowsFiltered.filter((r) => r.direction === "received"),
    [rowsFiltered]
  );
  const sentAll = React.useMemo(
    () => rowsFiltered.filter((r) => r.direction === "sent"),
    [rowsFiltered]
  );

  const revealedIds = React.useMemo(() => {
    const s = new Set<string>(revealedInPlace);
    echoRevealedSet.forEach((id) => s.add(id));
    return s;
  }, [revealedInPlace, echoRevealedSet]);

  const receivedMasked = React.useMemo(
    () => receivedAll.filter((r) => !r.can_reveal && !revealedIds.has(r.other_user)),
    [receivedAll, revealedIds]
  );

  const strictMatchIds = React.useMemo(() => {
    const recvSet = new Set(receivedAll.map((r) => r.other_user));
    const ids = new Set<string>();
    for (const s of sentAll) if (recvSet.has(s.other_user)) ids.add(s.other_user);
    return ids;
  }, [receivedAll, sentAll]);

  const matchRows: RpcRow[] = React.useMemo(() => {
    if (strictMatchIds.size === 0) return [];
    const sentMap = new Map(sentAll.map((r) => [r.other_user, r]));
    const recvMap = new Map(receivedAll.map((r) => [r.other_user, r]));
    return Array.from(strictMatchIds).map(
      (id) => sentMap.get(id) ?? (recvMap.get(id) as RpcRow)
    );
  }, [strictMatchIds, sentAll, receivedAll]);

  // ⬇️ IMPORTANT : n’afficher les “révélés” que s’ils sont toujours présents côté actifs
  const receivedRevealed = React.useMemo(() => {
    return receivedAll
      .filter((r) => revealedIds.has(r.other_user))
      .map((base) => {
        const info = promotedInfo[base.other_user];
        return info
          ? ({
              direction: "received" as const,
              other_user: base.other_user,
              created_at: base.created_at,
              username: info.username,
              ville: info.ville,
              age: info.age,
              avatar: info.avatar,
            } as Enriched)
          : base;
      });
  }, [revealedIds, receivedAll, promotedInfo]);

  const sent = React.useMemo(
    () => rowsFiltered.filter((r) => r.direction === "sent" && !strictMatchIds.has(r.other_user)),
    [rowsFiltered, strictMatchIds]
  );

  const maskedWithMock = React.useMemo(() => {
    const used = new Set<number>();
    return receivedMasked.map((it) => {
      const pick = pickMaskedAvatar(it.other_user, used);
      return { row: it, mockSrc: pick.src, hasOffer: incomingEchoOffers.has(it.other_user) };
    });
  }, [receivedMasked, incomingEchoOffers]);

  const loadHistory = React.useCallback(
    async (uid: string) => {
      setLoadingHist(true);
      setHistoryUnavailable(false);
      try {
        const [rA, sA] = await Promise.all([
          supabase
            .from("hearts")
            .select("from_user, created_at, receiver_archived")
            .eq("to_user", uid)
            .order("created_at", { ascending: false }),
          supabase
            .from("hearts")
            .select("to_user, created_at, sender_archived")
            .eq("from_user", uid)
            .order("created_at", { ascending: false }),
        ]);
        if (rA.error) throw rA.error;
        if (sA.error) throw sA.error;

        let rRows = (rA.data ?? [])
          .filter((x) => !!(x as any).receiver_archived)
          .map((x) => ({
            direction: "received" as const,
            other_user: (x as any).from_user as string,
            created_at: (x as any).created_at as string,
          }));

        let sRows = (sA.data ?? [])
          .filter((x) => !!(x as any).sender_archived)
          .map((x) => ({
            direction: "sent" as const,
            other_user: (x as any).to_user as string,
            created_at: (x as any).created_at as string,
          }));

        // Filtrage antibrouteur aussi pour l’historique :
        // les victimes ne voient pas les keefs liés à un antibrouteur.
        if (antibrouteurIds.size > 0 && !antibrouteurIds.has(uid)) {
          rRows = rRows.filter((x) => !antibrouteurIds.has(x.other_user));
          sRows = sRows.filter((x) => !antibrouteurIds.has(x.other_user));
        }

        const ids = Array.from(
          new Set([...rRows.map((x) => x.other_user), ...sRows.map((x) => x.other_user)])
        );
        if (!ids.length) {
          setRecusHist([]);
          setEnvoyesHist([]);
          return;
        }

        const { byId, avatar } = await enrichProfiles(ids);

        const map = (list: typeof rRows | typeof sRows): Enriched[] =>
          list.map((x) => {
            const v = byId.get(x.other_user);
            return {
              direction: x.direction,
              other_user: x.other_user,
              created_at: x.created_at,
              username: v?.username ?? null,
              ville: v?.ville ?? null,
              age: ageFromISO(v?.birthday),
              avatar: v ? avatar.get(v.id) ?? null : null,
            };
          });

        setRecusHist(map(rRows));
        setEnvoyesHist(map(sRows));
      } catch (e: any) {
        if (isBenignHistoryError(e)) {
          setHistoryUnavailable(true);
          setRecusHist([]);
          setEnvoyesHist([]);
        } else {
          setError(e?.message ?? "Erreur inconnue");
          setRecusHist([]);
          setEnvoyesHist([]);
        }
      } finally {
        setLoadingHist(false);
      }
    },
    [antibrouteurIds]
  );

  React.useEffect(() => {
    if (showHist && me) void loadHistory(me);
  }, [showHist, me, loadHistory]);

  // ---------------- Actions : archiver / restaurer / supprimer ----------------

  // ✅ Version solide : tente d’abord la RPC hearts_archive_v1,
  // puis fallback double UPDATE si besoin.
  async function archive(row: { direction: "received" | "sent"; other_user: string }) {
    if (!me) return;

    // ⚠️ Confirmation avant mise à la corbeille (action réversible)
    if (typeof window !== "undefined") {
      const ok = window.confirm(
        "Mettre ce keef à la corbeille ?\n\nTu pourras le retrouver dans l’historique."
      );
      if (!ok) return;
    }

    // 1) Tentative via RPC (atomique)
    try {
      const rpc = await supabase.rpc("hearts_archive_v1", {
        p_other: row.other_user,
        p_dir: row.direction,
      });

      if (!rpc.error && rpc.data === true) {
        // Succès → nettoyage UI + états locaux
        setRows((ls) =>
          ls.filter(
            (it) => !(it.other_user === row.other_user && it.direction === row.direction)
          )
        );
        setRevealedInPlace((prev) => {
          if (!prev.has(row.other_user)) return prev;
          const cp = new Set(prev);
          cp.delete(row.other_user);
          return cp;
        });
        setEchoRevealedSet((prev) => {
          if (!prev.has(row.other_user)) return prev;
          const cp = new Set(prev);
          cp.delete(row.other_user);
          return cp;
        });
        setPromotedInfo((prev) => {
          if (!prev[row.other_user]) return prev;
          const { [row.other_user]: _, ...rest } = prev as any;
          return rest as any;
        });
        if (showHist && me) void loadHistory(me);
        return;
      }
      // si rpc.error ou data !== true → fallback
    } catch {
      // on poursuit sur le fallback
    }

    // 2) Fallback : double tentative d’UPDATE
    const tries: Array<{ col: "receiver_archived" | "sender_archived"; from: string; to: string }> =
      row.direction === "received"
        ? [
            { col: "receiver_archived", from: row.other_user, to: me },
            { col: "sender_archived", from: me, to: row.other_user },
          ]
        : [
            { col: "sender_archived", from: me, to: row.other_user },
            { col: "receiver_archived", from: row.other_user, to: me },
          ];

    for (const t of tries) {
      const u = await supabase
        .from("hearts")
        .update({ [t.col]: true })
        .eq("from_user", t.from)
        .eq("to_user", t.to);

      if (u.error) continue;

      const v = await supabase
        .from("hearts")
        .select("receiver_archived, sender_archived")
        .eq("from_user", t.from)
        .eq("to_user", t.to)
        .maybeSingle();

      const archivedOk =
        !v.error &&
        v.data &&
        ((t.col === "receiver_archived" && (v.data as any).receiver_archived === true) ||
          (t.col === "sender_archived" && (v.data as any).sender_archived === true));

      if (archivedOk || (!v.error && !v.data)) {
        setRows((ls) =>
          ls.filter(
            (it) => !(it.other_user === row.other_user && it.direction === row.direction)
          )
        );
        setRevealedInPlace((prev) => {
          if (!prev.has(row.other_user)) return prev;
          const cp = new Set(prev);
          cp.delete(row.other_user);
          return cp;
        });
        setEchoRevealedSet((prev) => {
          if (!prev.has(row.other_user)) return prev;
          const cp = new Set(prev);
          cp.delete(row.other_user);
          return cp;
        });
        setPromotedInfo((prev) => {
          if (!prev[row.other_user]) return prev;
          const { [row.other_user]: _, ...rest } = prev as any;
          return rest as any;
        });
        if (showHist && me) void loadHistory(me);
        return;
      }
    }

    alert("Impossible de mettre à la corbeille.");
  }

  async function restore(row: Enriched) {
    if (!me) return;
    const col = row.direction === "received" ? "receiver_archived" : "sender_archived";
    const from = row.direction === "received" ? row.other_user : me;
    const to = row.direction === "received" ? me : row.other_user;
    const r = await supabase
      .from("hearts")
      .update({ [col]: false })
      .eq("from_user", from)
      .eq("to_user", to);
    if (r.error) {
      alert("Impossible de restaurer.");
      return;
    }
    if (row.direction === "received") setRecusHist((ls) => ls.filter((x) => x !== row));
    else setEnvoyesHist((ls) => ls.filter((x) => x !== row));
    if (me) void loadActifs(me);
  }

  async function hardDelete(row: Enriched) {
    if (!me) return;
    if (!confirm("Confirmer la suppression définitive ?")) return;
    const from = row.direction === "received" ? row.other_user : me;
    const to = row.direction === "received" ? me : row.other_user;
    const r = await supabase.from("hearts").delete().eq("from_user", from).eq("to_user", to);
    if (r.error) {
      alert("Suppression impossible.");
      return;
    }
    if (row.direction === "received") setRecusHist((ls) => ls.filter((x) => x !== row));
    else setEnvoyesHist((ls) => ls.filter((x) => x !== row));
  }

  function markRevealedInPlace(otherId: string) {
    setRevealedInPlace((prev) => {
      const cp = new Set(prev);
      cp.add(otherId);
      return cp;
    });
  }
  async function ensurePromotedInfo(otherId: string) {
    if (promotedInfo[otherId]) return;
    try {
      const { byId, avatar } = await enrichProfiles([otherId]);
      const v = byId.get(otherId);
      setPromotedInfo((m) => ({
        ...m,
        [otherId]: {
          username: v?.username ?? null,
          ville: v?.ville ?? null,
          age: ageFromISO(v?.birthday),
          avatar: v ? avatar.get(otherId) ?? null : null,
        },
      }));
    } catch {
      /* non bloquant */
    }
  }

  async function sendEcho(toUser: string) {
    try {
      setSendingFor(toUser);
      const call = await supabase.rpc("boomerang_echo_heart_v1", { p_from: toUser });
      if (call.error) throw call.error;
      const res: any = call.data ?? {};

      if (res.ok || res.status === "redeemed") {
        markRevealedInPlace(toUser);
        setOfferedEcho((prev) => new Set(prev).add(toUser));
        setIncomingEchoOffers((prev) => {
          const cp = new Set(prev);
          cp.delete(toUser);
          return cp;
        });
        setEchoRevealedSet((prev) => {
          const cp = new Set(prev);
          cp.add(toUser);
          return cp;
        });
        void ensurePromotedInfo(toUser);
        return;
      }

      if (res.reason === "no_offer_found") {
        alert("Il n’y a pas d’écho 🧡 à renvoyer pour ce keef.");
        return;
      }
      if (res.reason === "offer_expired") {
        alert("L’offre d’écho 🧡 a expiré (l’expéditeur a été re-crédité).");
        return;
      }
      alert("Impossible de renvoyer l’Écho 🧡 pour le moment.");
    } catch (e: any) {
      alert(e?.message ?? "Erreur lors du renvoi de l’Écho 🧡.");
    } finally {
      setSendingFor(null);
    }
  }

  // ------------------------------- Rendu -------------------------------
  const receivedTotal = receivedMasked.length + receivedRevealed.length;

  return (
    <>
      <Head>
        <title>Mes keefs — Vivaya</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div
        className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat px-3 pt-5 pb-16"
        style={{ backgroundImage: `url('/bg-mes-coups-de-coeur-ext.png')` }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => router.back()} className="rounded-xl bg-yellowGreen px-4 py-2">
              ← Retour
            </button>
            {/* Historique désactivé : case à cocher retirée (UI). Logique conservée. */}
          </div>

          {error && (
            <div className="rounded-2xl bg-white/70 ring-1 ring-gray-200 p-4 mb-6 text-center text-red-700">
              Erreur : {error}
            </div>
          )}

          {/* === 1) ★ TES KEEFONS === */}
          <section className="mb-8 md:mb-10">
            <div className="flex items-center gap-2 mb-1">
              <h2
                className="text-3xl md:text-4xl font-extrabold
               bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500
               bg-clip-text text-transparent"
              >
                ★ Tes keefons
              </h2>
              <span className="text-black/70 text-xl">({matchRows.length})</span>
            </div>

            {loadingActifs ? null : matchRows.length === 0 ? (
              <div className="rounded-2xl bg-white/70 ring-1 ring-gray-200 p-6 text-center text-gray-700">
                Aucun match pour l’instant.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] md:gap-6">
                {matchRows.map((it, i) => (
                  <RevealedCard
                    key={`match-${it.other_user}-${it.created_at}`}
                    row={it}
                    onArchive={() =>
                      archive({ direction: it.direction, other_user: it.other_user })
                    }
                    priority={i === 0}
                  />
                ))}
              </div>
            )}
          </section>

          {/* === 2) REÇUS (voilés + révélés) === */}
          <section className="mb-8">
            <div className="flex items-baseline gap-2 mb-1">
              <h2 className="text-2xl font-extrabold bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
                Tes keefs reçus
              </h2>
              <span className="text-black/70 text-xl">({receivedTotal})</span>
            </div>

            {receivedTotal > 0 && (
              <p className="text-sm text-gray-700 mb-3">
                identités masquées — abonne-toi pour tout voir
              </p>
            )}

            {loadingActifs ? null : receivedTotal === 0 ? (
              <div className="rounded-2xl bg-white/70 ring-1 ring-gray-200 p-6 text-center text-gray-700">
                Aucun keef reçu pour l’instant.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] md:gap-6">
                {/* révélés */}
                {receivedRevealed.map((r, i) => (
                  <RevealedCard
                    key={`promoted-${r.other_user}-${"created_at" in r ? (r as any).created_at : i}`}
                    row={r}
                    onArchive={() => archive({ direction: "received", other_user: r.other_user })}
                    priority={i === 0}
                  />
                ))}

                {/* voilés (avec poubelle) */}
                {maskedWithMock.slice(0, 3).map(({ row, mockSrc, hasOffer }, i) => (
                  <MaskedCard
                    key={`m-${row.other_user}-${row.created_at}`}
                    mockSrc={mockSrc}
                    otherUser={row.other_user}
                    hasOffer={hasOffer}
                    offered={offeredEcho.has(row.other_user)}
                    sending={sendingFor === row.other_user}
                    onSendEcho={() => sendEcho(row.other_user)}
                    onArchive={() => archive({ direction: "received", other_user: row.other_user })}
                    priority={i === 0 && receivedRevealed.length === 0}
                  />
                ))}

                {receivedMasked.length > 3 && (
                  <CounterCard count={receivedMasked.length - 3} />
                )}
              </div>
            )}
          </section>

          {/* === 3) ENVOYÉS (hors matches) === */}
          <section>
            <div className="flex items-baseline gap-2 mb-1">
              <h2 className="text-2xl font-extrabold bg-gradient-to-r from-fuchsia-400 via-pink-500 to-rose-500 bg-clip-text text-transparent">
                Tes keefs envoyés
              </h2>
            </div>

            {loadingActifs ? null : sent.length === 0 ? (
              <div className="rounded-2xl bg-white/70 ring-1 ring-gray-200 p-6 text-center text-gray-700">
                Aucun pour l’instant.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] md:gap-6">
                {sent.map((it, i) => (
                  <RevealedCard
                    key={`s-${it.other_user}-${it.created_at}`}
                    row={it}
                    onArchive={() => archive({ direction: "sent", other_user: it.other_user })}
                    priority={i === 0}
                  />
                ))}
              </div>
            )}

            {/* Historique — envoyés */}
            {showHist && (
              <div className="mt-7">
                <div className="flex items-baseline gap-2 mb-1">
                  <h3 className="text-xl font-semibold text-black">Historique (envoyés)</h3>
                  <span className="text-black/70 text-lg">({envoyesHist.length})</span>
                </div>

                {loadingHist ? (
                  <div className="rounded-2xl bg-white/70 ring-1 ring-gray-200 p-6 text-center text-gray-700">
                    Chargement de l’historique…
                  </div>
                ) : historyUnavailable ? (
                  <div className="rounded-2xl bg-white/70 ring-1 ring-gray-200 p-6 text-center text-gray-700">
                    Historique indisponible pour ce compte.
                  </div>
                ) : !envoyesHist.length ? (
                  <div className="rounded-2xl bg-white/70 ring-1 ring-gray-200 p-6 text-center text-gray-700">
                    Aucun élément archivé.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] md:gap-6">
                    {envoyesHist.map((p, i) => (
                      <div
                        key={`ea-${p.other_user}-${p.created_at}`}
                        className="relative w-full rounded-2xl bg-white/85 p-3 md:p-4 shadow-lg"
                      >
                        <Link
                          href={`/profileplus/${p.other_user}`}
                          className="block focus:outline-none"
                        >
                          <div className="relative mx-auto rounded-full overflow-hidden ring-4 ring-white shadow w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28">
                            {p.avatar ? (
                              <Image
                                src={p.avatar}
                                alt={p.username ?? "Profil"}
                                width={112}
                                height={112}
                                priority={i === 0}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-300" />
                            )}
                          </div>
                          <div className="mt-2 md:mt-3 text-center">
                            <div className="font-semibold text-sm md:text-base">
                              {p.username ?? "Profil"}
                            </div>
                            <div className="text-xs md:text-sm text-gray-700">
                              {p.ville ?? "—"}
                              {p.age ? ` · ${p.age} ans` : ""}
                            </div>
                          </div>
                        </Link>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button
                            title="Effacer définitivement"
                            className="h-9 rounded-full bg-menuBtn text-white text-sm hover:brightness-95"
                            onClick={() => hardDelete(p)}
                          >
                            Effacer
                          </button>
                          <button
                            title="Restaurer"
                            className="h-9 rounded-full bg-paleGreen text-white text-sm hover:brightness-95"
                            onClick={() => restore(p)}
                          >
                            Restaurer
                          </button>
                        </div>
                        <p className="mt-1 text-[10px] text-center text-gray-500">
                          effacer définitivement
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Historique — reçus */}
          {showHist && (
            <section className="mt-10">
              <div className="flex items-baseline gap-2 mb-1">
                <h3 className="text-xl font-semibold text-black">Historique (reçus)</h3>
                <span className="text-black/70 text-lg">({recusHist.length})</span>
              </div>

              {loadingHist ? (
                <div className="rounded-2xl bg-white/70 ring-1 ring-gray-200 p-6 text-center text-gray-700">
                  Chargement de l’historique…
                </div>
              ) : historyUnavailable ? (
                <div className="rounded-2xl bg-white/70 ring-1 ring-gray-200 p-6 text-center text-gray-700">
                  Historique indisponible pour ce compte.
                </div>
              ) : !recusHist.length ? (
                <div className="rounded-2xl bg-white/70 ring-1 ring-gray-200 p-6 text-center text-gray-700">
                  Aucun élément archivé.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] md:gap-6">
                  {recusHist.map((p, i) => (
                    <div
                      key={`ra-${p.other_user}-${p.created_at}`}
                      className="relative w-full rounded-2xl bg-white/85 p-3 md:p-4 shadow-lg"
                    >
                      <Link
                        href={`/profileplus/${p.other_user}`}
                        className="block focus:outline-none"
                      >
                        <div className="relative mx-auto rounded-full overflow-hidden ring-4 ring-white shadow w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28">
                          {p.avatar ? (
                            <Image
                              src={p.avatar}
                              alt={p.username ?? "Profil"}
                              width={112}
                              height={112}
                              priority={i === 0}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-300" />
                          )}
                        </div>
                        <div className="mt-2 md:mt-3 text-center">
                          <div className="font-semibold text-sm md:text-base">
                            {p.username ?? "Profil"}
                          </div>
                          <div className="text-xs md:text-sm text-gray-700">
                            {p.ville ?? "—"}
                            {p.age ? ` · ${p.age} ans` : ""}
                          </div>
                        </div>
                      </Link>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          title="Effacer définitivement"
                          className="h-9 rounded-full bg-menuBtn text-white text-sm hover:brightness-95"
                          onClick={() => hardDelete(p)}
                        >
                          Effacer
                        </button>
                        <button
                          title="Restaurer"
                          className="h-9 rounded-full bg-paleGreen text-white text-sm hover:brightness-95"
                          onClick={() => restore(p)}
                        >
                          Restaurer
                        </button>
                      </div>
                      <p className="mt-1 text-[10px] text-center text-gray-500">
                        effacer définitivement
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Lien légal discret CGU · Mentions légales */}
          <div className="mt-10 text-center text-[11px] text-gray-700">
            Conditions Générales d’Utilisation · Mentions légales
          </div>
        </div>
      </div>
    </>
  );
}
