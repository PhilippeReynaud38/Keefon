// -*- coding: utf-8 -*-
// components/LikeAndHeartButtons.tsx — Vivaya
// -----------------------------------------------------------------------------
// Rôle : actions rapides d’un profil (❤️ coup-de-cœur, 📣🧡 écho-cœur, 👍 like, 💬 chat).
// Utilisé notamment par /pages/profileplus/[id].tsx
// -----------------------------------------------------------------------------
// Back attendu :
// - RPC send_heart_v6(p_to uuid)                -> envoie un ❤️ (décrémente stock cœur)
// - RPC offer_echo_heart_v1(p_to uuid)          -> propose un Écho 🧡 (décrémente stock échos)
// - (optionnel) RPC has_sent_heart_to(p_other)  -> bool (sinon fallback RLS)
// - Tables caches :
//     * user_heart_stock_cache(periodic_left, packs_left, total_left [GENERATED])
//     * user_echo_stock_cache(remaining)
// -----------------------------------------------------------------------------
// ⚠️ Patches (2025-10-30) — Stabilité / zéro régression
//   • Retire l’appel RPC « get_echo_stock » (404) → on lit UNIQUEMENT user_echo_stock_cache.
//   • Pré‑check sur LIKE : on vérifie l’existence avant INSERT pour éviter un 409 réseau
//     (contrainte d’unicité likes_from_to_unique). En cas de course, on gère encore le 409.
//   • Aucun autre changement fonctionnel.
// -----------------------------------------------------------------------------

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";

/* --------------------------------- Utils ---------------------------------- */

function mapHeartErrorToUserMessage(raw: unknown): string {
  const s = String(raw || "").toLowerCase();
  if (s.includes("no_heart_stock") || s.includes("no hearts left"))
    return "Tu n’as plus de Keef ❤️ disponibles.";
  if (s.includes("already") || s.includes("duplicate") || s.includes("unique"))
    return "Tu as déjà envoyé un Keef ❤️ à ce profil.";
  if (s.includes("forbidden") || s.includes("blocked") || s.includes("rls"))
    return "Action refusée.";
  return "Une erreur est survenue. Réessaie dans un instant.";
}

function mapEchoErrorToUserMessage(raw: unknown): string {
  const s = String(raw || "").toLowerCase();
  if (s.includes("no_echo_stock") || s.includes("no echo") || s.includes("stock"))
    return "Tu n’as plus d’Échos 🧡 disponibles.";
  if (s.includes("heart_required") || s.includes("need heart") || s.includes("first send a heart"))
    return "Envoie d’abord un Keef ❤️ à cette personne.";
  if (s.includes("duplicate") || s.includes("already") || s.includes("redundant"))
    return "Un Écho 🧡 est déjà en attente pour ce profil.";
  if (s.includes("forbidden") || s.includes("blocked") || s.includes("rls"))
    return "Action refusée.";
  return "Impossible d’envoyer l’Écho 🧡 pour le moment.";
}

/** Stock via RPC si dispo ; sinon fallback lecture table cache adaptée */
async function fetchStockSafe(
  kind: "heart" | "echo",
): Promise<number> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const me = auth?.user?.id;
    if (!me) return 0;

    // 1) RPC — uniquement pour les ❤️ (pour les Échos on SKIP l'appel RPC 404)
    if (kind === "heart") {
      try {
        const { data, error } = await supabase
          .rpc("get_heart_stock" as any, { p_user_id: me })
          .single();
        if (!error && data) {
          const x = data as any;
          if (typeof x.remaining === "number") return x.remaining;
          if (typeof x.total_left === "number") return x.total_left;
        }
      } catch {
        // RPC absente -> fallback cache (voir ci-dessous)
      }
    }

    // 2) Fallback : lecture table cache selon kind
    if (kind === "heart") {
      const { data, error } = await supabase
        .from("user_heart_stock_cache")
        .select("total_left, periodic_left, packs_left")
        .eq("user_id", me)
        .maybeSingle();
      if (!error && data) {
        const d: any = data;
        if (typeof d.total_left === "number") return d.total_left;
        const p = typeof d.periodic_left === "number" ? d.periodic_left : 0;
        const k = typeof d.packs_left === "number" ? d.packs_left : 0;
        return p + k;
      }
      return 0;
    } else {
      const { data, error } = await supabase
        .from("user_echo_stock_cache")
        .select("remaining")
        .eq("user_id", me)
        .maybeSingle();
      if (!error && data && typeof (data as any).remaining === "number") {
        return (data as any).remaining;
      }
      return 0;
    }
  } catch {
    return 0;
  }
}

/** A a-t-il déjà envoyé un ❤️ à B ? (RPC si dispo, sinon fallback RLS) */
async function alreadyHearted(targetUserId: string): Promise<boolean> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const me = auth?.user?.id;
    if (!me) return false;

    try {
      const r = await supabase.rpc("has_sent_heart_to", { p_other: targetUserId }).single();
      if (!r.error) return !!r.data;
    } catch { /* ignore */ }

    const q = await supabase
      .from("hearts")
      .select("id")
      .eq("from_user", me)
      .eq("to_user", targetUserId)
      .is("expired", false)
      .maybeSingle();
    return !!q.data;
  } catch {
    return false;
  }
}

/** A a-t-il déjà une offre d’Écho 🧡 'offered' vers B ? (fallback RLS) */
async function alreadyEchoOffered(targetUserId: string): Promise<boolean> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const me = auth?.user?.id;
    if (!me) return false;
    const q = await supabase
      .from("echo_offers")
      .select("id")
      .eq("from_user", me)
      .eq("to_user", targetUserId)
      .eq("status", "offered")
      .maybeSingle();
    return !!q.data;
  } catch {
    return false;
  }
}

/* -------------------------------- ❤️ Heart -------------------------------- */

export function HeartButton({ targetUserId, mobileCentered }: { targetUserId: string; mobileCentered?: boolean }) {
  const [isOpen, setOpen] = useState(false);
  const [stock, setStock] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [hasAlready, setHasAlready] = useState<boolean | null>(null);

  const isOut = useMemo(() => stock !== null && stock <= 0, [stock]);

  const openModal = useCallback(async () => {
    setMsg(null);
    setOpen(true);
    const [s, a] = await Promise.all([fetchStockSafe("heart"), alreadyHearted(targetUserId)]);
    setStock(s);
    setHasAlready(a);
  }, [targetUserId]);

  const closeModal = useCallback(() => { setOpen(false); setMsg(null); }, []);

  const onConfirmSend = useCallback(async () => {
    if (sending) return;
    setSending(true);
    setMsg(null);

    if (hasAlready) {
      setMsg("Tu as déjà envoyé un Keef ❤️ à ce profil.");
      setSending(false);
      return;
    }
    if ((stock ?? 0) <= 0) {
      setMsg("Tu n’as plus de Keefs ❤️ disponibles.");
      setSending(false);
      return;
    }

    const { data, error } = await supabase.rpc("send_heart_v6", { p_to: targetUserId });
    setSending(false);

    if (error) {
      setMsg(mapHeartErrorToUserMessage(error.message));
      // on rafraîchit le stock si le back a refusé pour stock
      if (String(error.message || "").toLowerCase().includes("stock")) {
        setStock(await fetchStockSafe("heart"));
      }
      return;
    }

    // back peut renvoyer {reason:'already_sent'} ou similaire
    if ((data as any)?.reason === "already_sent" || (data as any)?.already_sent) {
      setMsg("Tu as déjà envoyé un Keef ❤️ à ce profil.");
      setHasAlready(true);
      return;
    }

    // succès -> MAJ stock + verrou
    setStock(await fetchStockSafe("heart"));
    setHasAlready(true);
    closeModal();
  }, [sending, stock, targetUserId, closeModal, hasAlready]);

  return (
    <div className={mobileCentered ? "w-full flex justify-center" : ""}>
      <button
        className="text-xl disabled:opacity-50"
        title=" Keef ❤️ "
        aria-label="Keef ❤️"
        onClick={openModal}
        disabled={sending}
      >
        ❤️
      </button>

      {isOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-2xl bg-white p-5 shadow-xl w-[min(92vw,460px)]">
            <h3 className="text-lg font-semibold mb-3">Envoyer un keef ?</h3>
            {msg && <p className="text-red-700 mb-2">{msg}</p>}
            <p className="text-sm text-gray-600 mb-4">Stock restant : {stock ?? "…"}</p>
            <div className="flex gap-3 justify-end">
              <button className="px-3 py-2" onClick={closeModal}>Annuler</button>
              <button
                className="rounded-md px-3 py-2 bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-50"
                onClick={onConfirmSend}
                disabled={sending || isOut || !!hasAlready}
                title={hasAlready ? "Déjà envoyé" : undefined}
              >
                Envoyer ❤️
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ 📣🧡 Écho 🧡 ----------------------------- */

export function EchoHeartButton({ targetUserId, mobileCentered }: { targetUserId: string; mobileCentered?: boolean }) {
  const [isOpen, setOpen] = useState(false);
  const [stock, setStock] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [hasHeart, setHasHeart] = useState<boolean | null>(null);
  const [hasEcho, setHasEcho] = useState<boolean | null>(null);

  const isOut = useMemo(() => stock !== null && stock <= 0, [stock]);

  const openModal = useCallback(async () => {
    setMsg(null);
    setOpen(true);
    const [s, h, e] = await Promise.all([
      fetchStockSafe("echo"),
      alreadyHearted(targetUserId),
      alreadyEchoOffered(targetUserId),
    ]);
    setStock(s);
    setHasHeart(h);
    setHasEcho(e);
  }, [targetUserId]);

  const closeModal = useCallback(() => { setOpen(false); setMsg(null); }, []);

  const onConfirmSend = useCallback(async () => {
    if (sending) return;
    setSending(true);
    setMsg(null);

    if (!hasHeart) {
      setMsg("Envoie d’abord un Keef ❤️ à cette personne, puis tu pourras envoyer un Écho 🧡.");
      setSending(false);
      return;
    }
    if (hasEcho) {
      setMsg("Tu as déjà proposé un Écho 🧡 à ce profil.");
      setSending(false);
      return;
    }
    if ((stock ?? 0) <= 0) {
      setMsg("Tu n’as plus d’Échos 🧡 disponibles.");
      setSending(false);
      return;
    }

    const { data, error } = await supabase.rpc("offer_echo_heart_v1", { p_to: targetUserId });
    setSending(false);

    if (error) {
      setMsg(mapEchoErrorToUserMessage(error.message));
      if (String(error.message || "").toLowerCase().includes("stock")) {
        setStock(await fetchStockSafe("echo"));
      }
      return;
    }

    if ((data as any)?.status === "offered" || (data as any)?.ok || (data as any)?.already_offered) {
      setMsg("Écho 🧡 envoyé !");
      setHasEcho(true);
      setStock(await fetchStockSafe("echo"));
      setTimeout(() => closeModal(), 900);
      return;
    }

    closeModal();
  }, [sending, stock, targetUserId, closeModal, hasHeart, hasEcho]);

  return (
    <div className={mobileCentered ? "w-full flex justify-center" : ""}>
      <button className="text-xl" title="Propose un Écho 🧡" aria-label="Propose un Écho 🧡" onClick={openModal} disabled={sending}>
        📣🧡
      </button>

      {isOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-2xl bg-white p-5 shadow-xl w-[min(92vw,460px)]">
            <h3 className="text-lg font-semibold mb-3">Propose un Écho 🧡 pour ton keef </h3>
            {msg && <p className="text-red-700 mb-2">{msg}</p>}
            <p className="text-sm text-gray-600 mb-4">Stock restant : {stock ?? "…"}</p>
            <div className="flex gap-3 justify-end">
              <button className="px-3 py-2" onClick={closeModal}>Annuler</button>
              <button
                className="rounded-md px-3 py-2 bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
                onClick={onConfirmSend}
                disabled={sending || isOut || !!hasEcho || !hasHeart}
                title={hasEcho ? "Déjà proposé" : undefined}
              >
                Envoyer ❤️
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- 👍 + 💬 (Desktop) -------------------------- */
/** Export conservé pour compat compat (historique pages). */
export function LikeAndMessageButtons({
  targetUserId,
  liked,
  onLike,
  mobileCentered,
}: {
  targetUserId: string;
  liked?: boolean;
  onLike?: () => void;
  mobileCentered?: boolean;
}) {
  const router = useRouter();
  const goMessage = useCallback(() => { void router.push(`/messages/${targetUserId}`); }, [router, targetUserId]);
  const [liking, setLiking] = useState(false);

  return (
    <div className={mobileCentered ? "w-full flex justify-center gap-4" : "flex gap-4"}>
      <button className="text-xl disabled:opacity-50" title="Like" aria-label="Like" onClick={onLike} disabled={liking || liked}>👍</button>
      <button className="text-xl" title="Message" aria-label="Message" onClick={goMessage}>💬</button>
    </div>
  );
}

/* --------------------------- 👍 + 💬 (Desktop v2) ------------------------- */
/** Nom attendu par /pages/profileplus/[id].tsx — on le fournit ET on garde l’ancien. */
export function LikeChatReport({
  targetUserId,
  setMsg,
  setTone,
}: {
  targetUserId: string;
  setMsg?: (m: string | null) => void;
  setTone?: (t: "success" | "error") => void;
}) {
  const router = useRouter();
  const [liking, setLiking] = useState(false);

  const pushMsg = useCallback(
    (m: string | null, tone: "success" | "error" = "success") => {
      setMsg?.(m);
      setTone?.(tone);
      if (m) setTimeout(() => setMsg?.(null), 1500);
    },
    [setMsg, setTone]
  );

  const handleLike = useCallback(async () => {
    if (liking) return;
    setLiking(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const me = auth?.user?.id;
      if (!me) { pushMsg("Connecte-toi pour liker.", "error"); return; }

      // ✅ Pré-check pour éviter un 409 (contrainte d'unicité likes_from_to_unique)
      const already = await supabase
        .from("likes")
        .select("id")
        .eq("from_user", me)
        .eq("to_user", targetUserId)
        .maybeSingle();
      if (already.data) {
        pushMsg("Tu as déjà liké ce profil.", "success");
        return; // on évite la requête INSERT qui ferait un 409 côté réseau
      }

      const { error } = await supabase
        .from("likes")
        .insert([{ from_user: me, to_user: targetUserId }]);

      if (error) {
        const m = String(error.message || "").toLowerCase();
        if (m.includes("unique") || m.includes("duplicate") || m.includes("already")) {
          // Cas de course éventuel: quelqu'un (ou un double clic) a déjà inséré entre temps
          pushMsg("Tu as déjà liké ce profil.", "success");
        } else {
          pushMsg("Impossible d’envoyer le like pour le moment.", "error");
        }
      } else {
        pushMsg("Like envoyé !", "success");
      }
    } finally {
      setLiking(false);
    }
  }, [liking, targetUserId, pushMsg]);

  const handleChat = useCallback(() => { void router.push(`/chat/${targetUserId}`); }, [router, targetUserId]);

  return (
    <div className="flex items-center gap-5">
      <button className="text-xl disabled:opacity-50" title="Like" aria-label="Like" onClick={handleLike} disabled={liking}>👍</button>
      <button className="text-xl" title="Message" aria-label="Message" onClick={handleChat}>💬</button>
    </div>
  );
}
