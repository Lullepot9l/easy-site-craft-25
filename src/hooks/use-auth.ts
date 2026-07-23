import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "user" | "premium" | "admin" | "owner";

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  xp: number;
  level: number;
  coins: number;
  is_verified: boolean;
  equipped_effect?: string | null;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole>("user");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      // Só recarrega tudo em SIGNED_IN / SIGNED_OUT / USER_UPDATED.
      // TOKEN_REFRESHED / INITIAL_SESSION disparam ao voltar de outra aba
      // e NÃO devem zerar o estado da página (causava "Iniciando LURIS").
      if (event === "SIGNED_OUT" || !s?.user) {
        setRole("user");
        setProfile(null);
        setLoading(false);
        return;
      }
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        setTimeout(() => { loadUserData(s.user.id); }, 0);
      }
    });
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) await loadUserData(data.session.user.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadUserData(uid: string) {
    const [{ data: profileData }, { data: roleData }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    setProfile(profileData as Profile | null);
    const roles = (roleData ?? []).map((r) => r.role as AppRole);
    if (roles.includes("owner")) setRole("owner");
    else if (roles.includes("admin")) setRole("admin");
    else if (roles.includes("premium")) setRole("premium");
    else setRole("user");
  }

  return { session, user, role, profile, loading, isOwner: role === "owner" };
}
