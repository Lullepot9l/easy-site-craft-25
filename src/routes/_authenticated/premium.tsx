import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/premium")({ component: Premium });

function Premium() {
  const { formatPrice, t } = useI18n();
  const plans = [
    { name: "USER", price: 0, color: "purple", feats: ["Chat IA limitado", "10 imagens/mês", "Comunidade"] },
    { name: "PREMIUM", price: 29.9, color: "magenta", feats: ["Chat IA ilimitado", "Imagens ilimitadas", "Marketplace VIP", "Suporte prioritário", "Badge premium"] },
    { name: "DRAGON", price: 99.9, color: "cyan", feats: ["Tudo do Premium", "Acesso a Labs", "API privada", "Avatar holográfico", "Early access"] },
  ];
  return (
    <div className="space-y-6 max-w-5xl animate-fade-in-up">
      <h1 className="text-3xl font-display gradient-text">⚡ Planos Premium</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div key={p.name} className={`glass-strong p-6 rounded-2xl hover-lift ${p.name === "PREMIUM" ? "glow-magenta scale-105" : "glow-purple"}`}>
            <h3 className="font-display text-2xl gradient-text">{p.name}</h3>
            <div className="text-4xl font-display neon-text-magenta mt-2">{p.price === 0 ? "FREE" : formatPrice(p.price)}<span className="text-sm text-muted-foreground">{p.price > 0 && t("price.monthly")}</span></div>
            <ul className="mt-6 space-y-2 text-sm">
              {p.feats.map((f) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 neon-text-cyan shrink-0" /> {f}</li>)}
            </ul>
            <button className="w-full mt-6 btn-neon py-2 rounded-lg font-display">Escolher</button>
          </div>
        ))}
      </div>
    </div>
  );
}
