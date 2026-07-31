import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

/** Snapshot AO VIVO do estado real da conta + da plataforma. */
export const liveExportSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const uid = context.userId;

    const [
      profile,
      prefs,
      memory,
      convos,
      backgrounds,
      themes,
      images,
      market,
      settings,
      roleRow,
    ] = await Promise.all([
      sb.from("profiles").select("*").eq("id", uid).maybeSingle(),
      sb.from("user_preferences").select("*").eq("user_id", uid).maybeSingle(),
      sb.from("user_memory").select("memory_key, memory_value").eq("user_id", uid).limit(500),
      sb.from("conversations").select("id, title, agent, created_at, updated_at").eq("user_id", uid).order("updated_at", { ascending: false }).limit(200),
      sb.from("chat_backgrounds").select("conversation_id, mode, value, name").eq("user_id", uid).limit(200),
      sb.from("user_themes").select("theme_id, active").eq("user_id", uid).limit(200),
      sb.from("generated_images").select("prompt, image_url, style, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(100),
      sb.from("marketplace_items").select("title, category, item_type, price_coins, content").limit(500),
      sb.from("luris_settings").select("system_prompt, personality").eq("id", 1).maybeSingle(),
      sb.rpc("get_user_role", { _user_id: uid }),
    ]);

    const convIds = (convos.data ?? []).map((c: Row) => c.id as string);
    let messages: Row[] = [];
    if (convIds.length) {
      const { data } = await sb
        .from("messages")
        .select("conversation_id, role, content, created_at")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: true })
        .limit(5000);
      messages = (data ?? []) as Row[];
    }

    const marketItems = (market.data ?? []) as Row[];
    const byCategory: Record<string, number> = {};
    for (const it of marketItems) {
      const c = String(it.category ?? "outro");
      byCategory[c] = (byCategory[c] ?? 0) + 1;
    }

    return {
      generated_at: new Date().toISOString(),
      role: (roleRow.data as string) ?? "user",
      profile: (profile.data ?? null) as Row | null,
      preferences: (prefs.data ?? null) as Row | null,
      memory: (memory.data ?? []) as Row[],
      conversations: (convos.data ?? []) as Row[],
      messages,
      chat_backgrounds: (backgrounds.data ?? []) as Row[],
      user_themes: (themes.data ?? []) as Row[],
      generated_images: (images.data ?? []) as Row[],
      luris_settings: (settings.data ?? null) as Row | null,
      marketplace: { total: marketItems.length, by_category: byCategory, items: marketItems.slice(0, 80) },
    };
  });

const importSchema = z.object({
  payload: z.object({
    profile: z.record(z.string(), z.any()).nullable().optional(),
    preferences: z.record(z.string(), z.any()).nullable().optional(),
    memory: z.array(z.object({ memory_key: z.string(), memory_value: z.string() })).optional(),
    conversations: z.array(z.record(z.string(), z.any())).optional(),
    messages: z.array(z.record(z.string(), z.any())).optional(),
    chat_backgrounds: z.array(z.record(z.string(), z.any())).optional(),
  }),
  parts: z.object({
    profile: z.boolean().default(true),
    memory: z.boolean().default(true),
    conversations: z.boolean().default(true),
    backgrounds: z.boolean().default(true),
  }),
});

/** Importa um snapshot exportado para a conta ATUAL (outra conta/dispositivo). */
export const importAccountSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => importSchema.parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const uid = context.userId;
    const p = data.payload;
    const report: string[] = [];

    if (data.parts.profile && p.profile) {
      const allowed = [
        "display_name", "username", "avatar_url", "bio", "codename", "activity_status",
        "current_game", "favorite_games", "name_color", "name_font", "profile_theme",
        "equipped_effect", "discord_username", "whatsapp_number",
      ] as const;
      const patch: Row = {};
      for (const k of allowed) if (p.profile[k] !== undefined && p.profile[k] !== null) patch[k] = p.profile[k];
      if (Object.keys(patch).length) {
        const { error } = await sb.from("profiles").update(patch as never).eq("id", uid);
        if (error) return { ok: false, error: `Perfil: ${error.message}`, report };
        report.push(`Perfil atualizado (${Object.keys(patch).length} campos)`);
      }
    }

    if (data.parts.memory && p.memory?.length) {
      const rows = p.memory.slice(0, 500).map((m) => ({
        user_id: uid,
        memory_key: m.memory_key.slice(0, 60),
        memory_value: m.memory_value.slice(0, 500),
        updated_at: new Date().toISOString(),
      }));
      const { error } = await sb.from("user_memory").upsert(rows, { onConflict: "user_id,memory_key" });
      if (error) return { ok: false, error: `Memórias: ${error.message}`, report };
      report.push(`${rows.length} memórias importadas`);
    }

    if (data.parts.conversations && p.conversations?.length) {
      let convCount = 0;
      let msgCount = 0;
      for (const c of p.conversations.slice(0, 100)) {
        const { data: inserted, error } = await sb
          .from("conversations")
          .insert({ user_id: uid, title: String(c.title ?? "Importada"), agent: String(c.agent ?? "luris") })
          .select("id")
          .single();
        if (error || !inserted) continue;
        convCount++;
        const msgs = (p.messages ?? [])
          .filter((m) => m.conversation_id === c.id)
          .slice(0, 500)
          .map((m) => ({
            conversation_id: inserted.id as string,
            role: String(m.role ?? "user"),
            content: String(m.content ?? ""),
          }))
          .filter((m) => m.content.length > 0);
        if (msgs.length) {
          const { error: mErr } = await sb.from("messages").insert(msgs);
          if (!mErr) msgCount += msgs.length;
        }
      }
      report.push(`${convCount} conversas e ${msgCount} mensagens importadas`);
    }

    if (data.parts.backgrounds && p.chat_backgrounds?.length) {
      const global = p.chat_backgrounds.find((b) => !b.conversation_id);
      if (global) {
        await sb.from("chat_backgrounds").delete().eq("user_id", uid).is("conversation_id", null);
        const { error } = await sb.from("chat_backgrounds").insert({
          user_id: uid,
          conversation_id: null,
          mode: String(global.mode ?? "preset"),
          value: String(global.value ?? ""),
          name: String(global.name ?? "Importado"),
        });
        if (!error) report.push("Fundo de conversa importado");
      }
    }

    return { ok: true, error: null as string | null, report };
  });