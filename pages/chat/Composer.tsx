// -*- coding: utf-8 -*-
/**
 * Vivaya — pages/chat/Composer.tsx
 * Rôle : zone de saisie + bouton d’envoi (stateless côté stockage).
 * Entrées :
 *   - disabled?: boolean → désactive la saisie/envoi (ex. blocage actif)
 *   - onSend: (value: string) => Promise<void> | void
 *   - error?: string | null → message d’erreur à afficher
 *   - placeholder?: string
 *
 * Notes :
 *   - Version simplifiée et unifiée (on retire la double définition et le bouton “questions abonnés”
 *     de l’original pour rester minimaliste/robuste).
 */

import { useState } from "react";

type Props = {
  disabled?: boolean;
  onSend: (value: string) => void | Promise<void>;
  error?: string | null;
  placeholder?: string;
};

export default function Composer({ disabled, onSend, error, placeholder }: Props) {
  const [value, setValue] = useState("");

  const send = async () => {
    if (disabled) return;
    const v = value.trim();
    if (!v) return;
    await onSend(v);
    setValue("");
  };

  return (
    <div className="fixed inset-x-0 bottom-0 bg-yellow-300/90">
      <div className="mx-auto flex max-w-3xl items-end gap-2 px-3 py-2">
        <textarea
          className="flex-1 resize-none rounded-xl border border-yellow-400 bg-white p-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-60"
          rows={2}
          placeholder={placeholder || "Écris un message…"}
          disabled={disabled}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button
          type="button"
          onClick={send}
          disabled={disabled}
          className="mb-1 rounded-full bg-orange-400 p-3 text-white shadow hover:opacity-90 active:scale-95 disabled:opacity-50"
          title={disabled ? "Blocage actif" : "Envoyer"}
        >
          ➤
        </button>
      </div>

      {error && (
        <div className="mx-auto max-w-3xl px-4 pb-3 text-sm text-red-800">
          {error}
        </div>
      )}
    </div>
  );
}
