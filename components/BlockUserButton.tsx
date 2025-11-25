/**
 * Vivaya — /components/BlockUserButton.tsx
 * Rôle : Bouton d’action pour bloquer un utilisateur (messages/conversations).
 * Entrées (props) :
 *   - blockedUserId: UUID du profil à bloquer (obligatoire)
 *   - blockedUserName?: libellé optionnel pour la confirmation (“U3”, “mia”, etc.)
 *   - className?: classes utilitaires pour placement/styling
 *   - onBlocked?: callback appelé après succès (ex. retirer la carte de la liste)
 * Sorties : aucune (effet contrôlé via onBlocked)
 * Contraintes : UTF-8, pas d’effet de bord non maîtrisé ; confirmation utilisateur.
 * Dépendances internes : client Supabase du projet (import supabase)
 * Dépendances externes : @supabase/supabase-js (déjà utilisé dans le projet)
 * Notes de maintenance :
 *   - RLS requises sur public.blocks (voir SQL en bas de réponse).
 *   - Unicité (user_id, blocked_user_id) recommandée pour éviter doublons.
 */

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient"; // [NOTE] adapte le chemin si besoin

type Props = {
  blockedUserId: string;
  blockedUserName?: string;
  className?: string;
  onBlocked?: () => void;
};

export default function BlockUserButton({
  blockedUserId,
  blockedUserName,
  className,
  onBlocked,
}: Props) {
  const [loading, setLoading] = useState(false);

  // [SAFE] garde-entrée
  if (!blockedUserId) return null;

  const handleBlock = async () => {
    // [SAFE] confirmation explicite, simple et sans gadget
    const label = blockedUserName ? `« ${blockedUserName} »` : "cet utilisateur";
    const ok = window.confirm(
      `Bloquer ${label} ?\n\nVous ne recevrez plus de messages de cette personne.`
    );
    if (!ok) return;

    try {
      setLoading(true);

      // [FIX] insertion explicite ; on pose user_id ici pour rester robuste
      // (RLS : insert autorisé si user_id = auth.uid()).
      const {
        data: authData,
        error: authErr,
      } = await supabase.auth.getUser();
      if (authErr || !authData?.user?.id) {
        throw new Error("Impossible de récupérer l’utilisateur courant.");
      }

      const userId = authData.user.id;

      const { error } = await supabase.from("blocks").insert({
        user_id: userId,
        blocked_user_id: blockedUserId,
      });

      if (error) {
        // Erreur typique si contrainte d’unicité déjà présente
        if (
          (error as any).code === "23505" ||
          String(error.message).toLowerCase().includes("unique")
        ) {
          alert("Cet utilisateur est déjà bloqué.");
        } else {
          throw error;
        }
      } else {
        // [NOTE] feedback simple ; libre à toi d’utiliser ton système de toast
        alert("Utilisateur bloqué.");
        onBlocked?.();
      }
    } catch (e: any) {
      console.error("[BlockUserButton] block error:", e);
      alert("⚠️ Une erreur est survenue lors du blocage.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBlock}
      disabled={loading}
      title="Bloquer cet utilisateur"
      className={
        className ??
        "inline-flex items-center gap-2 rounded-2xl px-3 py-1 text-sm shadow " +
          "border border-red-300/60 hover:border-red-400 " +
          "bg-white hover:bg-red-50 active:bg-red-100 transition disabled:opacity-60"
      }
    >
      {/* icône simple, sans librairie supplémentaire */}
      <span aria-hidden>🚫</span>
      <span>{loading ? "Blocage..." : "Bloquer"}</span>
    </button>
  );
}
