-- UTF-8 – vivaya_admin_roles_rls.sql
-- Règles de sécurité pour la gestion des administrateurs et superadmins dans la table profiles

-- 1. ✅ Ajout des colonnes sensibles (si elles n’existent pas déjà)
-- ⚠️ À exécuter uniquement si la colonne n’existe pas encore
-- ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
-- ALTER TABLE profiles ADD COLUMN is_superadmin BOOLEAN DEFAULT FALSE;

-- 2. ✅ Activation des politiques RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. 🔁 Politique de lecture : tout utilisateur peut lire les profils
DROP POLICY IF EXISTS "Public read access" ON profiles;
CREATE POLICY "Public read access"
ON profiles
FOR SELECT
USING (true);

-- 4. ✏️ Politique générale de mise à jour : permet à chaque utilisateur de modifier son propre profil
DROP POLICY IF EXISTS "Self profile update" ON profiles;
CREATE POLICY "Self profile update"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. 🔐 Politique stricte : seuls les superadmins peuvent modifier le champ is_admin
DROP POLICY IF EXISTS "Allow superadmin to modify is_admin" ON profiles;
CREATE POLICY "Allow superadmin to modify is_admin"
ON profiles
FOR UPDATE
USING (
  -- Seul le superadmin peut modifier quelqu’un d’autre
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.is_superadmin = TRUE
  )
)
WITH CHECK (
  -- On vérifie que seule une personne avec is_superadmin peut changer is_admin
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.is_superadmin = TRUE
  )
  OR auth.uid() = id
);

-- 6. 🔐 Politique stricte : seuls les superadmins peuvent modifier le champ is_superadmin
DROP POLICY IF EXISTS "Allow update is_superadmin only by superadmin" ON profiles;
CREATE POLICY "Allow update is_superadmin only by superadmin"
ON profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.is_superadmin = TRUE
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.is_superadmin = TRUE
  )
);

-- ✅ Fin – structure RLS claire, logique et robuste
