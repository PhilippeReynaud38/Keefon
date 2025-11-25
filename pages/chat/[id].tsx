// -*- coding: utf-8 -*-
/**
 * Vivaya — pages/chat/[id].tsx
 *
 * Correctif 27/10 :
 *  - Pour les comptes FREE, autoriser l’envoi si la paire (moi, autre) est
 *    autorisée par les RLS via la vue public.chat_pairs_v1 (match OU écho 🧡
 *    “redeemed”), et pas uniquement sur la base de isMatch.
 *  - Fallback d’accès : si la RPC can_chat_with() est absente ou refuse,
 *    on vérifie chat_pairs_v1 avant de rediriger vers /abonnement.
 *
 * 28/10 :
 *  - Affichage du pseudo dans l’entête du chat (mobile-first), à côté de l’avatar.
 *
 * 29/10 (build fix) :
 *  - Remplacement du `for…of` sur un Set par une boucle `for` sur Array.from(Set)
 *    pour éviter l’erreur TS “Set<string> can only be iterated…”.
 *
 * 29/10 (build fix #2) :
 *  - Le composant ReportAbuseButton n’accepte pas `messagesSnapshot`. On supprime
 *    simplement cette prop pour coller à son interface, sans rien changer d’autre.
 */

import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import ChatLayout from "../../components/ChatLayout";
import MessagesChat from "../../components/MessagesChat";
import { supabase } from "../../lib/supabaseClient";
import ReportAbuseButton from "@/components/admin/ReportAbuseButton";

type ChatMsgSnap = {
  id: number | string;
  sender: string;
  receiver: string;
  content: string;
  created_at: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Résout une URL storage vers URL publique (HEAD check)
 * NOTE build: pas de `for…of` sur Set pour rester ES5-safe.
 */
async function resolvePublicUrl(url?: string | null): Promise<string | null> {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) {
    try {
      const ok = await fetch(url, { method: "HEAD" })
        .then((r) => r.ok)
        .catch(() => false);
      return ok ? url : null;
    } catch {
      return null;
    }
  }
  const raw = url.replace(/^\/+/, "");
  const candidates = new Set<string>([
    raw,
    raw.startsWith("avatars/") ? raw : `avatars/${raw}`,
    raw.startsWith("avatars/avatars/") ? raw : `avatars/avatars/${raw}`,
  ]);

  // ✅ Remplacement du `for (const key of candidates)` par un `for` classique
  const keys = Array.from(candidates);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const { data } = supabase.storage.from("avatars").getPublicUrl(key);
    const pub = data?.publicUrl;
    if (!pub) continue;
    try {
      const ok = await fetch(pub, { method: "HEAD" })
        .then((r) => r.ok)
        .catch(() => false);
      if (ok) return pub;
    } catch {}
  }
  return null;
}

type PlanId = "free" | "premium" | "elite"; // premium = “Essentiel” (technique)

function normalizePlanId(raw: string | null | undefined): PlanId {
  const v = (raw || "").trim().toLowerCase();
  if (v === "elite" || v === "élite") return "elite";
  if (v === "premium" || v === "essentiel" || v === "essential") return "premium";
  return "free";
}

export default function ChatPage() {
  const router = useRouter();

  // ID de l’interlocuteur : on attend router.isReady ; badLink si id invalide.
  const [peerId, setPeerId] = useState<string | null>(null);
  const [badLink, setBadLink] = useState(false);

  useEffect(() => {
    if (!router.isReady) return; // attendre que Next remplisse query
    const raw = Array.isArray(router.query.id)
      ? router.query.id[0]
      : (router.query.id as string | undefined);

    if (!raw) return; // ne rien faire tant que l’id n’est pas injecté

    const id = raw.replace(/^['"<]+|['">]+$/g, "");
    if (!UUID_RE.test(id)) {
      setBadLink(true);
      setPeerId(null);
      return;
    }
    setBadLink(false);
    setPeerId(id);
  }, [router.isReady, router.query.id]);

  // État auth / accès
  const [userId, setUserId] = useState<string | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  // Plan + “paire autorisée” (RLS) + match (info annexe)
  const [planId, setPlanId] = useState<PlanId>("free");
  const [pairAuthorized, setPairAuthorized] = useState(false);
  const [isMatch, setIsMatch] = useState<boolean>(false); // garde pour affichages éventuels

  // Données interlocuteur (header)
  const [peerData, setPeerData] = useState<{
    username: string;
    avatar_url: string | null;
    age?: number;
    ville?: string;
    code_postal?: string;
    is_certified?: boolean;
  } | null>(null);
  const [headerAvatarUrl, setHeaderAvatarUrl] = useState<string>("/default-avatar.png");

  // Menu + signalement
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<ChatMsgSnap[] | null>(null);

  // Blocage réciproque
  const [isBlockedEitherWay, setIsBlockedEitherWay] = useState<boolean>(false);

  // 1) Auth + garde d’accès — NE RIEN FAIRE tant que router/pair non prêts
  useEffect(() => {
    (async () => {
      if (!router.isReady) return;
      if (badLink) {
        setAllowed(false);
        return;
      } // on affichera un message
      if (!peerId) return; // attendre l’id

      const { data: auth } = await supabase.auth.getUser();
      const me = auth?.user?.id || null;
      if (!me) {
        router.replace("/login");
        return;
      }
      setUserId(me);

      // Plan effectif (source unique)
      const { data: eff } = await supabase
        .from("user_plans_effective_v")
        .select("effective_tier")
        .eq("id", me)
        .maybeSingle();

      const normalized = normalizePlanId(eff?.effective_tier);
      setPlanId(normalized);

      // FREE : on tente la RPC can_chat_with, sinon on vérifie chat_pairs_v1
      if (normalized === "premium" || normalized === "elite") {
        setAllowed(true);
      } else {
        let ok = false;
        try {
          const r = await supabase.rpc("can_chat_with", { target_user: peerId });
          ok = !(r as any)?.error && !!(r as any)?.data;
        } catch {
          ok = false;
        }
        if (!ok) {
          // Fallback : la paire est-elle autorisée par les RLS (match/écho “redeemed”) ?
          const [a, b] = [me, peerId].sort(); // u1 = least, u2 = greatest (lexico)
          const { data: p } = await supabase
            .from("chat_pairs_v1")
            .select("u1,u2")
            .eq("u1", a)
            .eq("u2", b)
            .maybeSingle();
          ok = !!p;
        }
        if (!ok) {
          router.replace(`/abonnement?reason=chat-locked`);
          return;
        }
        setAllowed(true);
      }

      // Info : match réciproque (peut servir à l’UI)
      const { data: m, error: em } = await supabase.rpc("is_match", {
        user_a: me,
        user_b: peerId,
      });
      setIsMatch(!em && !!m);
    })();
  }, [router.isReady, badLink, peerId, router]);

  // 1.bis) Blocage bilatéral
  useEffect(() => {
    (async () => {
      if (!userId || !peerId) return;
      const { data: a } = await supabase
        .from("blocks")
        .select("id")
        .eq("user_id", userId)
        .eq("blocked_user_id", peerId);
      const { data: b } = await supabase
        .from("blocks")
        .select("id")
        .eq("user_id", peerId)
        .eq("blocked_user_id", userId);
      setIsBlockedEitherWay(Boolean(a?.length || b?.length));
    })();
  }, [userId, peerId]);

  // 1.ter) Déterminer si la PAIRE est autorisée par RLS (chat_pairs_v1)
  useEffect(() => {
    (async () => {
      if (!userId || !peerId) return;
      const [a, b] = [userId, peerId].sort(); // u1 = least, u2 = greatest (lexico)
      const { data, error } = await supabase
        .from("chat_pairs_v1")
        .select("u1,u2")
        .eq("u1", a)
        .eq("u2", b)
        .maybeSingle();
      setPairAuthorized(!error && !!data);
    })();
  }, [userId, peerId]);

  // 2) Données interlocuteur (uniquement après autorisation)
  useEffect(() => {
    if (allowed !== true || !peerId) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("public_full_profiles")
        .select("username, avatar_url, age, ville, code_postal, is_certified")
        .eq("id", peerId)
        .maybeSingle();
      if (!cancelled)
        setPeerData(error || !data ? { username: "Contact", avatar_url: null } : data);
    })().catch(() => {
      if (!cancelled) setPeerData({ username: "Contact", avatar_url: null });
    });
    return () => {
      cancelled = true;
    };
  }, [allowed, peerId]);

  // 3) Avatar header
  useEffect(() => {
    if (allowed !== true || !peerData || !peerId) return;
    let cancel = false;
    (async () => {
      let url: string | null = null;
      const { data: mainPhoto } = await supabase
        .from("photos")
        .select("url")
        .eq("user_id", peerId)
        .eq("is_main", true)
        .limit(1)
        .maybeSingle();
      if (mainPhoto?.url) url = await resolvePublicUrl(mainPhoto.url);
      if (!url) url = await resolvePublicUrl(peerData.avatar_url);
      if (!cancel) setHeaderAvatarUrl(url || "/default-avatar.png");
    })();
    return () => {
      cancel = true;
    };
  }, [allowed, peerData, peerId]);

  // Fermeture menu au clic extérieur
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Snapshot pour signalement (pré-chargé, utile côté admin si besoin ultérieur)
  async function loadSnapshot() {
    const { data: auth } = await supabase.auth.getUser();
    const me = auth?.user?.id;
    if (allowed !== true || !me || !peerId) {
      setSnapshot(null);
      return;
    }
    const { data, error } = await supabase
      .from("messages")
      .select("id,sender,receiver,content,created_at")
      .or(
        `and(sender.eq.${me},receiver.eq.${peerId}),and(sender.eq.${peerId},receiver.eq.${me})`
      )
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) {
      setSnapshot(null);
      return;
    }
    setSnapshot(((data ?? []) as ChatMsgSnap[]).reverse());
  }
  const openReport = async () => {
    await loadSnapshot();
    setReportOpen(true);
  };

  // Action blocage
  const blockPeer = async () => {
    if (!userId || !peerId) return;
    const ok = confirm(
      "Bloquer ce profil de façon DÉFINITIVE ?\n\nVous ne pourrez plus vous écrire ni vous retrouver dans les recherches/suggestions."
    );
    if (!ok) return;
    const { error } = await supabase
      .from("blocks")
      .insert({ user_id: userId, blocked_user_id: peerId });
    if (error) {
      const msg = String(error.message || "");
      if (msg.toLowerCase().includes("unique") || (error as any).code === "23505") {
        setIsBlockedEitherWay(true);
        alert("Profil déjà bloqué.");
      } else {
        alert("⚠️ Blocage impossible pour le moment.");
      }
      return;
    }
    setIsBlockedEitherWay(true);
    alert("Ce profil est désormais bloqué définitivement.");
  };

  // États d'affichage
  if (badLink) {
    return (
      <ChatLayout>
        <div className="flex items-center justify-center h-screen text-gray-600">
          Lien de chat invalide.
        </div>
      </ChatLayout>
    );
  }
  if (allowed === null) {
    return (
      <ChatLayout>
        <div className="flex items-center justify-center h-screen text-gray-600">
          Chargement…
        </div>
      </ChatLayout>
    );
  }
  if (allowed !== true) return null;

  // ✅ Autorisation d’envoi côté UI :
  //    - Premium/Elite : toujours OK (hors blocage)
  //    - Free : OK si la paire est autorisée en base (chat_pairs_v1)
  const allowSend = !isBlockedEitherWay && (planId !== "free" ? true : pairAuthorized);

  // Rendu
  return (
    <ChatLayout>
      <div className="relative z-10 h-screen flex flex-col overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-yellow-300 text-gray-900 shadow h-16 md:h-20">
          <div className="max-w-lg mx-auto grid grid-cols-3 items-center h-full px-4">
            <div className="justify-self-start">
              <button
                onClick={() => router.back()}
                className="text-sm px-3 py-1 rounded bg-orangeVivaya text-white shadow hover:opacity-90 active:scale-[0.99] transition"
                aria-label="Retour"
              >
                ← Retour
              </button>
            </div>

            {/* --- Centre de l’entête : avatar + pseudo (mobile-first) --- */}
            <div
              className="justify-self-center h-full flex items-center justify-center gap-2 cursor-pointer"
              onClick={() => router.push(`/profileplus/${peerId!}`)}
              role="button"
              aria-label="Voir le profil"
            >
              {/* Avatar compact pour tenir dans la barre mobile */}
              <div className="relative h-[86%] aspect-square">
                <Image
                  src={headerAvatarUrl}
                  alt={peerData?.username || "Contact"}
                  fill
                  sizes="(max-width:768px) 56px, 80px"
                  className="rounded-full object-cover bg-white ring-2 ring-white/70 shadow-sm"
                  priority
                />
              </div>

              {/* Pseudo : lisible, tronqué si long */}
              <div
                className="text-[13px] md:text-sm font-semibold text-gray-900 max-w-[160px] md:max-w-[220px] truncate leading-4"
                title={peerData?.username || "Contact"}
              >
                {peerData?.username || "Contact"}
              </div>
            </div>

            <div className="justify-self-end relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="bg-orangeVivaya text-white px-3 py-1 rounded shadow hover:opacity-90 active:scale-[0.99] transition"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                MENU
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-lg ring-1 ring-black/5 overflow-hidden z-50"
                >
                  {[
                    { label: "Recherche", href: "/recherche" },
                    { label: "Messages", href: "/interaction/messages" },
                    { label: "Mes likes", href: "/interaction/mes-likes" },
                    { label: "Mes coups de cœur", href: "/interaction/mes_coups_de_coeur" },
                    { label: "Tableau de bord", href: "/dashboard" },
                  ].map((it) => (
                    <button
                      key={it.label}
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        router.push(it.href);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      {it.label}
                    </button>
                  ))}

                  <div className="h-px bg-gray-100" />
                  <button
                    role="menuitem"
                    onClick={async () => {
                      setMenuOpen(false);
                      await blockPeer();
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-red-50"
                  >
                    🛡️ Bloquer définitivement
                  </button>
                  <button
                    role="menuitem"
                    onClick={async () => {
                      setMenuOpen(false);
                      await openReport();
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-red-50"
                  >
                    🚩 Signaler
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {isBlockedEitherWay && (
          <div className="mx-auto mt-3 max-w-3xl rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            ⚠️ Blocage définitif actif — Vous ne pouvez plus échanger de messages ensemble,
            ni vous retrouver dans les recherches/suggestions.
          </div>
        )}

        <div className="flex-1 flex justify-center items-stretch overflow-hidden">
          <div className="w-full max-w-[480px] h-full sm:rounded-xl sm:shadow-md overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <MessagesChat userId={userId!} peerId={peerId!} allowSend={allowSend} />
            </div>
          </div>
        </div>

        {peerId && (
          <ReportAbuseButton
            reportedUserId={peerId}
            /* messagesSnapshot retiré : la prop n’existe pas dans <ReportAbuseButton /> */
            open={reportOpen}
            onOpenChange={setReportOpen}
          />
        )}
      </div>
    </ChatLayout>
  );
}
