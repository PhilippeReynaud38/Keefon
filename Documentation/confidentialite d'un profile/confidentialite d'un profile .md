# Vivaya — Guide maintenance « Confidentialité des profils »

_Mise à jour : 2025-11-07_

Ce document explique comment les **paramètres de confidentialité** contrôlent l’affichage des profils
dans **/recherche** et **/dashboard**. Il sert de référence pour la **maintenance** (DB + front)
et vise la simplicité (pas d’usine à gaz), la robustesse et la lisibilité.


DANS LA PAGE PARAMETRES  :

paramètres — réservés aux abonnés ====> Confidentialité du profil
Par défaut, ton profil est visible. 
   --->  Tu peux activer le mode privé pour le cacher. Cacher mon profil (mode privé)
   --->  Seuls les profils certifiés peuvent me voir




---

## 1) Modèle de données (source de vérité)

### Table `public.user_settings`
**Champs utilisés**
- `user_id uuid` (PK)
- `is_public boolean not null default true` → *« Cacher mon profil (mode privé) »* si `false`.
- `visible_to_certified_only boolean not null default false` → *« Seuls les profils certifiés peuvent me voir »* si `true`.

**Index recommandé**
```sql
create index if not exists idx_user_settings_user_id
  on public.user_settings(user_id);
```

**Remarques**
- Aucune colonne de confidentialité **n’est ajoutée** à `public.profiles`.
- Les triggers éventuels d’`updated_at` n’impactent pas la logique.

### Certification d’un viewer
Un viewer est considéré **certifié** si au moins une des conditions est vraie :
1) `public.profiles.certified_status = 'approved'`
2) Existence dans `public.certified_photos` d’une ligne `(user_id = viewer, status = 'approved')`

**Index recommandé**
```sql
create index if not exists idx_cert_photos_user_status
  on public.certified_photos(user_id, status);
```

> La confidentialité reste **isolée** dans `public.user_settings` ; la certification reste
> **isolée** dans `profiles`/`certified_photos`.

---

## 2) RPC (SQL défendues) utilisées par le front

### `public.get_privacy_flags(p_ids uuid[]) returns (user_id, is_public, cert_only)`
**Rôle** : renvoyer en un seul appel les drapeaux de confidentialité pour une **liste** d’IDs.

**Sécurité**
- `SECURITY DEFINER`
- `grant execute on function … to authenticated`
- `revoke all on function … from public`

**Corps déployé**
```sql
create or replace function public.get_privacy_flags(p_ids uuid[])
returns table(user_id uuid, is_public boolean, cert_only boolean)
language sql
security definer
set search_path = public
as $$
  select
    us.user_id,
    coalesce(us.is_public, true)                  as is_public,
    coalesce(us.visible_to_certified_only, false) as cert_only
  from public.user_settings us
  where us.user_id = any(p_ids)
$$;

revoke all on function public.get_privacy_flags(uuid[]) from public;
grant execute on function public.get_privacy_flags(uuid[]) to authenticated;
```

### `public.get_viewer_is_certified() returns boolean`
**Rôle** : déterminer si `auth.uid()` est certifié (via `profiles` **ou** `certified_photos`).

**Sécurité**
- `SECURITY DEFINER`
- `grant execute on function … to authenticated`
- `revoke all on function … from public`

**Corps déployé**
```sql
create or replace function public.get_viewer_is_certified()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(
           select 1 from public.profiles p
           where p.id = auth.uid() and p.certified_status = 'approved'
         )
      or exists(
           select 1 from public.certified_photos c
           where c.user_id = auth.uid() and c.status = 'approved'
         );
$$;

revoke all on function public.get_viewer_is_certified() from public;
grant execute on function public.get_viewer_is_certified() to authenticated;
```

---

## 3) Règle de visibilité (moteur)

Pour un **viewer V** et un **candidat C** :
1) Charger `flags[C] = { is_public, cert_only }` via `get_privacy_flags([C])`.
2) Charger `viewer_is_certified` via `get_viewer_is_certified()`.
3) **Afficher C** si :
   - `flags[C].is_public = true`, **et**
   - (`flags[C].cert_only = false` **ou** `viewer_is_certified = true`).

> Aucun besoin d’élargir les RLS : tout passe par les **RPC security definer**.

---

## 4) Côté Front — fichiers concernés

### `/pages/dashboard.tsx`
**Responsable** : composant `ProfilesArea`.

**Flux**
1. Obtenir la base des **candidats** (proximité/âge) via `rpc('trouver_profils_proches', …)` puis filtrer les **bloqués**.
2. **Confidentialité** :
   - `rpc('get_privacy_flags', { p_ids: candidateIds })`
   - `const vCert = await rpc('get_viewer_is_certified')`
   - Appliquer la règle §3 pour **masquer** les profils privés/cert_only.
3. Lecture facultative : `profiles(id, created_at)` pour flag *nouveau*.
4. Préchargements UI : `photos` (main/publicUrl), `likes` (déjà likés).

**Notes**
- LocalStorage `vivaya_dashboard_seen_v1` limite la répétition visuelle (anti-spam).
- Aucun accès direct à `user_settings` ni `certified_photos` côté client.

### `/pages/recherche.tsx`
**Même logique** après obtention de la liste `candidates` :
- Récupérer les `flags` via `get_privacy_flags` + `viewer_is_certified`,
- Filtrer avec la règle §3,
- Appliquer ensuite les filtres avancés (certifiés uniquement, enfants, fume/alcool, taille, études).

### (Optionnel) `/pages/parametres.tsx` + `components/settings/PrivacySettingsCard.tsx`
- `upsert` simple pour écrire les réglages :
```ts
await supabase.from('user_settings').upsert({
  user_id: session.user.id,
  is_public,
  visible_to_certified_only: certOnly,
}, { onConflict: 'user_id' });
```
- RLS typique : `user_id = auth.uid()` pour `select/insert/update/delete`.

---

## 5) Objets DB consultés (lecture)
- `public.trouver_profils_proches` (RPC existante, proximité/âge).
- `public.profiles (id, created_at, certified_status)` → `created_at` pour *nouveau*, et lecture certif via la RPC ; pas de colonnes de confidentialité ici.
- `public.photos` → URLs publiques des avatars.
- `public.likes` → marquer *déjà liké*.
- `public.user_localisations`, `public.presignup_data` → **pour le viewer** (CP/ville/âge/genres).

---

## 6) Invariants (à ne pas casser)
- **Source unique** des réglages : `public.user_settings`.
- **Pas** de doublon `is_public`/`visible_to_certified_only` dans d’autres tables ou vues.
- **Toujours** filtrer via **les 2 RPC** après avoir construit la liste des candidats.
- RPC = `security definer`, `grant execute to authenticated`, `revoke from public`.
- **Défauts** si absence de ligne `user_settings` : `is_public=true`, `cert_only=false`.

---

## 7) Plan de tests (rapide)

Profils de test connus :
- **H2** (certifié & abonné) → `aac2e829-f271-454d-a43a-b84b1c490395`
- **F1** (non certifiée, non abonnée) → `d2e3af44-fed2-4b0d-bb5b-d3c903cf5899`
- **Mimie** (certifiée non abonnée) → `eafac9ae-dafb-442c-8b22-31ae544de7c8`

Pour chaque **candidat C**, tester ces 4 cas dans `user_settings` de C :
1. `is_public=false` → **jamais visible**.
2. `is_public=true, cert_only=false` → **visible pour tous**.
3. `is_public=true, cert_only=true` + **viewer non certifié** → **masqué**.
4. `is_public=true, cert_only=true` + **viewer certifié** → **visible**.

Vérifier le comportement sur **/recherche** et **/dashboard**.

---

## 8) Dépannage (checklist)
1. **Un profil « privé » apparaît**  
   - Vérifier la ligne `user_settings` (ou son absence ⇒ défauts).  
   - Tester rapidement côté SQL :  
     ```sql
     select * from get_privacy_flags(array['<user_id>'::uuid]);
     select get_viewer_is_certified();
     ```
   - Si les RPC renvoient la bonne info, vérifier l’application du filtre côté front.

2. **Un profil « cert_only » visible par un viewer non certifié**  
   - `get_viewer_is_certified()` doit renvoyer `false` pour ce viewer.  
   - Contrôler `profiles.certified_status='approved'` ou une ligne `certified_photos(..., 'approved')` inexistante.

3. **Erreurs RLS**  
   - S’assurer que le front **n’interroge jamais** `user_settings`/`certified_photos` en direct.
   - Utiliser **exclusivement** les RPC ci-dessus pour la confidentialité.

---

## 9) Extensions futures (sûres)
- Nouveaux scopes (`visibility_scope: 'all'|'certified'`, masquage par zone, etc.) :  
  garder `user_settings` comme **seul** stockage ; étendre **les RPC** si la règle dépasse le front.
- UI : brancher `PrivacySettingsCard` dans `/pages/parametres.tsx` (`upsert` simple).

---

**Contact / rappel**  
– Principe : *une table (user_settings), deux RPC, un filtre front unique.*  
– Ne jamais dupliquer les drapeaux dans d’autres tables/vues.  
– Conserver les index recommandés pour garder des temps de réponse courts.
