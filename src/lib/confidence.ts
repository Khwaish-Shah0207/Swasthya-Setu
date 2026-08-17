import type { MappingConfidence, NamasteConcept } from "./types";

// ---------------------------------------------------------------------------
// "Swasthya-Setu Mapping Confidence"
//
// This is a PROTOTYPE-SPECIFIC heuristic used to communicate, at a glance,
// how complete and well-specified a NAMASTE -> WHO mapping is. WHO does not
// publish an official confidence score for these mappings — this indicator
// must always be labelled as belonging to Swasthya-Setu, never attributed
// to WHO or NAMASTE.
//
// Heuristic (transparent, on purpose, for hackathon demonstrability):
//   +40  exact biomedical code present
//   +25  TM2 code present
//   +15  definition present for the NAMASTE concept
//   +10  biomedical title present
//   +10  TM2 title present
//   capped at 97 (never claim absolute certainty)
//   floor of 30 when at least the biomedical or TM2 code exists
// ---------------------------------------------------------------------------

export function computeMappingConfidence(concept: NamasteConcept): MappingConfidence {
  let score = 0;
  const reasons: string[] = [];

  if (concept.biomedicalCode) {
    score += 40;
    reasons.push("biomedical code present");
  }
  if (concept.tm2Code) {
    score += 25;
    reasons.push("TM2 code present");
  }
  if (concept.definition) {
    score += 15;
    reasons.push("source definition present");
  }
  if (concept.biomedicalTitle) {
    score += 10;
    reasons.push("biomedical title present");
  }
  if (concept.tm2Title) {
    score += 10;
    reasons.push("TM2 title present");
  }

  if (score === 0) {
    return {
      score: 0,
      band: "Low",
      label: "Swasthya-Setu Mapping Confidence",
      rationale: "No WHO mapping data available for this concept in the current dataset.",
    };
  }

  score = Math.min(score, 97);
  score = Math.max(score, concept.biomedicalCode || concept.tm2Code ? 30 : 0);

  const band: MappingConfidence["band"] = score >= 85 ? "High" : score >= 60 ? "Medium" : "Low";

  return {
    score,
    band,
    label: "Swasthya-Setu Mapping Confidence",
    rationale: reasons.length > 0 ? `Based on: ${reasons.join(", ")}.` : "Limited source data available.",
  };
}
