import {
  Plus,
  Clock,
  CheckCircle2,
  CreditCard,
  Zap,
  Bell,
  HardHat,
  User,
  type LucideIcon,
} from "lucide-react";
import { C, Role } from "@/lib/theme";

interface Item {
  k: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export const INSTALLATEUR_TABS: Item[] = [
  { k: "publier", label: "Publier", icon: Plus },
  { k: "attente", label: "En attente", icon: Clock },
  { k: "acceptees", label: "Acceptées", icon: CheckCircle2 },
  { k: "notifs", label: "Notifs", icon: Bell },
  { k: "compte", label: "Compte", icon: CreditCard },
];

export const POSEUR_TABS: Item[] = [
  { k: "feed", label: "Poses", icon: Zap },
  { k: "notifs", label: "Notifs", icon: Bell },
  { k: "chantiers", label: "Chantiers", icon: HardHat },
  { k: "espace", label: "Espace", icon: User },
];

export default function TabBar({
  role,
  tab,
  setTab,
}: {
  role: Role;
  tab: string;
  setTab: (t: string) => void;
}) {
  const items = role === "entreprise" ? INSTALLATEUR_TABS : POSEUR_TABS;
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${items.length},1fr)`,
        borderTop: `1px solid ${C.line}`,
        background: "#fff",
        paddingBottom: 6,
      }}
    >
      {items.map(({ k, label, icon: Icon, badge }) => {
        const active = tab === k;
        return (
          <button
            key={k}
            onClick={() => setTab(k)}
            className="relative flex flex-col items-center gap-1 py-2.5"
          >
            <div className="relative">
              <Icon size={21} color={active ? C.teal : "#9AA8A5"} />
              {badge && badge > 0 ? (
                <span
                  className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                  style={{ background: C.orange }}
                >
                  {badge}
                </span>
              ) : null}
            </div>
            <span
              className="text-[10.5px] font-semibold"
              style={{ color: active ? C.teal : "#9AA8A5" }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
