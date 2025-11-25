/**
 * FICHIER : components/recherche/ResultsGrid.tsx
 * RÔLE    : Grille responsive de cartes profil + pagination client simple.
 * DÉPENDS : ProfileCard (../ProfileCard), ProfileCardDTO (../../lib/types)
 *
 * COMPORTEMENT :
 * - Affiche N cartes (page locale) + bouton “Charger N de plus”.
 * - Skeletons si isLoading.
 * - Empty state propre si aucun résultat.
 *
 * RÈGLES VIVAYA :
 * - Patch minimal : adapter onLike pour supporter (id) et (id, action).
 * - Code simple, lisible, UTF-8, commentaires sobres.
 */

import React from "react";
import ProfileCard from "../ProfileCard";
import { ProfileCardDTO } from "../../lib/types";

// Signature cible (utilisée par ProfileCard)
type OnLikeCompat = (id: string, action: "like" | "unlike") => boolean | Promise<boolean>;
// Ancienne signature (déjà présente côté appelant)
type OnLikeLegacy = (id: string) => void;

type Props = {
  items: ProfileCardDTO[];
  pageSize?: number;
  isLoading?: boolean;
  onLike?: OnLikeLegacy | OnLikeCompat;
  onFav?: (id: string) => void;
  onMessage?: (id: string) => void;
};

const Skeleton: React.FC = () => (
  <div className="p-3 rounded-2xl border bg-white animate-pulse">
    <div className="w-full aspect-[4/5] rounded-xl bg-gray-100" />
    <div className="h-4 bg-gray-100 mt-3 rounded w-2/3" />
    <div className="h-3 bg-gray-100 mt-2 rounded w-1/3" />
  </div>
);

const ResultsGrid: React.FC<Props> = ({
  items,
  pageSize = 24,
  isLoading = false,
  onFav,
  onLike,
  onMessage,
}) => {
  const [shown, setShown] = React.useState(pageSize);

  React.useEffect(() => {
    setShown(pageSize);
  }, [items, pageSize]);

  const visible = items.slice(0, shown);
  const hasMore = shown < items.length;

  // Adaptateur onLike : supporte (id) et (id, action). Retour normalisé en boolean/Promise<boolean>.
  const onLikeAdapter: OnLikeCompat | undefined = React.useMemo(() => {
    if (!onLike) return undefined;
    return (id, action) => {
      const result = (onLike as any)(id, action);
      if (typeof result === "boolean") return result;
      if (result && typeof result.then === "function") return result as Promise<boolean>;
      return true;
    };
  }, [onLike]);

  return (
    <section aria-label="Résultats de la recherche" className="mt-6">
      <div className="flex items-center justify-between mb-3 text-sm text-gray-600">
        <span>{items.length} profils — {visible.length}/{items.length} affichés</span>
        <span className="text-gray-500">Tri : distance</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: Math.min(pageSize, 12) }).map((_, i) => <Skeleton key={i} />)
          : visible.map((p) => (
              <ProfileCard
                key={p.id}
                profile={p}
                onFav={onFav}
                onLike={onLikeAdapter}
                onMessage={onMessage}
              />
            ))}
      </div>

      {!isLoading && items.length === 0 && (
        <div className="mt-8 p-6 text-center border rounded-2xl bg-white">
          <div className="text-lg font-medium">Aucun profil</div>
          <div className="text-sm text-gray-600 mt-1">Modifie tes filtres pour élargir la recherche.</div>
        </div>
      )}

      {!isLoading && hasMore && (
        <div className="flex justify-center mt-6">
          <button
            className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50"
            onClick={() => setShown((n) => n + pageSize)}
          >
            Charger {pageSize} de plus
          </button>
        </div>
      )}
    </section>
  );
};

export default ResultsGrid;
