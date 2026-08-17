"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "./app-shell";

const PUBLIC_NAV = [
  { href: "/", label: "Home" },
  { href: "/analytics", label: "Analytics" },
];

export function PublicNavbar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center" aria-label="Swasthya-Setu home">
          <BrandMark size={34} />
        </Link>

        <nav className="flex items-center gap-6">
          {PUBLIC_NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm transition-standard"
                style={{
                  color: active ? "var(--color-teal-900)" : "var(--color-ink-muted)",
                  fontWeight: active ? 600 : 500,
                }}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/login"
            className="rounded-lg bg-[var(--color-teal-700)] text-white px-4 py-2 text-sm font-medium hover:bg-[var(--color-teal-900)] transition-standard"
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function PublicPageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="border-b border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-8">
      <div className="max-w-6xl mx-auto">
        {eyebrow && (
          <p className="text-xs uppercase tracking-widest text-[var(--color-gold-700)] font-medium mb-1">{eyebrow}</p>
        )}
        <h1 className="font-display text-2xl">{title}</h1>
        {description && <p className="text-sm text-[var(--color-ink-muted)] mt-1 max-w-2xl">{description}</p>}
      </div>
    </div>
  );
}
