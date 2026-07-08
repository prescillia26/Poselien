import { MapPin, Sparkles } from "lucide-react";
import { C } from "@/lib/theme";
import { Job, eur, jobStatut, totalInstallateur } from "@/lib/data";
import { Badge, Chip } from "./ui";

export default function JobCard({
  job,
  amount = "installateur",
}: {
  job: Job;
  amount?: "installateur" | "poseur";
}) {
  const st = jobStatut(job.status);
  return (
    <div
      className="rounded-2xl bg-white p-3.5"
      style={{ border: `1px solid ${C.line}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {job.prestations.map((p) => (
            <Chip key={p}>{p}</Chip>
          ))}
        </div>
        <Badge bg={st.bg} color={st.col}>
          {st.txt}
        </Badge>
      </div>

      <div
        className="mt-2.5 flex items-center gap-1 text-sm"
        style={{ color: C.muted }}
      >
        <MapPin size={14} />
        {job.ville} · {job.dept}
      </div>

      <p className="mt-1.5 text-sm leading-relaxed" style={{ color: C.ink }}>
        {job.description}
      </p>

      <div className="mt-3 flex items-center justify-between">
        {job.aides ? (
          <Badge bg={C.greenBg} color={C.green} icon={Sparkles}>
            Aides éligibles
          </Badge>
        ) : (
          <span />
        )}
        <div className="text-right">
          <div className="text-lg font-extrabold" style={{ color: C.teal }}>
            {eur(
              amount === "installateur" ? totalInstallateur(job.prix) : job.prix
            )}
          </div>
          <div className="text-[11px]" style={{ color: C.muted }}>
            {amount === "installateur" ? "commission incluse" : "montant pose"}
          </div>
        </div>
      </div>
    </div>
  );
}
