import Link from "next/link";
import { Search, ShieldCheck, GitMerge, BarChart3 } from "lucide-react";
import { PublicNavbar } from "@/components/public-shell";
import { BrandMark } from "@/components/app-shell";

const FEATURES = [
  {
    icon: Search,
    title: "NAMASTE terminology search",
    description: "Search Ayurveda, Siddha, and Unani diagnoses recorded under India's NAMASTE terminology set.",
  },
  {
    icon: GitMerge,
    title: "WHO ICD-11 mapping",
    description: "Every NAMASTE concept is resolved against WHO ICD-11 Traditional Medicine Module 2 and Biomedicine.",
  },
  {
    icon: ShieldCheck,
    title: "FHIR R4 dual coding",
    description: "Generates real FHIR Condition resources carrying NAMASTE, TM2, and ICD-11 Biomedicine codings together.",
  },
  {
    icon: BarChart3,
    title: "Aggregate analytics",
    description: "Public, anonymized statistics on coding coverage and mapping confidence — no patient data included.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <main className="flex-1">
        <section className="setu-arcs px-6 py-20">
          <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
            <BrandMark size={84} />
            <h1 className="font-display text-4xl mt-6">Swasthya-Setu</h1>
            <p className="text-lg text-[var(--color-ink-muted)] mt-3 max-w-xl">
              Bridging Traditional Knowledge with Global Health Standards
            </p>
            <p className="text-sm text-[var(--color-ink-muted)] mt-4 max-w-2xl leading-relaxed">
              A FHIR-compliant terminology interoperability layer connecting India&apos;s NAMASTE terminology
              with WHO ICD-11 (Traditional Medicine Module 2 &amp; Biomedicine) — pluggable into any
              FHIR-compatible EMR.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-teal-700)] text-white px-5 py-3 text-sm font-medium hover:bg-[var(--color-teal-900)] transition-standard"
              >
                Login to demonstration EMR
              </Link>
              <Link
                href="/analytics"
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-3 text-sm font-medium hover:border-[var(--color-teal-500)] transition-standard"
              >
                View Analytics
              </Link>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 border-t border-[var(--color-line)]">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs uppercase tracking-widest text-[var(--color-gold-700)] font-medium text-center mb-2">
              What Swasthya-Setu does
            </p>
            <h2 className="font-display text-2xl text-center mb-10">A terminology interoperability layer, not a hospital EMR</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-teal-100)] text-[var(--color-teal-700)]">
                      <Icon size={18} />
                    </span>
                    <p className="font-display text-lg mt-4">{f.title}</p>
                    <p className="text-sm text-[var(--color-ink-muted)] mt-1.5 leading-relaxed">{f.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-6 py-14 border-t border-[var(--color-line)]">
          <div className="max-w-3xl mx-auto rounded-xl border border-[var(--color-gold-500)]/40 bg-[var(--color-gold-100)] p-6 text-center">
            <p className="text-sm text-[var(--color-gold-700)] font-medium">Demonstration prototype</p>
            <p className="text-sm text-[var(--color-ink)] mt-1 max-w-xl mx-auto">
              Built for Smart India Hackathon 2026. Log in to walk through the full clinician and terminology
              management workflow using the demonstration EMR — Wellness Hospital.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--color-line)] px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-[var(--color-ink-muted)]">
          <span>Swasthya-Setu — FHIR Terminology Interoperability Layer</span>
          <span>Prototype, not certified for production clinical use</span>
        </div>
      </footer>
    </div>
  );
}
