import type { ReactNode } from "react";

export function SectionHeading({
  id,
  step,
  title,
  description,
  aside,
}: {
  id: string;
  step?: number;
  title: string;
  description?: string;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1">
        <h2
          id={id}
          className="text-[11px] font-semibold tracking-[0.1em] text-slate-500 uppercase"
        >
          {step === undefined ? title : `${step}. ${title}`}
        </h2>
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </div>
      {aside}
    </div>
  );
}
