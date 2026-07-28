import { useEffect, useState } from "react";
import { Download, Smartphone, MonitorDown } from "lucide-react";
import lurisWinZip from "@/assets/Luris-Windows.zip.asset.json";


type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallApp({ className = "" }: { className?: string }) {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [showWin, setShowWin] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true;
    if (standalone) setInstalled(true);

    const ua = window.navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua));

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  async function handleClick() {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      return;
    }
    if (isIOS) setShowIOSHelp(true);
    else setShowIOSHelp(true); // fallback instructions for other browsers
  }

  return (
    <>
      <div className={`inline-flex flex-wrap gap-2 ${className}`}>
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg glass hover-lift font-display text-sm"
          title="Instalar Luris como aplicativo (PWA)"
        >
          {isIOS ? <Smartphone size={16} /> : <Download size={16} />}
          Instalar Luris (PWA)
        </button>
        <button
          type="button"
          onClick={() => setShowWin(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg btn-neon font-display text-sm glow-purple"
          title="Baixar aplicativo desktop para Windows (.exe)"
        >
          <MonitorDown size={16} />
          Baixar para Windows (.exe)
        </button>
      </div>

      {showWin && (
        <div onClick={() => setShowWin(false)} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div onClick={(e) => e.stopPropagation()} className="glass-strong rounded-2xl p-6 max-w-md w-full text-sm space-y-3">
            <h3 className="font-display text-lg gradient-text">Luris para Windows</h3>
            <p className="text-muted-foreground text-xs">
              App nativo com detecção automática do jogo que você está jogando, atalhos e janela sem barra de navegador.
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-muted-foreground text-xs">
              <li>Baixe o pacote <b>Luris-Windows.zip</b>.</li>
              <li>Clique com o botão direito → <b>Extrair tudo</b>.</li>
              <li>Abra a pasta e execute <b>Luris.exe</b>.</li>
              <li>Se o Windows avisar, clique em <b>Mais informações → Executar assim mesmo</b>.</li>
            </ol>
            <a
              href={lurisWinZip.url}
              download="Luris-Windows.zip"
              onClick={() => setShowWin(false)}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 btn-neon rounded-lg font-display glow-purple"
            >
              <MonitorDown size={16} /> Baixar agora
            </a>
            <button onClick={() => setShowWin(false)} className="w-full py-2 glass rounded-lg font-display text-xs">Fechar</button>
          </div>
        </div>
      )}


      {showIOSHelp && (
        <div
          onClick={() => setShowIOSHelp(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-strong rounded-2xl p-6 max-w-sm w-full text-sm space-y-3"
          >
            <h3 className="font-display text-lg gradient-text">
              Instalar Luris como app
            </h3>
            {isIOS ? (
              <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                <li>Toque no botão <b>Compartilhar</b> (▲) do Safari.</li>
                <li>Escolha <b>Adicionar à Tela de Início</b>.</li>
                <li>Confirme com <b>Adicionar</b>. Pronto — vira app com ícone da Luris.</li>
              </ol>
            ) : (
              <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                <li>
                  <b>Windows / Mac (Chrome ou Edge):</b> clique no ícone{" "}
                  <b>Instalar</b> na barra de endereço, ou menu ⋮ →{" "}
                  <b>Instalar Luris</b>.
                </li>
                <li>
                  <b>Android (Chrome):</b> menu ⋮ → <b>Instalar aplicativo</b> /{" "}
                  <b>Adicionar à tela inicial</b>.
                </li>
                <li>Depois abra Luris pelo ícone — ele roda como app, sem barra do navegador.</li>
              </ol>
            )}
            <button
              onClick={() => setShowIOSHelp(false)}
              className="w-full mt-2 py-2 btn-neon rounded-lg font-display text-sm"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
