import { MapPin, Sparkles, CalendarDays } from "lucide-react";
import { C } from "@/lib/theme";
import {
  Pose,
  eur,
  totalEntreprise,
  netPoseur,
  creneauLabel,
  STATUT_LABEL,
} from "@/lib/poses";
import { Badge, Chip } from "@/components/ui";

export default function PoseCard({
  pose,
  mode,
  onClick,
}: {
  pose: Pose;
  mode: "entreprise" | "poseur";
  onClick?: () => void;
}) {
  const st = STATUT_LABEL[pose.statut];
  const montant =
    mode === "entreprise" ? totalEntreprise(pose.prix) : netPoseur(pose.prix);

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      className="rounded-2xl bg-white p-3.5"
      style={{
        border: `1px solid ${C.line}`,
        cursor: onClick ? "pointer" : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {pose.prestations.map((p) => (
            <Chip key={p}>{p}</Chip>
          ))}
        </div>
        {mode === "entreprise" && (
          <Badge bg={st.bg} color={st.col}>
            {st.txt}
          </Badge>
        )}
      </div>

      <div
        className="mt-2.5 flex items-center gap-1 text-sm"
        style={{ color: C.muted }}
      >
        <MapPin size={14} />
        {pose.ville} · {pose.departement}
      </div>

      {pose.description && (
        <p className="mt-1.5 text-sm leading-relaxed" style={{ color: C.ink }}>
          {pose.description}
        </p>
      )}

      {pose.creneaux && pose.creneaux.length > 0 && (
        <div className="mt-2.5 flex flex-col gap-1">
          {pose.creneaux.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-1.5 text-xs"
              style={{ color: C.muted }}
            >
              <CalendarDays size={13} /> {creneauLabel(c)}
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        {pose.aides ? (
          <Badge bg={C.greenBg} color={C.green} icon={Sparkles}>
            Aides éligibles
          </Badge>
        ) : (
          <span />
        )}
        <div className="text-right">
          <div className="text-lg font-extrabold" style={{ color: C.teal }}>
            {eur(montant)}
          </div>
          <div className="text-[11px]" style={{ color: C.muted }}>
            {mode === "entreprise" ? "débité (+5 %)" : "net (−5 %)"}
          </div>
        </div>
      </div>
    </div>
  );
}
