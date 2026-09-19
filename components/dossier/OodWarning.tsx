import { Icon } from "@/components/ui/Icon";

export interface OodWarningProps {
  /** The warning after its "Out of domain:" label. */
  text: string;
}

/** Inline out-of-domain flag on a grade D row: the prediction is a hypothesis, not evidence. */
export function OodWarning({ text }: OodWarningProps) {
  return (
    <p className="mt-2 flex items-start gap-2 rounded-control border border-gap-border bg-gap-fill px-3 py-2 text-xs text-gap-text">
      <Icon name="triangle-alert" className="mt-px size-3.5 shrink-0" />
      <span>
        <span className="font-semibold">Out of domain:</span> {text}
      </span>
    </p>
  );
}
