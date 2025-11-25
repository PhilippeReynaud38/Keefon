// -*- coding: utf-8 -*-
// components/ProfileForm.tsx — Vivaya
// Règles : robuste, simple, maintenable. UTF-8. Pas d’usine à gaz.
// Mapping exact : qualites_recherchees, vision_relation, bio.
// Stratégie d’écriture : UPDATE via user_id → si 0 ligne, UPDATE via id → si 0 ligne, UPSERT (id).

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import TraitsSelector from "@/components/TraitsSelector";
import CityAutocomplete from "@/components/recherche/CityAutocomplete";

const EDITABLE_FIELDS = [
  "taille",
  "origines",
  "religion",
  "a_des_enfants",
  "souhaite_enfants",
  "situation",
  "niveau_etude",
  "animaux",
  "musique",
  "fume",
  "alcool",
  "description",
  "qualites_recherchees",
  "vision_relation",
  "bio",
  "traits",
] as const;

type EditableKey = (typeof EDITABLE_FIELDS)[number];

export default function ProfileForm({ userId }: { userId: string }) {
  const [form, setForm] = useState<Record<string, any>>({});
  const [traits, setTraits] = useState<string[]>([]);
  const [selectedVille, setSelectedVille] = useState("");
  const [selectedCodePostal, setSelectedCodePostal] = useState("");
  const [message, setMessage] = useState("");
  const successRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (message.startsWith("✅") && successRef.current) {
      successRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [message]);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    (async () => {
      // Chargement profil (on essaye par user_id ; si rien, on essaye par id)
      const byUserId = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
      const profile = byUserId.data ?? (await supabase.from("profiles").select("*").eq("id", userId).maybeSingle()).data;

      if (!alive) return;

      if (profile) {
        const cleaned: Record<string, any> = {};
        for (const key of EDITABLE_FIELDS) {
          if (key === "traits") continue;
          cleaned[key] = profile[key] ?? "";
        }
        setForm(cleaned);
        const t = String(profile.traits || "")
          .split(",")
          .map((x: string) => x.trim())
          .filter(Boolean);
        setTraits(t);
      } else {
        const empty: Record<string, any> = {};
        for (const key of EDITABLE_FIELDS) {
          if (key === "traits") continue;
          empty[key] = "";
        }
        setForm(empty);
        setTraits([]);
      }

      const { data: localisation } = await supabase
        .from("user_localisations")
        .select("ville, code_postal")
        .eq("user_id", userId)
        .maybeSingle();
      if (!alive) return;
      setSelectedVille(localisation?.ville || "");
      setSelectedCodePostal(localisation?.code_postal || "");
    })();
    return () => { alive = false; };
  }, [userId]);

  const updateField = (key: EditableKey, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const emptyToNull = (v: any) => (v === "" ? null : v);

  const handleSubmit = async () => {
    setMessage("");
    if (!userId) { setMessage("❌ Utilisateur non connecté."); return; }
    if (!selectedCodePostal) { setMessage("❌ Veuillez choisir une ville valide dans la liste."); return; }

    const payload: Record<string, any> = {};
    for (const key of EDITABLE_FIELDS) {
      if (key === "traits") continue;
      payload[key] = emptyToNull(form[key]);
    }
    payload.traits = traits.length ? traits.join(", ") : null;

    // 1) UPDATE via user_id
    const u1 = await supabase.from("profiles").update(payload).eq("user_id", userId).select("id");
    if (u1.error) {
      console.error("[ProfileForm] UPDATE via user_id failed:", u1.error);
      setMessage(u1.error.code === "42501" ? "❌ Accès refusé (RLS)." : "❌ Erreur lors de la mise à jour du profil.");
      return;
    }
    if (u1.data && u1.data.length > 0) {
      // Localisation
      const loc = await supabase.from("user_localisations").upsert({ user_id: userId, ville: selectedVille || null, code_postal: selectedCodePostal });
      if (loc.error) {
        console.error("[ProfileForm] UPSERT localisation failed:", loc.error);
        setMessage("❌ Profil mis à jour, mais échec sur la localisation.");
        return;
      }
      setMessage("✅ Profil mis à jour avec succès !");
      return;
    }

    // 2) UPDATE via id (cas existant : user_id nul, mais id = userId)
    const u2 = await supabase.from("profiles").update(payload).eq("id", userId).select("id");
    if (u2.error) {
      console.error("[ProfileForm] UPDATE via id failed:", u2.error);
      setMessage(u2.error.code === "42501" ? "❌ Accès refusé (RLS)." : "❌ Erreur lors de la mise à jour du profil.");
      return;
    }
    if (u2.data && u2.data.length > 0) {
      // Localisation
      const loc = await supabase.from("user_localisations").upsert({ user_id: userId, ville: selectedVille || null, code_postal: selectedCodePostal });
      if (loc.error) {
        console.error("[ProfileForm] UPSERT localisation failed:", loc.error);
        setMessage("❌ Profil mis à jour, mais échec sur la localisation.");
        return;
      }
      setMessage("✅ Profil mis à jour avec succès !");
      return;
    }

    // 3) Aucune ligne → création
    const ins = await supabase.from("profiles").upsert({ id: userId, user_id: userId, ...payload }, { onConflict: "id" });
    if (ins.error) {
      console.error("[ProfileForm] UPSERT create failed:", ins.error);
      setMessage(ins.error.code === "42501" ? "❌ Accès refusé (RLS)." : "❌ Erreur lors de la création du profil.");
      return;
    }
    const loc = await supabase.from("user_localisations").upsert({ user_id: userId, ville: selectedVille || null, code_postal: selectedCodePostal });
    if (loc.error) {
      console.error("[ProfileForm] UPSERT localisation failed:", loc.error);
      setMessage("❌ Profil créé, mais échec sur la localisation.");
      return;
    }
    setMessage("✅ Profil mis à jour avec succès !");
  };

  return (
    <div className="bg-white p-4 shadow rounded-xl mt-6 max-w-2xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">📝 Complète ton profil</h2>
      <div className="space-y-4">
        <div>
          <label className="block font-semibold mb-1 text-flashyGreen">Nom de ville ou code postal</label>
          <CityAutocomplete
            initialValue={selectedVille}
            onSelect={(ville, codePostal) => { setSelectedVille(ville); setSelectedCodePostal(codePostal); }}
          />
        </div>

        <TraitsSelector traits={traits} onChange={setTraits} />

        <input className="input" placeholder="Taille en cm" value={form.taille || ""} onChange={(e) => updateField("taille", e.target.value)} />
        <input className="input" placeholder="Origines" value={form.origines || ""} onChange={(e) => updateField("origines", e.target.value)} />
        <input className="input" placeholder="Religion" value={form.religion || ""} onChange={(e) => updateField("religion", e.target.value)} />

        <select className="input" value={form.a_des_enfants || ""} onChange={(e) => updateField("a_des_enfants", e.target.value)}>
          <option value="">Avez-vous des enfants ?</option><option value="oui">Oui</option><option value="non">Non</option>
        </select>

        <select className="input" value={form.souhaite_enfants || ""} onChange={(e) => updateField("souhaite_enfants", e.target.value)}>
          <option value="">Souhaitez-vous des enfants ?</option>
          <option value="oui">Oui</option><option value="non">Non</option><option value="je ne sais pas">Je ne sais pas</option>
        </select>

        <select className="input" value={form.situation || ""} onChange={(e) => updateField("situation", e.target.value)}>
          <option value="">Situation actuelle</option>
          <option value="Célibataire">Célibataire</option><option value="Divorcé">Divorcé</option>
          <option value="Séparé">Séparé</option><option value="Veuf">Veuf</option>
        </select>

        <select className="input" value={form.niveau_etude || ""} onChange={(e) => updateField("niveau_etude", e.target.value)}>
          <option value="">Niveau d’étude</option>
          <option value="collège/lycée">Collège / Lycée</option><option value="bac">Bac</option>
          <option value="bac+2">Bac +2</option><option value="bac+3">Bac +3</option><option value="bac+5 et plus">Bac +5 et plus</option>
        </select>

        <input className="input" placeholder="Animaux (type, nombre...)" value={form.animaux || ""} onChange={(e) => updateField("animaux", e.target.value)} />
        <input className="input" placeholder="Musique préférée" value={form.musique || ""} onChange={(e) => updateField("musique", e.target.value)} />

        <select className="input" value={form.fume || ""} onChange={(e) => updateField("fume", e.target.value)}>
          <option value="">Fume ?</option><option value="oui">Oui</option><option value="non">Non</option><option value="occasionnellement">Occasionnellement</option>
        </select>

        <select className="input" value={form.alcool || ""} onChange={(e) => updateField("alcool", e.target.value)}>
          <option value="">Alcool ?</option><option value="jamais">Jamais</option><option value="occasionnellement">Occasionnellement</option><option value="quotidien">Quotidien</option>
        </select>

        <label className="block text-paleGreen font-semibold">Décris-toi librement</label>
        <textarea className="input h-28" value={form.description || ""} onChange={(e) => updateField("description", e.target.value)} />

        <label className="block text-paleGreen font-semibold">💛 Les qualités que vous appréciez chez une autre personne</label>
        <textarea className="input h-28" value={form.qualites_recherchees || ""} onChange={(e) => updateField("qualites_recherchees", e.target.value)} />

        <label className="block text-paleGreen font-semibold">Une relation pour toi c’est…</label>
        <textarea className="input h-28" value={form.vision_relation || ""} onChange={(e) => updateField("vision_relation", e.target.value)} />

        <label className="block text-paleGreen font-semibold">Ta bio libre</label>
        <textarea className="input h-24" value={form.bio || ""} onChange={(e) => updateField("bio", e.target.value)} />

        {message && (
          <p ref={successRef} className={`text-sm mb-4 rounded px-4 py-2 text-center ${message.startsWith("✅") ? "text-green-700 bg-green-50 border border-green-300" : "text-red-600"}`}>
            {message}
          </p>
        )}

        <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Mettre à jour
        </button>
      </div>
    </div>
  );
}
