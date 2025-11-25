// lib/comptabilite/pivot.ts
// UTF-8
// Pivot robuste & générique : calcule lignes (1 par achat) + totaux par colonne produit.

export type Tx = {
  id: string;
  recorded_on: string;          // 'YYYY-MM-DD'
  email: string;
  invoice_no: string;
  sku: string;                  // doit correspondre à un id de produit
  qty: number;                  // 1 par défaut
  unit_price_ht_cents: number;  // ≥ 0
  vat_rate_bp: number;          // ex: 2000 = 20.00%
  stripe_fee_cents: number;     // ≥ 0
};

export interface PivotRowDetail {
  key: string;                                // email — invoice_no
  email: string;
  invoice_no: string;
  cells: Record<string, number>;              // 1 ou 0 par produit
}

export interface PivotTotals {
  count: Record<string, number>;
  totalTTC: Record<string, number>;
  totalTVA: Record<string, number>;
  stripe: Record<string, number>;
  net: Record<string, number>;
}

export interface BuildPivotResult {
  columns: string[];
  details: PivotRowDetail[];
  totals: PivotTotals;
}

function calcHT(tx: Tx) { return (tx.qty || 0) * (tx.unit_price_ht_cents || 0); }
function calcTVA(ht: number, rateBp: number) { return Math.round((ht || 0) * (rateBp || 0) / 10000); }
function calcTTC(ht: number, tva: number) { return (ht || 0) + (tva || 0); }
function clamp01(n: number) { return n > 0 ? 1 : 0; }

export function buildPivot(transactions: Tx[], columns: string[]): BuildPivotResult {
  const details: PivotRowDetail[] = [];
  const init = (v = 0) => Object.fromEntries(columns.map(c => [c, v])) as Record<string, number>;

  const totals: PivotTotals = {
    count: init(0),
    totalTTC: init(0),
    totalTVA: init(0),
    stripe: init(0),
    net: init(0),
  };

  for (const tx of transactions) {
    const ht = calcHT(tx);
    const tva = calcTVA(ht, tx.vat_rate_bp);
    const ttc = calcTTC(ht, tva);
    const net = ht - (tx.stripe_fee_cents || 0); // = TTC - TVA - Stripe

    const row: PivotRowDetail = {
      key: `${tx.email} — ${tx.invoice_no}`,
      email: tx.email,
      invoice_no: tx.invoice_no,
      cells: init(0),
    };

    if (columns.includes(tx.sku)) {
      row.cells[tx.sku] = 1;
      totals.count[tx.sku] += clamp01(tx.qty || 0);
      totals.totalTVA[tx.sku] += tva;
      totals.totalTTC[tx.sku] += ttc;
      totals.stripe[tx.sku] += (tx.stripe_fee_cents || 0);
      totals.net[tx.sku] += net;
    }

    details.push(row);
  }

  return { columns, details, totals };
}
