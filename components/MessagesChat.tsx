/*  ============================================================================
    Fichier        : components/MessagesChat.tsx
    Projet         : Vivaya
    Objet          : Fil de discussion + composer, bouton “Inspiration” (questions)
    Encodage       : UTF-8

    NOTE IMPORTANTE — ENVOI :
    - On envoie { sender: userId, receiver: peerId, content } pour satisfaire la RLS.
    - Si la RLS refuse (42501), on loggue clairement côté console.

    Changelog — 2025-10-14 (hotfix DEV)
    - Ajout d’un FLAG DEV local pour forcer l’activation du bouton Inspiration
      sans RPC ni back (aucune dépendance à is_subscriber / v_is_questions_enabled_*).
      → Pour revenir au comportement normal, mettre FORCE_ENABLE_QUESTIONS = false.

    Changelog — 2025-11-21
    - Ajout d’un useEffect qui marque comme “vus” (seen = true) tous les messages
      reçus (receiver = userId) provenant de ce contact (sender = peerId) dès
      que le composant de chat est monté. Cela permet de faire tomber la pastille
      verte sur la page “Mes messages”, quel que soit le chemin d’accès au chat
      (carte ou profil public).
    ============================================================================ */

import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/* =============== FLAG DEV — activer/désactiver le bouton côté front ============== */
/**
 * IMPORTANT :
 * - true  : bouton Inspiration toujours actif (pas de vérif d’abonnement)
 * - false : comportement normal (utilise la vérif éligibilité)
 */
const FORCE_ENABLE_QUESTIONS = false as const;
/* ================================================================================ */

/* ——— Types ——— */
export type Message = {
  id: number;
  sender: string;
  receiver: string;
  content: string;
  created_at: string;
};

export interface MessagesChatProps {
  userId: string;
  peerId: string;
  allowRead?: boolean; // si false : ne fetch pas les messages
  allowSend?: boolean; // si false : désactive l’envoi
}

/* ——— Emoji data ——— */
const CATS = {
  faces: ["😀","😁","😂","🤣","😅","😊","😎","😍","😘","😜","🤔","😢","😭","😡","🥳"],
  gestures: ["👍","👎","👌","👏","🙌","🙏","💪","🤘","✌️","👋"],
  love: ["❤️","🧡","💛","💚","💙","💜","💖","💕","💔"],
  fun: ["🎉","🔥","✨","⚡","💯","🍕","🍺","🤖","💀","👻","🎸","🎮","🚀","🛸","🎧"],
  misc: ["⭐","🏆","⚽","🎲","🎵","📚","🗺️","🏖️","🌈","🍀"],
} as const;
const CAT_ICON: Record<keyof typeof CATS, string> = {
  faces: "😊",
  gestures: "👍",
  love: "❤️",
  fun: "🎉",
  misc: "✨",
};

/* ——— Catégories & fallback de “Questions” ——— */
const Q_CATEGORIES: { key: string; label: string }[] = [
  { key: "brise-glace", label: "Brise-glace" },
  { key: "detente",     label: "Détente" },
  { key: "hobbies",     label: "Hobbies" },
  { key: "voyage",      label: "Voyage" },
  { key: "humour",      label: "Humour" },
  { key: "profond",     label: "Profond" },
];

const Q_FALLBACK_BY_CAT: Record<string, string[]> = {
  "brise-glace": [
    "Quel petit plaisir te met de bonne humeur ?",
    "Quel est ton emoji le plus utilisé ?",
    "Plutôt matin ou soir pour papoter ?",
    "Thé, café… ou autre rituel du matin ?",
    "Quel est ton super-pouvoir discret ?",
    "Si on se parlait 10 min, tu voudrais parler de quoi ?",
  ],
  "detente": [
    "C’est quoi ta manière préférée de décompresser ?",
    "Un truc simple qui te fait du bien au quotidien ?",
    "Le plat réconfort ultime pour toi ?",
    "Une chanson qui te calme instantanément ?",
    "Tu as un endroit “doudou” pour te poser ?",
  ],
  "hobbies": [
    "Tu bricoles quoi en ce moment pour le plaisir ?",
    "Un sujet dont tu pourrais parler des heures ?",
    "Film/série/jeu que tu recommandes sans hésiter ?",
    "Tu apprends quelque chose de nouveau ces temps-ci ?",
    "Quel hobby te donne le plus d’énergie ?",
  ],
  "voyage": [
    "Mer, montagne ou ville : ton terrain de jeu ?",
    "Un petit coin près de chez toi à faire découvrir ?",
    "Ton dernier endroit coup de cœur et pourquoi ?",
    "Road-trip ou farniente ?",
    "Si on partait demain, on irait où ?",
  ],
  "humour": [
    "Le dernier truc qui t’a fait vraiment rire ?",
    "Plutôt mèmes, stand-up ou blagues nulles ?",
    "Quelle situation te fait rire à tous les coups ?",
    "Ton gif préféré pour tout dire sans parler ?",
    "As-tu une vanne “signature” ?",
  ],
  "profond": [
    "Qu’est-ce qui compte le plus pour toi en ce moment ?",
    "De quoi es-tu le plus fier·e dernièrement ?",
    "Un petit défi perso que tu t’es lancé ?",
    "Qu’aimerais-tu faire plus souvent pour toi ?",
    "Quel conseil t’a marqué et que tu suis encore ?",
  ],
};

/* ——— Helpers ——— */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return isMobile;
}
const pickRandom = (arr: string[], n: number) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.max(1, n));
};

/*  ============================================================================
    Composant principal
    ============================================================================ */
export default function MessagesChat({
  userId,
  peerId,
  allowRead = true,
  allowSend = true,
}: MessagesChatProps) {
  /* ——— États principaux ——— */
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [cat, setCat] = useState<keyof typeof CATS>("faces");
  const [soundEnabled, setSoundEnabled] = useState(true);

  /* ——— Questions ——— */
  const [eligible, setEligible] = useState<boolean | null>(null); // null = vérification en cours
  const [qOpen, setQOpen] = useState(false);
  const [qLoading, setQLoading] = useState(false);
  const [qItems, setQItems] = useState<string[]>([]);
  const [qCategory, setQCategory] = useState<string | null>(Q_CATEGORIES[0].key);
  const [qBlockedHint, setQBlockedHint] = useState(false); // hint “réservé aux abonnés”
  const SUGGESTION_COUNT = 5;

  const isMobile = useIsMobile();

  /* ——— Refs & mesures ——— */
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);
  const [composerHeight, setComposerHeight] = useState<number>(64);
  const mobileTaRef = useRef<HTMLTextAreaElement | null>(null);
  const desktopTaRef = useRef<HTMLTextAreaElement | null>(null);

  /* 🔔 Son — activation + persistance */
  useEffect(() => {
    audioRef.current = new Audio("/ding.mp3");
    audioRef.current.volume = 0.4;
    const stored = localStorage.getItem("chatSoundEnabled");
    if (stored !== null) setSoundEnabled(stored === "true");
  }, []);
  useEffect(() => {
    const unlock = () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.play().then(() => { audio.pause(); audio.currentTime = 0; }).catch(() => {});
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);
  useEffect(() => {
    localStorage.setItem("chatSoundEnabled", String(soundEnabled));
  }, [soundEnabled]);

  /* 🔄 Chargement + temps réel des messages */
  useEffect(() => {
    if (!allowRead) { setMessages([]); return; }
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender.eq.${userId},receiver.eq.${peerId}),and(sender.eq.${peerId},receiver.eq.${userId})`)
        .order("created_at");
      if (error) { console.error("messages load error", error); return; }
      setMessages((data ?? []) as Message[]);
      scrollToBottom();
    };
    fetchMessages().catch(console.error);

    const channel = supabase
      .channel("messages:realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as Message;
        const inThread =
          (m.sender === userId && m.receiver === peerId) ||
          (m.sender === peerId && m.receiver === userId);
        if (inThread) {
          setMessages((prev) => [...prev, m]);
          if (m.sender === peerId && soundEnabled) {
            const audio = audioRef.current;
            if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
          }
          setTimeout(scrollToBottom, 50);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, peerId, soundEnabled, allowRead]);

  /* ✅ Marquer comme lus les messages reçus de ce contact
     ----------------------------------------------------
     - Ce useEffect tourne dès que le chat est monté (ou que userId/peerId changent).
     - Il met seen = true pour tous les messages :
          sender   = peerId   (l’autre)
          receiver = userId   (moi, l’utilisateur connecté)
          seen     = false    (non lus)
     - De cette façon, peu importe d’où on arrive dans le chat
       (carte “Mes messages” ou profil public), la table messages
       est cohérente et la pastille verte peut disparaître.
  */
  useEffect(() => {
    if (!allowRead) return;
    if (!userId || !peerId) return;

    const markAsSeen = async () => {
      const { error } = await supabase
        .from("messages")
        .update({ seen: true })
        .eq("receiver", userId)
        .eq("sender", peerId)
        .eq("seen", false);

      if (error) {
        console.error("mark-as-seen error", error);
        return; // on sort si l’UPDATE est refusé (RLS, etc.)
      }

      // Ici, l’UPDATE a réussi : les messages reçus de ce contact sont bien passés
      // en seen = true en base. La page /interaction/messages, quand elle se
      // remontera, relira les données propres.
      //
      // On n’a PAS besoin de modifier d’autres fichiers pour que la pastille
      // disparaisse : la logique d’affichage se base déjà sur le champ `seen`.
    };

    void markAsSeen();
  }, [allowRead, userId, peerId]);

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  /* 💬 Envoi */
  const sendMessage = async () => {
    if (!allowSend) return;
    const content = newMsg.trim();
    if (!content) return;
    setNewMsg("");
    setPickerOpen(false);

    const { error } = await supabase
      .from("messages")
      .insert({ sender: userId, receiver: peerId, content });

    if (error) {
      // 42501 = RLS violation → on log visualisable vite fait en DEV
      console.error("send message error", {
        code: (error as any).code,
        message: (error as any).message,
        hint: (error as any).hint,
      });
    }
    setTimeout(scrollToBottom, 50);
  };

  /* 📱 Auto-height textarea (mobile 2→5) */
  useEffect(() => {
    if (!isMobile) return;
    const ta = mobileTaRef.current;
    if (!ta) return;
    const MIN = 2, MAX = 5, LH_FALLBACK = 18;
    const getLH = () => {
      const cs = window.getComputedStyle(ta);
      return cs.lineHeight.endsWith("px") ? parseFloat(cs.lineHeight) : LH_FALLBACK;
    };
    const adjust = () => {
      const lh = getLH();
      ta.style.overflowY = "auto";
      ta.style.resize = "none";
      ta.style.height = "auto";
      ta.style.height = `${Math.min(Math.max(ta.scrollHeight, lh * MIN), lh * MAX)}px`;
    };
    adjust();
    ta.addEventListener("input", adjust);
    const onResize = () => adjust();
    window.addEventListener("resize", onResize);
    return () => {
      ta.removeEventListener("input", adjust);
      window.removeEventListener("resize", onResize);
    };
  }, [isMobile]);

  /* 🖥️ Auto-height textarea (desktop 3→5) */
  useEffect(() => {
    if (isMobile) return;
    const ta = desktopTaRef.current;
    if (!ta) return;
    const MIN = 3, MAX = 5, LH_FALLBACK = 22;
    const getLH = () => {
      const cs = window.getComputedStyle(ta);
      return cs.lineHeight.endsWith("px") ? parseFloat(cs.lineHeight) : LH_FALLBACK;
    };
    const adjust = () => {
      const lh = getLH();
      ta.style.overflowY = "auto";
      ta.style.resize = "none";
      ta.style.height = "auto";
      ta.style.height = `${Math.min(Math.max(ta.scrollHeight, lh * MIN), lh * MAX)}px`;
    };
    adjust();
    ta.addEventListener("input", adjust);
    const onResize = () => adjust();
    window.addEventListener("resize", onResize);
    return () => {
      ta.removeEventListener("input", adjust);
      window.removeEventListener("resize", onResize);
    };
  }, [isMobile]);

  /* 📏 Mesure dynamique du composer */
  useEffect(() => {
    if (!composerRef.current || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect?.height ?? 64;
      setComposerHeight(Math.max(48, Math.round(h)));
    });
    ro.observe(composerRef.current);
    setComposerHeight(composerRef.current.offsetHeight || 64);
    return () => ro.disconnect();
  }, []);

  /* ✅ Éligibilité — MODE DEV : on force à true et on ne tape aucune RPC */
  useEffect(() => {
    if (FORCE_ENABLE_QUESTIONS) {
      setEligible(true);
      return;
    }
    // --- Comportement normal (laisse ici si tu remets le flag à false) ---
    let cancel = false;
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth?.user?.id) { if (!cancel) setEligible(false); return; }
        const { data, error } = await supabase.rpc("is_subscriber");
        if (!cancel) setEligible(!error && typeof data === "boolean" ? data : false);
      } catch {
        if (!cancel) setEligible(false);
      }
    })();
    return () => { /* cleanup */ };
  }, []);

  /* 🔮 Charger des suggestions (fallback local si pas de RPC côté back) */
  const loadSuggestions = async (category: string | null) => {
    setQLoading(true);
    try {
      const args: any = { in_category: category, limit_count: SUGGESTION_COUNT };
      const { data, error } = await supabase.rpc("get_premium_question_suggestions", args);
      if (!error && Array.isArray(data) && data.every((x) => typeof x === "string")) {
        setQItems((data as string[]));
      } else {
        if (category && Q_FALLBACK_BY_CAT[category]) {
          setQItems(pickRandom(Q_FALLBACK_BY_CAT[category], SUGGESTION_COUNT));
        } else {
          const pool = Object.values(Q_FALLBACK_BY_CAT).flat();
          setQItems(pickRandom(pool, SUGGESTION_COUNT));
        }
      }
    } catch {
      if (category && Q_FALLBACK_BY_CAT[category]) {
        setQItems(pickRandom(Q_FALLBACK_BY_CAT[category], SUGGESTION_COUNT));
      } else {
        const pool = Object.values(Q_FALLBACK_BY_CAT).flat();
        setQItems(pickRandom(pool, SUGGESTION_COUNT));
      }
    } finally {
      setQLoading(false);
    }
  };

  /* Rescroll quand la hauteur du composer change */
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [composerHeight]);

  /* ——— Rendu ——— */
  if (!allowRead) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-sm text-gray-600">
        Messagerie réservée aux matchs réciproques (ou abonnés).
      </div>
    );
  }
  const effectiveEligible = FORCE_ENABLE_QUESTIONS ? true : (eligible === true);

  return (
    <div className="flex flex-col h-full relative">
      {/* Fil de messages */}
      <div
        ref={scrollRef}
        onScroll={() => { if (qOpen) setQOpen(false); }}
        style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: composerHeight + 16 }}
        className="flex-1 overflow-y-auto flex flex-col gap-3 thin-scrollbar"
      >
        {messages.map((m) => {
          const mine = m.sender === userId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`relative px-4 py-3 rounded-2xl break-words shadow-sm text-[16px] leading-relaxed
                max-w-[85%] md:max-w-[70%] lg:max-w-[60%]
                ${mine ? "bg-bubbleRight text-gray-800" : "bg-bubbleLeft text-gray-800"}`}
              >
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 😊 bouton flottant (gauche) */}
      <button
        aria-label="Émojis"
        title="Émojis"
        style={{ position: "fixed", left: 8, bottom: composerHeight + 8, zIndex: 60 }}
        className="text-2xl leading-none w-7 h-7 flex items-center justify-center"
        onClick={() => setPickerOpen((o) => !o)}
        type="button"
      >
        😊
      </button>

      {/* 🔔 bouton flottant (droite) */}
      <button
        aria-label={soundEnabled ? "Son activé" : "Son désactivé"}
        title={soundEnabled ? "Son activé" : "Son désactivé"}
        style={{ position: "fixed", right: 8, bottom: composerHeight + 8, zIndex: 60 }}
        className="text-2xl leading-none w-7 h-7 flex items-center justify-center"
        onClick={() => setSoundEnabled((v) => !v)}
        type="button"
      >
        {soundEnabled ? "🔔" : "🔕"}
      </button>

      {/* Picker émojis */}
      {pickerOpen && (
        <div
          style={{ position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: composerHeight + 56, zIndex: 1000 }}
          className="w-[95%] max-w-sm bg-surface border rounded shadow-lg p-3"
        >
          <div className="flex justify-center gap-2 mb-2">
            {(Object.keys(CATS) as (keyof typeof CATS)[]).map((k) => (
              <button
                key={k}
                aria-label={k}
                className={`px-2 py-1 rounded text-lg ${cat === k ? "bg-primary/20" : "hover:bg-surface-muted"}`}
                onClick={() => setCat(k)}
                title={k}
                type="button"
              >
                {CAT_ICON[k]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-1 text-xl">
            {CATS[cat].map((e) => (
              <button key={e} onClick={() => { setNewMsg((t) => t + e); setPickerOpen(false); }} type="button">{e}</button>
            ))}
          </div>
        </div>
      )}

      {/* ——— Composer (bandeau) ——— */}
      <div className="fixed bottom-0 inset-x-0 bg-yellowGreen border-t z-50" ref={composerRef}>
        <div className="relative p-2 md:p-3 min-h-[56px] vivaya-chat-composer">
          {/* Rangée d’actions (gauche) : BOUTON INSPIRATION */}
          <div className="relative mb-2">
            <div className="relative inline-block min-h-[28px]">
              <button
                type="button"
                onClick={async () => {
                  // MODE DEV : on ouvre toujours le popover (pas de vérif)
                  if (FORCE_ENABLE_QUESTIONS) {
                    if (!qOpen) await loadSuggestions(qCategory);
                    setQOpen((v) => !v);
                    return;
                  }
                  // Comportement normal (si flag à false)
                  if (!effectiveEligible || qLoading) {
                    setQBlockedHint(true);
                    window.setTimeout(() => setQBlockedHint(false), 1800);
                    return;
                  }
                  if (!qOpen) await loadSuggestions(qCategory);
                  setQOpen((v) => !v);
                }}
                aria-disabled={!effectiveEligible && !FORCE_ENABLE_QUESTIONS}
                className={`relative z-[80] h-7 px-2 rounded-full text-[11px] font-semibold shadow border
                           ${(effectiveEligible || FORCE_ENABLE_QUESTIONS) && !qLoading
                              ? "bg-yellowGreen text-black hover:opacity-90 border-black/10 cursor-pointer"
                              : "bg-yellowGreen/70 text-black/70 border-black/10 cursor-not-allowed"}`}
                title={
                  FORCE_ENABLE_QUESTIONS
                    ? "Inspiration (mode DEV — toujours actif)"
                    : (effectiveEligible ? "Questions (réservé aux abonnés)" : "Réservé aux abonnés")
                }
              >
                <span aria-hidden className="mr-1">💬</span> Inspiration
                {FORCE_ENABLE_QUESTIONS && (
                  <span className="ml-2 text-[10px] px-1 py-[1px] rounded bg-black/80 text-white align-middle">
                    DEV
                  </span>
                )}
              </button>

              {/* Hint non-abonné (non affiché en mode DEV) */}
              {!FORCE_ENABLE_QUESTIONS && qBlockedHint && !effectiveEligible && (
                <div
                  className="absolute left-0 bottom-full mb-2 w-[260px] rounded-xl border bg-white shadow p-2 text-xs"
                  role="status" aria-live="polite"
                >
                  Fonction réservée aux abonnés. Va dans “Abonnement” pour l’activer.
                </div>
              )}

              {/* Popup catégories + liste */}
              {(FORCE_ENABLE_QUESTIONS || effectiveEligible) && qOpen && (
                <div
                  className="absolute left-0 bottom-full mb-2 w-[320px] max-h-96 overflow-auto rounded-xl border bg-white shadow"
                  role="dialog"
                  aria-label="Idées de questions"
                >
                  {/* Catégories */}
                  <div className="flex flex-wrap gap-1 p-2 border-b">
                    {Q_CATEGORIES.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        className={`px-2 py-1 rounded-full text-[11px] border ${
                          qCategory === c.key ? "bg-yellowGreen font-semibold" : "bg-white hover:bg-neutral-50"
                        }`}
                        onClick={async () => {
                          setQCategory(c.key);
                          await loadSuggestions(c.key);
                        }}
                      >
                        {c.label}
                      </button>
                    ))}
                    {/* Toutes */}
                    <button
                      type="button"
                      className={`px-2 py-1 rounded-full text-[11px] border ${
                        qCategory === null ? "bg-yellowGreen font-semibold" : "bg-white hover:bg-neutral-50"
                      }`}
                      onClick={async () => {
                        setQCategory(null);
                        await loadSuggestions(null);
                      }}
                    >
                      Toutes
                    </button>
                    {/* Autres (rafraîchir) */}
                    <button
                      type="button"
                      className="ml-auto px-2 py-1 rounded-full text-[11px] border bg-white hover:bg-neutral-50"
                      onClick={async () => { await loadSuggestions(qCategory); }}
                      title="Obtenir d’autres idées"
                    >
                      Autres ↻
                    </button>
                  </div>

                  {/* Liste des idées */}
                  <ul className="p-1">
                    {qItems.map((q, i) => (
                      <li key={`${q}-${i}`}>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50"
                          onClick={() => {
                            setNewMsg((t) => (t ? `${t}\n${q}` : q));
                            setQOpen(false);
                          }}
                        >
                          {q}
                        </button>
                      </li>
                    ))}
                    {qItems.length === 0 && (
                      <li className="px-3 py-2 text-sm text-neutral-500">Aucune idée pour cette catégorie.</li>
                    )}
                  </ul>

                  <div className="border-t p-2 text-right">
                    <button
                      type="button"
                      onClick={() => setQOpen(false)}
                      className="text-xs px-3 py-1 rounded bg-neutral-200 hover:bg-neutral-300"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bouton d’envoi (droite) */}
          <button
            onClick={sendMessage}
            aria-label="Envoyer"
            title={allowSend ? "Envoyer" : "Envoi réservé aux matchs (ou abonnés)"}
            disabled={!allowSend}
            className={`
              absolute right-2 md:right-3
              bottom-4 md:bottom-3
              w-10 h-10 rounded-full text-white flex items-center justify-center shadow active:scale-[0.98]
              ${allowSend ? "bg-orangeVivaya" : "bg-gray-300 cursor-not-allowed"}
            `}
            type="button"
          >
            ➤
          </button>

          {/* Champ de saisie — mobile / desktop */}
          {isMobile ? (
            <textarea
              ref={mobileTaRef}
              data-testid="chat-input"
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              placeholder="Écris un message…"
              rows={2}
              className="w-full min-w-0 border rounded bg-jaunevert px-3 py-2 pr-16"
              onKeyDown={(e) => {
                if (!allowSend) return;
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
          ) : (
            <textarea
              ref={desktopTaRef}
              data-testid="chat-input"
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              placeholder="Écris un message…"
              rows={3}
              className="w-full min-w-0 border rounded bg-jaunevert px-3 py-2 pr-16"
              onKeyDown={(e) => {
                if (!allowSend) return;
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
