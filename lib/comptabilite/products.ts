// lib/comptabilite/products.ts (UTF-8)
// 10 produits fixes, lisibles, sans "réserves" ni flags.

export interface ProductDef { id: string; label: string; }
export type ProductRegistry = ProductDef[];

export const PRODUCT_REGISTRY: ProductRegistry = [
  { id: 'ABO_MOIS_ESSENTIEL',       label: 'Abo mois – Essentiel' },
  { id: 'ABO_MOIS_KEEFONPLUS',      label: 'Abo mois – Keefon+' },
  { id: 'ABO_TRIMESTRE_ESSENTIEL',  label: 'Abo trim. – Essentiel' },
  { id: 'ABO_TRIMESTRE_KEEFONPLUS', label: 'Abo trim. – Keefon+' },
  { id: 'COEUR_UNITE',              label: 'Cœur (unité)' },
  { id: 'COEUR_PACK',               label: 'Cœurs (pack)' },
  { id: 'COEUR_PACK_EXTRA',         label: 'Cœurs (pack extra)' },
  { id: 'ECHOCOEUR_UNITE',          label: 'Écho-cœur (unité)' },
  { id: 'ECHOCOEUR_PACK',           label: 'Écho-cœurs (pack)' },
  { id: 'ECHOCOEUR_PACK_EXTRA',     label: 'Écho-cœurs (pack extra)' },
];

// Ordre d’affichage des colonnes
export const PRODUCT_IDS: string[] = PRODUCT_REGISTRY.map(p => p.id);
