import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Wand2, Download } from "lucide-react";
import { generateImage } from "@/lib/chat.functions";

export const Route = createFileRoute("/_authenticated/images")({ component: ImagesPage });

function ImagesPage() {
  const gen = useServerFn(generateImage);
  const [prompt, setPrompt] = useState("dragão cyberpunk japonês neon roxo em Tóquio, chuva, holograma");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<{ url: string; prompt: string }[]>([]);

  async function run() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    try {
      const res = await gen({ data: { prompt: prompt.trim() } });
      if (res.error) toast.error(res.error);
      else if (res.image_url) {
        setImages([{ url: res.image_url, prompt }, ...images]);
        toast.success("Imagem gerada");
      }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-6 animate-fade-in-up max-w-5xl">
      <header>
        <h1 className="text-3xl font-display gradient-text">🎨 Gerador de Imagens IA</h1>
        <p className="text-sm text-muted-foreground">Nano Banana · Gemini 2.5 Flash Image</p>
      </header>

      <div className="glass-strong rounded-2xl p-4 glow-magenta">
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3}
          className="w-full bg-transparent outline-none font-body resize-none px-2" placeholder="Descreva sua imagem..." />
        <div className="flex justify-between items-center mt-2">
          <div className="flex gap-2 text-xs text-muted-foreground font-mono">
            {["anime", "realista", "cyberpunk", "fantasy", "cinematic"].map((s) => (
              <button key={s} onClick={() => setPrompt((p) => `${p}, estilo ${s}`)} className="px-2 py-1 glass rounded">{s}</button>
            ))}
          </div>
          <button onClick={run} disabled={loading} className="btn-neon px-5 py-2 rounded-lg font-display flex items-center gap-2 disabled:opacity-50">
            <Wand2 className="h-4 w-4" /> {loading ? "Gerando..." : "Gerar"}
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((img, i) => (
          <div key={i} className="glass rounded-xl overflow-hidden hover-lift">
            <img src={img.url} alt={img.prompt} className="w-full aspect-square object-cover" />
            <div className="p-3">
              <p className="text-xs text-muted-foreground line-clamp-2">{img.prompt}</p>
              <a href={img.url} download className="mt-2 inline-flex items-center gap-1 text-xs neon-text-cyan font-mono">
                <Download className="h-3 w-3" /> Baixar
              </a>
            </div>
          </div>
        ))}
        {images.length === 0 && <p className="text-muted-foreground text-sm col-span-full">Suas imagens geradas aparecerão aqui.</p>}
      </div>
    </div>
  );
}
