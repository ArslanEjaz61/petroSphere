
-- Broaden SELECT policies so any signed-in user can read seeded demo data.
-- Writes remain owner-scoped via existing INSERT/UPDATE/DELETE policies.
CREATE POLICY "companies read all authed"  ON public.companies  FOR SELECT TO authenticated USING (true);
CREATE POLICY "contacts read all authed"   ON public.contacts   FOR SELECT TO authenticated USING (true);
CREATE POLICY "deals read all authed"      ON public.deals      FOR SELECT TO authenticated USING (true);
CREATE POLICY "documents read all authed"  ON public.documents  FOR SELECT TO authenticated USING (true);
CREATE POLICY "tasks read all authed"      ON public.tasks      FOR SELECT TO authenticated USING (true);
CREATE POLICY "activities read all authed" ON public.activities FOR SELECT TO authenticated USING (true);
