// lib/comptabilite/format.ts
// UTF-8
// Helpers d'affichage (EUR, labels) — zéro dépendance lourde.

import { PRODUCT_REGISTRY, ProductRegistry } from './products';

export function formatEUR(cents: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format((cents || 0) / 100);
}

export function cents(n: number): string {
  return String((n ?? 0) / 100).replace('.', ','); // pour CSV FR
}

export function labelFor(id: string, registry: ProductRegistry = PRODUCT_REGISTRY): string {
  return registry.find(p => p.id === id)?.label ?? id;
}

export type { ProductRegistry };
