import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertOwner(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "owner",
  });
  if (error || !data) throw new Error("Forbidden");
}

const tokenSchema = z.string().min(20);

/* ============================ LIST / UPSERT / DELETE ============================ */

export const listCommands = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context);
    const { data, error } = await context.supabase
      .from("discord_commands")
      .select("*")
      .eq("owner_id", context.userId)
      .order("category", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(32),
    description: z.string().max(100).default(""),
    category: z.string().default("geral"),
    enabled: z.boolean().default(true),
    scope: z.enum(["guild", "global"]).default("guild"),
    guild_id: z.string().optional().nullable(),
    cooldown_seconds: z.number().int().min(0).max(3600).default(0),
    aliases: z.array(z.string()).default([]),
    allowed_roles: z.array(z.string()).default([]),
    allowed_channels: z.array(z.string()).default([]),
    allowed_users: z.array(z.string()).default([]),
    denied_roles: z.array(z.string()).default([]),
    denied_channels: z.array(z.string()).default([]),
    permissions: z.array(z.string()).default([]),
    subcommands: z.array(z.object({ name: z.string(), description: z.string() })).default([]),
    response_type: z.enum(["text", "embed", "ai"]).default("text"),
    response_content: z.string().default(""),
    response_embed: z.any().optional().nullable(),
    ai_prompt: z.string().optional().nullable(),
    ephemeral: z.boolean().default(false),
    favorite: z.boolean().default(false),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const row = { ...data, owner_id: context.userId };
    if (data.id) {
      const { data: r, error } = await context.supabase
        .from("discord_commands").update(row).eq("id", data.id).select().single();
      if (error) throw new Error(error.message);
      return r;
    }
    const { data: r, error } = await context.supabase
      .from("discord_commands").insert(row).select().single();
    if (error) throw new Error(error.message);
    return r;
  });

export const deleteCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const { error } = await context.supabase.from("discord_commands").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), enabled: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const { error } = await context.supabase
      .from("discord_commands").update({ enabled: data.enabled }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============================ PRESETS ============================ */

export const importPresets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    presets: z.array(z.object({
      name: z.string(), description: z.string(), category: z.string(),
      subcommands: z.array(z.object({ name: z.string(), description: z.string() })).optional(),
    })),
    scope: z.enum(["guild", "global"]).default("guild"),
    guild_id: z.string().optional().nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const rows = data.presets.map((p) => ({
      owner_id: context.userId,
      name: p.name,
      description: p.description,
      category: p.category,
      scope: data.scope,
      guild_id: data.guild_id ?? null,
      subcommands: p.subcommands ?? [],
      response_type: "text" as const,
      response_content: `✅ Comando /${p.name} disponível.`,
      enabled: true,
    }));
    const { error, count } = await context.supabase
      .from("discord_commands")
      .upsert(rows, { onConflict: "owner_id,name,scope,guild_id", ignoreDuplicates: false, count: "exact" });
    if (error) throw new Error(error.message);
    return { ok: true, count: count ?? rows.length };
  });

/* ============================ DISCORD SYNC ============================ */

async function discordApi(path: string, token: string, init: RequestInit = {}) {
  const res = await fetch(`https://discord.com/api/v10${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  const j = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(j?.message || `Discord ${res.status}: ${text.slice(0, 200)}`);
  return j;
}

export const syncCommandsToDiscord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    token: tokenSchema,
    applicationId: z.string().min(5),
    guildId: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const scopeFilter = data.guildId ? "guild" : "global";
    const { data: cmds, error } = await context.supabase
      .from("discord_commands")
      .select("name,description,subcommands,enabled")
      .eq("owner_id", context.userId)
      .eq("scope", scopeFilter)
      .eq("enabled", true);
    if (error) throw new Error(error.message);

    const payload = (cmds ?? []).map((c: any) => {
      const opts = Array.isArray(c.subcommands) && c.subcommands.length
        ? c.subcommands.map((s: any) => ({
            type: 1, name: String(s.name).toLowerCase(), description: s.description || s.name,
          }))
        : [];
      return {
        name: String(c.name).toLowerCase(),
        description: c.description || c.name,
        type: 1,
        ...(opts.length ? { options: opts } : {}),
      };
    });

    const scope = data.guildId
      ? `/applications/${data.applicationId}/guilds/${data.guildId}/commands`
      : `/applications/${data.applicationId}/commands`;
    const res = await discordApi(scope, data.token, { method: "PUT", body: JSON.stringify(payload) });

    // save discord_command_id back
    if (Array.isArray(res)) {
      for (const c of res) {
        await context.supabase
          .from("discord_commands")
          .update({ discord_command_id: c.id })
          .eq("owner_id", context.userId)
          .eq("name", c.name);
      }
    }
    return { synced: (res as any[]).length };
  });

/* ============================ CONFIG (PUBLIC KEY / INTERACTIONS) ============================ */

export const saveInteractionsConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    public_key: z.string().min(20),
    interactions_endpoint: z.string().url().optional().nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const { data: existing } = await context.supabase
      .from("owner_discord_config").select("id").eq("owner_id", context.userId).maybeSingle();
    const row = { owner_id: context.userId, ...data };
    if (existing?.id) {
      const { error } = await context.supabase
        .from("owner_discord_config").update(row).eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("owner_discord_config").insert(row);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/* ============================ LOGS ============================ */

export const listCommandLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ limit: z.number().min(1).max(500).default(100) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const { data: rows, error } = await context.supabase
      .from("discord_command_logs")
      .select("*")
      .eq("owner_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const clearCommandLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context);
    const { error } = await context.supabase
      .from("discord_command_logs").delete().eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
