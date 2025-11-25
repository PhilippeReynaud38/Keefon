// -*- coding: utf-8 -*-
// Composant : PrivacySettingsCard
// Rôle : Affiche/écrit les 2 réglages "réservés aux abonnés" SANS SQL custom.
//        - Cache le bloc si la base ne supporte pas les colonnes ou si RLS refuse.
//        - Optionnel : gating par abonnement via prop canUseAdvanced (par défaut true).
//
// Dépendances : supabase client (import "@/lib/supabaseClient")
// Effets externes : update sur public.profiles (col. is_public, visible_to_certified_only)
// Invariants : ne jette aucune erreur fatale ; si indisponible => bloc masqué.
//
// Dernière MAJ : 2025-11-07

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  canUseAdvanced?: boolean; // passe true si abonné, sinon false (affiche un voile + CTA)
};

export default function PrivacySettingsCard({ canUseAdvanced = true }: Props) {
  const [available, setAvailable] = useState<boolean>(false); // bloc affichable ?
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<"none" | "is_public" | "cert_only">("none");

  const [meId, setMeId] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [certOnly, setCertOnly] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const disabled = saving !== "none" || loading;

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth?.user?.id || null;
        if (!uid) {
          setAvailable(false);
          return;
        }
        setMeId(uid);

        // Tentative de lecture ciblée : si les colonnes manquent ou RLS refuse, on masque le bloc.
        const { data, error: selErr } = await supabase
          .from("profiles")
          .select("id, is_public, visible_to_certified_only")
          .eq("id", uid)
          .maybeSingle();

        if (selErr || !data) {
          setAvailable(false);
          return;
        }

        // Les colonnes existent et la lecture passe.
        // Valeurs par défaut robustes si null/undefined.
        setIsPublic((data as any).is_public ?? true);
        setCertOnly((data as any).visible_to_certified_only ?? false);
        setAvailable(true);
      } catch (e: any) {
        setAvailable(false); // opacité totale : on ne montre pas le bloc si doute
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function updateField(field: "is_public" | "visible_to_certified_only", value: boolean) {
    if (!meId) return;
    setSaving(field === "is_public" ? "is_public" : "cert_only");
    setError(null);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ [field]: value })
        .eq("id", meId);
      if (error) throw error;
      if (field === "is_public") setIsPublic(value);
      else setCertOnly(value);
    } catch (e: any) {
      setError("Impossible d’enregistrer ce réglage (droits ou colonne manquante).");
    } finally {
      setSaving("none");
    }
  }

  // Si indisponible (colonnes absentes / RLS), on masque entièrement le bloc
  if (!available) return null;

  return (
    <section className="relative rounded-2xl bg-white/90 shadow-sm ring-1 ring-gray-200 p-4 sm:p-6">
      {!canUseAdvanced && (
        <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-white/70 backdrop-blur-[1px]">
          <div className="text-center px-4">
            <div className="font-semibold text-gray-900">Réservé aux abonnés</div>
            <p className="text-sm sm:text-base md:text-xl text-gray-600 mt-1">
              Activez un abonnement pour gérer la confidentialité de votre profil.
            </p>
            <Link
              href="/abonnement"
              className="inline-block mt-3 px-4 py-2 rounded-xl bg-amber-500 text-white font-semibold shadow hover:bg-amber-500/90"
            >
              Découvrir l’abonnement
            </Link>
          </div>
        </div>
      )}

      <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
        Paramètres — réservés aux abonnés
      </h3>
      <p className="text-sm sm:text-base text-gray-700 mb-4">
        Par défaut, ton profil est <b>visible</b>. Tu peux activer le mode privé pour le cacher.
      </p>

      <div className={`${!canUseAdvanced ? "pointer-events-none opacity-60" : ""} space-y-3`}>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            className="mt-1 accent-blue-600"
            checked={!isPublic}
            onChange={(e) => updateField("is_public", !e.target.checked)}
            disabled={disabled}
          />
          <span>
            <div className="font-medium">Cacher mon profil (mode privé)</div>
            <div className="text-sm text-gray-600">
              Si activé, ton profil n’apparaît plus dans la recherche ni les suggestions.
            </div>
          </span>
        </label>

        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            className="mt-1 accent-blue-600"
            checked={certOnly}
            onChange={(e) => updateField("visible_to_certified_only", e.target.checked)}
            disabled={disabled}
          />
          <span>
            <div className="font-medium">Seuls les profils certifiés peuvent me voir</div>
            <div className="text-sm text-gray-600">
              Ton profil reste visible, mais uniquement pour les membres certifiés.
            </div>
          </span>
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {saving !== "none" && (
        <p className="mt-3 text-sm text-gray-600">Enregistrement…</p>
      )}
    </section>
  );
}
