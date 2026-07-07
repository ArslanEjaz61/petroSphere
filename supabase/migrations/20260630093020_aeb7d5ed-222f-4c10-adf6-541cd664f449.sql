
CREATE POLICY "documents bucket read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents');
CREATE POLICY "documents bucket insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');
CREATE POLICY "documents bucket update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'documents');
CREATE POLICY "documents bucket delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents');
