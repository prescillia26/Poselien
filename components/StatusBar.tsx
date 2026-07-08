// Fausse barre d'état iOS (reprise de la maquette)
export default function StatusBar() {
  return (
    <div className="flex items-center justify-between px-5 pt-2.5 pb-1 text-xs font-semibold text-white">
      <span>9:41</span>
      <div className="flex items-center gap-1">
        <span style={{ letterSpacing: 1 }}>••••</span>
        <span>5G</span>
        <span
          className="inline-block h-2.5 w-5 rounded-sm relative"
          style={{ border: "1px solid #fff" }}
        >
          <span className="absolute inset-0.5 rounded-[1px] bg-white" />
        </span>
      </div>
    </div>
  );
}
