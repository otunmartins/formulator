import { Icon } from "@/components/ui/Icon";

export interface NovelBannerProps {
  excipient: string;
  route: string | null;
}

/** S15: no precedent at this route, so no endpoint gets a positive verdict. */
export function NovelBanner({ excipient, route }: NovelBannerProps) {
  return (
    <section
      aria-labelledby="novel-banner-title"
      className="mb-5 flex animate-reveal items-start gap-3 rounded-card border border-gap-border bg-gap-fill px-5 py-4"
    >
      <Icon name="flask" className="mt-0.5 size-4 shrink-0 text-gap-text" />
      <div className="text-[13px]">
        <h2 id="novel-banner-title" className="font-semibold text-gap-text">
          Needs a nonclinical package
        </h2>
        <p className="mt-0.5">
          {excipient} has no precedent for the {route ?? "[PLACEHOLDER]"} route. No positive verdict
          is given for any endpoint until nonclinical data are added to this dossier.
        </p>
      </div>
    </section>
  );
}
