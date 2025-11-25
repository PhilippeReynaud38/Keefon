// -*- coding: utf-8 -*-
// ============================================================================
// Vivaya — Admin · Plans (règles par abonnement)
// ----------------------------------------------------------------------------
// OBJET : Administrer des "features" (règles JSON) par plan d’abonnement.
//         Utile surtout pour FREE (limites, coûts) et pour exceptions ponctuelles.
//         Les avantages “inclus par contrat” sont masqués par défaut.
//
// QUALITÉ :
// - Code simple, commenté, UTF-8, pas de gadgets.
// - Zéro effet de bord : parse JSON tolérant + UPSERT idempotent.
// - Full dark background (body + 100vh).
//
// CHANGEMENTS (2025-09-08) :
// - Retrait définitif : openers_unlocked, elite_badge (seed + UI).
// - read_messages : considéré INCLUS par contrat pour premium/elite → masqué par défaut.
// - Clés obsolètes (ex. "limit") : masquées par défaut, bouton "Supprimer" pour nettoyer.
// - Lexique FR complété pour les features conservées.
// - ➕ NEW : new_convo_daily_limit (limite de nouvelles conversations / jour, pour les 3 plans).
// ============================================================================

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";

// ---------- Types BDD --------------------------------------------------------
type Plan = { id: string; label: string };
type FeatureRow = { plan_id: string; feature_key: string; feature_value: any };

// ---------- Libellés FR (features actives) ----------------------------------
const FEATURE_LABELS: Record<string, string> = {
  daily_send_limit: "Limite quotidienne d’envois",
  new_convo_daily_limit: "Nouvelles conversations / jour", // NEW
  see_profile_views: "Voir qui a consulté mon profil",
  see_read_receipts: "Accusés de lecture (vu / horodatage)",
  weekly_boosts: "Boosts hebdomadaires",
  heart_cost: "Coût des cœurs",
  heart_gift_quota: "Cœurs offerts / mois",
};

// Clés incluses “par contrat” (peu d’intérêt à les éditer ici) → masquées par défaut
const CONTRACT_INCLUDED_BY_PLAN: Record<string, string[]> = {
  premium: ["see_profile_views", "read_messages"], // lecture illimitée incluse
  elite: ["see_profile_views", "read_messages", "see_read_receipts", "priority_support"],
};

// Clés obsolètes (anciennes/invalides) à masquer par défaut
const DEPRECATED_KEYS = new Set<string>(["openers_unlocked", "elite_badge", "limit"]);

// Mise en forme d’un identifiant snake_case pour l’afficher gentiment
function humanize(key: string) {
  return key.replace(/_/g, " ").trim().replace(/^\w/, (c) => c.toUpperCase());
}

// ---------- Parse JSON tolérant ---------------------------------------------
function relaxedParseJSON(input: string): any {
  const raw = (input || "").trim();
  try {
    return JSON.parse(raw);
  } catch {}
  try {
    let fixed = raw.replace(/'/g, '"'); // quotes simples → doubles
    fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][\w]*)\s*:/g, '$1"$2":'); // clés non-quotées
    return JSON.parse(fixed);
  } catch {
    throw new Error('Valeur JSON invalide. Exemple : {"limit": 100} ou {"enabled": true}');
  }
}

// ---------- Seed idempotent (plans + features utiles) -----------------------
async function ensureDefaultPlans(): Promise<void> {
  const defaultPlans: Plan[] = [
    { id: "free", label: "Gratuit" },
    { id: "premium", label: "Premium" },
    { id: "elite", label: "Élite" },
  ];
  for (const p of defaultPlans) {
    const { error } = await supabase
      .from("plan_tiers")
      .upsert({ id: p.id, label: p.label }, { onConflict: "id" });
    if (error) throw error;
  }

  // NB : pas de openers_unlocked / elite_badge / limit ici (abandonnés).
  // PREMIUM/ELITE : on n’écrit PAS read_messages (inclus par contrat).
  const defaultFeatures: Record<string, Record<string, any>> = {
    free: {
      daily_send_limit: { limit: 20 },
      new_convo_daily_limit: { limit: 5 },  // NEW : 5 nouvelles conversations / jour
      heart_cost: { cost: 1 },
      heart_gift_quota: { count: 0 },
    },
    premium: {
      daily_send_limit: { limit: 100 },
      new_convo_daily_limit: { limit: 25 }, // NEW
      heart_cost: { cost: 1 },
      heart_gift_quota: { count: 1 },
      weekly_boosts: { count: 1 },
      // see_profile_views / read_messages : inclus par contrat → non stockés ici
    },
    elite: {
      daily_send_limit: { limit: 300 },
      new_convo_daily_limit: { limit: 60 }, // NEW
      heart_cost: { cost: 0 },
      heart_gift_quota: { count: 3 },
      weekly_boosts: { count: 3 },
      // read_messages / read_receipts / support : inclus par contrat → non stockés ici
    },
  };

  for (const planId of Object.keys(defaultFeatures)) {
    for (const [feature_key, feature_value] of Object.entries(defaultFeatures[planId])) {
      const { error } = await supabase
        .from("plan_features")
        .upsert(
          { plan_id: planId, feature_key, feature_value },
          { onConflict: "plan_id,feature_key" }
        );
      if (error) throw error;
    }
  }
}

// ============================================================================
// Composant principal
// ============================================================================
export default function AdminPlans() {
  const router = useRouter();

  // États
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string>("");

  const [features, setFeatures] = useState<FeatureRow[]>([]);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState('{"limit": 50}');

  const [hideContracts, setHideContracts] = useState(true);
  const [hideDeprecated, setHideDeprecated] = useState(true);

  const [banner, setBanner] = useState<{ kind: "info" | "error"; msg: string } | null>(null);

  // Palette dark
  const bgOuter = "#12161c";
  const cardBg = "#1a1f27";
  const border = "#2b323c";
  const text = "#f3f4f6";
  const textSoft = "#cbd5e1";
  const btnBg = "#222833";
  const inputBg = "#0f1318";
  const codeBg = "#0b0f14";

  // Fond body global
  useEffect(() => {
    const prevBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = bgOuter;
    return () => {
      document.body.style.backgroundColor = prevBg;
    };
  }, [bgOuter]);

  // Guard admin
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess?.session?.user?.id;
      if (!uid) {
        router.replace("/login");
        return;
      }
      try {
        const { data, error } = await supabase.rpc("is_admin", { p_user: uid });
        if (!cancelled && !error && data === true) {
          setIsAdmin(true);
          return;
        }
      } catch {}
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("is_admin, is_superadmin")
          .eq("id", uid)
          .maybeSingle();
        if (error) {
          if (!cancelled) {
            setIsAdmin(false);
            setBanner({ kind: "error", msg: "Accès refusé. Impossible de vérifier ton rôle." });
          }
          return;
        }
        const admin = !!(data?.is_admin || data?.is_superadmin);
        if (!cancelled) {
          setIsAdmin(admin);
          if (!admin) setBanner({ kind: "error", msg: "Accès refusé. Rôle admin requis." });
        }
      } catch (e: any) {
        if (!cancelled) {
          setIsAdmin(false);
          setBanner({ kind: "error", msg: `Accès refusé. ${e?.message ?? ""}` });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Chargements
  async function loadPlans(selectFirst = true) {
    setLoading(true);
    setBanner(null);
    const { data, error } = await supabase.from("plan_tiers").select("id,label").order("id");
    if (error) {
      setBanner({ kind: "error", msg: "Impossible de charger les plans." });
      setLoading(false);
      return;
    }
    setPlans(data || []);
    if (selectFirst && data && data.length && !currentPlanId) setCurrentPlanId(data[0].id);
    setLoading(false);
  }

  useEffect(() => {
    if (isAdmin !== true) return;
    (async () => {
      await loadPlans(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  async function loadFeatures(planId: string) {
    setLoading(true);
    setBanner(null);
    const { data, error } = await supabase
      .from("plan_features")
      .select("plan_id,feature_key,feature_value")
      .eq("plan_id", planId)
      .order("feature_key");
    if (error) {
      setBanner({ kind: "error", msg: "Impossible de charger les règles du plan." });
      setLoading(false);
      return;
    }
    setFeatures(data || []);
    setLoading(false);
  }

  useEffect(() => {
    if (!currentPlanId || isAdmin !== true) return;
    (async () => {
      await loadFeatures(currentPlanId);
    })();
  }, [currentPlanId, isAdmin]);

  const currentPlanLabel = useMemo(
    () => plans.find((p) => p.id === currentPlanId)?.label ?? currentPlanId,
    [plans, currentPlanId]
  );

  const filteredFeatures = useMemo(() => {
    let list = features;
    if (hideContracts) {
      const mask = new Set(CONTRACT_INCLUDED_BY_PLAN[currentPlanId] || []);
      list = list.filter((f) => !mask.has(f.feature_key));
    }
    if (hideDeprecated) {
      list = list.filter((f) => !DEPRECATED_KEYS.has(f.feature_key));
    }
    return list;
  }, [features, currentPlanId, hideContracts, hideDeprecated]);

  // Mutations (simple ou lot)
  async function upsertFeatureOrBatch(key: string, rawJson: string) {
    setBanner(null);
    let parsed: any;
    try {
      parsed = relaxedParseJSON(rawJson);
    } catch (e: any) {
      setBanner({ kind: "error", msg: e?.message || "JSON invalide." });
      return;
    }

    // Lot : clé vide + objet { k: v, ... }
    if (!key.trim() && parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      try {
        for (const [k, v] of Object.entries(parsed)) {
          if (DEPRECATED_KEYS.has(k)) continue;
          const { error } = await supabase
            .from("plan_features")
            .upsert(
              { plan_id: currentPlanId, feature_key: k, feature_value: v },
              { onConflict: "plan_id,feature_key" }
            );
          if (error) throw error;
        }
        await loadFeatures(currentPlanId);
        setBanner({ kind: "info", msg: "Règles ajoutées/mises à jour (lot)." });
      } catch (e: any) {
        setBanner({ kind: "error", msg: e?.message || "Erreur lors de l’ajout en lot." });
      }
      return;
    }

    // Simple
    const trimmedKey = key.trim();
    if (!trimmedKey) {
      setBanner({
        kind: "error",
        msg:
          "La clé est vide. Pour un ajout en lot, laisse la clé vide et fournis un objet JSON { feature_key: feature_value, ... }.",
      });
      return;
    }
    if (DEPRECATED_KEYS.has(trimmedKey)) {
      setBanner({ kind: "error", msg: `La clé "${trimmedKey}" est obsolète et ne doit plus être utilisée.` });
      return;
    }
    try {
      const { error } = await supabase
        .from("plan_features")
        .upsert(
          { plan_id: currentPlanId, feature_key: trimmedKey, feature_value: parsed },
          { onConflict: "plan_id,feature_key" }
        );
      if (error) throw error;
      await loadFeatures(currentPlanId);
      setBanner({ kind: "info", msg: "Règle sauvegardée." });
    } catch (e: any) {
      setBanner({ kind: "error", msg: e?.message || "Erreur inconnue lors de la sauvegarde." });
    }
  }

  async function deleteFeature(key: string) {
    setBanner(null);
    if (!confirm(`Supprimer la règle "${key}" pour ${currentPlanLabel} ?`)) return;
    const { error } = await supabase
      .from("plan_features")
      .delete()
      .eq("plan_id", currentPlanId)
      .eq("feature_key", key);
    if (error) {
      setBanner({ kind: "error", msg: "Erreur lors de la suppression." });
      return;
    }
    setFeatures((prev) => prev.filter((f) => f.feature_key !== key));
    setBanner({ kind: "info", msg: "Supprimé." });
  }

  // Render
  if (isAdmin === false) {
    return (
      <div style={{ minHeight: "100vh", maxWidth: 980, margin: "0 auto", padding: 16, color: text, background: bgOuter }}>
        <div style={{ marginBottom: 12, fontSize: 14 }}>
          <Link href="/admin" style={{ color: textSoft, textDecoration: "none" }}>← Retour admin</Link>
        </div>
        <h1 style={{ marginTop: 0 }}>Accès refusé.</h1>
        {banner && (
          <div style={{ marginTop: 12, padding: 10, borderRadius: 8, border: `1px solid #4d2222`, background: "#2a1212", color: "#ffc7c7" }}>
            {banner.msg}
          </div>
        )}
      </div>
    );
  }
  if (loading && !plans.length && isAdmin !== true) {
    return <div style={{ color: text, background: bgOuter, minHeight: "100vh", padding: 16 }}>Chargement…</div>;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        maxWidth: 980,
        margin: "0 auto",
        padding: 16,
        backgroundColor: bgOuter,
        borderRadius: 12,
        border: `1px solid ${border}`,
        color: text,
      }}
    >
      <div style={{ marginBottom: 8, fontSize: 14 }}>
        <Link href="/admin" style={{ textDecoration: "none", color: textSoft }}>
          ← Retour au tableau de bord Admin
        </Link>
      </div>

      <h1 style={{ margin: 0, marginBottom: 8 }}>Admin · Plans</h1>

      {banner && (
        <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, border: `1px solid #355d40`, background: "#172417", color: "#cbe8c8" }}>
          {banner.msg}
        </div>
      )}

      {/* Sélection du plan + options d’affichage + seed */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "8px 0 12px" }}>
        <label style={{ minWidth: 40, color: textSoft }}>Plan :</label>
        <select
          value={currentPlanId}
          onChange={(e) => setCurrentPlanId(e.target.value)}
          style={{ padding: "6px 8px", borderRadius: 8, border: `1px solid ${border}`, background: inputBg, color: text }}
        >
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.id} — {p.label}
            </option>
          ))}
        </select>

        <label style={{ display: "flex", alignItems: "center", gap: 6, color: textSoft }}>
          <input type="checkbox" checked={hideContracts} onChange={(e) => setHideContracts(e.target.checked)} />
          Masquer les avantages inclus par contrat
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 6, color: textSoft }}>
          <input type="checkbox" checked={hideDeprecated} onChange={(e) => setHideDeprecated(e.target.checked)} />
          Masquer les clés obsolètes
        </label>

        <button
          onClick={ensureDefaultPlans}
          title="Crée/Met à jour : free, premium, elite (idempotent)"
          style={{ marginLeft: "auto", padding: "6px 10px", borderRadius: 8, border: `1px solid ${border}`, background: btnBg, color: text, cursor: "pointer" }}
        >
          Créer plans par défaut
        </button>
      </div>

      <h3 style={{ marginTop: 8, marginBottom: 8 }}>Règles pour : {currentPlanLabel}</h3>

      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, background: cardBg, border: `1px solid ${border}`, borderRadius: 10, overflow: "hidden" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: `1px solid ${border}`, padding: 10, width: "30%", color: textSoft }}>
              Clé technique <span style={{ opacity: 0.9 }}>(feature_key)</span>
              <br />
              <span style={{ fontWeight: 400, fontSize: 12, opacity: 0.9 }}>Libellé FR</span>
            </th>
            <th style={{ textAlign: "left", borderBottom: `1px solid ${border}`, padding: 10, color: textSoft }}>
              Valeur JSON (paramètres)
            </th>
            <th style={{ borderBottom: `1px solid ${border}`, padding: 10, width: 180 }}></th>
          </tr>
        </thead>
        <tbody>
          {filteredFeatures.map((row) => (
            <FeatureRowEditor
              key={`${row.feature_key}-${row.plan_id}`}
              row={row}
              onSave={(k, v) => upsertFeatureOrBatch(k, v)}
              onDelete={() => deleteFeature(row.feature_key)}
              codeBg={codeBg}
            />
          ))}

          {/* Ligne d’ajout rapide (simple ou lot) */}
          <tr>
            <td style={{ padding: 10, verticalAlign: "top" }}>
              <input
                placeholder="ex: new_convo_daily_limit  (laisser vide pour un ajout en lot)"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                style={{ width: "100%", padding: "6px 8px", borderRadius: 8, border: `1px solid ${border}`, background: inputBg, color: text }}
              />
              {newKey.trim() && (
                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9, color: textSoft }}>
                  <em>{FEATURE_LABELS[newKey.trim()] ?? humanize(newKey.trim())}</em>
                </div>
              )}
            </td>
            <td style={{ padding: 10 }}>
              <textarea
                rows={3}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                style={{ width: "100%", padding: 8, fontFamily: "monospace", borderRadius: 8, border: `1px solid ${border}`, background: codeBg, color: text }}
              />
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6, color: textSoft }}>
                • Simple : <code style={{ background: codeBg, padding: "2px 4px", borderRadius: 4 }}>{"{\"limit\": 5}"}</code><br />
                • Lot (clé vide) : <code style={{ background: codeBg, padding: "2px 4px", borderRadius: 4 }}>{"{\"new_convo_daily_limit\": {\"limit\": 5}, \"daily_send_limit\": {\"limit\": 100}}"}</code>
              </div>
            </td>
            <td style={{ textAlign: "right", padding: 10, verticalAlign: "top" }}>
              <button
                onClick={() => upsertFeatureOrBatch(newKey.trim(), newValue)}
                style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${border}`, background: btnBg, color: text, cursor: "pointer" }}
              >
                Ajouter / Mettre à jour
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Lexique FR — features actives */}
      <div style={{ marginTop: 24, padding: 12, background: cardBg, border: `1px solid ${border}`, borderRadius: 10 }}>
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Lexique (features actives)</h3>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, fontSize: 14, color: textSoft }}>
          <li>
            <b>new_convo_daily_limit</b> — <u>Nouvelles conversations / jour</u>. Limite le nombre de <i>premiers messages</i> envoyés vers un <i>nouvel interlocuteur</i> (aucun fil existant).  
            Type : <code style={{ background: codeBg, padding: "2px 4px", borderRadius: 4 }}>{"{\"limit\": number}"}</code>.  
            Exemples : FREE 5 / PREMIUM 25 / ELITE 60. (Reset quotidien ; réponses dans un fil existant non comptées.)
          </li>
          <li>
            <b>daily_send_limit</b> — Limite quotidienne d’envois (tous messages/actions confondus).  
            Type : <code style={{ background: codeBg, padding: "2px 4px", borderRadius: 4 }}>{"{\"limit\": number}"}</code>.
          </li>
          <li>
            <b>see_profile_views</b> — Affiche la liste des personnes ayant consulté mon profil.  
            Type : <code style={{ background: codeBg, padding: "2px 4px", borderRadius: 4 }}>{"{\"enabled\": boolean}"}</code>.
          </li>
          <li>
            <b>see_read_receipts</b> — Accusés de lecture (“Vu à …”).  
            Type : <code style={{ background: codeBg, padding: "2px 4px", borderRadius: 4 }}>{"{\"enabled\": boolean}"}</code>. <i>Note :</i> à câbler côté app si non présent.
          </li>

          <li>
            <b>weekly_boosts</b> — Nombre de boosts hebdomadaires.  
            Type : <code style={{ background: codeBg, padding: "2px 4px", borderRadius: 4 }}>{"{\"count\": number}"}</code>.
          </li>
          <li>
            <b>heart_cost</b> — Coût d’un cœur (crédits/points internes).  
            Type : <code style={{ background: codeBg, padding: "2px 4px", borderRadius: 4 }}>{"{\"cost\": number}"}</code>.
          </li>
          <li>
            <b>heart_gift_quota</b> — Cœurs offerts par mois (bonus commercial).  
            Type : <code style={{ background: codeBg, padding: "2px 4px", borderRadius: 4 }}>{"{\"count\": number}"}</code>.
          </li>
        </ul>
        <div style={{ marginTop: 10, color: textSoft }}>
          <b>Offres par régions :</b> à gérer via <i>Cohortes</i> (groupes géographiques + overrides).
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Ligne d’édition d’une feature
// ============================================================================
function FeatureRowEditor({
  row,
  onSave,
  onDelete,
  codeBg,
}: {
  row: { plan_id: string; feature_key: string; feature_value: any };
  onSave: (k: string, rawJson: string) => void;
  onDelete: () => void;
  codeBg: string;
}) {
  // Resynchroniser l’éditeur si on change de plan / valeur
  const [raw, setRaw] = useState<string>(() => JSON.stringify(row.feature_value ?? {}, null, 2));
  useEffect(() => {
    setRaw(JSON.stringify(row.feature_value ?? {}, null, 2));
  }, [row.plan_id, row.feature_key, row.feature_value]);

  const border = "#2b323c";
  const translated = FEATURE_LABELS[row.feature_key] ?? humanize(row.feature_key);

  return (
    <tr>
      <td style={{ padding: 10, verticalAlign: "top" }}>
        <code>{row.feature_key}</code>
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9, color: "#cbd5e1" }}>
          <em>{translated}</em>
        </div>
      </td>
      <td style={{ padding: 10 }}>
        <textarea
          rows={4}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          style={{
            width: "100%",
            padding: 8,
            fontFamily: "monospace",
            borderRadius: 8,
            border: `1px solid ${border}`,
            background: codeBg,
            color: "#f3f4f6",
          }}
        />
      </td>
      <td style={{ textAlign: "right", padding: 10, verticalAlign: "top" }}>
        <button
          onClick={() => onSave(row.feature_key, raw)}
          style={{
            marginRight: 8,
            padding: "8px 10px",
            borderRadius: 8,
            border: `1px solid ${border}`,
            background: "#222833",
            color: "#f3f4f6",
            cursor: "pointer",
          }}
        >
          Enregistrer
        </button>
        <button
          onClick={onDelete}
          style={{
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #6b2d2d",
            background: "#2a1515",
            color: "#ffb3b3",
            cursor: "pointer",
          }}
        >
          Supprimer
        </button>
      </td>
    </tr>
  );
}
