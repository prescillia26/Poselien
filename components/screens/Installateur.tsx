import { CreditCard } from "lucide-react";
import { C } from "@/lib/theme";
import { Empty } from "../ui";
import PublierForm from "../pose/PublierForm";
import MesPosesEntreprise from "../pose/MesPosesEntreprise";
import ActiverNotifications from "../notifications/ActiverNotifications";
import NotifsList from "../notifications/NotifsList";

export default function Installateur({ tab }: { tab: string }) {
  if (tab === "compte") return <Compte />;
  if (tab === "notifs") return <NotifsList />;
  if (tab === "attente") return <MesPosesEntreprise filtre="attente" />;
  if (tab === "acceptees") return <MesPosesEntreprise filtre="acceptees" />;
  return <PublierForm />;
}

function Compte() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-extrabold" style={{ color: C.ink }}>
        Compte
      </h1>
      <div
        className="mt-4 rounded-2xl p-4 text-white"
        style={{ background: `linear-gradient(150deg, ${C.teal}, ${C.teal2})` }}
      >
        <div className="flex items-center gap-2 text-sm" style={{ color: C.mist }}>
          <CreditCard size={16} /> Moyen de paiement
        </div>
        <div className="mt-3 text-lg font-bold tracking-wide">
          À configurer plus tard
        </div>
      </div>
      <div className="mt-4">
        <ActiverNotifications />
      </div>
      <div className="mt-4">
        <Empty text="Le paiement sera ajouté à une prochaine étape." />
      </div>
    </div>
  );
}
