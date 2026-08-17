import type { Metadata } from "next";
import { SessionProvider } from "@/lib/session-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Swasthya-Setu | FHIR Terminology Interoperability Layer",
  description:
    "Bridging Traditional Knowledge with Global Health Standards — a FHIR-compliant NAMASTE / WHO ICD-11 (TM2 & Biomedicine) terminology integration layer.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--color-canvas)]">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
