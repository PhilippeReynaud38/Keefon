// -*- coding: utf-8 -*-
// Fichier : /pages/recherche.tsx
// Projet  : Keefon parfois il s'appel Vivaya
//
// Rôle : Page de recherche de profils avec filtres de base + filtres avancés
//        (réservés aux abonnés via useSubscription). Cette version remplace
//        l’ancien filtre “A des animaux” par deux filtres normalisés :
//        “Fume ?” et “Alcool ?” dont les valeurs sont exactement
//        "oui" | "non" | "occasionnellement".
//
// Sources de données :
//   - RPC  trouver_profils_proches(uid, rayon_m, age_min, age_max, center_cp)
//   - Lecture des attributs profil depuis public.profiles
//       (traits, souhaite_enfants, a_des_enfants, taille, niveau_etude, fume, alcool)
//   - Lecture de genre_recherche depuis public.presignup_data
//   - certified_photos (badge certifié) + profiles.certified_status
//   - photos (avatars Storage -> publicUrl)
//
// 🔒 Confidentialité (07/11) :
//   - Filtrage après la RPC via 2 RPC défendeurs :
//       * get_privacy_flags(p_ids uuid[]) -> (user_id, is_public, cert_only)
//       * get_viewer_is_certified() -> boolean
//   - Aucune RLS élargie côté client.
//
// Règles Keefon : robustesse, simplicité, commentaires conservés, UTF-8.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";

import CityAutocomplete from "@/components/recherche/CityAutocomplete";
import AgeRangeSlider from "@/components/recherche/AgeRangeSlider";
import SearchResultCard, {
  type ProfileCardData,
} from "@/components/recherche/SearchResultCard";
import useSubscription from "@/abonnement/useSubscription";
import Footer from "@/components/Footer"; // ✅ petit lien légal en bas

// ------------ Types ---------------------------------------------------------
type RpcProfil = {
  id: string;
  username: string | null;
  ville: string | null;
  code_postal?: string | null;
  birthday: string | null;
  distance_m: number | null;
};

type MyPrefs = { userId: string; mySeek: string | null };

const STUDY_LEVEL_OPTIONS = [
  "Collège / Lycée",
  "Bac",
  "Bac +2",
  "Bac +3",
  "Bac +5 et plus",
] as const;

type ChoiceYN = "" | "oui" | "non";
type ChoiceYNOcc = "" | "oui" | "non" | "occasionnellement";

// ------------ Utils ---------------------------------------------------------
function normalizeTraits(input: unknown): string[] {
  if (Array.isArray(input))
    return Array.from(
      new Set(input.map(String).map((s) => s.trim()).filter(Boolean))
    ).slice(0, 6);
  if (typeof input === "string")
    return Array.from(
      new Set(
        input
          .split(/[,|/•\-]+|\s{2,}/g)
          .map((s) => s.trim())
          .filter(Boolean)
      )
    ).slice(0, 6);
  return [];
}

function calcAge(birthdayISO: string | null): number | undefined {
  if (!birthdayISO) return undefined;
  const b = new Date(birthdayISO);
  if (Number.isNaN(b.getTime())) return undefined;
  const t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
  return age;
}

function extractCpFromLabel(label: string | null | undefined): string | null {
  if (!label) return null;
  const m = label.match(/\b(\d{5})\b/);
  return m ? m[1] : null;
}

function isYes(v: unknown): boolean {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "oui" || s === "true" || s === "1";
}
function isNo(v: unknown): boolean {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "non" || s === "false" || s === "0";
}

// 🔒 Statut certifié du viewer — via RPC SECURITY DEFINER
async function viewerIsCertified(): Promise<boolean> {
  const { data, error } = await supabase.rpc("get_viewer_is_certified");
  if (error) {
    console.error("[recherche] get_viewer_is_certified:", error);
    return false;
  }
  return data === true;
}

// 🔵 Liste des utilisateurs à cacher (mode "antibrouteur")
async function loadAntibrouteurSet(candidateIds: string[]): Promise<Set<string>> {
  if (!candidateIds.length) return new Set();
  try {
    const { data, error } = await supabase
      .from("antibrouteurs_ids_v")
      .select("user_id")
      .in("user_id", candidateIds);
    if (error) {
      console.error("[recherche] antibrouteurs:", error);
      return new Set();
    }
    return new Set((data ?? []).map((r: any) => String(r.user_id)));
  } catch (e) {
    console.error("[recherche] antibrouteurs:", e);
    return new Set();
  }
}

// ===========================================================================

function Recherche() {
  const router = useRouter();

  // Abonnement (gating)
  const _subRaw = useSubscription() as any;
  const isSubscribed =
    typeof _subRaw === "boolean"
      ? _subRaw
      : !!(
          _subRaw?.isActive ??
          _subRaw?.active ??
          (_subRaw?.plan && String(_subRaw.plan).toLowerCase() !== "free")
        );
  const subLoading = false;
  const canUseAdvanced =
    isSubscribed || process.env.NEXT_PUBLIC_ALLOW_ADVANCED_FILTERS_FOR_ALL === "1";

  // Filtres de base
  const [ville, setVille] = useState("");
  const [codePostal, setCodePostal] = useState("");
  const [distanceKm, setDistanceKm] = useState(200);
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(99);

  // Filtres avancés
  const [onlyCertified, setOnlyCertified] = useState<boolean>(false);
  const [wantsKids, setWantsKids] = useState<ChoiceYN>("");
  const [hasKids, setHasKids] = useState<ChoiceYN>("");
  const [smokes, setSmokes] = useState<ChoiceYNOcc>(""); // profiles.fume
  const [drinks, setDrinks] = useState<ChoiceYNOcc>(""); // profiles.alcool
  const [heightMin, setHeightMin] = useState<number | "">("");
  const [heightMax, setHeightMax] = useState<number | "">("");
  const [studyLevel, setStudyLevel] = useState<string>("");

  // Système
  const [prefs, setPrefs] = useState<MyPrefs | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<ProfileCardData[]>([]);

  const [filtersHydrated, setFiltersHydrated] = useState(false);
  const [autoSearched, setAutoSearched] = useState(false);
  const [cityInputVersion, setCityInputVersion] = useState(0);

  // Hydrate filtres depuis localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("vivaya_search_filters");
      if (raw) {
        const p = JSON.parse(raw);
        setVille(p.ville ?? "");
        setCodePostal(p.codePostal ?? "");
        setDistanceKm(typeof p.distanceKm === "number" ? p.distanceKm : 200);
        setAgeMin(typeof p.ageMin === "number" ? p.ageMin : 18);
        setAgeMax(typeof p.ageMax === "number" ? p.ageMax : 99);
        setOnlyCertified(!!p.onlyCertified);
        setWantsKids(p.wantsKids ?? "");
        setHasKids(p.hasKids ?? "");
        setSmokes(p.smokes ?? "");
        setDrinks(p.drinks ?? "");
        setHeightMin(typeof p.heightMin === "number" ? p.heightMin : "");
        setHeightMax(typeof p.heightMax === "number" ? p.heightMax : "");
        setStudyLevel(p.studyLevel ?? "");
      }
    } finally {
      setFiltersHydrated(true);
    }
  }, []);

  // Sauvegarde filtres dans localStorage
  useEffect(() => {
    if (!filtersHydrated) return;
    localStorage.setItem(
      "vivaya_search_filters",
      JSON.stringify({
        ville,
        codePostal,
        distanceKm,
        ageMin,
        ageMax,
        onlyCertified,
        wantsKids,
        hasKids,
        smokes,
        drinks,
        heightMin,
        heightMax,
        studyLevel,
      })
    );
  }, [
    filtersHydrated,
    ville,
    codePostal,
    distanceKm,
    ageMin,
    ageMax,
    onlyCertified,
    wantsKids,
    hasKids,
    smokes,
    drinks,
    heightMin,
    heightMax,
    studyLevel,
  ]);

  // Préférences user (ce que je recherche)
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return setPrefs(null);

      const { data, error } = await supabase
        .from("presignup_data")
        .select("genre_recherche")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        setPrefs({ userId: user.id, mySeek: null });
        return;
      }
      setPrefs({ userId: user.id, mySeek: (data as any)?.genre_recherche ?? null });
    })();
  }, []);

  // Auto-recherche à l’arrivée
  useEffect(() => {
    if (filtersHydrated && prefs && !autoSearched) {
      (async () => {
        await handleSearch();
        setAutoSearched(true);
      })();
    }
  }, [filtersHydrated, prefs, autoSearched]);

  // Reset
  const resetFilters = async () => {
    setVille("");
    setCodePostal("");
    setDistanceKm(200);
    setAgeMin(18);
    setAgeMax(99);
    setOnlyCertified(false);
    setWantsKids("");
    setHasKids("");
    setSmokes("");
    setDrinks("");
    setHeightMin("");
    setHeightMax("");
    setStudyLevel("");
    setCityInputVersion((v) => v + 1);
    localStorage.removeItem("vivaya_search_filters");
    if (prefs) await handleSearch();
  };

  // Recherche principale
  const handleSearch = async () => {
    if (!prefs) return;
    setLoading(true);
    setError(null);
    setCards([]);
    try {
      const minA = Math.min(ageMin, ageMax);
      const maxA = Math.max(ageMin, ageMax);
      const chosenCp = codePostal || extractCpFromLabel(ville) || null;

      const { data: rpcData, error: rpcErr } = await supabase.rpc("trouver_profils_proches", {
        uid: prefs.userId,
        rayon_m: Math.min(Math.round(distanceKm * 1000), 200000),
        age_min: minA,
        age_max: maxA,
        center_cp: chosenCp,
      });
      if (rpcErr) throw rpcErr;

      // === 🔒 CONFIDENTIALITÉ via RPC =======================================
      const rows = (rpcData ?? []) as RpcProfil[];
      const allIds = rows.map((r) => r.id);

      // 1) Flags candidats (SECURITY DEFINER)
      const { data: flags, error: flagsErr } = await supabase.rpc("get_privacy_flags", {
        p_ids: allIds,
      });
      if (flagsErr) throw flagsErr;

      const fMap = new Map<string, { is_public: boolean; cert_only: boolean }>();
      for (const r of flags ?? []) {
        const row = r as any;
        fMap.set(String(row.user_id), {
          is_public: row.is_public !== false,
          cert_only: !!row.cert_only,
        });
      }

      // 2) Statut certifié du viewer
      const viewerCert = await viewerIsCertified();

      // 3) Filtre final (défauts : public & pas cert_only)
      const rowsVisible = rows.filter((r) => {
        const f = fMap.get(r.id) ?? { is_public: true, cert_only: false };
        return f.is_public && (!f.cert_only || viewerCert);
      });

      if (rowsVisible.length === 0) {
        setCards([]);
        return;
      }
      // =====================================================================

      // 🔵 Exclure les profils marqués "antibrouteur"
      const antiSet = await loadAntibrouteurSet(rowsVisible.map((r) => r.id));
      const cleanRows = rowsVisible.filter((r) => !antiSet.has(r.id));

      if (cleanRows.length === 0) {
        setCards([]);
        return;
      }

      const baseById = new Map<string, ProfileCardData>();
      for (const r of cleanRows) {
        baseById.set(r.id, {
          id: r.id,
          user_id: r.id,
          username: r.username ?? "—",
          age: calcAge(r.birthday),
          city: r.ville ?? undefined,
          distance_km:
            r.distance_m != null ? Math.round((r.distance_m / 1000) * 10) / 10 : undefined,
          traits: [],
          photos: [],
        } as ProfileCardData & { certified?: boolean; is_certified?: boolean });
      }
      const ids = Array.from(baseById.keys());

      // Certif (pour filtre onlyCertified)
      const { data: certRows, error: certErr } = await supabase
        .from("certified_photos")
        .select("user_id, status")
        .in("user_id", ids)
        .eq("status", "approved");
      if (certErr) throw certErr;
      const certifiedSet = new Set((certRows ?? []).map((r: any) => r.user_id as string));

      // Lecture colonnes dans `profiles`
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select(
          "id, traits, souhaite_enfants, a_des_enfants, niveau_etude, taille, fume, alcool"
        )
        .in("id", ids);
      if (pErr) throw pErr;

      // Appliquer les filtres avancés SEULEMENT si autorisés
      const applied = {
        onlyCertified: canUseAdvanced && onlyCertified,
        wantsKids: canUseAdvanced ? wantsKids : "",
        hasKids: canUseAdvanced ? hasKids : "",
        smokes: canUseAdvanced ? smokes : "",
        drinks: canUseAdvanced ? drinks : "",
        heightMin: canUseAdvanced ? heightMin : "",
        heightMax: canUseAdvanced ? heightMax : "",
        studyLevel: canUseAdvanced ? studyLevel : "",
      };

      const keptIds: string[] = [];
      for (const p of profiles ?? []) {
        const pid = (p as any).id as string;

        if (applied.onlyCertified && !certifiedSet.has(pid)) continue;
        if (applied.wantsKids === "oui" && !isYes((p as any).souhaite_enfants)) continue;
        if (applied.wantsKids === "non" && !isNo((p as any).souhaite_enfants)) continue;
        if (applied.hasKids === "oui" && !isYes((p as any).a_des_enfants)) continue;
        if (applied.hasKids === "non" && !isNo((p as any).a_des_enfants)) continue;

        // Fume ?
        if (applied.smokes) {
          const v = String((p as any).fume ?? "").trim().toLowerCase();
          if (v !== applied.smokes) continue;
        }
        // Alcool ?
        if (applied.drinks) {
          const v = String((p as any).alcool ?? "").trim().toLowerCase();
          if (v !== applied.drinks) continue;
        }

        // Taille
        const height = Number.parseInt(
          String((p as any).taille ?? "").replace(/\D+/g, ""),
          10
        );
        if (Number.isFinite(height)) {
          if (applied.heightMin !== "" && height < Number(applied.heightMin)) continue;
          if (applied.heightMax !== "" && height > Number(applied.heightMax)) continue;
        } else if (applied.heightMin !== "" || applied.heightMax !== "") {
          continue;
        }

        // Niveau d’études
        if (applied.studyLevel) {
          const v = String((p as any).niveau_etude ?? "").trim();
          if (v !== applied.studyLevel) continue;
        }

        const e = baseById.get(pid) as
          | (ProfileCardData & { certified?: boolean; is_certified?: boolean })
          | undefined;
        if (!e) continue;
        e.traits = normalizeTraits((p as any).traits);
        const c = certifiedSet.has(pid);
        e.certified = c;
        e.is_certified = c;
        keptIds.push(pid);
      }

      if (keptIds.length === 0) {
        setCards([]);
        return;
      }

      // Photos public URL
      const { data: photos, error: phErr } = await supabase
        .from("photos")
        .select("user_id, url, is_main")
        .in("user_id", keptIds);
      if (phErr) throw phErr;

      const grouped = new Map<string, { url: string; is_main?: boolean }[]>();
      for (const row of photos ?? []) {
        const list = grouped.get(row.user_id) ?? [];
        const { data } = supabase.storage.from("avatars").getPublicUrl(row.url);
        const publicUrl = data?.publicUrl || null;
        if (publicUrl)
          list.push({ url: publicUrl, is_main: row.is_main ?? undefined });
        grouped.set(row.user_id, list);
      }

      for (const id of keptIds) {
        const e = baseById.get(id);
        if (!e) continue;
        const list = (grouped.get(id) ?? []).sort(
          (a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0)
        );
        (e as any).photos = list.slice(0, 6);
      }

      setCards(keptIds.map((id) => baseById.get(id)!).filter(Boolean));
    } catch (e: any) {
      console.error(e);
      setError("Supabase : " + (e?.message ?? "Erreur inconnue"));
    } finally {
      setLoading(false);
    }
  };

  const searchDisabled = useMemo(
    () => loading || !prefs?.mySeek,
    [loading, prefs]
  );
  const resultsCount = cards.length;

  // ------------------------------ UI ----------------------------------------
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Fond image sécurisé */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[-1] bg-[url('/bg-recherche-ext.png')] bg-cover bg-center md:bg-fixed"
      />
      {/* Conteneur principal */}
      <div className="min-h-screen">
        <div className="mx-auto max-w-3xl px-3 sm:px-4 py-5 sm:py-8">
          {/* Nav */}
          <div className="mb-3 sm:mb-4 flex items-center">
            <button
              onClick={() => router.back()}
              className="bg-pink-100 hover:bg-pink-200 text-pink-800 font-semibold rounded-full shadow 
                         px-3 py-1.5 text-xs sm:text-sm md:text-base whitespace-nowrap"
            >
              Retour
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="ml-auto bg-green-100 hover:bg-green-200 text-green-800 font-semibold rounded-full shadow 
                         px-3 py-1.5 text-xs sm:text-sm md:text-base whitespace-nowrap"
            >
              Tableau de bord
            </button>
          </div>

          {/* En-tête */}
          <div className="mb-5 sm:mb-6">
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold tracking-tight text-gray-900">
              Recherche de profils
            </h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-xl md:text-2xl text-gray-700">
              Vous recherchez : <b>{prefs?.mySeek ?? "—"}</b>
            </p>
          </div>

          {/* Carte filtres */}
          <div className="rounded-2xl bg-white/90 shadow-sm ring-1 ring-gray-200 backdrop-blur p-3 sm:p-6 md:p-7">
            <div className="space-y-5 sm:space-y-6 md:space-y-7">
              {/* Ville */}
              <div>
                <label className="mb-1 block text-base sm:text-2xl md:text-3xl font-medium text-gray-700">
                  Ville (optionnel)
                </label>
                <CityAutocomplete
                  key={cityInputVersion}
                  initialValue={
                    ville && codePostal ? `${ville} (${codePostal})` : ville || ""
                  }
                  onSelect={(v, cp) => {
                    setVille(v);
                    setCodePostal(cp);
                  }}
                />
                <p className="mt-2 text-xs sm:text-base md:text-xl text-gray-600 leading-snug">
                  Si vide, recherche centrée sur la ville de votre profil.
                </p>
              </div>

              {/* Distance */}
              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <label className="text-base sm:text-2xl md:text-3xl font-medium text-gray-700">
                    Distance maximale
                  </label>
                  <span className="text-base sm:text-2xl md:text-3xl tabular-nums text-gray-900">
                    {distanceKm} km
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={200}
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              {/* Tranche d'âge */}
              <div className="text-xs sm:text-base md:text-xl">
                <AgeRangeSlider
                  minAge={ageMin}
                  maxAge={ageMax}
                  onChange={(min, max) => {
                    setAgeMin(min);
                    setAgeMax(max);
                  }}
                />
              </div>

              {/* Filtres avancés */}
              <details className="rounded-xl border border-gray-200 bg-white/90 p-3 sm:p-5" open>
                <summary className="cursor-pointer select-none text-lg sm:text-2xl md:text-3xl font-semibold text-gray-900">
                  Filtres avancés
                  {!subLoading && !canUseAdvanced && (
                    <span className="ml-2 text-sm sm:text-base md:text-xl text-amber-700 font-medium">
                      (réservés aux abonnés)
                    </span>
                  )}
                </summary>

                <div className="relative mt-4">
                  {!canUseAdvanced && (
                    <div className="absolute inset-0 z-10 grid place-items-center rounded-lg bg-white/70 backdrop-blur-[1px]">
                      <div className="text-center px-4">
                        <div className="font-semibold text-gray-900">
                          Débloquez les filtres avancés
                        </div>
                        <p className="text-sm sm:text-base md:text-xl text-gray-600 mt-1">
                          Profils certifiés, enfants, fume/alcool, taille, niveau d’études…
                        </p>
                        <button
                          onClick={() => router.push("/abonnement")}
                          className="mt-3 px-4 py-2 rounded-xl bg-amber-500 text-white font-semibold shadow hover:bg-amber-500/90"
                        >
                          Découvrir l’abonnement
                        </button>
                      </div>
                    </div>
                  )}

                  <div
                    className={`${
                      !canUseAdvanced ? "pointer-events-none opacity-60" : ""
                    } grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm sm:text-base md:text-xl`}
                  >
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="accent-blue-600"
                        checked={onlyCertified}
                        onChange={(e) => setOnlyCertified(e.target.checked)}
                        disabled={!canUseAdvanced}
                      />
                      Profils certifiés uniquement
                    </label>

                    <label>
                      Veut des enfants
                      <select
                        className="mt-2 w-full rounded-lg border px-3 py-2 text-sm sm:text-base md:text-xl"
                        value={wantsKids}
                        onChange={(e) => setWantsKids(e.target.value as ChoiceYN)}
                        disabled={!canUseAdvanced}
                      >
                        <option value="">Indifférent</option>
                        <option value="oui">Oui</option>
                        <option value="non">Non</option>
                      </select>
                    </label>

                    <label>
                      A des enfants
                      <select
                        className="mt-2 w-full rounded-lg border px-3 py-2 text-sm sm:text-base md:text-xl"
                        value={hasKids}
                        onChange={(e) => setHasKids(e.target.value as ChoiceYN)}
                        disabled={!canUseAdvanced}
                      >
                        <option value="">Indifférent</option>
                        <option value="oui">Oui</option>
                        <option value="non">Non</option>
                      </select>
                    </label>

                    {/* NEW: Fume ? */}
                    <label>
                      Fume ?
                      <select
                        className="mt-2 w-full rounded-lg border px-3 py-2 text-sm sm:text-base md:text-xl"
                        value={smokes}
                        onChange={(e) => setSmokes(e.target.value as ChoiceYNOcc)}
                        disabled={!canUseAdvanced}
                      >
                        <option value="">Indifférent</option>
                        <option value="oui">Oui</option>
                        <option value="non">Non</option>
                        <option value="occasionnellement">Occasionnellement</option>
                      </select>
                    </label>

                    {/* NEW: Alcool ? */}
                    <label>
                      Alcool ?
                      <select
                        className="mt-2 w-full rounded-lg border px-3 py-2 text-sm sm:text-base md:text-xl"
                        value={drinks}
                        onChange={(e) => setDrinks(e.target.value as ChoiceYNOcc)}
                        disabled={!canUseAdvanced}
                      >
                        <option value="">Indifférent</option>
                        <option value="oui">Oui</option>
                        <option value="non">Non</option>
                        <option value="occasionnellement">Occasionnellement</option>
                      </select>
                    </label>

                    <div>
                      <div className="mb-2 font-medium">Taille (cm)</div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={120}
                          max={230}
                          placeholder="min"
                          className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base md:text-xl"
                          value={heightMin === "" ? "" : heightMin}
                          onChange={(e) =>
                            setHeightMin(e.target.value === "" ? "" : Number(e.target.value))
                          }
                          disabled={!canUseAdvanced}
                        />
                        <span>—</span>
                        <input
                          type="number"
                          min={120}
                          max={230}
                          placeholder="max"
                          className="w-full rounded-lg border px-3 py-2 text-sm sm:text-base md:text-xl"
                          value={heightMax === "" ? "" : heightMax}
                          onChange={(e) =>
                            setHeightMax(e.target.value === "" ? "" : Number(e.target.value))
                          }
                          disabled={!canUseAdvanced}
                        />
                      </div>
                    </div>

                    <label>
                      Niveau d’études
                      <select
                        className="mt-2 w-full rounded-lg border px-3 py-2 text-sm sm:text-base md:text-xl"
                        value={studyLevel}
                        onChange={(e) => setStudyLevel(e.target.value)}
                        disabled={!canUseAdvanced}
                      >
                        <option value="">Indifférent</option>
                        {STUDY_LEVEL_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              </details>

              {/* Actions */}
              <div className="pt-1 flex items-center justify-between gap-2">
                <button
                  onClick={handleSearch}
                  disabled={searchDisabled}
                  className="bg-paleGreen text-white font-semibold rounded 
                             px-3 py-2 text-sm sm:text-base md:text-xl
                             hover:opacity-90 disabled:opacity-60"
                >
                  {loading ? "Recherche…" : "Rechercher"}
                </button>

                <button
                  type="button"
                  onClick={resetFilters}
                  title="Remettre tous les filtres à zéro"
                  className="bg-yellow-500 hover:bg-yellow-500/90 text-white font-semibold rounded 
                             px-3 py-2 text-sm sm:text-base md:text-xl
                             shadow whitespace-nowrap"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>

          {/* Résultats */}
          <div className="mt-5">
            <div className="flex items-baseline justify-between mb-3">
              <div className="text-sm sm:text-lg md:text-2xl text-gray-700">
                {loading ? (
                  "Chargement…"
                ) : (
                  <>
                    <b>{resultsCount}</b> {resultsCount > 1 ? "résultats" : "résultat"}
                  </>
                )}
              </div>
              {error && (
                <p className="text-sm sm:text-lg md:text-2xl text-red-600">
                  Erreur : {error}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {cards.map((c) => (
                <SearchResultCard key={c.id} data={c} />
              ))}
            </div>

            {!loading && cards.length === 0 && (
              <p className="mt-3 text-sm sm:text-lg md:text-xl text-gray-700">
                Aucun profil ne correspond à ces critères.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Petit footer légal commun (CGU · Mentions légales) */}
      <Footer />
    </div>
  );
}

;(Recherche as any).requireAuth = true;
export default Recherche;
