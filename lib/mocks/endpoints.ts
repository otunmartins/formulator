import { z } from "zod";
import { endpointSchema, type Endpoint } from "@/lib/types/dossier";

// Endpoint fixtures (Build 04), copied from the reference screens S07 (PS80 × 1N8Z) and S15
// (ALX-117 × 1N8Z). The screens show sources only for the expanded peroxide rows; every other
// row carries one visible [PLACEHOLDER] source rather than an invented citation.
// Out-of-domain text is stored without its "Out of domain:" prefix; the UI adds it.
// TODO(phase-2): Endpoint and Source rows written by the precedent and hazard pipelines.

export type EndpointSetId = "ps80" | "alx117";

const PLACEHOLDER_SOURCES = [{ title: "[PLACEHOLDER]", meta: "[PLACEHOLDER]" }];
const LIABILITY_MET = { title: "Liability map: HC Met107, HC Met83", meta: "1N8Z · FreeSASA 2.1" };

const PS80: Endpoint[] = [
  {
    id: "reg",
    name: "Regulatory precedent",
    subtitle: "SC route, 0.2 mg/mL",
    verdict: "prec",
    grade: "A",
    basis:
      "Listed for subcutaneous use. The entered level is within the range used in marketed SC antibody products.",
    ood: null,
    sources: PLACEHOLDER_SOURCES,
    step: "precedent",
  },
  {
    id: "tox",
    name: "Local tolerance and systemic toxicity",
    subtitle: "SC",
    verdict: "prec",
    grade: "A",
    basis: "Long-standing parenteral use at comparable exposure. No route-specific signal found.",
    ood: null,
    sources: PLACEHOLDER_SOURCES,
    step: "precedent",
  },
  {
    id: "residual",
    name: "Residual ethylene oxide and 1,4-dioxane",
    subtitle: "Process impurities",
    verdict: "prec",
    grade: "A",
    basis: "Controlled by compendial limits. Confirm the supplier CoA meets them.",
    ood: null,
    sources: PLACEHOLDER_SOURCES,
    step: "precedent",
  },
  {
    id: "hypersens",
    name: "Hypersensitivity",
    subtitle: "Excipient-related",
    verdict: "supp",
    grade: "B",
    basis:
      "Reports concentrate on IV products at higher polysorbate exposure. No SC signal found, but SC data at this level are limited.",
    ood: null,
    sources: PLACEHOLDER_SOURCES,
    step: "hazard",
  },
  {
    id: "perox",
    name: "Peroxide impurities → Met oxidation",
    subtitle: "This Fab",
    verdict: "alert",
    grade: "B",
    basis:
      "Polysorbate 80 autoxidises to peroxides on storage, and HC Met107 in CDR-H3 is solvent-exposed. Avoid standard grade: specify a low-peroxide grade with an incoming peroxide limit.",
    ood: null,
    sources: [
      {
        title:
          "Ha, Wang & Wang. Peroxide formation in polysorbate 80 and protein stability. J Pharm Sci (2002)",
        meta: "Experimental, class-level",
      },
      {
        title:
          "Kishore et al. Degradation of polysorbates 20 and 80: autoxidation and hydrolysis. J Pharm Sci (2011)",
        meta: "Experimental, class-level",
      },
      LIABILITY_MET,
    ],
    step: "hazard",
  },
  {
    id: "hydrolysis",
    name: "Hydrolysis → free fatty acid particles",
    subtitle: "Residual host-cell lipases",
    verdict: "gap",
    grade: "D",
    basis:
      "Depends on residual lipase activity in the drug substance, which is not in this dossier. Test sub-visible particles after storage at 25 °C.",
    ood: "this prediction uses polysorbate 20 data as a surrogate. Treat it as a hypothesis to test, not as evidence.",
    sources: PLACEHOLDER_SOURCES,
    step: "hazard",
  },
  {
    id: "deamid",
    name: "Deamidation at storage temperature",
    subtitle: "HC Asn55–Gly56",
    verdict: "gap",
    grade: "C",
    basis:
      "Asn-Gly in CDR-H2 is predicted fast at 25 °C and slow at 4 °C. Protein-intrinsic, not excipient-driven. Confirm by peptide mapping on stability.",
    ood: null,
    sources: PLACEHOLDER_SOURCES,
    step: "hazard",
  },
  {
    id: "interfacial",
    name: "Interfacial and agitation protection",
    subtitle: "This Fab",
    verdict: "supp",
    grade: "C",
    basis:
      "Surfactant class protects against interfacial aggregation. The compatibility simulation adds a protein-specific signal.",
    ood: null,
    sources: PLACEHOLDER_SOURCES,
    step: "hazard",
  },
];

const ALX117: Endpoint[] = [
  {
    id: "reg",
    name: "Regulatory precedent",
    subtitle: "SC route, 1.0 mg/mL",
    verdict: "gap",
    grade: "E",
    basis: "No listing for SC use in FDA IID or EMA sources.",
    ood: null,
    sources: PLACEHOLDER_SOURCES,
    step: "precedent",
  },
  {
    id: "tox",
    name: "Local tolerance and systemic toxicity",
    subtitle: "SC",
    verdict: "gap",
    grade: "E",
    basis: "No local tolerance or repeat-dose toxicity data found.",
    ood: null,
    sources: PLACEHOLDER_SOURCES,
    step: "precedent",
  },
  {
    id: "residual",
    name: "Residual monomers and catalyst",
    subtitle: "Process impurities",
    verdict: "gap",
    grade: "E",
    basis: "Residual lactide, glycolide and polymerisation catalyst are not characterised.",
    ood: null,
    sources: PLACEHOLDER_SOURCES,
    step: "precedent",
  },
  {
    id: "hypersens",
    name: "Hypersensitivity",
    subtitle: "Excipient-related",
    verdict: "gap",
    grade: "D",
    basis:
      "Pre-existing anti-PEG antibodies are possible. Not assessable for this polymer without data.",
    ood: "anti-PEG antibody risk is inferred from PEGylated protein data, not from this polymer.",
    sources: PLACEHOLDER_SOURCES,
    step: "hazard",
  },
  {
    id: "perox",
    name: "Peroxide impurities → Met oxidation",
    subtitle: "This Fab",
    verdict: "gap",
    grade: "D",
    basis:
      "PEG blocks can form peroxides. Oxidation risk to HC Met107 is unquantified. Measure peroxide content.",
    ood: "peroxide propensity uses PEG homopolymer data. The block copolymer is outside the model domain.",
    sources: [
      {
        title: "Surrogate: PEG homopolymer peroxide data",
        meta: "Outside model applicability domain",
      },
      LIABILITY_MET,
    ],
    step: "hazard",
  },
  {
    id: "polyester",
    name: "Polyester hydrolysis → pH drift",
    subtitle: "PLGA block",
    verdict: "gap",
    grade: "C",
    basis:
      "The PLGA ester backbone hydrolyses to lactic and glycolic acid. Expect pH drift in a weakly buffered formulation.",
    ood: null,
    sources: PLACEHOLDER_SOURCES,
    step: "hazard",
  },
  {
    id: "deamid",
    name: "Deamidation at storage temperature",
    subtitle: "HC Asn55–Gly56",
    verdict: "gap",
    grade: "C",
    basis: "Protein-intrinsic. Acidic drift from polymer hydrolysis could change the rate.",
    ood: null,
    sources: PLACEHOLDER_SOURCES,
    step: "hazard",
  },
  {
    id: "interfacial",
    name: "Interfacial and agitation protection",
    subtitle: "This Fab",
    verdict: "gap",
    grade: "E",
    basis: "No interfacial data for this polymer.",
    ood: null,
    sources: PLACEHOLDER_SOURCES,
    step: "hazard",
  },
];

export interface EndpointSet {
  endpoints: readonly Endpoint[];
  /** No precedent for the fixture's route (S15). */
  novelForRoute: boolean;
}

const endpointsSchema = z.array(endpointSchema).length(8);

// Validated at load so a bad fixture fails loudly (CODING_STANDARDS §1).
export const ENDPOINT_SETS: Record<EndpointSetId, EndpointSet> = {
  ps80: { endpoints: endpointsSchema.parse(PS80), novelForRoute: false },
  alx117: { endpoints: endpointsSchema.parse(ALX117), novelForRoute: true },
};
