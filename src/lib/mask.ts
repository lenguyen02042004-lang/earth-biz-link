export function maskPhone(v?: string | null): string {
  if (!v) return "";
  const s = String(v).trim();
  if (s.length <= 6) return s.slice(0, 2) + "xxxx";
  return `${s.slice(0, 3)}xxxx${s.slice(-3)}`;
}

export function maskEmail(v?: string | null): string {
  if (!v) return "";
  const [name, domain] = String(v).split("@");
  if (!domain) return "xxxx";
  const head = name.slice(0, 2);
  return `${head}${"x".repeat(Math.max(3, name.length - 2))}@${domain}`;
}
