-- SERVERS
CREATE TABLE public.servers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  tag text,
  description text,
  icon_url text,
  banner_url text,
  invite_code text NOT NULL UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.servers TO authenticated;
GRANT ALL ON public.servers TO service_role;
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.server_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id uuid NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (server_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.server_members TO authenticated;
GRANT ALL ON public.server_members TO service_role;
ALTER TABLE public.server_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.server_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id uuid NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  name text NOT NULL,
  topic text,
  kind text NOT NULL DEFAULT 'text',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.server_channels TO authenticated;
GRANT ALL ON public.server_channels TO service_role;
ALTER TABLE public.server_channels ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.server_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.server_channels(id) ON DELETE CASCADE,
  server_id uuid NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  attachment_url text,
  attachment_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.server_messages TO authenticated;
GRANT ALL ON public.server_messages TO service_role;
ALTER TABLE public.server_messages ENABLE ROW LEVEL SECURITY;

-- helper (security definer avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.is_server_member(_server_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.server_members WHERE server_id = _server_id AND user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_server_owner(_server_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.servers WHERE id = _server_id AND owner_id = _user_id)
$$;

-- POLICIES: servers
CREATE POLICY "servers_select" ON public.servers FOR SELECT TO authenticated
  USING (is_public OR owner_id = auth.uid() OR public.is_server_member(id, auth.uid()));
CREATE POLICY "servers_insert" ON public.servers FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "servers_update" ON public.servers FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "servers_delete" ON public.servers FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- POLICIES: members
CREATE POLICY "members_select" ON public.server_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_server_member(server_id, auth.uid()) OR public.is_server_owner(server_id, auth.uid()));
CREATE POLICY "members_insert" ON public.server_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_server_owner(server_id, auth.uid()));
CREATE POLICY "members_delete" ON public.server_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_server_owner(server_id, auth.uid()));
CREATE POLICY "members_update" ON public.server_members FOR UPDATE TO authenticated
  USING (public.is_server_owner(server_id, auth.uid())) WITH CHECK (public.is_server_owner(server_id, auth.uid()));

-- POLICIES: channels
CREATE POLICY "channels_select" ON public.server_channels FOR SELECT TO authenticated
  USING (public.is_server_member(server_id, auth.uid()) OR public.is_server_owner(server_id, auth.uid())
         OR EXISTS (SELECT 1 FROM public.servers s WHERE s.id = server_id AND s.is_public));
CREATE POLICY "channels_write" ON public.server_channels FOR INSERT TO authenticated
  WITH CHECK (public.is_server_owner(server_id, auth.uid()));
CREATE POLICY "channels_update" ON public.server_channels FOR UPDATE TO authenticated
  USING (public.is_server_owner(server_id, auth.uid())) WITH CHECK (public.is_server_owner(server_id, auth.uid()));
CREATE POLICY "channels_delete" ON public.server_channels FOR DELETE TO authenticated
  USING (public.is_server_owner(server_id, auth.uid()));

-- POLICIES: messages
CREATE POLICY "smessages_select" ON public.server_messages FOR SELECT TO authenticated
  USING (public.is_server_member(server_id, auth.uid()) OR public.is_server_owner(server_id, auth.uid()));
CREATE POLICY "smessages_insert" ON public.server_messages FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND (public.is_server_member(server_id, auth.uid()) OR public.is_server_owner(server_id, auth.uid())));
CREATE POLICY "smessages_delete" ON public.server_messages FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_server_owner(server_id, auth.uid()));

-- triggers
CREATE TRIGGER servers_updated_at BEFORE UPDATE ON public.servers
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.server_messages;