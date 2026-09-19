import { Icon } from "@/components/ui/Icon";

export const DISCLAIMER =
  "Decision support, not a certification of safety. Wet-lab validation required.";

/** Persistent disclaimer, visible in every state. */
export function Footer() {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 flex h-footer items-center justify-center gap-2 bg-footer-bg text-xs text-footer-text">
      <Icon name="info" className="size-3.5" />
      {DISCLAIMER}
    </footer>
  );
}
