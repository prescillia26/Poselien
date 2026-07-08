"use client";

import { useState } from "react";
import { Zap, LogOut } from "lucide-react";
import { C, Role } from "@/lib/theme";
import StatusBar from "./StatusBar";
import TabBar from "./TabBar";
import Installateur from "./screens/Installateur";
import Poseur from "./screens/Poseur";

export default function AppShell({ role }: { role: Role }) {
  const [tab, setTab] = useState(role === "entreprise" ? "publier" : "feed");

  return (
    <>
      {/* En-tête */}
      <div
        style={{
          background: `linear-gradient(150deg, ${C.teal}, ${C.teal2})`,
          color: "#fff",
        }}
      >
        <StatusBar />
        <div className="flex items-center justify-between px-4 pb-3.5 pt-1">
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: C.orange }}
            >
              <Zap size={19} color="#fff" />
            </div>
            <div>
              <div className="text-[17px] font-extrabold leading-none tracking-tight">
                Posélien
              </div>
              <div className="text-[11px]" style={{ color: C.mist }}>
                {role === "entreprise" ? "Espace entreprise" : "Espace poseur"}
              </div>
            </div>
          </div>

          {/* Déconnexion (remplace l'ancien bouton « Changer ») */}
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
              style={{ background: "rgba(255,255,255,0.14)" }}
            >
              <LogOut size={13} /> Déconnexion
            </button>
          </form>
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto" style={{ background: C.bg }}>
        {role === "entreprise" ? (
          <Installateur tab={tab} />
        ) : (
          <Poseur tab={tab} />
        )}
      </div>

      {/* Barre d'onglets */}
      <TabBar role={role} tab={tab} setTab={setTab} />
    </>
  );
}
