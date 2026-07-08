import Link from "next/link";
import { Zap, Building2, HardHat, ArrowRight } from "lucide-react";
import { C } from "@/lib/theme";
import StatusBar from "./StatusBar";

export default function Welcome() {
  return (
    <div
      className="flex flex-1 flex-col"
      style={{ background: `linear-gradient(160deg, ${C.teal}, ${C.teal2})` }}
    >
      <StatusBar />
      <div className="relative flex flex-1 flex-col justify-center px-6 pb-8">
        {/* Ondes décoratives */}
        <svg
          viewBox="0 0 200 200"
          className="pointer-events-none absolute"
          style={{ top: 30, right: -30, width: 260, opacity: 0.16 }}
        >
          {[40, 66, 92, 118].map((r) => (
            <path
              key={r}
              d={`M100 ${100 - r} A ${r} ${r} 0 0 1 ${100 + r} 100`}
              fill="none"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
            />
          ))}
        </svg>

        <div className="mb-10 flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: C.orange }}
          >
            <Zap size={26} color="#fff" />
          </div>
          <div>
            <div className="text-2xl font-extrabold tracking-tight text-white">
              Posélien
            </div>
            <div className="text-sm" style={{ color: C.mist }}>
              La pose, mise en relation
            </div>
          </div>
        </div>

        <div className="mb-2 text-2xl font-bold leading-tight text-white">
          Vos poses confiées à des poseurs certifiés, partout en France.
        </div>
        <p className="mb-8 text-sm" style={{ color: C.mist }}>
          Choisissez votre profil pour créer votre compte.
        </p>

        <Link
          href="/inscription?role=entreprise"
          className="mb-3 flex items-center gap-3 rounded-2xl bg-white p-4 text-left"
        >
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: C.teal }}
          >
            <Building2 size={22} color="#fff" />
          </div>
          <div className="flex-1">
            <div className="font-bold" style={{ color: C.ink }}>
              Je suis une entreprise
            </div>
            <div className="text-xs" style={{ color: C.muted }}>
              Je publie des poses à réaliser
            </div>
          </div>
          <ArrowRight size={18} color={C.muted} />
        </Link>

        <Link
          href="/inscription?role=poseur"
          className="flex items-center gap-3 rounded-2xl bg-white p-4 text-left"
        >
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: C.orange }}
          >
            <HardHat size={22} color="#fff" />
          </div>
          <div className="flex-1">
            <div className="font-bold" style={{ color: C.ink }}>
              Je suis un poseur
            </div>
            <div className="text-xs" style={{ color: C.muted }}>
              Je reçois et j&apos;accepte des poses
            </div>
          </div>
          <ArrowRight size={18} color={C.muted} />
        </Link>

        <p className="mt-8 text-center text-sm" style={{ color: C.mist }}>
          Déjà un compte ?{" "}
          <Link href="/connexion" className="font-bold text-white underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
