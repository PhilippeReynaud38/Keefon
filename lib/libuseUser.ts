// lib/libuseUser.ts
// ✅ Vivaya – Hook d’accès au user (logique nettoyée, UTF-8)
// 🔒 Toute logique de redirection est désormais centralisée dans _app.tsx
// 📦 Ce fichier peut servir à exposer des infos personnalisées du user

import { useUser } from '@supabase/auth-helpers-react';

// ✅ Tu peux enrichir ce hook plus tard si besoin
export function useCustomUser() {
  const user = useUser();

  return {
    user,
    userId: user?.id || null,
    email: user?.email || null,
    username: user?.user_metadata?.username || null,
    // Tu peux ajouter d'autres champs ici si tu veux centraliser des infos
  };
}
