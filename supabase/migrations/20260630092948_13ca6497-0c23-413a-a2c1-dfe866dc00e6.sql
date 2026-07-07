
-- =============== ENUMS ===============
CREATE TYPE public.app_role AS ENUM ('admin','trading_manager','trader','compliance_officer','finance','viewer');
CREATE TYPE public.company_type AS ENUM ('supplier','buyer','broker','refinery','inspection','storage','shipping','bank','other');
CREATE TYPE public.company_status AS ENUM ('prospect','active','onboarding','blocked','archived');
CREATE TYPE public.risk_rating AS ENUM ('low','medium','high','unknown');
CREATE TYPE public.deal_stage AS ENUM ('lead','inquiry','offer','loi','icpo','fco','negotiation','spa','payment','loading','shipment','delivered','cancelled');
CREATE TYPE public.task_status AS ENUM ('todo','working','waiting','done');
CREATE TYPE public.task_priority AS ENUM ('low','medium','high','urgent');
CREATE TYPE public.doc_category AS ENUM ('loi','icpo','fco','spa','ncnda','imfpa','pop','sgs','tank_storage','bill_of_lading','invoice','insurance','certificate_of_origin','inspection','other');

-- =============== PROFILES ===============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles read all authed" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- =============== USER_ROLES ===============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles read own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- =============== updated_at trigger ===============
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- =============== Auto-create profile + default role on signup ===============
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'trader');
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============== MASTER DATA ===============
CREATE TABLE public.countries (code TEXT PRIMARY KEY, name TEXT NOT NULL, region TEXT);
CREATE TABLE public.ports (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, country_code TEXT REFERENCES public.countries(code), region TEXT);
CREATE TABLE public.products (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL UNIQUE, category TEXT, unit TEXT DEFAULT 'MT');
CREATE TABLE public.currencies (code TEXT PRIMARY KEY, name TEXT NOT NULL, symbol TEXT);

GRANT SELECT ON public.countries, public.ports, public.products, public.currencies TO authenticated;
GRANT ALL ON public.countries, public.ports, public.products, public.currencies TO service_role;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "countries read" ON public.countries FOR SELECT TO authenticated USING (true);
CREATE POLICY "ports read" ON public.ports FOR SELECT TO authenticated USING (true);
CREATE POLICY "products read" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "currencies read" ON public.currencies FOR SELECT TO authenticated USING (true);

-- =============== COMPANIES ===============
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type public.company_type NOT NULL DEFAULT 'buyer',
  status public.company_status NOT NULL DEFAULT 'prospect',
  country_code TEXT REFERENCES public.countries(code),
  website TEXT,
  industry TEXT,
  risk_rating public.risk_rating NOT NULL DEFAULT 'unknown',
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  owner_id UUID REFERENCES auth.users(id),
  created_by UUID NOT NULL REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.companies (name);
CREATE INDEX ON public.companies (type);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "companies all auth" ON public.companies FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER companies_touch BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =============== CONTACTS ===============
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  linkedin TEXT,
  nationality TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.contacts (company_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contacts all auth" ON public.contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER contacts_touch BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =============== DEALS ===============
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE DEFAULT ('D-' || lpad((floor(random()*900000)+100000)::text, 6, '0')),
  title TEXT NOT NULL,
  stage public.deal_stage NOT NULL DEFAULT 'lead',
  buyer_id UUID REFERENCES public.companies(id),
  seller_id UUID REFERENCES public.companies(id),
  product_id UUID REFERENCES public.products(id),
  quantity NUMERIC,
  unit TEXT DEFAULT 'MT',
  price NUMERIC,
  currency TEXT DEFAULT 'USD' REFERENCES public.currencies(code),
  port_loading UUID REFERENCES public.ports(id),
  port_destination UUID REFERENCES public.ports(id),
  expected_profit NUMERIC,
  expected_close DATE,
  notes TEXT,
  owner_id UUID REFERENCES auth.users(id),
  created_by UUID NOT NULL REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.deals (stage);
CREATE INDEX ON public.deals (buyer_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deals TO authenticated;
GRANT ALL ON public.deals TO service_role;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deals all auth" ON public.deals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER deals_touch BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =============== DOCUMENTS ===============
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category public.doc_category NOT NULL DEFAULT 'other',
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  ai_summary TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.documents (deal_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documents all auth" ON public.documents FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER documents_touch BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =============== TASKS ===============
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status public.task_status NOT NULL DEFAULT 'todo',
  priority public.task_priority NOT NULL DEFAULT 'medium',
  due_date DATE,
  assignee_id UUID REFERENCES auth.users(id),
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks all auth" ON public.tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER tasks_touch BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =============== ACTIVITIES (audit trail) ===============
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activities read" ON public.activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "activities insert" ON public.activities FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());

-- =============== AI CONVERSATIONS ===============
CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_conversations, public.ai_messages TO authenticated;
GRANT ALL ON public.ai_conversations, public.ai_messages TO service_role;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "convs own" ON public.ai_conversations FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "msgs own" ON public.ai_messages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));

-- =============== MARKET (seeded mock) ===============
CREATE TABLE public.market_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  product TEXT NOT NULL,
  region TEXT NOT NULL,
  price NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'USD/bbl',
  change_pct NUMERIC NOT NULL DEFAULT 0,
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.market_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  headline TEXT NOT NULL,
  source TEXT,
  url TEXT,
  region TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.market_prices, public.market_news TO authenticated;
GRANT ALL ON public.market_prices, public.market_news TO service_role;
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mp read" ON public.market_prices FOR SELECT TO authenticated USING (true);
CREATE POLICY "mn read" ON public.market_news FOR SELECT TO authenticated USING (true);

-- =============== SEED MASTER DATA ===============
INSERT INTO public.currencies(code,name,symbol) VALUES
 ('USD','US Dollar','$'),('EUR','Euro','€'),('AED','UAE Dirham','د.إ'),('GBP','British Pound','£'),('SGD','Singapore Dollar','S$');

INSERT INTO public.countries(code,name,region) VALUES
 ('AE','United Arab Emirates','Middle East'),
 ('SA','Saudi Arabia','Middle East'),
 ('US','United States','Americas'),
 ('NL','Netherlands','Europe'),
 ('SG','Singapore','Asia'),
 ('IN','India','Asia'),
 ('GB','United Kingdom','Europe'),
 ('CH','Switzerland','Europe'),
 ('NG','Nigeria','Africa'),
 ('BR','Brazil','Americas');

INSERT INTO public.ports(name,country_code,region) VALUES
 ('Fujairah','AE','Middle East'),
 ('Jebel Ali','AE','Middle East'),
 ('Ras Tanura','SA','Middle East'),
 ('Rotterdam','NL','Europe'),
 ('Houston','US','Americas'),
 ('Singapore','SG','Asia'),
 ('Mumbai','IN','Asia'),
 ('Lagos','NG','Africa'),
 ('Santos','BR','Americas');

INSERT INTO public.products(name,category,unit) VALUES
 ('Brent Crude','Crude','bbl'),
 ('WTI Crude','Crude','bbl'),
 ('Diesel EN590','Distillates','MT'),
 ('Jet Fuel A1','Distillates','MT'),
 ('Gasoline 95','Light Distillates','MT'),
 ('Fuel Oil 380cst','Residual','MT'),
 ('LPG','Gas','MT'),
 ('LNG','Gas','MMBtu'),
 ('Bitumen 60/70','Heavy','MT'),
 ('Base Oil SN500','Lubes','MT');

INSERT INTO public.market_prices(symbol,product,region,price,unit,change_pct,history) VALUES
 ('BRENT','Brent Crude','Global',82.45,'USD/bbl',1.8,'[78,79,80.2,79.5,81,80.8,82.45]'::jsonb),
 ('WTI','WTI Crude','Global',78.12,'USD/bbl',1.2,'[74,75.1,76,75.8,77,77.6,78.12]'::jsonb),
 ('DIESEL','Diesel EN590','Fujairah',795.30,'USD/MT',-0.4,'[805,800,798,802,799,797,795.3]'::jsonb),
 ('JET','Jet Fuel A1','Singapore',845.10,'USD/MT',0.9,'[820,825,830,835,838,842,845.1]'::jsonb),
 ('GASOLINE','Gasoline 95','Rotterdam',780.00,'USD/MT',2.1,'[745,750,755,762,770,775,780]'::jsonb),
 ('FO380','Fuel Oil 380cst','Fujairah',462.20,'USD/MT',-1.1,'[480,478,475,470,468,464,462.2]'::jsonb),
 ('LPG','LPG','Houston',520.00,'USD/MT',0.3,'[515,517,518,519,520,520,520]'::jsonb),
 ('BITUMEN','Bitumen 60/70','Fujairah',390.00,'USD/MT',0.5,'[380,382,385,388,389,390,390]'::jsonb);

INSERT INTO public.market_news(headline,source,region,published_at) VALUES
 ('OPEC+ signals extended output cuts into Q3','Reuters','Global', now() - interval '2 hours'),
 ('Diesel demand picks up in Fujairah on bunker activity','Argus','Middle East', now() - interval '5 hours'),
 ('Rotterdam gasoline cracks widen on tight supply','Platts','Europe', now() - interval '8 hours'),
 ('Singapore jet fuel inventories drop to 6-week low','Bloomberg','Asia', now() - interval '12 hours'),
 ('US crude stocks fall more than expected','EIA','Americas', now() - interval '1 day');
