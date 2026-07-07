
DROP POLICY IF EXISTS "demo anon read activities" ON public.activities;
DROP POLICY IF EXISTS "demo authed read activities" ON public.activities;
DROP POLICY IF EXISTS "demo anon read companies" ON public.companies;
DROP POLICY IF EXISTS "demo authed read companies" ON public.companies;
DROP POLICY IF EXISTS "demo anon read contacts" ON public.contacts;
DROP POLICY IF EXISTS "demo authed read contacts" ON public.contacts;
DROP POLICY IF EXISTS "demo anon read deals" ON public.deals;
DROP POLICY IF EXISTS "demo authed read deals" ON public.deals;
DROP POLICY IF EXISTS "demo anon read documents" ON public.documents;
DROP POLICY IF EXISTS "demo authed read documents" ON public.documents;
DROP POLICY IF EXISTS "demo anon read profiles" ON public.profiles;
DROP POLICY IF EXISTS "demo anon read tasks" ON public.tasks;
DROP POLICY IF EXISTS "demo authed read tasks" ON public.tasks;

-- Convert has_role to SECURITY INVOKER; user_roles RLS lets authenticated read their own rows,
-- which is exactly what has_role(auth.uid(), role) needs.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
