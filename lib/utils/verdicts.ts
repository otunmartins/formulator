import type { Grade, Severity, Verdict } from "@/lib/types/domain";

// The single mapping for verdict, grade and severity presentation (CODING_STANDARDS §7).
// Components never re-type these labels or colours.

export type VerdictIcon = "circle-check" | "circle-check-dashed" | "flask" | "triangle-alert";

interface VerdictStyle {
  label: string;
  icon: VerdictIcon;
  /** Tailwind classes built from the verdict tokens. */
  className: string;
}

export const VERDICTS: Record<Verdict, VerdictStyle> = {
  prec: {
    label: "Precedented",
    icon: "circle-check",
    className: "text-prec-text bg-prec-fill border-prec-border",
  },
  supp: {
    label: "Supported without precedent",
    icon: "circle-check-dashed",
    className: "text-supp-text bg-supp-fill border-supp-border",
  },
  gap: {
    label: "Data gap: test",
    icon: "flask",
    className: "text-gap-text bg-gap-fill border-gap-border",
  },
  alert: {
    label: "Alert: avoid",
    icon: "triangle-alert",
    className: "text-alert-text bg-alert-fill border-alert-border",
  },
};

export function verdictStyle(verdict: Verdict): VerdictStyle {
  switch (verdict) {
    case "prec":
    case "supp":
    case "gap":
    case "alert":
      return VERDICTS[verdict];
    default: {
      const unreachable: never = verdict;
      throw new Error(`Unknown verdict: ${String(unreachable)}`);
    }
  }
}

export const GRADES: Record<Grade, string> = {
  A: "Regulatory precedent at this route and level",
  B: "Experimental data",
  C: "In-domain prediction",
  D: "Out-of-domain or surrogate prediction",
  E: "No data",
};

export const GRADE_ORDER: readonly Grade[] = ["A", "B", "C", "D", "E"];

interface SeverityStyle {
  label: Severity;
  /** Text colour class; always shown alongside the label. */
  className: string;
}

export const SEVERITY: Record<Severity, SeverityStyle> = {
  High: { label: "High", className: "text-risk-high" },
  Medium: { label: "Medium", className: "text-risk-medium" },
  Low: { label: "Low", className: "text-risk-low" },
};
