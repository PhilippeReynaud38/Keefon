// -*- coding: utf-8 -*-
// /components/SuggestedProfiles.tsx — Vivaya
//
// RÈGLES VIVAYA (résumé) :
// 1) Code robuste, simple, lisible ; aucun effet de bord caché.
// 2) Zéro bug toléré ; commentaires sobres et utiles ; UTF-8.
// 3) Pas d’“usine à gaz” : on filtre côté front prudemment.
// 4) Ne pas toucher aux autres fichiers / types globaux.
//
// Objet : suggérer jusqu’à 4 profils pertinents pour l’utilisateur courant.
// Données : lit depuis `visible_profiles_v`.
// Filtres front par défaut :
//  - Réciprocité orientation/genre (genre / genre_recherche).
//  - Âge ±5 (depuis birthday).
//  - Distance ≤ 10 km (via table communes_fr).
//  - Priorité aux nouveaux si created_at (tri front, non bloquant).
//  - Anti-répétition inter-sessions (max 2 fois).
//
// Correction demandée :
//  - `postal_code` doit être `string | null` (pas `undefined`) pour `ProfileCardDTO`.
//  - `age` strictement `number` (garanti par filtre), `city` = `string | null`.
//  - Aucune autre modification.
//
// Dépendances :
//  - "@/lib/supabaseClient" : client Supabase initialisé.
//  - "@/components/ProfileCard" : rendu d’une carte profil.
//  - "@/lib/types" : type `ProfileCardDTO`.
//
// Effets de bord : stockage local (anti-répétition).
// Dernière MAJ : 2025-10-29

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProfileCard from "@/components/ProfileCard";
import { ProfileCardDTO } from "@/lib/types";

type CurrentUserProps = {
  id: string;
  age: number;
  gender: "H" | "F";
  desiredGender: "H" | "F"; // genre_recherche
  lat: number;
  lon: number;
};

type Props = {
  currentUser: CurrentUserProps;
  title?: string;
  className?: string;
};

type Row = {
  id: string;
  username: string | null;
  genre: "H" | "F" | null;
  genre_recherche: "H" | "F" | null;
  birthday: string | null;
  code_postal: string | null;
  avatar_url?: string | null;
  main_photo_url?: string | null;
  is_certified?: boolean | null;
  created_at?: string | null;
};

function normalizePhotoUrl(path: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data?.publicUrl ?? null;
}

function ageFromBirthday(birthday?: string | null): number | undefined {
  if (!birthday) return undefined;
  const b = new Date(birthday);
  if (Number.isNaN(+b)) return undefined;
  const t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
  return a >= 0 && a < 130 ? a : undefined;
}

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Anti-répétition inter-sessions (max 2 fois)
const SEEN_STORAGE_KEY = "vivaya_suggested_seen_v1";
const SEEN_LIMIT = 2;

function readSeenCounts(): Record<string, number> {
  try {
    const raw = localStorage.getItem(SEEN_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}
function writeSeenCounts(map: Record<string, number>) {
  try {
    localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

export default function SuggestedProfiles({
  currentUser,
  title = "Profils suggérés",
  className = "",
}: Props) {
  const [items, setItems] = useState<ProfileCardDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // 1) Charger des candidats (lot large), puis filtrer côté front
        const { data, error } = await supabase
          .from("visible_profiles_v")
          .select(
            "id, username, genre, genre_recherche, birthday, code_postal, avatar_url, main_photo_url, is_certified, created_at"
          )
          .neq("id", currentUser.id)
          .limit(80);

        if (error) throw error;
        const rows = (data ?? []) as Row[];

        // 2) Préparer la carte CP -> lat/lon
        const cps = Array.from(new Set(rows.map((r) => r.code_postal).filter(Boolean))) as string[];
        const geoMap = new Map<string, { lat: number; lon: number }>();
        if (cps.length) {
          const { data: geo, error: geoErr } = await supabase
            .from("communes_fr")
            .select("code_postal, lat, lon")
            .in("code_postal", cps);
          if (geoErr) throw geoErr;
          for (const g of geo ?? []) {
            if (g?.code_postal != null && typeof g.lat === "number" && typeof g.lon === "number") {
              geoMap.set(g.code_postal, { lat: g.lat, lon: g.lon });
            }
          }
        }

        // 3) Filtres par défaut robustes
        const userIsHetero = currentUser.desiredGender !== currentUser.gender;
        const allowedCandidateGender = userIsHetero ? currentUser.desiredGender : currentUser.gender;

        let filtered = rows.filter((r) => {
          if (!r.genre || !r.genre_recherche || !r.birthday || !r.code_postal) return false;

          // Réciprocité orientation/genre
          if (r.genre !== allowedCandidateGender) return false;
          if (userIsHetero) {
            if (r.genre_recherche !== currentUser.gender) return false;
          } else {
            if (r.genre_recherche !== r.genre) return false;
          }

          // Âge ±5
          const rAge = ageFromBirthday(r.birthday);
          if (rAge === undefined) return false;
          if (Math.abs(rAge - currentUser.age) > 5) return false;

          // Distance ≤ 10 km
          const theirs = geoMap.get(r.code_postal)!;
          if (!theirs) return false;
          const d = distanceKm(currentUser.lat, currentUser.lon, theirs.lat, theirs.lon);
          if (d > 10) return false;

          return true;
        });

        // 4) Tri priorisant les nouveaux (si created_at)
        filtered.sort((a, b) => {
          if (!a.created_at && !b.created_at) return 0;
          if (!a.created_at) return 1;
          if (!b.created_at) return -1;
          return String(b.created_at).localeCompare(String(a.created_at));
        });

        // 5) Anti-répétition + max 4
        const seen = readSeenCounts();
        const notOverSeen = filtered.filter((r) => (seen[r.id] ?? 0) < SEEN_LIMIT);

        const uniq = new Map<string, Row>();
        for (const r of notOverSeen) if (!uniq.has(r.id)) uniq.set(r.id, r);
        const finalRows = Array.from(uniq.values()).slice(0, 4);

        // 6) Mapping → DTO
        //    NOTE : `age!` est sûr ici (filtre birthday+âge déjà passé).
        const mapped: ProfileCardDTO[] = finalRows.map((r) => {
          const pos = r.code_postal ? geoMap.get(r.code_postal) : undefined;
          const dKm = pos
            ? Math.round(distanceKm(currentUser.lat, currentUser.lon, pos.lat, pos.lon) * 10) / 10
            : 0;

          const age = ageFromBirthday(r.birthday)!; // number garanti

          return {
            id: r.id,
            username: r.username ?? "profil",
            age,
            city: null,                                // ✅ string | null (conforme DTO)
            postal_code: r.code_postal ?? null,        // ✅ string | null (PAS undefined)
            main_photo_url: normalizePhotoUrl(r.avatar_url ?? r.main_photo_url ?? null),
            certified: !!r.is_certified,
            traits: [],                                // tableau simple, typé par le DTO
            distance_km: dKm,
          };
        });

        setItems(mapped);

        // 7) Incrémenter les compteurs vus
        const toInc = { ...seen };
        for (const p of mapped) toInc[p.id] = (toInc[p.id] ?? 0) + 1;
        writeSeenCounts(toInc);
      } catch (e: any) {
        console.error("[SuggestedProfiles] error:", e?.message ?? e);
        setErr("Impossible de charger les profils suggérés pour le moment.");
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser]);

  const content = useMemo(() => {
    if (loading) return <p className="text-sm text-gray-600">Chargement des suggestions…</p>;
    if (err) return <p className="text-sm text-red-600">{err}</p>;
    if (!items.length) return <p className="text-sm text-gray-600">Aucun profil suggéré pour l’instant.</p>;
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((p) => (
          <ProfileCard key={p.id} profile={p} />
        ))}
      </div>
    );
  }, [loading, err, items]);

  return (
    <section className={className}>
      <h2 className="text-lg font-semibold text-gray-800 mb-3">{title}</h2>
      {content}
    </section>
  );
}
