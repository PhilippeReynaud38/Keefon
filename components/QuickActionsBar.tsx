// File: components/QuickActionsBar.tsx
// Encoding: UTF-8
/**
 * ============================================================
 * Rôle :
 *   Barre d’actions rapides en haut d’une page profil (mobile-first).
 *   Actions prévues : Retour, Dashboard, Cœur, Like, Message, (Premium chat optionnel).
 *
 * Responsabilités :
 *   - N’expose que l’UI et des callbacks. Aucune logique DB ici.
 *   - S’intègre sur /profileplus/[id] sans casser l’existant.
 *
 * Entrées / Sorties :
 *   Entrées : onBack, onDashboard, onHeart, onLike, onMessage, onPremiumChat
 *   Sorties : aucun retour ; les parents gèrent navigation & RPC.
 *
 * Sécurité / RLS :
 *   - Aucun accès DB. Respect total séparation admin/public.
 * ============================================================
 */

import * as React from "react";


type Props = {
  onBack?: () => void;
  onDashboard?: () => void;
  onHeart?: () => Promise<void> | void;
  onLike?: () => Promise<void> | void;
  onMessage?: () => void;
  // Premium chat (facultatif)
  premiumChatEligible?: boolean;
  premiumChatBlockedReason?: string;
  onStartPremiumChat?: () => Promise<void> | void;
};

const IconBtn: React.FC<{
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ label, onClick, disabled, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={label}
    aria-label={label}
    className={[
      "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium",
      disabled ? "bg-neutral-200 text-neutral-500 cursor-not-allowed" : "bg-white border border-neutral-200 hover:bg-neutral-50",
      "shadow-sm"
    ].join(" ")}
  >
    <span aria-hidden className="mr-1">{children}</span>
    <span className="hidden sm:inline">{label}</span>
  </button>
);

const QuickActionsBar: React.FC<Props> = ({
  onBack,
  onDashboard,
  onHeart,
  onLike,
  onMessage,
  premiumChatEligible,
  premiumChatBlockedReason,
  onStartPremiumChat,
}) => {
  return (
    <div className="w-full sticky top-0 z-20 bg-gradient-to-b from-white/90 to-white/70 backdrop-blur p-2 flex items-center gap-2">
      <IconBtn label="Retour" onClick={onBack}>⬅️</IconBtn>
      <IconBtn label="Dashboard" onClick={onDashboard}>🏠</IconBtn>
      <div className="mx-2 h-6 w-px bg-neutral-200" aria-hidden />
      <IconBtn label="Envoyer un cœur" onClick={onHeart}>💛</IconBtn>
      <IconBtn label="Envoyer un like" onClick={onLike}>👍</IconBtn>
      <IconBtn label="Envoyer un message" onClick={onMessage}>✉️</IconBtn>
      {/* Espace flexible */}
      <div className="flex-1" />
      {/* Bouton premium optionnel, activé par feature flag côté parent */}
      <div className="hidden sm:block">

      </div>
    </div>
  );
};

export default QuickActionsBar;
