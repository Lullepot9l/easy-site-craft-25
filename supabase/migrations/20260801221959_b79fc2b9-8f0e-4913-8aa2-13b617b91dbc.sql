ALTER TABLE public.profiles ALTER COLUMN account_id SET DEFAULT public.gen_account_id();
UPDATE public.profiles SET account_id = public.gen_account_id() WHERE account_id IS NULL OR account_id = '';
CREATE UNIQUE INDEX IF NOT EXISTS profiles_account_id_key ON public.profiles (account_id);