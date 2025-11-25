// components/comptabilite/ComptaRecapTable.tsx
// UTF-8
// Tableau récapitulatif : colonnes = produits dynamiques, lignes = email + n° facture,
// cellules = 1 si l’achat correspond à la colonne. Pied = 5 lignes (Nb ventes, TTC, TVA, Stripe, Net).
// ⚠️ Mode TTC : on considère que le prix saisi est TTC. TVA = (TTC * taux), Net = TTC − TVA − Stripe.

import { useMemo } from 'react';
import { BuildPivotResult, buildPivot, Tx } from '@/lib/comptabilite/pivot';
import { cents, formatEUR, labelFor, ProductRegistry } from '@/lib/comptabilite/format';

interface Props {
  transactions: Tx[];
  productIds: string[];             // colonnes à afficher (dynamiques)
  registry: ProductRegistry;        // pour libellés
}

// Sommes TTC/TVA/Stripe/Net par produit (clé = sku)
type TotalsMap = Record<string, number>;

export function ComptaRecapTable({ transactions, productIds, registry }: Props) {
  // On garde le pivot pour la structure (détails + compteurs par colonne)
  const pivot = useMemo<BuildPivotResult>(
    () => buildPivot(transactions, productIds),
    [transactions, productIds]
  );

  // Nouveau bloc de totaux basés sur TTC
  const totals = useMemo(() => {
    const totalTTC: TotalsMap = {};
    const totalTVA: TotalsMap = {};
    const stripe: TotalsMap = {};
    const net: TotalsMap = {};

    const add = (obj: TotalsMap, key: string, value: number) => {
      obj[key] = (obj[key] || 0) + value;
    };

    for (const tx of transactions) {
      const id = tx.sku;
      if (!productIds.includes(id)) continue;

      const qty = tx.qty ?? 1;
      // Ici, on interprète unit_price_ht_cents COMME un prix TTC (volonté produit)
      const lineTTC = (tx.unit_price_ht_cents || 0) * qty;

      // TVA = 20 % du TTC (ou tout autre taux si saisi en basis points)
      const rate = (tx.vat_rate_bp ?? 0) / 10000;        // ex. 2000 bp -> 0.20
      const lineTVA = Math.round(lineTTC * rate);

      // Stripe : on considère stripe_fee_cents comme total ligne (pas par unité)
      const lineStripe = Math.round(tx.stripe_fee_cents || 0);

      const lineNet = lineTTC - lineTVA - lineStripe;

      add(totalTTC, id, lineTTC);
      add(totalTVA, id, lineTVA);
      add(stripe, id, lineStripe);
      add(net, id, lineNet);
    }

    const hasAnyStripe = Object.values(stripe).some((v) => v > 0);

    return { totalTTC, totalTVA, stripe, net, hasAnyStripe };
  }, [transactions, productIds]);

  // Génération CSV (détail + totaux) — colonnes = productIds
  function exportCSV() {
    const sep = ';';
    const head = ['Email', 'Facture', ...productIds.map((id) => labelFor(id, registry))].join(sep);

    const detailLines = pivot.details.map((row) => {
      const cells = productIds.map((id) => String(row.cells[id] ?? 0)).join(sep);
      return [row.email, row.invoice_no, cells].join(sep);
    });

    const fmt = (obj: Record<string, number>) => productIds.map((id) => cents(obj[id] || 0)).join(sep);

    const totalsBlock = [
      [
        'Nb ventes',
        productIds.map((id) => String(pivot.totals.count[id] || 0)).join(sep),
      ],
      ['Total TTC', fmt(totals.totalTTC)],
      ['Total TVA', fmt(totals.totalTVA)],
      ...(totals.hasAnyStripe ? [['Taxe Stripe', fmt(totals.stripe)]] : []),
      ['Résultat net', fmt(totals.net)],
    ].map((row) => row.join(sep));

    const csv = [head, ...detailLines, '', ...totalsBlock].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comptabilite_recap.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // Styles simples
  const cellStyle: React.CSSProperties = {
    padding: '6px 8px',
    borderBottom: '1px solid #eee',
    whiteSpace: 'nowrap',
  };
  const headStyle: React.CSSProperties = {
    ...cellStyle,
    fontWeight: 600,
    position: 'sticky',
    top: 0,
    background: '#fafafa',
  };
  const leftSticky: React.CSSProperties = { position: 'sticky', left: 0, background: '#fff' };
  const leftSticky2: React.CSSProperties = { position: 'sticky', left: 160, background: '#fff' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button onClick={exportCSV} style={{ padding: '6px 10px' }}>
          Exporter CSV
        </button>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: 6 }}>
        <table
          style={{
            borderCollapse: 'separate',
            borderSpacing: 0,
            width: '100%',
            minWidth: 900,
          }}
        >
          <thead>
            <tr>
              <th style={{ ...headStyle, ...leftSticky, minWidth: 160 }}>Email</th>
              <th style={{ ...headStyle, ...leftSticky2, minWidth: 120 }}>Facture</th>
              {productIds.map((id) => (
                <th key={id} style={headStyle}>
                  {labelFor(id, registry)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pivot.details.map((row) => (
              <tr key={row.key}>
                <td style={{ ...cellStyle, ...leftSticky, minWidth: 160 }}>{row.email}</td>
                <td style={{ ...cellStyle, ...leftSticky2, minWidth: 120 }}>{row.invoice_no}</td>
                {productIds.map((id) => (
                  <td key={id} style={{ ...cellStyle, textAlign: 'center' }}>
                    {row.cells[id] ? '1' : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td style={{ ...headStyle, ...leftSticky }} colSpan={2}>
                Nb ventes
              </td>
              {productIds.map((id) => (
                <td key={id} style={{ ...headStyle, textAlign: 'center' }}>
                  {pivot.totals.count[id] || 0}
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ ...headStyle, ...leftSticky }} colSpan={2}>
                Total TTC
              </td>
              {productIds.map((id) => (
                <td key={id} style={{ ...headStyle, textAlign: 'right' }}>
                  {formatEUR(totals.totalTTC[id] || 0)}
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ ...headStyle, ...leftSticky }} colSpan={2}>
                Total TVA
              </td>
              {productIds.map((id) => (
                <td key={id} style={{ ...headStyle, textAlign: 'right' }}>
                  {formatEUR(totals.totalTVA[id] || 0)}
                </td>
              ))}
            </tr>
            {totals.hasAnyStripe && (
              <tr>
                <td style={{ ...headStyle, ...leftSticky }} colSpan={2}>
                  Taxe Stripe
                </td>
                {productIds.map((id) => (
                  <td key={id} style={{ ...headStyle, textAlign: 'right' }}>
                    {formatEUR(totals.stripe[id] || 0)}
                  </td>
                ))}
              </tr>
            )}
            <tr>
              <td style={{ ...headStyle, ...leftSticky }} colSpan={2}>
                Résultat net
              </td>
              {productIds.map((id) => (
                <td key={id} style={{ ...headStyle, textAlign: 'right' }}>
                  {formatEUR(totals.net[id] || 0)}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
