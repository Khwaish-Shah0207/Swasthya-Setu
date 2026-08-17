# Swasthya-Setu

**Bridging Traditional Knowledge with Global Health Standards**

A FHIR R4-compliant terminology interoperability layer that bridges India's
**NAMASTE** terminologies (Ayurveda, Siddha, Unani) with the **WHO
International Terminologies for Ayurveda** and **WHO ICD-11** (Traditional
Medicine Module 2 and Biomedicine).

Built for Smart India Hackathon 2026.

> **This is not a hospital management system or a generic dashboard.** The
> core product is a terminology integration plugin/microservice that any
> FHIR-compatible EMR can sit behind. A demonstration EMR ("Wellness
> Hospital") is included so the workflow can be experienced end-to-end.

---

## 1. Project overview

Clinicians recording an Ayurveda/Siddha/Unani diagnosis today have no
standard way to also express that diagnosis in WHO ICD-11 terms — which is
what claims processing, research, and international interoperability
require. Swasthya-Setu:

1. Ingests a NAMASTE terminology CSV into a normalized concept store.
2. Resolves each NAMASTE concept against WHO ICD-11 TM2 and Biomedicine,
   live via the official WHO API when credentials are configured, falling
   back to a locally cached snapshot otherwise.
3. Surfaces a **Swasthya-Setu Mapping Confidence** score — a
   prototype-specific heuristic, never attributed to WHO — so a clinician
   can see at a glance how complete a mapping is.
4. Lets a clinician search, review the mapping, and add a **dual-coded**
   diagnosis to a patient's problem list, generating a real FHIR R4
   `Condition` resource with multiple `coding` entries.
5. Exposes FHIR terminology operations (`$lookup`, `$translate`,
   `ValueSet` search, `CodeSystem` lookup) and a Bundle upload endpoint so
   an external EMR could integrate against it.

The demo flow (see the dashboard for the full path): **Login → Patient →
Add Diagnosis → search "sciatica" → NAMASTE result → WHO TM2 → WHO ICD-11
Biomedicine → Mapping Confidence → Add to Problem List → dual-coded FHIR
Condition → View FHIR JSON → Audit Log.**

### Navigation structure

- **Public / landing (`/`):** logo, tagline, feature overview, and links
  to **Analytics** (public, no login required) and **Login**.
- **AYUSH Doctor (clinician):** Dashboard, Patients, Terminology Search
  (a table of existing NAMASTE → TM2 → ICD-11 mappings), EMR/problem-list
  workflow. No Audit Log, no System Integration, no Analytics link in the
  sidebar — Analytics lives on the public landing page only.
- **Terminology Manager (admin):** Dashboard, Terminology Search, Mapping
  Management (Add / Edit / Delete mapping), WHO sync, Version tracking,
  Audit Log, System Integration.

## 2. Architecture

```
Hospital EMR A   Hospital EMR B   Hospital EMR C
        \              |               /
         \             |              /
              Swasthya-Setu (this app)
                        |
            FHIR Terminology Service
             (CodeSystem / ValueSet / ConceptMap)
                        |
        NAMASTE CSV ingestion    WHO ICD-11 API (OAuth 2.0)
                        |                 |
              Normalized store    Live lookup + local snapshot cache
```

```
Frontend (Next.js/React)
    v  (same-origin fetch only)
Swasthya-Setu Backend (Next.js API routes)
    v  OAuth 2.0 client-credentials
WHO ICD-11 API
```

The frontend **never** talks to the WHO API directly and never sees WHO
credentials — see `src/lib/who-api.ts`. See `ARCHITECTURE.md` for the full
component breakdown and `FHIR.md` for resource shapes.

## 3. Tech stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS v4
- **Backend:** Next.js API routes (Node.js runtime)
- **Data:** JSON-file persistence for the prototype (`data/db.json`) —
  schema-compatible with the PostgreSQL model described in
  `ARCHITECTURE.md` §Database, so swapping in Prisma/Postgres is a
  drop-in replacement for `src/lib/db.ts`
- **FHIR:** Hand-built FHIR R4 resource builders (`src/lib/fhir.ts`)
- **WHO:** Official WHO ICD-11 API, OAuth 2.0 client-credentials grant
- **Validation:** Zod
- **Charts:** Recharts
- **Icons:** lucide-react

## 4. Installation

```bash
npm install
cp .env.example .env   # fill in WHO_CLIENT_ID / WHO_CLIENT_SECRET if you have them
npm run dev
```

Visit `http://localhost:3000` — you'll be redirected to `/login`.

The app is fully runnable **without** WHO credentials: every WHO lookup
transparently falls back to the bundled snapshot in
`data/who-snapshot.json`, and the UI/API status panels clearly report
`snapshot-fallback` mode when this happens.

## 5. Environment variables

See `.env.example`:

```
WHO_CLIENT_ID=
WHO_CLIENT_SECRET=
```

Obtain these from the WHO ICD-11 API portal (https://icd.who.int/icdapi).
They are read **only** in `src/lib/who-api.ts`, a server-only module —
never bundled into client code, never logged, never hardcoded.

## 6. NAMASTE CSV ingestion

Source file: `data/namaste.csv`. Columns:

`namaste_code, english_name, sanskrit_term, system, definition, biomedical_code, biomedical_title, biomedical_definition, tm2_code, tm2_title`

Rows with `NA` in a mapping column are preserved as `null` — the pipeline
(`src/lib/namaste-loader.ts`) never invents a WHO code. Ingestion notes
(missing definitions, missing mappings, duplicate codes, incomplete rows)
are collected and viewable at **Admin -> NAMASTE ingestion pipeline** and
via `GET /api/terminology/ingestion-issues`.

To use your own dataset, replace `data/namaste.csv` with the same column
layout and restart the server (the loader caches on first read per
process).

## 7. Database

The prototype persists to `data/db.json` for zero-setup demoability. The
target production schema (User, Patient, Encounter, NamasteConcept,
ICDConcept, ConceptMapping, Condition, TerminologyVersion, AuditLog,
Consent) is documented in `ARCHITECTURE.md` and modelled directly by the
TypeScript types in `src/lib/types.ts` — moving to PostgreSQL means
replacing the implementation of `src/lib/db.ts` only.

## 8. FHIR implementation

See `FHIR.md` for full resource shapes and system URIs. Summary:

- `CodeSystem` for NAMASTE — `GET /api/fhir/codesystem`
- `ValueSet` of searchable NAMASTE concepts — same endpoint
- `ConceptMap` NAMASTE -> WHO ICD-11 — `GET /api/fhir/conceptmap`
- `Condition` (dual/triple coded) — generated per problem-list entry
- `Bundle` (patient problem list) — `GET /api/fhir/problem-list/:patientId`
- `Bundle` transaction upload (mock EMR ingestion) — `POST /api/fhir/bundle`

## 9. API endpoints

See `API.md` for the full reference. Core routes:

```
GET  /api/terminology/search?q=
GET  /api/terminology/namaste/:code
GET  /api/terminology/icd/:code
POST /api/terminology/translate
POST /api/terminology/sync
GET  /api/terminology/mappings
POST /api/terminology/mappings
PATCH  /api/terminology/mappings/:id
DELETE /api/terminology/mappings/:id
GET  /api/terminology/table
GET  /api/patients
GET  /api/patients/:id
POST /api/patients/:id/conditions
GET  /api/fhir/problem-list/:patientId
POST /api/fhir/bundle
GET  /api/audit
GET  /api/analytics
GET  /api/status
POST /api/auth/login
```

## 10. Demo credentials

Sign-in is simulated (no password check) — pick a role on the login
screen:

| User | Username | Role |
|---|---|---|
| Dr. Ananya Mehta | `ananya.mehta` | AYUSH Doctor |
| Rohit Kulkarni | `rohit.kulkarni` | Terminology Manager / Hospital Admin |

Demo patient for the primary walkthrough: **Rahul Sharma (PAT-001)**,
already has one dual-coded diagnosis (Gṛdhrasī / AAB-37) on file. Two
other patients (Meena Iyer, Arvind Menon) are provided to demonstrate the
patient search flow.

The dedicated **Analytics** page (aggregated statistics only, no
patient-identifying information) is reachable from the main navigation
for both roles — it is not gated behind a separate researcher login.

## 11. Limitations

- Not certified for production clinical, legal, or insurance use.
- The WHO API integration cannot be exercised live in every environment
  (e.g. sandboxed/offline networks) — it degrades to a cached snapshot
  automatically and reports this state honestly rather than pretending
  to be live.
- `Swasthya-Setu Mapping Confidence` is a prototype heuristic based on
  data completeness, not a WHO- or NAMASTE-endorsed metric.
- Persistence is a JSON file, adequate for a single-instance demo, not
  for concurrent production writes.
- The "Terminology Search Assistant" is lexical similarity plus a small
  synonym table — not a machine-learned or diagnostic model.

## 12. Future work

- Swap `src/lib/db.ts` for a PostgreSQL/Prisma implementation against the
  schema in `ARCHITECTURE.md`.
- Expand the WHO MMS search integration to resolve TM2 entities from
  their real WHO entity URIs rather than internal demo codes.
- Add FHIR `$expand` for large-scale ValueSet browsing and pagination.
- SNOMED CT / LOINC cross-mapping for broader biomedical interoperability.
- Formal consent-management workflow tied to India's DPDP Act.
