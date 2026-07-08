import { Star, HardHat } from "lucide-react";
import { C } from "@/lib/theme";
import FeedPoseur from "../poseur/FeedPoseur";
import ChantiersPoseur from "../poseur/ChantiersPoseur";
import NotifsPoseur from "../poseur/NotifsPoseur";
import PerimetreEditor from "../poseur/PerimetreEditor";
import MesDocuments from "../poseur/MesDocuments";
import ContratSignature from "../poseur/ContratSignature";
import ActiverNotifications from "../notifications/ActiverNotifications";

export default function Poseur({ tab }: { tab: string }) {
  if (tab === "notifs") return <NotifsPoseur />;
  if (tab === "chantiers") return <ChantiersPoseur />;
  if (tab === "espace") return <Espace />;
  return <FeedPoseur />;
}

function Espace() {
  return (
    <div>
      <div className="flex flex-col gap-3 p-4 pb-0">
        <div
          className="rounded-2xl bg-white p-4"
          style={{ border: `1px solid ${C.line}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-extrabold text-white"
              style={{ background: C.teal }}
            >
              <HardHat size={22} color="#fff" />
            </div>
            <div>
              <div className="font-bold" style={{ color: C.ink }}>
                Mon espace poseur
              </div>
              <div
                className="mt-0.5 flex items-center gap-1 text-xs"
                style={{ color: C.muted }}
              >
                <Star size={13} color={C.amber} fill={C.amber} /> Poseur certifié
              </div>
            </div>
          </div>
        </div>
        <ActiverNotifications />
      </div>
      <MesDocuments />
      <ContratSignature />
      <PerimetreEditor />
    </div>
  );
}
