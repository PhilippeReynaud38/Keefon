// scripts/backup_user_directory.ts
// Encodage : UTF-8
// Objet : Export "fichier de sauvegarde" des utilisateurs (CSV horodaté) à conserver à part.
// Règles Vivaya : code robuste, simple, commenté, zéro gadget, aucun effet de bord inattendu.

// ─────────────────────────────────────────────────────────────────────────────
// Dépendances minimales :
//   npm i --save-dev ts-node typescript @types/node
//   npm i pg @supabase/supabase-js
// Exécution :
//   npx ts-node scripts/backup_user_directory.ts
// Variables d'env requises (au choix) :
//   Option A (recommandé) : PG_CONNECTION_STRING (postgresql://USER:PWD@HOST:PORT/DB?sslmode=require)
//   Option B : SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (permet aussi l'upload dans Storage)
// Le script crée backups/users_backup_YYYYMMDD_HHmmss.csv
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

// ── Utilitaire : horodatage "sûr"
function timestampForFile(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

// ── Utilitaire : échappement CSV minimal et robuste
function toCsvRow(fields: (string | number | boolean | null)[]): string {
  const esc = (v: string | number | boolean | null) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    // Échappe si contient " ou , ou \n
    if (/[",\n]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  return fields.map(esc).join(',');
}

// ── SQL d’export : jointures minimales, ville priorisée, année de naissance calculée, abonnement booléen.
const EXPORT_SQL = `
with last_city as (
  select distinct on (ul.user_id)
         ul.user_id,
         ul.city
    from public.user_localisations ul
   order by ul.user_id, ul.updated_at desc nulls last
),
sub_active as (
  select s.user_id,
         bool_or(lower(s.status) = 'active') as is_subscribed
    from public.subscriptions s
   group by s.user_id
)
select
  p.id::text                                  as user_id,
  u.email                                     as email,
  case when ps.birthday is not null
       then extract(year from ps.birthday)::int
       else null end                           as birth_year,
  ps.gender                                   as gender,
  nullif(coalesce(nullif(btrim(ps.ville), ''), nullif(btrim(lc.city), '')), '') as city,
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

// ── Optionnel : upload vers Supabase Storage si variables présentes
async function uploadToSupabaseStorage(supabase: SupabaseClient, localPath: string, objectPath: string): Promise<void> {
  // Bucket conseillé : "backups" (public ou privé au choix). Crée-le une fois via le dashboard.
  const fileBuffer = await fs.promises.readFile(localPath);
  const { error } = await supabase.storage.from('backups').upload(objectPath, fileBuffer, {
    contentType: 'text/csv; charset=utf-8',
    upsert: true,
  });
  if (error) {
    throw new Error(`Upload Supabase Storage échoué : ${error.message}`);
  }
}

async function main(): Promise<void> {
  console.log('→ Démarrage export utilisateurs (CSV)…');

  const outDir = path.resolve(process.cwd(), 'backups');
  await fs.promises.mkdir(outDir, { recursive: true });
  const ts = timestampForFile();
  const csvPath = path.join(outDir, `users_backup_${ts}.csv`);

  // Prépare en-tête CSV (UTF‑8, pas de BOM par défaut)
  const headers = [
    'user_id',
    'email',
    'birth_year',
    'gender',
    'city',
    'height_cm',
    'orientation',
    'is_subscribed',
    'exported_at', // utile pour tracer quand l’export a été généré
  ];
  const exportedAt = new Date().toISOString();

  // Connexion via node-postgres (recommandé pour lecture cross-schema, incl. auth.users)
  const pgCnx = process.env.PG_CONNECTION_STRING;

  // Fallback : client Supabase pour upload Storage si clés présentes (pas utilisé pour la requête SQL brute)
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSrvKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = (supabaseUrl && supabaseSrvKey)
    ? createSupabaseClient(supabaseUrl, supabaseSrvKey)
    : null;

  if (!pgCnx) {
    console.error('✖ PG_CONNECTION_STRING manquant. Exemple : postgresql://USER:PWD@HOST:PORT/DB?sslmode=require');
    console.error('   (Optionnel) SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY permettent aussi l’upload dans Storage.');
    process.exit(1);
  }

  const client = new Client({
    connectionString: pgCnx,
    // Remarque : active le SSL si besoin (souvent requis sur Supabase)
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // Exécute la requête d’export
    const res = await client.query(EXPORT_SQL);

    // Écrit le CSV progressivement pour éviter de charger toute la sortie en mémoire (robuste si dataset large)
    const writeStream = fs.createWriteStream(csvPath, { encoding: 'utf8', flags: 'w' });

    // Ligne d'en-têtes
    writeStream.write(toCsvRow(headers) + '\n');

    for (const row of res.rows) {
      // Normalisation douce des valeurs
      const record = [
        row.user_id ?? '',
        row.email ?? '',
        (row.birth_year ?? '') as any,
        row.gender ?? '',
        row.city ?? '',
        (row.height_cm ?? '') as any,
        row.orientation ?? '',
        (row.is_subscribed === true) ? 'true' : 'false',
        exportedAt,
      ];
      writeStream.write(toCsvRow(record) + '\n');
    }

    // Termine l’écriture
    await new Promise<void>((resolve, reject) => {
      writeStream.end(() => resolve());
      writeStream.on('error', reject);
    });

    console.log(`✔ Export CSV écrit : ${csvPath}`);

    // Optionnel : copie dans Supabase Storage/backups
    if (supabase) {
      const objectPath = `users_backup_${ts}.csv`;
      try {
        await uploadToSupabaseStorage(supabase, csvPath, objectPath);
        console.log(`✔ Copie uploadée dans Storage bucket 'backups' : ${objectPath}`);
      } catch (e: any) {
        console.warn(`⚠ Upload Storage non bloquant : ${e?.message || e}`);
      }
    }

    console.log('✓ Sauvegarde terminée proprement.');
  } catch (err: any) {
    console.error('✖ Erreur pendant la sauvegarde :', err?.message || err);
    process.exitCode = 1;
  } finally {
    // Fermeture propre
    try { await client.end(); } catch { /* no-op */ }
  }
}

main().catch((e) => {
  console.error('✖ Erreur inattendue :', e?.message || e);
  process.exit(1);
});
