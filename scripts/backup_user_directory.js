// scripts/backup_user_directory.js
// Encodage : UTF-8
// Objet : Sauvegarde locale CSV des utilisateurs (email, année de naissance, genre, ville, taille, orientation, abonné).
// Usage : node scripts/backup_user_directory.js
// Var d'env requise : PG_CONNECTION_STRING (postgresql://USER:PWD@HOST:PORT/DB?sslmode=require)

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function ts() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

// Échappement CSV minimal et robuste
function toCsvRow(fields) {
  const esc = v => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return fields.map(esc).join(',');
}

// Requête : jointures en lecture seule
const EXPORT_SQL = `
with last_city as (
  select distinct on (ul.user_id) ul.user_id, ul.city
  from public.user_localisations ul
  order by ul.user_id, ul.updated_at desc nulls last
),
sub_active as (
  select s.user_id, bool_or(lower(s.status)='active') as is_subscribed
  from public.subscriptions s
  group by s.user_id
)
select
  p.id::text                                  as user_id,
  u.email                                     as email,
  case when ps.birthday is not null then extract(year from ps.birthday)::int end as birth_year,
  ps.gender                                   as gender,
  nullif(coalesce(nullif(btrim(ps.ville),''), nullif(btrim(lc.city),'')), '') as city,
  ps.height_cm                                as height_cm,
  ps.orientation                              as orientation,
  coalesce(sa.is_subscribed, false)           as is_subscribed
from public.profiles p
left join auth.users u on u.id = p.id
left join public.presignup_data ps on ps.user_id = p.id
left join last_city lc on lc.user_id = p.id
left join sub_active sa on sa.user_id = p.id
order by p.id asc;
`;

async function main() {
  console.log('→ Sauvegarde locale utilisateurs (CSV)…');

  const cnx = process.env.PG_CONNECTION_STRING;
  if (!cnx) {
    console.error('✖ Variable PG_CONNECTION_STRING manquante.');
    console.error('  Exemple : postgresql://postgres:PASS@HOST:5432/postgres?sslmode=require');
    process.exit(1);
  }

  // Dossier sortie
  const outDir = path.resolve(process.cwd(), 'backups');
  await fs.promises.mkdir(outDir, { recursive: true });
  const outfile = path.join(outDir, `users_backup_${ts()}.csv`);

  const client = new Client({ connectionString: cnx, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    const res = await client.query(EXPORT_SQL);

    const ws = fs.createWriteStream(outfile, { encoding: 'utf8', flags: 'w' });

    // (Option Excel) Décommente la ligne suivante pour écrire le BOM UTF‑8 :
    // ws.write('\uFEFF');

    // En‑têtes
    const headers = [
      'user_id','email','birth_year','gender','city','height_cm','orientation','is_subscribed','exported_at'
    ];
    ws.write(toCsvRow(headers) + '\n');

    const exportedAt = new Date().toISOString();

    for (const row of res.rows) {
      const record = [
        row.user_id ?? '',
        row.email ?? '',
        row.birth_year ?? '',
        row.gender ?? '',
        row.city ?? '',
        row.height_cm ?? '',
        row.orientation ?? '',
        row.is_subscribed === true ? 'true' : 'false',
        exportedAt
      ];
      ws.write(toCsvRow(record) + '\n');
    }

    await new Promise((resolve, reject) => {
      ws.end(resolve);
      ws.on('error', reject);
    });

    console.log(`✔ Sauvegarde créée : ${outfile}`);
    console.log('✓ Terminé.');
  } catch (e) {
    console.error('✖ Erreur pendant la sauvegarde :', e?.message || e);
    process.exitCode = 1;
  } finally {
    try { await client.end(); } catch {}
  }
}

main();
