
-- === Harden functions ===
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- === PROFILES: restrict read to own + admin ===
DROP POLICY IF EXISTS "profiles read all authed" ON public.profiles;
CREATE POLICY "profiles read own or admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

-- === COMPANIES ===
DROP POLICY IF EXISTS "companies all auth" ON public.companies;
CREATE POLICY "companies select own or admin" ON public.companies
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "companies insert own" ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "companies update own or admin" ON public.companies
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "companies delete own or admin" ON public.companies
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- === CONTACTS (scoped via parent company) ===
DROP POLICY IF EXISTS "contacts all auth" ON public.contacts;
CREATE POLICY "contacts select via company" ON public.contacts
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = contacts.company_id
        AND (c.created_by = auth.uid() OR c.owner_id = auth.uid())
    )
  );
CREATE POLICY "contacts insert via company" ON public.contacts
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = contacts.company_id
        AND (c.created_by = auth.uid() OR c.owner_id = auth.uid())
    )
  );
CREATE POLICY "contacts update via company" ON public.contacts
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = contacts.company_id
        AND (c.created_by = auth.uid() OR c.owner_id = auth.uid())
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = contacts.company_id
        AND (c.created_by = auth.uid() OR c.owner_id = auth.uid())
    )
  );
CREATE POLICY "contacts delete via company" ON public.contacts
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = contacts.company_id
        AND c.created_by = auth.uid()
    )
  );

-- === DEALS ===
DROP POLICY IF EXISTS "deals all auth" ON public.deals;
CREATE POLICY "deals select own or admin" ON public.deals
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "deals insert own" ON public.deals
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "deals update own or admin" ON public.deals
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "deals delete own or admin" ON public.deals
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- === DOCUMENTS (scoped via uploader or parent deal/company) ===
DROP POLICY IF EXISTS "documents all auth" ON public.documents;
CREATE POLICY "documents select scoped" ON public.documents
  FOR SELECT TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = documents.deal_id
        AND (d.created_by = auth.uid() OR d.owner_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = documents.company_id
        AND (c.created_by = auth.uid() OR c.owner_id = auth.uid())
    )
  );
CREATE POLICY "documents insert own" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "documents update own or admin" ON public.documents
  FOR UPDATE TO authenticated
  USING (uploaded_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (uploaded_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "documents delete own or admin" ON public.documents
  FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- === TASKS ===
DROP POLICY IF EXISTS "tasks all auth" ON public.tasks;
CREATE POLICY "tasks select own or admin" ON public.tasks
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR assignee_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "tasks insert own" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "tasks update own or admin" ON public.tasks
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR assignee_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR assignee_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "tasks delete own or admin" ON public.tasks
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- === ACTIVITIES ===
DROP POLICY IF EXISTS "activities read" ON public.activities;
CREATE POLICY "activities read own or admin" ON public.activities
  FOR SELECT TO authenticated
  USING (actor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- === STORAGE: documents bucket ===
-- Files are stored under a per-user prefix: '<auth.uid()>/...'
DROP POLICY IF EXISTS "documents bucket read" ON storage.objects;
DROP POLICY IF EXISTS "documents bucket insert" ON storage.objects;
DROP POLICY IF EXISTS "documents bucket update" ON storage.objects;
DROP POLICY IF EXISTS "documents bucket delete" ON storage.objects;

CREATE POLICY "documents bucket read own or admin" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (
      owner = auth.uid()
      OR (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
    )
  );
CREATE POLICY "documents bucket insert own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "documents bucket update own or admin" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (
      owner = auth.uid()
      OR (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
    )
  );
CREATE POLICY "documents bucket delete own or admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (
      owner = auth.uid()
      OR (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
    )
  );
