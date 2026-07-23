export function LurisLogo({ size = "text-3xl", showIcon = true }: { size?: string; showIcon?: boolean }) {
  return (
    <div className={`font-display font-black ${size} flex items-center gap-2.5 select-none relative`}>
      {showIcon && (
        <img
          src="/luris-icon.png"
          alt=""
          className="h-[1.4em] w-[1.4em] rounded-md object-cover"
          style={{
            boxShadow: "0 0 18px oklch(0.6 0.3 295 / 0.55), inset 0 0 0 1px oklch(0.75 0.2 295 / 0.4)",
          }}
        />
      )}
      <span className="flex items-baseline gap-1.5 tracking-[0.22em]">
        <span
          className="relative"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.96 0.05 295) 0%, oklch(0.82 0.28 295) 40%, oklch(0.72 0.34 320) 70%, oklch(0.9 0.12 260) 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            textShadow: "0 0 22px oklch(0.65 0.32 295 / 0.4)",
            filter: "drop-shadow(0 2px 10px oklch(0.55 0.3 295 / 0.5))",
          }}
        >
          LURIS
          <span
            aria-hidden
            className="absolute inset-0 animate-shimmer pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent 20%, oklch(1 0 0 / 0.45), transparent 80%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              backgroundSize: "220% 100%",
            }}
          >
            LURIS
          </span>
        </span>
        <span
          className="text-[0.5em] font-bold tracking-[0.35em] px-1.5 py-0.5 rounded-md"
          style={{
            color: "oklch(0.97 0.03 295)",
            background:
              "linear-gradient(135deg, oklch(0.45 0.28 295 / 0.55), oklch(0.5 0.3 330 / 0.55))",
            border: "1px solid oklch(0.78 0.22 295 / 0.5)",
            boxShadow:
              "0 0 14px oklch(0.65 0.28 295 / 0.5), inset 0 0 8px oklch(0.85 0.18 295 / 0.25)",
          }}
        >
          AI
        </span>
      </span>
    </div>
  );
}
