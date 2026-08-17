"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Search,
  ShieldCheck,
  ScrollText,
  Activity,
  LogOut,
} from "lucide-react";
import { useSession } from "@/lib/session-context";
import type { Role } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles: Role[];
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["clinician", "admin"] },
  { href: "/patients", label: "Patients", icon: Users, roles: ["clinician"] },
  { href: "/terminology", label: "Terminology Search", icon: Search, roles: ["clinician", "admin"] },
  { href: "/admin", label: "Terminology Manager", icon: ShieldCheck, roles: ["admin"] },
  { href: "/audit", label: "Audit Log", icon: ScrollText, roles: ["admin"] },
  { href: "/api-status", label: "System Integration", icon: Activity, roles: ["admin"] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-[var(--color-ink-muted)]">Loading…</div>;
  }
  if (!user) return null;

  const items = NAV.filter((n) => n.roles.includes(user.role));

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r border-[var(--color-line)] bg-[var(--color-surface)] flex flex-col">
        <div className="px-5 py-5 border-b border-[var(--color-line)]">
          <Link href="/dashboard" className="flex items-center">
            <BrandMark size={34} />
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-standard"
                style={{
                  background: active ? "var(--color-teal-100)" : "transparent",
                  color: active ? "var(--color-teal-900)" : "var(--color-ink-muted)",
                  fontWeight: active ? 600 : 500,
                }}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-[var(--color-line)]">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-[var(--color-ink-muted)]">{user.designation}</p>
          <p className="text-xs text-[var(--color-ink-muted)]">{user.hospital}</p>
          <button
            onClick={logout}
            className="mt-3 flex items-center gap-1.5 text-xs text-[var(--color-danger-700)] hover:underline"
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}

/** The Swasthya-Setu logo mark (uploaded brand asset, public/swasthya-setu-logo.png). */
export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <Image
      src="/swasthya-setu-logo.png"
      alt="Swasthya-Setu"
      width={size}
      height={size}
      className="shrink-0 rounded-full object-contain"
      priority
    />
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="border-b border-[var(--color-line)] bg-[var(--color-surface)] px-8 py-6 flex items-start justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-xs uppercase tracking-widest text-[var(--color-gold-700)] font-medium mb-1">{eyebrow}</p>
        )}
        <h1 className="font-display text-2xl">{title}</h1>
        {description && <p className="text-sm text-[var(--color-ink-muted)] mt-1 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
