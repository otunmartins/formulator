import type { Review, RunContext } from "@/lib/types/domain";

/** `RUN-2026-0918-0412` → `RUN-0918-0412` for compact lists. The data keeps the full ID. */
export function shortRunId(runId: string): string {
  const match = /^RUN-\d{4}-(\d{4}-\d{4})$/.exec(runId);
  return match ? `RUN-${match[1]}` : runId;
}

export function formatTemp(celsius: number): string {
  return `${celsius} °C`;
}

const FREQUENCIES: Record<string, string> = {
  qd: "daily",
  qw: "weekly",
  q2w: "every 2 weeks",
  q3w: "every 3 weeks",
  q4w: "every 4 weeks",
  once: "single dose",
};

export function formatFrequency(code: string): string {
  return FREQUENCIES[code] ?? code;
}

/**
 * An excipient concentration in mg/mL with at least one decimal place, as the screens show it:
 * 1 → "1.0", 0.2 → "0.2", 0.125 → "0.125". Digits are only added, never rounded away.
 */
export function formatConc(mgPerMl: number): string {
  return Number.isInteger(mgPerMl) ? mgPerMl.toFixed(1) : String(mgPerMl);
}

/** Run header context line, e.g. `SC · 150 mg every 2 weeks · 0.2 mg/mL excipient · stored at 25 °C`. */
export function formatContextLine(context: RunContext): string {
  return [
    context.route,
    `${context.dose.value} ${context.dose.unit} ${formatFrequency(context.frequency)}`,
    `${formatConc(context.conc_mg_mL)} mg/mL excipient`,
    `stored at ${formatTemp(context.storage_C)}`,
  ].join(" · ");
}

// Fixed abbreviations: en-GB Intl gives "Sept", the screens use "Sep".
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** `dd/mm/yyyy` in the given time zone. */
function dayKey(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Recent-runs time: `Today 14:12`, `Yesterday`, or `16 Sep`. */
export function formatRunTime(iso: string, now: Date = new Date(), timeZone?: string): string {
  const date = new Date(iso);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (dayKey(date, timeZone) === dayKey(now, timeZone)) {
    const time = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
    return `Today ${time}`;
  }
  if (dayKey(date, timeZone) === dayKey(yesterday, timeZone)) return "Yesterday";
  const [day, month] = dayKey(date, timeZone).split("/");
  return `${Number(day)} ${MONTHS[Number(month) - 1]}`;
}

/** Status chip text for a run's review state: `Draft` or `Signed off v2`. */
export function reviewLabel(review: Review): string {
  return review.status === "signed" ? `Signed off v${review.version}` : "Draft";
}
