// -*- coding: utf-8 -*-
// components/CityAutocomplete.tsx — Vivaya
//
// Autocomplete "Ville (CP)" basé sur la RPC SQL `public.search_communes_prefix`.
// Règles Vivaya: simple, robuste, commenté, maintenable, zéro gadgets.
//
// Points clés de cette version :
//  - Empêche la réouverture avec "Aucune ville trouvée" après sélection.
//  - N'affiche "Aucune ville trouvée" qu'après une vraie réponse.
//  - Déclenche la recherche à partir de 2 caractères (préfixe, accent-insensible).

import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Suggestion = { ville: string; code_postal: string; display: string };

type Props = {
  initialValue?: string;                 // ex: "Béziers (34500)"
  onSelect: (ville: string, cp: string) => void;
  limit?: number;                        // nb max d’items affichés (défaut 12)
};

const MIN_CHARS = 2;
const RPC_NAME = "search_communes_prefix";
const SELECTED_FORMAT = /\(\d{5}\)\s*$/; // "Ville (12345)" → valeur "verrouillée"

export default function CityAutocomplete({
  initialValue = "",
  onSelect,
  limit = 12,
}: Props) {
  const [value, setValue] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Suggestion[]>([]);
  const [highlight, setHighlight] = useState(0);
  const [hasFetched, setHasFetched] = useState(false); // vrai après 1 réponse

  // Sélection "verrouillée" (évite une recherche sur "Ville (CP)")
  const [selectedDisplay, setSelectedDisplay] = useState<string | null>(
    SELECTED_FORMAT.test(initialValue) ? initialValue : null
  );

  // Évite UNE recherche juste après un choose()
  const suppressNextSearch = useRef(false);

  const reqId = useRef(0);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const q = value.trim();

  const list = useMemo(() => rows.slice(0, limit), [rows, limit]);

  useEffect(() => {
    // 0) Si on vient d'une sélection : ignorer UNE recherche.
    if (suppressNextSearch.current) {
      suppressNextSearch.current = false;
      setOpen(false);
      setHasFetched(false);
      return;
    }

    // 1) Si la valeur est "verrouillée" (format Ville (CP)), ne pas chercher.
    if (selectedDisplay && value === selectedDisplay) {
      setOpen(false);
      setHasFetched(false);
      return;
    }
    if (SELECTED_FORMAT.test(q)) {
      // Cas où initialValue est déjà au bon format
      setOpen(false);
      setHasFetched(false);
      return;
    }

    // 2) Trop court → rien
    if (q.length < MIN_CHARS) {
      setRows([]);
      setOpen(false);
      setHasFetched(false);
      return;
    }

    // 3) Recherche RPC (préfixe, accent-insensible)
    const run = async () => {
      setLoading(true);
      setOpen(true);
      setHighlight(0);
      setHasFetched(false);
      const id = ++reqId.current;

      try {
        const { data, error } = await supabase.rpc(RPC_NAME, {
          q,
          lim: 25,
          off: 0,
        });
        if (error) throw error;
        if (reqId.current !== id) return; // requête obsolète

        const items: Suggestion[] = (data ?? []).map((d: any) => ({
          ville: d.nom_commune,
          code_postal: d.code_postal,
          display: `${d.nom_commune} (${d.code_postal})`,
        }));
        setRows(items);
      } catch {
        if (reqId.current === id) setRows([]);
      } finally {
        if (reqId.current === id) {
          setLoading(false);
          setHasFetched(true);
        }
      }
    };

    const t = setTimeout(run, 200); // petit debounce
    return () => clearTimeout(t);
  }, [q, selectedDisplay, value]);

  // Fermer au clic extérieur
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const choose = (s: Suggestion) => {
    const disp = s.display;
    setSelectedDisplay(disp);     // verrouille "Ville (CP)"
    suppressNextSearch.current = true; // ignore l’effet suivant
    setValue(disp);
    setRows([]);
    setOpen(false);
    setHasFetched(false);
    onSelect(s.ville, s.code_postal);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || list.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((i) => (i + 1) % list.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((i) => (i - 1 + list.length) % list.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(list[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={boxRef} className="relative">
      <input
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          setValue(v);
          setOpen(true);
          // Si l’utilisateur retape, on déverrouille la sélection
          if (selectedDisplay && v !== selectedDisplay) {
            setSelectedDisplay(null);
          }
        }}
        onFocus={() => {
          if (selectedDisplay && value === selectedDisplay) return; // verrouillé
          if (q.length >= MIN_CHARS) setOpen(true);
        }}
        onKeyDown={onKeyDown}
        placeholder="Nom de ville ou code postal"
        autoComplete="off"
        className="w-full rounded border px-3 py-2"
        aria-autocomplete="list"
        aria-expanded={open}
      />

      {open && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded border bg-white shadow">
          {loading && (
            <div className="px-3 py-2 text-sm text-gray-500">Recherche…</div>
          )}

          {/* N’affiche ce message que si la recherche courante a vraiment répondu */}
          {!loading && hasFetched && q.length >= MIN_CHARS && list.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">
              Aucune ville trouvée
            </div>
          )}

          {!loading &&
            list.map((s, i) => (
              <button
                key={`${s.ville}-${s.code_postal}-${i}`}
                className={`block w-full px-3 py-2 text-left text-sm ${
                  i === highlight ? "bg-blue-50" : ""
                }`}
                onMouseDown={(e) => {
                  e.preventDefault(); // évite blur avant click
                  choose(s);
                }}
                onMouseEnter={() => setHighlight(i)}
              >
                {s.display}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
