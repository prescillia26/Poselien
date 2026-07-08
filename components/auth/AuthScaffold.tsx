import Link from "next/link";
import { Zap, ChevronLeft } from "lucide-react";
import { C } from "@/lib/theme";
import StatusBar from "@/components/StatusBar";

// En-tête de marque + zone blanche pour les écrans d'authentification.
export default function AuthScaffold({
  title,
  subtitle,
  back,
  children,
}: {
  title: string;
  subtitle?: string;
  back?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div
        style={{
          background: `linear-gradient(150deg, ${C.teal}, ${C.teal2})`,
        }}
      >
        <StatusBar />
        <div className="px-6 pb-6 pt-2">
          {back && (
            <Link
              href={back.href}
              className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-white"
              style={{ color: C.mist }}
            >
              <ChevronLeft size={15} /> {back.label}
            </Link>
          )}
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{ background: C.orange }}
            >
              <Zap size={22} color="#fff" />
            </div>
            <div>
              <div className="text-xl font-extrabold tracking-tight text-white">
                {title}
              </div>
              {subtitle && (
                <div className="text-sm" style={{ color: C.mist }}>
                  {subtitle}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto px-6 py-6"
        style={{ background: C.bg }}
      >
        {children}
      </div>
    </div>
  );
}
