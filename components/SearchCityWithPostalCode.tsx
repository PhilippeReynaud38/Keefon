// -*- coding: utf-8 -*-
// components/recherche/SearchCityWithPostalCode.tsx — Vivaya
//
// But : champ ville + code postal avec suggestions, y compris quand
//       l’utilisateur ne tape pas les accents (ex. "beziers" → "Béziers").
// Règles Vivaya : simple, lisible, robuste, UTF-8, commentaires conservés.
// Aucune modif SQL nécessaire (accent-folding côté client).

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient"; // adapte si besoin

type CommuneRow = {
  nom_commune: string;
  code_postal: string;
};

type Suggestion = {
  ville: string;
  code_postal: string;
  display: string;
};

export default function SearchCityWithPostalCode() {
  const [cityInput, setCityInput] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<Suggestion[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedPostalCode, setSelectedPostalCode] = useState<string>("");
  const [notFound, setNotFound] = useState(false);

  // --- Accent folding : "Évreux" -> "evreux"
  const fold = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  // Variantes accentuées pour la 1re lettre (meilleur “superset” côté DB)
  const variantsMap = useMemo<Record<string, string[]>>(
    () => ({
      a: ["a", "A", "à", "À", "â", "Â", "ä", "Ä", "á", "Á", "ã", "Ã"],
      c: ["c", "C", "ç", "Ç"],
      e: ["e", "E", "é", "É", "è", "È", "ê", "Ê", "ë", "Ë"],
      i: ["i", "I", "î", "Î", "ï", "Ï", "í", "Í", "ì", "Ì"],
      o: ["o", "O", "ô", "Ô", "ö", "Ö", "ó", "Ó", "ò", "Ò", "õ", "Õ"],
      u: ["u", "U", "ù", "Ù", "û", "Û", "ü", "Ü", "ú", "Ú"],
      y: ["y", "Y", "ÿ", "Ÿ"],
    }),
    []
  );

  // Recherche (debounce léger)
  useEffect(() => {
    const q = cityInput.trim();

    // Si saisie trop courte → reset
    if (q.length < 2) {
      setCitySuggestions([]);
      setNotFound(false);
      return;
    }

    // Si la saisie correspond déjà à "Ville (CP)" → pas de recherche
    if (/^\s*.+\s*\(\d{5}\)\s*$/.test(q)) {
      setNotFound(false);
      return;
    }

    const timer = setTimeout(async () => {
      const fq = fold(q);
      const first = q[0] ?? "";
      const base = fold(first);
      const variants =
        variantsMap[base] ?? [first.toLowerCase(), first.toUpperCase()];

      // Superset côté DB : OR de "nom_commune ilike <var>%"
      // (Supabase encode l’expression .or() tout seul)
      const orExpr = variants.map((v) => `nom_commune.ilike.${v}%`).join(",");

      const { data, error } = await supabase
        .from("communes_fr")
        .select("nom_commune, code_postal")
        .or(orExpr)
        .order("nom_commune", { ascending: true })
        .limit(600);

      if (error || !data) {
        setCitySuggestions([]);
        setNotFound(false);
        return;
      }

      // Filtrage accent-insensible côté client + top 20
      const filtered = (data as CommuneRow[])
        .filter((d) => fold(d.nom_commune).startsWith(fq))
        .slice(0, 20)
        .map((d) => ({
          ville: d.nom_commune,
          code_postal: d.code_postal,
          display: `${d.nom_commune} (${d.code_postal})`,
        }));

      setCitySuggestions(filtered);
      setNotFound(filtered.length === 0);
    }, 220);

    return () => clearTimeout(timer);
  }, [cityInput, variantsMap]);

  // Sélection d’une ville
  const handleCitySelect = (city: string, postalCode: string) => {
    setSelectedCity(city);
    setSelectedPostalCode(postalCode);
    setCityInput(`${city} (${postalCode})`); // Remplit l’input proprement
    setCitySuggestions([]);
    setNotFound(false);
  };

  return (
    <div className="relative">
      <input
        id="city-with-postal"
        type="text"
        value={cityInput}
        onChange={(e) => {
          setCityInput(e.target.value);
          setSelectedCity("");
          setSelectedPostalCode("");
        }}
        placeholder="Entrez le nom d'une ville"
        className="w-full rounded border px-2 py-1"
        aria-autocomplete="list"
        aria-expanded={citySuggestions.length > 0}
      />

      {(citySuggestions.length > 0 || notFound) && (
        <ul
          role="listbox"
          className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded border bg-white text-sm"
        >
          {citySuggestions.map((city, idx) => (
            <li
              role="option"
              aria-selected={false}
              key={`${city.ville}-${city.code_postal}-${idx}`}
              className="cursor-pointer px-2 py-1 hover:bg-gray-100"
              onMouseDown={(e) => e.preventDefault()} // évite blur avant click
              onClick={() => handleCitySelect(city.ville, city.code_postal)}
            >
              {city.display}
            </li>
          ))}
          {notFound && citySuggestions.length === 0 && (
            <li className="px-2 py-1 text-gray-500">Aucune ville trouvée</li>
          )}
        </ul>
      )}

      {selectedCity && selectedPostalCode && (
        <p className="mt-2 text-sm text-gray-700">
          Ville sélectionnée : <strong>{selectedCity}</strong>{" "}
          (<strong>{selectedPostalCode}</strong>)
        </p>
      )}
    </div>
  );
}
