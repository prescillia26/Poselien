import { C } from "@/lib/theme";

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span
        className="mb-1 block text-sm font-medium"
        style={{ color: C.ink }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border bg-white px-3 py-2.5 text-[15px] outline-none"
      style={{ borderColor: C.line, color: C.ink }}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full rounded-xl border bg-white px-3 py-2.5 text-[15px] outline-none"
      style={{ borderColor: C.line, color: C.ink }}
    />
  );
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className="w-full rounded-xl border bg-white px-3 py-2.5 text-[15px] outline-none"
      style={{ borderColor: C.line, color: C.ink }}
    />
  );
}

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white transition-all disabled:opacity-60"
      style={{ background: C.orange }}
    >
      {children}
    </button>
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl px-3 py-2.5 text-sm"
      style={{ background: C.redBg, color: C.red }}
    >
      {children}
    </div>
  );
}

export function OkNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl px-3 py-2.5 text-sm"
      style={{ background: C.greenBg, color: C.green }}
    >
      {children}
    </div>
  );
}
