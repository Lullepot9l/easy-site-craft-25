import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AvatarBubble } from "@/components/AvatarBubble";

export const Route = createFileRoute("/_authenticated/social")({ component: Social });

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  likes: number;
  created_at: string;
  profiles?: { display_name: string | null; avatar_url: string | null; is_verified: boolean; equipped_effect?: string | null } | null;
}

function Social() {
  const { user, isOwner } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("social_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!data) return;
    const ids = [...new Set(data.map((p) => p.user_id))];
    const { data: profs } = await supabase.from("profiles").select("id, display_name, avatar_url, is_verified, equipped_effect").in("id", ids);
    const map = new Map(profs?.map((p) => [p.id, p]) ?? []);
    setPosts(data.map((p) => ({ ...p, profiles: map.get(p.user_id) ?? null })) as Post[]);
  }
  useEffect(() => { load(); }, []);

  async function post(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !user) return;
    setLoading(true);
    const { error } = await supabase.from("social_posts").insert({ user_id: user.id, content: content.trim() });
    setLoading(false);
    if (error) return toast.error(error.message);
    setContent("");
    toast.success("Postado na grid 🌐");
    load();
  }

  async function like(p: Post) {
    await supabase.from("social_posts").update({ likes: p.likes + 1 }).eq("id", p.id);
    setPosts((xs) => xs.map((x) => x.id === p.id ? { ...x, likes: x.likes + 1 } : x));
  }

  async function del(p: Post) {
    if (!confirm("Apagar post?")) return;
    await supabase.from("social_posts").delete().eq("id", p.id);
    setPosts((xs) => xs.filter((x) => x.id !== p.id));
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in-up">
      <h1 className="text-3xl font-display gradient-text">🌐 Social Hub</h1>

      <form onSubmit={post} className="glass-strong rounded-2xl p-4 glow-purple">
        <textarea value={content} onChange={(e) => setContent(e.target.value)} maxLength={500}
          placeholder="O que está acontecendo na grid?"
          className="w-full bg-transparent outline-none resize-none font-body text-sm min-h-[80px]" />
        <div className="flex justify-between items-center mt-2">
          <span className="text-[10px] font-mono text-muted-foreground">{content.length}/500</span>
          <button type="submit" disabled={loading || !content.trim()} className="btn-neon px-4 py-2 rounded-lg text-sm font-display flex items-center gap-2 disabled:opacity-50">
            <Send className="h-3 w-3" /> Postar
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {posts.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Seja o primeiro a postar na grid.</p>}
        {posts.map((p) => (
          <article key={p.id} className="glass rounded-xl p-4 hover-lift">
            <div className="flex items-start gap-3">
              <AvatarBubble url={p.profiles?.avatar_url} name={p.profiles?.display_name} size={40} effect={p.profiles?.equipped_effect} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm">{p.profiles?.display_name ?? "Anon"}</span>
                  {p.profiles?.is_verified && <span className="text-xs neon-text-cyan">✓</span>}
                  <span className="text-[10px] font-mono text-muted-foreground">{new Date(p.created_at).toLocaleString("pt-BR")}</span>
                </div>
                <p className="mt-1 text-sm whitespace-pre-wrap break-words">{p.content}</p>
                <div className="mt-3 flex items-center gap-4 text-xs">
                  <button onClick={() => like(p)} className="flex items-center gap-1 text-muted-foreground hover:neon-text-magenta">
                    <Heart className="h-3 w-3" /> {p.likes}
                  </button>
                  {(p.user_id === user?.id || isOwner) && (
                    <button onClick={() => del(p)} className="text-muted-foreground hover:text-[oklch(0.7_0.25_25)]">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
