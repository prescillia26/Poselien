import type { LucideIcon } from "lucide-react";
import { C } from "@/lib/theme";

export function Badge({
  children,
  bg,
  color,
  icon: Icon,
}: {
  children: React.ReactNode;
  bg: string;
  color: string;
  icon?: LucideIcon;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ background: bg, color }}
    >
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}

export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold"
      style={{ background: C.tealBg, color: C.teal }}
    >
      {children}
    </span>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-2 mt-1 text-xs font-bold tracking-wide"
      style={{ color: C.muted }}
    >
      {children}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <div
      className="rounded-2xl p-6 text-center text-sm"
      style={{ background: "#fff", border: `1px dashed ${C.line}`, color: C.muted }}
    >
      {text}
    </div>
  );
}
