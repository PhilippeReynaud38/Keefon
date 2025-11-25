// -*- coding: utf-8 -*-
/**
 * Vivaya — pages/chat/index.tsx
 * Objet / rôle :
 *   - Liste compacte des conversations (un item par interlocuteur).
 *   - Exclut les interlocuteurs bloqués (moi→lui OU lui→moi).
 *
 * Données lues :
 *   - messages (sender, receiver, content, created_at)
 *   - chat_peek (id, username, avatar_url, age, ville, code_postal, is_certified)
 *   - blocks (user_id, blocked_user_id)
 *
 * Contraintes Vivaya (rappel) :
 *   1) Code robuste, simple, lisible, sans logique fragile
 *   2) Zéro bug toléré ; erreurs identifiées et corrigées
 *   3) UTF-8 systématique ; commentaires utiles et sobres
 *   4) Pas d’usine à gaz ; composants font juste ce qu’ils doivent faire
 *
 * Corrections récentes :
 *   - ✅ Hooks sortis des callbacks/boucles (.map / .then)
 *   - ✅ Itération Set → Array.from pour éviter le besoin de --downlevelIteration
 *   - ✅ Typage explicite de peerId: string pour lever l’erreur TS
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { supabase } from "../../lib/supabaseClient";

type Peer = {
  id: string;
  username: string;
  avatar_url: string | null;
  age?: number;
  ville?: string;
  code_postal?: string;
  is_certified?: boolean;
  last_message: string;
  last_date: string;
  last_sender: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Convertit un chemin Storage -> URL publique, et vérifie qu'elle répond (HEAD 200).
 * Note : utilitaire pur ; ne touche pas au state/DOM.
 */
async function resolvePublicUrl(url?: string | null): Promise<string | null> {
  if (!url) return null;

  // Déjà une URL absolue ?
  if (/^https?:\/\//i.test(url)) {
    try {
      const ok = await fetch(url, { method: "HEAD" }).then(r => r.ok).catch(() => false);
      return ok ? url : null;
    } catch {
      return null;
    }
  }

  // Normalisation des chemins possibles dans le bucket "avatars"
  const raw = url.replace(/^\/+/, "");
  const candidates = new Set<string>([
    raw,
    raw.startsWith("avatars/") ? raw : `avatars/${raw}`,
    raw.startsWith("avatars/avatars/") ? raw : `avatars/avatars/${raw}`,
  ]);

  // ⚠️ Pas d’itération directe sur Set (évite downlevelIteration)
  const keys = Array.from(candidates);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const { data } = supabase.storage.from("avatars").getPublicUrl(key);
    const pub = data?.publicUrl;
    if (!pub) continue;

    try {
      const ok = await fetch(pub, { method: "HEAD" }).then(r => r.ok).catch(() => false);
      if (ok) return pub;
    } catch {
      // no-op
    }
  }
  return null;
}

/**
 * ConversationRow
 * - Composant enfant dédié à l’affichage d’une ligne de conversation.
 * - ⚠️ Hooks au niveau top du composant (jamais dans .map du parent).
 */
function ConversationRow({
  peer,
  userId,
  onOpen,
}: {
  peer: Peer;
  userId: string;
  onOpen: (id: string) => void;
}) {
  // État local strictement lié à cette ligne (avatar résolu)
  const [avatar, setAvatar] = useState<string>("/default-avatar.png");

  // Résout l'URL publique après montage / quand avatar_url change
  useEffect(() => {
    let cancel = false;
    resolvePublicUrl(peer.avatar_url).then(u => {
      if (!cancel && u) setAvatar(u);
    });
    return () => {
      cancel = true;
    };
  }, [peer.avatar_url]);

  return (
    <button
      onClick={() => onOpen(peer.id)}
      className="w-full flex items-center gap-3 bg-white rounded-xl shadow p-3 text-left hover:bg-surface-muted transition"
    >
      <Image
        src={avatar}
        alt={peer.username}
        width={40}
        height={40}
        className="w-10 h-10 rounded-full object-cover"
      />
      <div className="flex-1">
        <div className="font-medium flex items-center gap-2">
          {peer.username}
          {peer.is_certified && (
            <span className="text-xs text-green-600">✔ Certifié</span>
          )}
          {/* Pastille "nouveau" si le dernier message vient de l'autre */}
          {peer.last_sender !== userId && (
            <span className="w-2 h-2 bg-red-500 rounded-full inline-block animate-pulse" />
          )}
        </div>
        <div className="text-sm text-gray-500 truncate">{peer.last_message}</div>
      </div>
    </button>
  );
}

/**
 * Page : liste des conversations
 */
export default function ChatListPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const router = useRouter();

  // -- Auth (récupère l'utilisateur courant)
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return void router.replace("/login");
      setUserId(user.id);
    })();
  }, [router]);

  // -- Navigation vers un fil
  const openThread = useCallback(
    (otherId: string) => {
      router.push("/chat/" + otherId);
    },
    [router]
  );

  // -- Charger conversations + realtime (abonnement insert)
  useEffect(() => {
    if (!userId) return;

    const fetchConversations = async () => {
      // 1) Charge mes blocages et ceux subis
      const [a, b] = await Promise.all([
        supabase.from("blocks").select("blocked_user_id").eq("user_id", userId),
        supabase.from("blocks").select("user_id").eq("blocked_user_id", userId),
      ]);

      const iBlock = new Set<string>((a.data ?? []).map(r => String(r.blocked_user_id)));
      const theyBlockMe = new Set<string>((b.data ?? []).map(r => String(r.user_id)));

      // 2) Messages (derniers d’abord)
      const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender.eq.${userId},receiver.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erreur messages", error);
        return;
      }

      const list = messages ?? [];
      const map: Record<string, Peer> = {};

      for (const m of list) {
        // ✅ Typage explicite pour lever l’erreur TS
        const peerId: string = String(m.sender === userId ? m.receiver : m.sender);
        if (!UUID_RE.test(peerId) || peerId === userId) continue;

        // 3) Exclure bloqués dans un sens ou l’autre
        if (iBlock.has(peerId) || theyBlockMe.has(peerId)) continue;

        // On ne garde que le premier (donc le plus récent) rencontré
        if (map[peerId]) continue;

        const { data: profile, error: profileErr } = await supabase
          .from("chat_peek")
          .select("username, avatar_url, age, ville, code_postal, is_certified")
          .eq("id", peerId)
          .maybeSingle();

        if (profileErr) {
          console.error("Erreur chargement peer chat_peek", profileErr);
          continue;
        }

        if (profile) {
          map[peerId] = {
            id: peerId,
            username: profile.username ?? "—",
            avatar_url: profile.avatar_url ?? null,
            age: profile.age,
            ville: profile.ville,
            code_postal: profile.code_postal,
            is_certified: profile.is_certified,
            last_message: m.content,
            last_date: m.created_at,
            last_sender: m.sender,
          };
        }
      }

      setPeers(Object.values(map));
    };

    // premier chargement
    fetchConversations().catch(console.error);

    // abonnement realtime aux nouveaux messages
    const channel = supabase
      .channel("realtime:chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as any;
          if (m.sender === userId || m.receiver === userId) {
            fetchConversations().catch(() => {});
          }
        }
      )
      .subscribe();

    // nettoyage
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (!userId) {
    return <div className="p-4 text-center text-gray-500">Chargement…</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-chatBgFrom to-chatBgTo text-gray-900">
      <header className="sticky top-0 z-50 bg-yellow-300 text-gray-900 px-4 py-3 shadow">
        <div className="max-w-lg mx-auto flex justify-between items-center">
          <h1 className="text-lg font-bold">Mes conversations</h1>
          <button
            onClick={() => router.push("/")}
            className="text-sm px-3 py-1 rounded bg-surface-muted text-gray-800 shadow hover:bg-surface"
          >
            ↩ Accueil
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {peers.length === 0 && (
          <p className="text-sm text-gray-500">Aucune conversation pour le moment.</p>
        )}

        {/* ✅ Hooks déplacés dans ConversationRow (plus aucun hook dans .map) */}
        {peers.map((peer) => (
          <ConversationRow key={peer.id} peer={peer} userId={userId} onOpen={openThread} />
        ))}
      </div>
    </div>
  );
}
