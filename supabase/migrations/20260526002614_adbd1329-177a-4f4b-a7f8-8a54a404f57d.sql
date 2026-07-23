
CREATE TABLE public.websites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  html text NOT NULL DEFAULT '',
  css text NOT NULL DEFAULT '',
  js text NOT NULL DEFAULT '',
  template text NOT NULL DEFAULT 'blank',
  thumbnail_url text,
  published boolean NOT NULL DEFAULT false,
  views integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages websites" ON public.websites
  FOR ALL USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Published websites are public" ON public.websites
  FOR SELECT USING (published = true);

CREATE TRIGGER websites_updated_at
  BEFORE UPDATE ON public.websites
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX idx_websites_slug ON public.websites(slug);
CREATE INDEX idx_websites_owner ON public.websites(owner_id);
