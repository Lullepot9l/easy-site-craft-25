ALTER TABLE public.luris_settings
  ADD COLUMN IF NOT EXISTS feelings text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS thoughts text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS extra_rules text NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS public.invites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  inviter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reward_coins integer NOT NULL DEFAULT 10,
  redeemed boolean NOT NULL DEFAULT false,
  redeemed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invites TO authenticated;
GRANT ALL ON public.invites TO service_role;

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invites_select_own_or_owner" ON public.invites
  FOR SELECT TO authenticated
  USING (inviter_id = auth.uid() OR invited_id = auth.uid() OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "invites_insert_own" ON public.invites
  FOR INSERT TO authenticated
  WITH CHECK (inviter_id = auth.uid());

CREATE POLICY "invites_delete_own" ON public.invites
  FOR DELETE TO authenticated
  USING (inviter_id = auth.uid() OR public.has_role(auth.uid(), 'owner'));

CREATE TRIGGER invites_set_updated_at
  BEFORE UPDATE ON public.invites
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();