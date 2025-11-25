// pages/comptabilite/index.tsx (UTF-8)
// Comptabilité — superadmin-only, tableau récap (10 colonnes fixes), période mois/trim/année.
// Ajout DEV_BYPASS : si NEXT_PUBLIC_COMPTA_BYPASS=1 alors on affiche la page sans check superadmin.

import { useEffect, useMemo, useState } from 'react';
import { requireSuperadmin } from '@/lib/auth_comptabilite/requireSuperadmin';
import { ComptaRecapTable } from '@/components/comptabilite/ComptaRecapTable';
import { PRODUCT_REGISTRY, PRODUCT_IDS } from '@/lib/comptabilite/products';
import { Tx } from '@/lib/comptabilite/pivot';
import { supabase } from '@/lib/supabaseClient';

// 🔓 Bypass DEV : placez NEXT_PUBLIC_COMPTA_BYPASS=1 dans .env.local pour désactiver le garde
const DEV_BYPASS = process.env.NEXT_PUBLIC_COMPTA_BYPASS === '1';

type PeriodKind = 'month' | 'quarter' | 'year';

function NotFoundLocal() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>404</h1>
      <p>Page introuvable.</p>
    </div>
  );
}

function periodRange(kind: PeriodKind, value: string): { start: string; end: string } {
  if (kind === 'month') {
    const [y, m] = value.split('-').map(Number);
    const start = `${y}-${String(m).padStart(2, '0')}-01`;
    const endDay = new Date(y, m, 0).getDate();
    return { start, end: `${y}-${String(m).padStart(2, '0')}-${String(endDay).padStart(2, '0')}` };
  }
  if (kind === 'quarter') {
    const [ys, qs] = value.split('-Q'); const y = Number(ys); const q = Number(qs);
    const sm = (q - 1) * 3 + 1, em = sm + 2, endDay = new Date(y, em, 0).getDate();
    return { start: `${y}-${String(sm).padStart(2, '0')}-01`, end: `${y}-${String(em).padStart(2, '0')}-${String(endDay).padStart(2, '0')}` };
  }
  const y = Number(value); return { start: `${y}-01-01`, end: `${y}-12-31` };
}

export default function ComptabilitePage() {
  const [allowed, setAllowed] = useState<null | boolean>(null);
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [periodKind, setPeriodKind] = useState<PeriodKind>('month');
  const [periodValue, setPeriodValue] = useState<string>(defaultMonth);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Tx[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const { start, end } = useMemo(() => periodRange(periodKind, periodValue), [periodKind, periodValue]);

  // Garde d’accès : si DEV_BYPASS, on autorise directement.
  useEffect(() => {
    let mounted = true;
    if (DEV_BYPASS) {
      setAllowed(true);
      return () => { mounted = false; };
    }
    requireSuperadmin().then((res) => { if (mounted) setAllowed(res.ok); });
    return () => { mounted = false; };
  }, []);

  async function fetchData() {
    setLoading(true); setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('table_comptabilite')
        .select('id, recorded_on, email, invoice_no, sku, qty, unit_price_ht_cents, vat_rate_bp, stripe_fee_cents')
        .gte('recorded_on', start)
        .lte('recorded_on', end)
        .order('recorded_on', { ascending: true });
      if (error) throw error;
      setRows((data ?? []) as Tx[]);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Erreur de chargement'); setRows([]);
    } finally { setLoading(false); }
  }

  useEffect(() => { if (allowed) fetchData(); /* eslint-disable-next-line */ }, [allowed, start, end]);

  // Utilise le bypass pour décider de l’accès
  const isAllowed = DEV_BYPASS ? true : allowed;

  if (isAllowed === null) return <div style={{ padding: 24 }}>Chargement…</div>;
  if (!isAllowed) return <NotFoundLocal />;

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Comptabilité</h1>
      <div style={{ color: '#666', marginBottom: 16 }}>Accès superadmin confirmé.</div>

      {/* Filtres période */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <label>
          Type&nbsp;
          <select value={periodKind} onChange={(e) => {
            const k = e.target.value as PeriodKind; setPeriodKind(k);
            if (k === 'month') setPeriodValue(defaultMonth);
            if (k === 'quarter') setPeriodValue(`${now.getFullYear()}-Q${Math.floor(now.getMonth()/3)+1}`);
            if (k === 'year') setPeriodValue(String(now.getFullYear()));
          }}>
            <option value="month">Mois</option>
            <option value="quarter">Trimestre</option>
            <option value="year">Année</option>
          </select>
        </label>

        {periodKind === 'month' && (
          <label> Mois&nbsp;
            <input type="month" value={periodValue} onChange={(e) => setPeriodValue(e.target.value)} />
          </label>
        )}

        {periodKind === 'quarter' && (
          <>
            <label> Année&nbsp;
              <input type="number" min={2000} max={2100}
                value={periodValue.split('-Q')[0] || String(now.getFullYear())}
                onChange={(e) => setPeriodValue(`${e.target.value || now.getFullYear()}-Q${periodValue.split('-Q')[1] || '1'}`)}
                style={{ width: 100 }} />
            </label>
            <label> Trimestre&nbsp;
              <select
                value={periodValue.split('-Q')[1] || '1'}
                onChange={(e) => setPeriodValue(`${periodValue.split('-Q')[0] || now.getFullYear()}-Q${e.target.value}`)}>
                <option value="1">T1</option><option value="2">T2</option>
                <option value="3">T3</option><option value="4">T4</option>
              </select>
            </label>
          </>
        )}

        {periodKind === 'year' && (
          <label> Année&nbsp;
            <input type="number" min={2000} max={2100} value={periodValue}
              onChange={(e) => setPeriodValue(e.target.value)} style={{ width: 100 }} />
          </label>
        )}

        <button onClick={fetchData} disabled={loading} style={{ padding: '6px 10px' }}>
          {loading ? 'Chargement…' : 'Actualiser'}
        </button>
      </div>

      {/* Formulaire d’entrée rapide */}
      <QuickEntry onSaved={fetchData} />

      {/* Tableau récap — 10 colonnes fixes */}
      <ComptaRecapTable transactions={rows} productIds={PRODUCT_IDS} registry={PRODUCT_REGISTRY} />

      {errorMsg && <div style={{ color: 'crimson', marginTop: 12 }}>Erreur : {errorMsg}</div>}
    </div>
  );
}

// Import à la fin pour rester lisible en haut
import { QuickEntry } from '@/components/comptabilite/QuickEntry';
