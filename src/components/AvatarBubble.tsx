import { UserCircle2 } from "lucide-react";

interface Props {
  url?: string | null;
  name?: string | null;
  size?: number;
  effect?: string | null;
  className?: string;
}

/** Avatar redondo com suporte aos efeitos animados do marketplace (fx-*). */
export function AvatarBubble({ url, name, size = 40, effect, className = "" }: Props) {
  const fx = effect ? `fx-wrap ${effect}` : "";
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();
  const style = { width: size, height: size, aspectRatio: "1 / 1" as const, boxSizing: "border-box" as const };
  const wrapStyle = {
    width: size,
    height: size,
    aspectRatio: "1 / 1" as const,
    lineHeight: 0,
    flex: "0 0 auto",
    boxSizing: "border-box" as const,
  };
  return (
    <span
      className={`${fx} shrink-0 inline-flex items-center justify-center align-middle ${className}`}
      style={wrapStyle}
    >
      {url ? (
        <img
          src={url}
          alt={name ?? ""}
          style={style}
          className="rounded-full object-cover block"
        />
      ) : (
        <span
          style={style}
          className="rounded-full bg-gradient-to-br from-[oklch(0.55_0.3_295)] to-[oklch(0.6_0.32_330)] flex items-center justify-center font-display text-white"
        >
          {initial !== "?" ? initial : <UserCircle2 className="h-1/2 w-1/2" />}
        </span>
      )}
    </span>
  );
}
