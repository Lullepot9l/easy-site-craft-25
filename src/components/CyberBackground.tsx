export function CyberBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* base gradient mais suave estilo Tóquio noite */}
      <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.12_0.08_295)] via-[oklch(0.08_0.05_280)] to-[oklch(0.1_0.1_330)]" />
      <div className="absolute inset-0 grid-bg opacity-25" />
      {/* blobs neon — sem raio/scan, mais cinematic */}
      <div className="absolute top-[-10%] -left-32 w-[42rem] h-[42rem] rounded-full bg-[oklch(0.5_0.3_295)] opacity-25 blur-[160px] animate-float" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[44rem] h-[44rem] rounded-full bg-[oklch(0.55_0.32_330)] opacity-20 blur-[180px] animate-float" style={{ animationDelay: "3s" }} />
      <div className="absolute top-[40%] left-[30%] w-[32rem] h-[32rem] rounded-full bg-[oklch(0.55_0.25_210)] opacity-15 blur-[140px] animate-float" style={{ animationDelay: "5s" }} />
      {/* vinheta sutil pra dar profundidade */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.5)_100%)]" />
    </div>
  );
}
