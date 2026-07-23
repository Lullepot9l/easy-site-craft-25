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

async function discord(path: string, token: string, init: RequestInit = {}) {
  const res = await fetch(`https://discord.com/api/v10${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  if (!res.ok) throw new Error(json?.message || `Discord ${res.status}: ${text.slice(0, 200)}`);
  return json;
}

const tokenSchema = z.string().min(20);

/* ============================ BOT PROFILE ============================ */

export const testDiscordBot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ token: tokenSchema }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const me = await discord("/users/@me", data.token);
    return {
      id: me.id, username: me.username, discriminator: me.discriminator,
      avatar: me.avatar ? `https://cdn.discordapp.com/avatars/${me.id}/${me.avatar}.png?size=256` : null,
      banner: me.banner ? `https://cdn.discordapp.com/banners/${me.id}/${me.banner}.png?size=600` : null,
      accent_color: me.accent_color, bot: !!me.bot, flags: me.flags ?? 0,
    };
  });

export const updateDiscordBotProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      token: tokenSchema,
      username: z.string().min(2).max(32).optional(),
      avatar: z.string().nullable().optional(),   // data URI or null to remove
      banner: z.string().nullable().optional(),   // data URI or null
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const body: any = {};
    if (data.username !== undefined) body.username = data.username;
    if (data.avatar !== undefined) body.avatar = data.avatar;
    if (data.banner !== undefined) body.banner = data.banner;
    const me = await discord("/users/@me", data.token, { method: "PATCH", body: JSON.stringify(body) });
    return {
      ok: true, username: me.username,
      avatar: me.avatar ? `https://cdn.discordapp.com/avatars/${me.id}/${me.avatar}.png?size=256` : null,
      banner: me.banner ? `https://cdn.discordapp.com/banners/${me.id}/${me.banner}.png?size=600` : null,
    };
  });

/* ============================ GUILDS / CHANNELS ============================ */

export const listDiscordGuilds = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ token: tokenSchema }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const guilds = await discord("/users/@me/guilds", data.token);
    return (guilds as any[]).map((g) => ({
      id: g.id, name: g.name,
      icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
      owner: g.owner, permissions: g.permissions,
    }));
  });

export const listDiscordChannels = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ token: tokenSchema, guildId: z.string().min(5) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const cs = await discord(`/guilds/${data.guildId}/channels`, data.token);
    return (cs as any[]).map((c) => ({ id: c.id, name: c.name, type: c.type, parent_id: c.parent_id }));
  });

export const createDiscordChannel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    token: tokenSchema, guildId: z.string().min(5),
    name: z.string().min(1).max(100),
    type: z.number().int().default(0), // 0 text, 2 voice, 4 category, 5 announcement
    topic: z.string().max(1024).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const c = await discord(`/guilds/${data.guildId}/channels`, data.token, {
      method: "POST",
      body: JSON.stringify({ name: data.name, type: data.type, topic: data.topic }),
    });
    return { id: c.id, name: c.name, type: c.type };
  });

export const deleteDiscordChannel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ token: tokenSchema, channelId: z.string().min(5) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    await discord(`/channels/${data.channelId}`, data.token, { method: "DELETE" });
    return { ok: true };
  });

/* ============================ MESSAGES ============================ */

export const sendDiscordMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    token: tokenSchema, channelId: z.string().min(5),
    content: z.string().min(1).max(2000),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const m = await discord(`/channels/${data.channelId}/messages`, data.token, {
      method: "POST", body: JSON.stringify({ content: data.content }),
    });
    return { id: m.id, timestamp: m.timestamp };
  });

export const sendDiscordEmbed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    token: tokenSchema, channelId: z.string().min(5),
    title: z.string().max(256).optional(),
    description: z.string().max(4000).optional(),
    color: z.number().int().optional(),
    imageUrl: z.string().url().optional(),
    thumbnailUrl: z.string().url().optional(),
    footer: z.string().max(2048).optional(),
    content: z.string().max(2000).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const embed: any = {};
    if (data.title) embed.title = data.title;
    if (data.description) embed.description = data.description;
    if (data.color !== undefined) embed.color = data.color;
    if (data.imageUrl) embed.image = { url: data.imageUrl };
    if (data.thumbnailUrl) embed.thumbnail = { url: data.thumbnailUrl };
    if (data.footer) embed.footer = { text: data.footer };
    embed.timestamp = new Date().toISOString();
    const m = await discord(`/channels/${data.channelId}/messages`, data.token, {
      method: "POST",
      body: JSON.stringify({ content: data.content || undefined, embeds: [embed] }),
    });
    return { id: m.id };
  });

export const deleteDiscordMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    token: tokenSchema, channelId: z.string().min(5), messageId: z.string().min(5),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    await discord(`/channels/${data.channelId}/messages/${data.messageId}`, data.token, { method: "DELETE" });
    return { ok: true };
  });

export const sendDiscordDM = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    token: tokenSchema, userId: z.string().min(5), content: z.string().min(1).max(2000),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const dm = await discord(`/users/@me/channels`, data.token, {
      method: "POST", body: JSON.stringify({ recipient_id: data.userId }),
    });
    const m = await discord(`/channels/${dm.id}/messages`, data.token, {
      method: "POST", body: JSON.stringify({ content: data.content }),
    });
    return { id: m.id, channel: dm.id };
  });

/* ============================ MEMBERS / ROLES ============================ */

export const listDiscordMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    token: tokenSchema, guildId: z.string().min(5), limit: z.number().min(1).max(1000).default(100),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const ms = await discord(`/guilds/${data.guildId}/members?limit=${data.limit}`, data.token);
    return (ms as any[]).map((m) => ({
      id: m.user?.id, username: m.user?.username, nick: m.nick,
      avatar: m.user?.avatar ? `https://cdn.discordapp.com/avatars/${m.user.id}/${m.user.avatar}.png` : null,
      bot: !!m.user?.bot, roles: m.roles ?? [], joined_at: m.joined_at,
    }));
  });

export const listDiscordRoles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ token: tokenSchema, guildId: z.string().min(5) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const rs = await discord(`/guilds/${data.guildId}/roles`, data.token);
    return (rs as any[]).map((r) => ({
      id: r.id, name: r.name, color: r.color, position: r.position,
      mentionable: r.mentionable, hoist: r.hoist,
    }));
  });

export const kickDiscordMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    token: tokenSchema, guildId: z.string().min(5), userId: z.string().min(5),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    await discord(`/guilds/${data.guildId}/members/${data.userId}`, data.token, { method: "DELETE" });
    return { ok: true };
  });

export const banDiscordMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    token: tokenSchema, guildId: z.string().min(5), userId: z.string().min(5),
    deleteMessageSeconds: z.number().min(0).max(604800).default(0),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    await discord(`/guilds/${data.guildId}/bans/${data.userId}`, data.token, {
      method: "PUT",
      body: JSON.stringify({ delete_message_seconds: data.deleteMessageSeconds }),
    });
    return { ok: true };
  });

/* ============================ SLASH COMMANDS ============================ */

export const listSlashCommands = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    token: tokenSchema, applicationId: z.string().min(5), guildId: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const scope = data.guildId
      ? `/applications/${data.applicationId}/guilds/${data.guildId}/commands`
      : `/applications/${data.applicationId}/commands`;
    const cs = await discord(scope, data.token);
    return (cs as any[]).map((c) => ({ id: c.id, name: c.name, description: c.description, type: c.type }));
  });

export const createSlashCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    token: tokenSchema, applicationId: z.string().min(5),
    guildId: z.string().optional(),
    name: z.string().min(1).max(32),
    description: z.string().min(1).max(100),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const scope = data.guildId
      ? `/applications/${data.applicationId}/guilds/${data.guildId}/commands`
      : `/applications/${data.applicationId}/commands`;
    const c = await discord(scope, data.token, {
      method: "POST",
      body: JSON.stringify({ name: data.name.toLowerCase(), description: data.description, type: 1 }),
    });
    return { id: c.id, name: c.name };
  });

export const deleteSlashCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    token: tokenSchema, applicationId: z.string().min(5),
    commandId: z.string().min(5), guildId: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const scope = data.guildId
      ? `/applications/${data.applicationId}/guilds/${data.guildId}/commands/${data.commandId}`
      : `/applications/${data.applicationId}/commands/${data.commandId}`;
    await discord(scope, data.token, { method: "DELETE" });
    return { ok: true };
  });

/* ============================ APPLICATION (BIO / DESCRIPTION / TAGS / ICON) ============================ */

export const getDiscordApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ token: tokenSchema }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const app = await discord("/applications/@me", data.token);
    return {
      id: app.id, name: app.name, description: app.description ?? "",
      tags: app.tags ?? [],
      icon: app.icon ? `https://cdn.discordapp.com/app-icons/${app.id}/${app.icon}.png?size=256` : null,
      cover_image: app.cover_image,
      interactions_endpoint_url: app.interactions_endpoint_url,
      flags: app.flags,
    };
  });

export const updateDiscordApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    token: tokenSchema,
    description: z.string().max(400).optional(),
    tags: z.array(z.string().max(20)).max(5).optional(),
    icon: z.string().nullable().optional(),           // data URI
    cover_image: z.string().nullable().optional(),    // data URI
    interactions_endpoint_url: z.string().url().nullable().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const body: any = {};
    if (data.description !== undefined) body.description = data.description;
    if (data.tags !== undefined) body.tags = data.tags;
    if (data.icon !== undefined) body.icon = data.icon;
    if (data.cover_image !== undefined) body.cover_image = data.cover_image;
    if (data.interactions_endpoint_url !== undefined) body.interactions_endpoint_url = data.interactions_endpoint_url;
    const app = await discord("/applications/@me", data.token, {
      method: "PATCH", body: JSON.stringify(body),
    });
    return { ok: true, description: app.description, tags: app.tags };
  });

/* ============================ MESSAGE WITH ATTACHMENT ============================ */

export const sendDiscordMessageWithFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    token: tokenSchema, channelId: z.string().min(5),
    content: z.string().max(2000).optional(),
    filename: z.string().min(1).max(120),
    fileDataUri: z.string().min(20), // data:mime;base64,....
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    // parse data URI
    const m = /^data:([^;]+);base64,(.+)$/.exec(data.fileDataUri);
    if (!m) throw new Error("Arquivo inválido (esperado data URI base64)");
    const mime = m[1]; const b64 = m[2];
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const blob = new Blob([bin], { type: mime });
    const form = new FormData();
    form.append("payload_json", JSON.stringify({ content: data.content || "" }));
    form.append("files[0]", blob, data.filename);
    const res = await fetch(`https://discord.com/api/v10/channels/${data.channelId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bot ${data.token}` },
      body: form,
    });
    const text = await res.text();
    const j = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error(j?.message || `Discord ${res.status}`);
    return { id: j.id, attachments: j.attachments };
  });

/* ============================ BULK / SYNC SLASH COMMANDS ============================ */

export const bulkSetSlashCommands = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    token: tokenSchema, applicationId: z.string().min(5),
    guildId: z.string().optional(),
    commands: z.array(z.object({
      name: z.string().min(1).max(32),
      description: z.string().min(1).max(100),
      type: z.number().int().default(1),
    })).max(100),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context);
    const scope = data.guildId
      ? `/applications/${data.applicationId}/guilds/${data.guildId}/commands`
      : `/applications/${data.applicationId}/commands`;
    const cs = await discord(scope, data.token, {
      method: "PUT",
      body: JSON.stringify(data.commands.map((c) => ({
        name: c.name.toLowerCase(), description: c.description, type: c.type ?? 1,
      }))),
    });
    return (cs as any[]).map((c) => ({ id: c.id, name: c.name, description: c.description }));
  });
