import { C } from "@/lib/theme";

// Cadre "téléphone" : centré sur ordinateur, plein écran sur mobile.
export default function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="phone-wrap flex min-h-screen w-full items-start justify-center py-6"
      style={{ background: "#E7ECEA" }}
    >
      <div
        className="phone-shell relative flex w-full max-w-[420px] flex-col overflow-hidden"
        style={{
          height: 820,
          background: C.card,
          borderRadius: 34,
          boxShadow: "0 24px 70px rgba(11,61,58,0.22)",
          border: "6px solid #0B1F1D",
        }}
      >
        {children}
      </div>
    </div>
  );
}
