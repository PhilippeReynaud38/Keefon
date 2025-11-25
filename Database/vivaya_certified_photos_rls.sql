-- UTF-8 – vivaya_certified_photos_rls.sql
-- Politique de sécurité RLS pour la table certified_photos

-- 1. ✅ Activer la sécurité RLS
ALTER TABLE certified_photos ENABLE ROW LEVEL SECURITY;

-- 2. 🔍 Lecture : seuls les admins peuvent lire toutes les photos, sinon on limite à soi-même
DROP POLICY IF EXISTS "Allow read to admin or owner" ON certified_photos;
CREATE POLICY "Allow read to admin or owner"
ON certified_photos
FOR SELECT
USING (
  -- admin : accès global
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.is_admin = TRUE
  )
  -- ou propriétaire
  OR user_id = auth.uid()
);

-- 3. ✏️ Insertion : chaque utilisateur peut ajouter sa propre photo
DROP POLICY IF EXISTS "Allow insert own photo" ON certified_photos;
CREATE POLICY "Allow insert own photo"
ON certified_photos
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
);

-- 4. 📝 Mise à jour : chaque utilisateur peut modifier ses propres photos non validées
DROP POLICY IF EXISTS "Allow update own photo if pending" ON certified_photos;
CREATE POLICY "Allow update own photo if pending"
ON certified_photos
FOR UPDATE
USING (
  user_id = auth.uid() AND status = 'pending'
)
WITH CHECK (
  user_id = auth.uid()
);

-- 5. 🗑 Suppression : uniquement par un administrateur
DROP POLICY IF EXISTS "Allow delete only for admin" ON certified_photos;
CREATE POLICY "Allow delete only for admin"
ON certified_photos
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.is_admin = TRUE
  )
);
