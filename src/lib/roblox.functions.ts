import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

function randKey() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return "luris_sk_" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const listMyApiKeys = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("api_keys")
      .select("id,name,key,created_at,last_used_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createLurisApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ name: z.string().min(1).max(64).default("Roblox Studio") }).parse(d))
  .handler(async ({ data, context }) => {
    const key = randKey();
    const { data: row, error } = await context.supabase
      .from("api_keys")
      .insert({ user_id: context.userId, name: data.name, key })
      .select("id,name,key,created_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteMyApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("api_keys")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
