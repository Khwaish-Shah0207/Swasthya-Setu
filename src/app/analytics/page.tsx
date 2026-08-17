"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { PublicNavbar, PublicPageHeader } from "@/components/public-shell";

interface AnalyticsData {
  disclaimer: string;
  totals: {
    namasteConcepts: number;
    codedEncounters: number;
    dualCodedEncounters: number;
    dualCodedConceptsAvailable: number;
    biomedicineOnlyConcepts: number;
    tm2OnlyConcepts: number;
    unmappedConcepts: number;
  };
  confidenceDistribution: { High: number; Medium: number; Low: number };
  systemDistribution: Record<string, number>;
  monthlyTrend: { month: string; encounters: number }[];
}

const CONF_COLORS = ["#256A45", "#B98A2E", "#8A3220"];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetch("/api/analytics").then((r) => r.json()).then(setData);
  }, []);

  const mappingAvailability = data
    ? [
        { name: "Dual coded", value: data.totals.dualCodedConceptsAvailable },
        { name: "Biomedicine only", value: data.totals.biomedicineOnlyConcepts },
        { name: "TM2 only", value: data.totals.tm2OnlyConcepts },
        { name: "Unmapped", value: data.totals.unmappedConcepts },
      ]
    : [];

  const confidenceData = data
    ? [
        { name: "High", value: data.confidenceDistribution.High },
        { name: "Medium", value: data.confidenceDistribution.Medium },
        { name: "Low", value: data.confidenceDistribution.Low },
      ]
    : [];

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <PublicPageHeader
        title="Analytics"
        description="Aggregate, anonymized terminology and coding statistics. No patient-identifiable information is shown."
      />

      <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
        {data && (
          <div className="rounded-lg border border-[var(--color-gold-500)]/40 bg-[var(--color-gold-100)] px-4 py-2.5 text-xs text-[var(--color-gold-700)]">
            {data.disclaimer}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ["NAMASTE Concepts", data?.totals.namasteConcepts],
            ["Coded Encounters", data?.totals.codedEncounters],
            ["Dual-Coded Encounters", data?.totals.dualCodedEncounters],
            ["Unmapped Concepts", data?.totals.unmappedConcepts],
          ].map(([label, value]) => (
            <div key={label as string} className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-5">
              <p className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">{label}</p>
              <p className="font-display text-3xl mt-2">{value ?? "—"}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6">
            <p className="font-display text-lg mb-4">Monthly coding trend</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data?.monthlyTrend ?? []}>
                <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#55645C" }} />
                <YAxis tick={{ fontSize: 11, fill: "#55645C" }} />
                <Tooltip />
                <Line type="monotone" dataKey="encounters" stroke="#0F5C4C" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6">
            <p className="font-display text-lg mb-4">Mapping availability</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mappingAvailability}>
                <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#55645C" }} />
                <YAxis tick={{ fontSize: 11, fill: "#55645C" }} />
                <Tooltip />
                <Bar dataKey="value" fill="#1C7C63" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6">
            <p className="font-display text-lg mb-4">Swasthya-Setu mapping confidence distribution</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={confidenceData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {confidenceData.map((entry, i) => (
                    <Cell key={entry.name} fill={CONF_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6">
            <p className="font-display text-lg mb-4">TM2 vs Biomedicine coverage</p>
            <div className="space-y-3 text-sm">
              {data &&
                Object.entries(data.systemDistribution).map(([system, count]) => (
                  <div key={system} className="flex items-center justify-between">
                    <span>{system}</span>
                    <span className="font-mono">{count} concepts</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
