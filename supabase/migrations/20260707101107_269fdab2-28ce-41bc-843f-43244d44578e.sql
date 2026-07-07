
-- DEMO MODE: allow anon SELECT while login is disabled.
-- Re-tighten these when auth is re-enabled.
GRANT SELECT ON public.companies, public.contacts, public.deals, public.documents,
  public.tasks, public.activities, public.profiles TO anon;

CREATE POLICY "demo anon read companies" ON public.companies FOR SELECT TO anon USING (true);
CREATE POLICY "demo anon read contacts" ON public.contacts FOR SELECT TO anon USING (true);
CREATE POLICY "demo anon read deals" ON public.deals FOR SELECT TO anon USING (true);
CREATE POLICY "demo anon read documents" ON public.documents FOR SELECT TO anon USING (true);
CREATE POLICY "demo anon read tasks" ON public.tasks FOR SELECT TO anon USING (true);
CREATE POLICY "demo anon read activities" ON public.activities FOR SELECT TO anon USING (true);
CREATE POLICY "demo anon read profiles" ON public.profiles FOR SELECT TO anon USING (true);

-- Same for authenticated (in case a session appears)
CREATE POLICY "demo authed read companies" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "demo authed read contacts" ON public.contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "demo authed read deals" ON public.deals FOR SELECT TO authenticated USING (true);
CREATE POLICY "demo authed read documents" ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "demo authed read tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "demo authed read activities" ON public.activities FOR SELECT TO authenticated USING (true);
