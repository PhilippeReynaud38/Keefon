/* ===================================================================
   PATH          : components/interaction/HeartCard.tsx
   MODULE        : HeartCard (UI)
   OBJECTIF      : Envelopper ProfileCard et afficher, en overlay,
                   des pastilles d’état liées aux interactions :
                   - ❤️ déjà envoyé (moi → autre)
                   - 🧡 Écho proposé (moi → autre)
                   - 🧡 Écho reçu (autre → moi)

   CONTEXTE      : Lecture uniquement. Aucune écriture en base.
                   Respect des règles Vivaya :
                   1) Code robuste, clair, sans usine à gaz
                   2) Zéro effet de bord (UI only + read-only)
                   3) Commentaires sobres et utiles
                   4) UTF-8, composant modulaire

   ENTRÉES       : `props` – doit permettre de déduire l’ID “autre”
                   via plusieurs pistes possibles (otherUserId, userId,
                   profileId, heart.from_user/to_user, etc.).

   SORTIES       : JSX – ProfileCard + éventuelles pastilles d’état.

   ACCÈS DONNÉES : Supabase (read-only)
                   - Table `hearts` (count HEAD)
                   - Table `echo_offers` (count HEAD, status='offered')

   SÉCURITÉ/RLS  : On suppose les policies déjà en place côté lecture.
                   Le composant ne contourne rien et ne fait que lire.

   INVARIANTS    : - Ne requête rien tant que mon id (`meId`) n’est pas
                     connu.
                   - Ne requête rien si l’ID “autre” est inconnu
                     (carte anonyme).

   DERNIÈRE MAJ  : 2025-10-30 (Europe/Paris)
   =================================================================== */

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProfileCard from "@/components/ProfileCard";

/** Sécurise un id éventuellement absent */
const asId = (x: unknown) => (typeof x === "string" && x.length > 0 ? x : null);

/**
 * Déduit l’ID de l’autre personne depuis les props + mon id.
 * On essaie plusieurs chemins possibles pour rester robuste sans logique fragile.
 */
function resolveOtherId(props: any, meId: string | null): string | null {
  const candidates = [
    props.otherUserId,
    props.userId,
    props.profileId,
    props.toUserId,
    props.fromUserId,
    props?.user?.id,
    props?.profile?.id,
    // Cas d’une carte dérivée d’un "heart" (on choisit l’autre extrémité)
    props?.heart?.from_user && props?.heart?.to_user
      ? props.heart.from_user === meId
        ? props.heart.to_user
        : props.heart.from_user
      : null,
  ].map(asId);

  for (const c of candidates) {
    if (c && c !== meId) return c;
  }
  return null; // carte anonyme → on n’affiche pas de pastilles
}

/** Pastilles d’état (❤️/🧡) superposées à la carte */
function StatusPills(props: any) {
  const [meId, setMeId] = useState<string | null>(null);
  const [otherId, setOtherId] = useState<string | null>(null);

  const [iSentHeart, setISentHeart] = useState(false);
  const [iOfferedEcho, setIOfferedEcho] = useState(false);
  const [theyOfferedEcho, setTheyOfferedEcho] = useState(false);

  // Récupère mon ID (client-side) — lecture uniquement
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setMeId(data?.user?.id ?? null);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Déduit l’ID de l’autre personne dès que mon ID est connu
  useEffect(() => {
    if (!meId) return;
    setOtherId(resolveOtherId(props, meId));
    // ⚠️ dépendre de `props` entier peut retrigger souvent ; acceptable ici
    // car on reste en lecture et on filtre avec les invariants ci-dessous.
  }, [meId, props]);

  // Interroge les compteurs read-only une fois les deux IDs connus
  useEffect(() => {
    if (!meId || !otherId) return;

    // 1) Moi → autre : cœur actif ?
    // PostgREST renvoie un "PromiseLike" sans .catch() → on utilise onRejected dans then().
    supabase
      .from("hearts")
      .select("*", { count: "exact", head: true })
      .eq("from_user", meId)
      .eq("to_user", otherId)
      .eq("expired", false)
      .then(
        ({ error, count }) => setISentHeart(!error && (count ?? 0) > 0),
        () => setISentHeart(false) // onRejected (pas de .catch)
      );

    // 2) Moi → autre : Écho 🧡 proposé (actif) ?
    supabase
      .from("echo_offers")
      .select("id", { head: true, count: "exact" })
      .eq("from_user", meId)
      .eq("to_user", otherId)
      .eq("status", "offered")
      .then(
        ({ error, count }) => setIOfferedEcho(!error && (count ?? 0) > 0),
        () => setIOfferedEcho(false)
      );

    // 3) Autre → moi : Écho 🧡 proposé (actif) ?
    supabase
      .from("echo_offers")
      .select("id", { head: true, count: "exact" })
      .eq("from_user", otherId)
      .eq("to_user", meId)
      .eq("status", "offered")
      .then(
        ({ error, count }) => setTheyOfferedEcho(!error && (count ?? 0) > 0),
        () => setTheyOfferedEcho(false)
      );
  }, [meId, otherId]);

  // Construit la liste finale de pastilles à afficher
  const pills = useMemo(() => {
    const arr: { key: string; label: string; cls: string }[] = [];
    if (theyOfferedEcho)
      arr.push({
        key: "theyEcho",
        label: "Écho 🧡 proposé 💌",
        cls: "bg-amber-100 text-amber-900",
      });
    if (iOfferedEcho)
      arr.push({
        key: "iEcho",
        label: "Tu as déjà proposé un Écho 🧡",
        cls: "bg-emerald-100 text-emerald-900",
      });
    if (iSentHeart)
      arr.push({
        key: "iHeart",
        label: "Tu as déjà envoyé un cœur",
        cls: "bg-pink-100 text-pink-800",
      });
    return arr;
  }, [iSentHeart, iOfferedEcho, theyOfferedEcho]);

  // Rien à afficher si je n’ai pas les 2 IDs ou aucune pastille active
  if (!meId || !otherId || pills.length === 0) return null;

  return (
    <div className="absolute right-2 top-2 z-10 flex flex-col items-end gap-1">
      {pills.map((p) => (
        <span
          key={p.key}
          className={`rounded-full px-2 py-1 text-xs shadow ${p.cls}`}
          title={p.label}
        >
          {p.label}
        </span>
      ))}
    </div>
  );
}

/** Carte enveloppée avec overlay de pastilles d’état (read-only) */
export default function HeartCard(props: any) {
  return (
    <div className="relative">
      <ProfileCard {...props} />
      <StatusPills {...props} />
    </div>
  );
}
