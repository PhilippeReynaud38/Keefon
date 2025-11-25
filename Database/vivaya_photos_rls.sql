-- UTF-8 – vivaya_photos_rls.sql
-- Politique de sécurité RLS pour la table photos (galerie utilisateur principale)

-- 1. ✅ Activer la sécurité RLS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- 2. 🔍 Lecture : chacun voit ses propres photos + les admins peuvent tout voir
DROP POLICY IF EXISTS "Allow read to admin or owner" ON photos;
CREATE POLICY "Allow read to admin or owner"
ON photos
FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.is_admin = TRUE
  )
);

-- 3. ✏️ Insertion : uniquement pour soi-même
DROP POLICY IF EXISTS "Allow insert own photo" ON photos;
CREATE POLICY "Allow insert own photo"
ON photos
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 4. 📝 Modification : uniquement ses propres photos
DROP POLICY IF EXISTS "Allow update own photo" ON photos;
CREATE POLICY "Allow update own photo"
ON photos
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 5. 🗑 Suppression : uniquement ses propres photos
DROP POLICY IF EXISTS "Allow delete own photo" ON photos;
CREATE POLICY "Allow delete own photo"
ON photos
FOR DELETE
USING (user_id = auth.uid());
