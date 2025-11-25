// UTF-8 — lib/payments.ts
// -----------------------------------------------------------------------------
// Objectif :
//   Point d'entrée UNIQUE pour toutes les opérations de paiement côté app.
//   (abonnements et achats de crédits).
//
// Contexte / module :
//   Utilisé par les pages & composants React (front) pour demander :
//     - un changement de plan (Free / Essential / Elite, etc.)
//     - un achat de crédits (cœurs, échos)
//   Sans parler directement à Stripe ou à un autre PSP.
//
// Entrées :
//   - userId   : identifiant utilisateur (UUID Supabase, par ex.)
//   - planId   : identifiant de l'abonnement métier ('free' | 'essential' | 'elite')
//   - type     : type de crédit ('heart' | 'echo')
//   - quantity : quantité de crédits à ajouter
//
// Sorties :
//   - objets de résultat simples (success, message, redirectUrl éventuelle)
//
// Accès données :
//   - À implémenter : update de la base (Supabase) dans la partie DevPaymentProvider.
//   - Ce fichier NE DOIT PAS contenir de clés Stripe ni d'appel direct à un PSP.
//
// Effets de bord :
//   - Pour l'instant : aucun appel externe, uniquement de la logique métier à brancher.
//   - Plus tard : ce sera ici qu'on branchera un provider réel (Stripe ou autre),
//     mais toujours derrière cette abstraction.
//
// Invariants :
//   - Les pages / composants NE DOIVENT JAMAIS appeler un PSP directement.
//   - Toute opération "paiement" passe par getPaymentProvider().
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Types métiers
// -----------------------------------------------------------------------------

// Plans côté métier (mêmes valeurs que UiTier dans pages/abonnement.tsx)
export type PlanId = 'free' | 'essential' | 'elite';

// Types de crédits utilisables sur le site.
export type CreditType = 'heart' | 'echo';

// Résultat générique pour une demande d'abonnement.
export interface SubscriptionResult {
  success: boolean;
  redirectUrl?: string; // ex. URL de checkout PSP (plus tard)
  message?: string;
}

// Résultat générique pour un achat de crédits.
export interface CreditsPurchaseResult {
  success: boolean;
  redirectUrl?: string; // ex. URL de checkout PSP (plus tard)
  message?: string;
}

// -----------------------------------------------------------------------------
// Interface du provider de paiement
// -----------------------------------------------------------------------------
//
// Cette interface décrit ce qu'un "système de paiement" sait faire pour Keefon.
// Peu importe que derrière ce soit :
//   - un mode dev (gratuit, direct DB)
//   - Stripe
//   - un autre PSP "high risk / dating"
// -----------------------------------------------------------------------------

export interface PaymentProvider {
  /**
   * Demande d'abonnement / changement de plan.
   *
   * - En mode dev : on peut directement mettre à jour le plan dans la base.
   * - En mode prod avec PSP : on crée une session de paiement et on renvoie
   *   éventuellement une redirectUrl vers le checkout.
   */
  subscribeToPlan(params: {
    userId: string;
    planId: PlanId;
  }): Promise<SubscriptionResult>;

  /**
   * Achat de crédits (cœurs, échos, etc.).
   *
   * - En mode dev : on crédite directement les crédits dans la base.
   * - En mode prod avec PSP : on crée une session de paiement, puis un webhook
   *   viendra créditer les crédits après confirmation.
   */
  purchaseCredits(params: {
    userId: string;
    type: CreditType;
    quantity: number;
  }): Promise<CreditsPurchaseResult>;
}

// -----------------------------------------------------------------------------
// Implémentation DEV par défaut (aucun PSP)
// -----------------------------------------------------------------------------
//
// Objectif : permettre de tester tout Keefon sans Stripe, sans Kbis,
// et sans aucun système de paiement externe.
//
// Pour l'instant, CETTE IMPLÉMENTATION NE PARLE À AUCUN PSP.
// Elle est là pour :
//   - débloquer l'UX (boutons d'abonnement, cœurs, échos),
//   - valider la logique métier / DB,
//   - préparer le terrain pour brancher un vrai provider plus tard.
//
// TODO : brancher Supabase ici (update du plan, incrément de crédits).
// -----------------------------------------------------------------------------

// TODO: remplace l'import ci-dessous par ton helper réel Supabase quand tu seras prêt.
// import { supabaseClient } from '@/lib/supabaseClient';

class DevPaymentProvider implements PaymentProvider {
  async subscribeToPlan(params: {
    userId: string;
    planId: PlanId;
  }): Promise<SubscriptionResult> {
    const { userId, planId } = params;

    // -------------------------------------------------------------------------
    // TODO : implémentation réelle côté DB
    //
    // Exemple d'intention (à adapter à ton schéma) :
    //
    // const { error } = await supabaseClient
    //   .from('profiles')
    //   .update({ effective_plan: planId })
    //   .eq('id', userId);
    //
    // if (error) {
    //   return {
    //     success: false,
    //     message: "Impossible de mettre à jour l'abonnement (mode dev).",
    //   };
    // }
    //
    // -------------------------------------------------------------------------

    // Pour l'instant : on simule un succès.
    return {
      success: true,
      message: `Abonnement mis à jour en mode DEV sur le plan "${planId}". Aucun paiement réel effectué.`,
    };
  }

  async purchaseCredits(params: {
    userId: string;
    type: CreditType;
    quantity: number;
  }): Promise<CreditsPurchaseResult> {
    const { userId, type, quantity } = params;

    // -------------------------------------------------------------------------
    // TODO : implémentation réelle côté DB
    //
    // Idée générale :
    //   - table "user_credits" ou champs "hearts_count" / "echoes_count"
    //   - incrémenter la colonne correspondant au type
    //
    // Exemple (à adapter) :
    //
    // const column =
    //   type === 'heart'
    //     ? 'hearts_count'
    //     : 'echoes_count';
    //
    // const { error } = await supabaseClient.rpc('increment_user_credits', {
    //   p_user_id: userId,
    //   p_column: column,
    //   p_quantity: quantity,
    // });
    //
    // ou un simple update avec `column = column + quantity`.
    //
    // if (error) {
    //   return {
    //     success: false,
    //     message: "Impossible d'ajouter les crédits (mode dev).",
    //   };
    // }
    //
    // -------------------------------------------------------------------------

    // Pour l'instant : on simule un succès.
    return {
      success: true,
      message: `Crédits ajoutés en mode DEV : +${quantity} "${type}" pour l'utilisateur ${userId}. Aucun paiement réel effectué.`,
    };
  }
}

// -----------------------------------------------------------------------------
// Sélection du provider actif
// -----------------------------------------------------------------------------
//
// Pour l'instant, on force DevPaymentProvider.
// Plus tard, tu pourras brancher un provider réel en fonction d'une variable
// d'environnement (ex. NEXT_PUBLIC_PAYMENTS_PROVIDER).
// -----------------------------------------------------------------------------

let activeProvider: PaymentProvider = new DevPaymentProvider();

/**
 * Récupère le provider de paiement actif.
 *
 * Les pages / composants ne doivent utiliser QUE cette fonction
 * pour déclencher une opération de paiement.
 */
export function getPaymentProvider(): PaymentProvider {
  return activeProvider;
}

// -----------------------------------------------------------------------------
// NOTE FUTURE :
//
// Quand tu auras un PSP (Stripe ou autre), tu pourras :
//
//   - créer un fichier StripePaymentProvider (ou autreNomPaymentProvider)
//   - implémenter l'interface PaymentProvider avec les vrais appels PSP
//   - puis ici, remplacer l'initialisation :
//
//     if (process.env.NEXT_PUBLIC_PAYMENTS_PROVIDER === 'stripe') {
//       activeProvider = new StripePaymentProvider(...);
//     } else {
//       activeProvider = new DevPaymentProvider();
//     }
//
// Sans changer une seule ligne dans les pages ou composants.
// -----------------------------------------------------------------------------
