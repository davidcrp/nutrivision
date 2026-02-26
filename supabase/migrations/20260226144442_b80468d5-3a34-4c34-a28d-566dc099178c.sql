-- Garantir bucket público para leitura por URL pública
update storage.buckets
set public = true
where id = 'meal-photos';

-- Remover políticas antigas relacionadas ao bucket para evitar conflito
DROP POLICY IF EXISTS "Users can upload meal photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view meal photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own meal photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to meal-photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read from meal-photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own meal photos" ON storage.objects;

-- Upload: apenas autenticados, e somente na própria pasta (user_id/...)
CREATE POLICY "Authenticated users can upload to meal-photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'meal-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Leitura via API de storage para autenticados
CREATE POLICY "Authenticated users can read from meal-photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'meal-photos'
);

-- (Opcional de segurança) Exclusão apenas dos próprios arquivos
CREATE POLICY "Authenticated users can delete own meal photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'meal-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);