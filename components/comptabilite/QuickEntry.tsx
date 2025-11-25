// components/comptabilite/QuickEntry.tsx (UTF-8)
// Entrée rapide : date, email, facture, produit, prix TTC (€).
// ⚠️ On enregistre le montant saisi en base dans unit_price_ht_cents mais on l’interprète désormais comme TTC côté affichage.
// TVA fixée à 20% (2000 bp). Frais Stripe forcés à 0 pour l’instant.

import { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { PRODUCT_REGISTRY } from '@/lib/comptabilite/products';
import { formatEUR } from '@/lib/comptabilite/format';

type Props = { onSaved: () => void };

function euroToCents(input: string): number {
  const cleaned = input.replace(/\s/g, '').replace(',', '.');
  const value = Number(cleaned);
  if (!isFinite(value) || value < 0) return 0;
  return Math.round(value * 100);
}

export function QuickEntry({ onSaved }: Props) {
  const todayISO = new Date().toISOString().slice(0, 10);
  const products = useMemo(() => PRODUCT_REGISTRY, []);

  const [recordedOn, setRecordedOn] = useState<string>(todayISO);
  const [email, setEmail] = useState<string>('');
  const [invoiceNo, setInvoiceNo] = useState<string>('');
  const [sku, setSku] = useState<string>(products[0]?.id || '');
  const [priceTTC, setPriceTTC] = useState<string>('0');

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>('');
  const [okMsg, setOkMsg] = useState<string>('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErr(''); setOkMsg('');
    try {
      if (!recordedOn) throw new Error('Date requise');
      if (!email || !email.includes('@')) throw new Error('Email invalide');
      if (!invoiceNo) throw new Error('Numéro de facture requis');
      if (!sku) throw new Error('Produit requis');

      const unit_price_ttc_cents = euroToCents(priceTTC);

      // On persiste dans unit_price_ht_cents (hérité du schéma), mais on lira/affichera comme TTC.
      const { error } = await supabase.from('table_comptabilite').insert([{
        recorded_on: recordedOn,
        email,
        invoice_no: invoiceNo,
        sku,
        qty: 1,
        unit_price_ht_cents: unit_price_ttc_cents, // ← interprété comme TTC côté tableau/CSV
        vat_rate_bp: 2000,     // 20,00 %
        stripe_fee_cents: 0,   // pas de Stripe pour l’instant
        payment_method: 'autre',
      }]);
      if (error) throw error;

      setOkMsg(
        `Ajouté : ${email} — ${invoiceNo} — ${products.find(p => p.id === sku)?.label} — ${formatEUR(unit_price_ttc_cents)} TTC`
      );
      setPriceTTC('0');
      onSaved();
    } catch (e: any) {
      setErr(e?.message || 'Échec de l’enregistrement');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ border: '1px solid #eee', padding: 12, borderRadius: 8, marginBottom: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Entrée rapide</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <label style={{ minWidth: 150 }}>
          Date<br />
          <input type="date" value={recordedOn} onChange={(e) => setRecordedOn(e.target.value)} />
        </label>
        <label style={{ minWidth: 240 }}>
          Email client<br />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@domaine.tld" />
        </label>
        <label style={{ minWidth: 180 }}>
          N° facture<br />
          <input type="text" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="F2025-0001" />
        </label>
        <label style={{ minWidth: 220 }}>
          Produit<br />
          <select value={sku} onChange={(e) => setSku(e.target.value)}>
            {products.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </label>
        <label style={{ minWidth: 160 }}>
          Prix TTC (€)<br />
          <input type="text" inputMode="decimal" value={priceTTC} onChange={(e) => setPriceTTC(e.target.value)} />
        </label>
      </div>
      <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button type="submit" disabled={saving} style={{ padding: '6px 10px' }}>
          {saving ? 'Enregistrement…' : 'Ajouter'}
        </button>
        {err && <span style={{ color: 'crimson' }}>Erreur : {err}</span>}
        {okMsg && <span style={{ color: 'green' }}>{okMsg}</span>}
      </div>
    </form>
  );
}
