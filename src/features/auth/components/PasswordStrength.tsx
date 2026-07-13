"use client";

const WIDTHS = ["w-0", "w-1/5", "w-2/5", "w-3/5", "w-4/5", "w-full"];
const COLORS = [
  "bg-red-500",
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-lime-500",
  "bg-green-600",
];
const LABELS = ["Too weak", "Weak", "Fair", "Good", "Strong", "Very strong"];

function score(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={ok ? "text-emerald-600" : "text-muted-foreground"}>
      <span aria-hidden>{ok ? "✓" : "○"}</span> {label}
    </li>
  );
}

export function PasswordStrength({ password }: { password: string }) {
  const s = password ? score(password) : 0;

  return (
    <div className="space-y-1.5">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full transition-all ${COLORS[s]} ${WIDTHS[s]}`} />
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        <Rule ok={password.length >= 8} label="8+ characters" />
        <Rule ok={/[A-Z]/.test(password)} label="Uppercase" />
        <Rule ok={/[a-z]/.test(password)} label="Lowercase" />
        <Rule ok={/\d/.test(password)} label="Number" />
        <Rule ok={/[^A-Za-z0-9]/.test(password)} label="Symbol" />
      </ul>
      {password && <p className="text-xs text-muted-foreground">{LABELS[s]}</p>}
    </div>
  );
}
