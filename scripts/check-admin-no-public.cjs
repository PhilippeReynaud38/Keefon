// scripts/check-admin-no-public.cjs
const fs = require('fs');
const path = require('path');

const ADMIN_DIR = path.join(process.cwd(), 'pages', 'admin');

// regex qui attrape supabase.from('public.xyz') ou "public.xyz"
const RE = /supabase\s*\.\s*from\s*\(\s*['"]public\.[^'"]*['"]\s*\)/i;

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(p));
    else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) out.push(p);
  }
  return out;
}

const files = listFiles(ADMIN_DIR);
let found = false;

for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  if (RE.test(txt)) {
    // retrouver les lignes coupables
    const lines = txt.split(/\r?\n/);
    lines.forEach((line, i) => {
      if (RE.test(line)) {
        console.error(`❌ Interdit: ${path.relative(process.cwd(), f)}:${i + 1}`);
        console.error(`   ${line.trim()}`);
        found = true;
      }
    });
  }
}

if (found) {
  console.error("\nBloqué: utilise les vues/admin RPC (schema admin.*) au lieu de public.* dans /pages/admin/**.");
  process.exit(1);
} else {
  console.log("✅ OK: aucune requête public.* trouvée dans /pages/admin/**");
  process.exit(0);
}
