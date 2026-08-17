"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Stethoscope, ShieldCheck, ArrowLeft } from "lucide-react";
import { useSession } from "@/lib/session-context";
import { BrandMark } from "@/components/app-shell";

const DEMO_USERS = [
  {
    username: "ananya.mehta",
    name: "Dr. Ananya Mehta",
    role: "AYUSH Doctor",
    desc: "Consultant Physician, Ayurveda Integrative Care",
    icon: Stethoscope,
  },
  {
    username: "rohit.kulkarni",
    name: "Rohit Kulkarni",
    role: "Terminology Manager",
    desc: "Hospital Admin — NAMASTE ingestion & WHO sync",
    icon: ShieldCheck,
  },
];

export default function LoginPage() {
  const { login } = useSession();
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(username: string) {
    setPending(username);
    setError(null);
    const res = await login(username);
    setPending(null);
    if (!res.ok) {
      setError(res.error ?? "Sign-in failed");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 setu-arcs relative">
      <Link
        href="/"
        className="absolute left-4 top-4 sm:left-8 sm:top-8 inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-teal-700)] transition-standard"
      >
        <ArrowLeft size={14} /> Home
      </Link>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-8">
          <BrandMark size={68} />
          <p className="text-sm text-[var(--color-ink-muted)] mt-3">
            Bridging Traditional Knowledge with Global Health Standards
          </p>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-[var(--color-gold-700)] font-medium mb-1">
            Demonstration EMR
          </p>
          <p className="font-display text-lg mb-4">Wellness Hospital</p>

          <p className="text-sm text-[var(--color-ink-muted)] mb-3">Choose a demo account to sign in:</p>

          <div className="space-y-2">
            {DEMO_USERS.map((u) => {
              const Icon = u.icon;
              return (
                <button
                  key={u.username}
                  onClick={() => handleLogin(u.username)}
                  disabled={pending !== null}
                  className="w-full flex items-center gap-3 rounded-lg border border-[var(--color-line)] px-4 py-3 text-left hover:border-[var(--color-teal-500)] hover:bg-[var(--color-teal-100)] transition-standard disabled:opacity-60"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-teal-100)] text-[var(--color-teal-700)] shrink-0">
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{u.name}</span>
                    <span className="block text-xs text-[var(--color-ink-muted)]">
                      {u.role} · {u.desc}
                    </span>
                  </span>
                  {pending === u.username && (
                    <span className="ml-auto text-xs text-[var(--color-teal-700)]">Signing in…</span>
                  )}
                </button>
              );
            })}
          </div>

          {error && <p className="text-sm text-[var(--color-danger-700)] mt-3">{error}</p>}

          <p className="text-xs text-[var(--color-ink-muted)] mt-5 leading-relaxed">
            This is a hackathon prototype. Sign-in is simulated for demonstration purposes only — no
            passwords are verified. All patient data shown is synthetic demo data.
          </p>
        </div>
      </div>
    </div>
  );
}
