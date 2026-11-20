import { Fragment } from "react";
import { ExternalLink, Mail, Phone } from "lucide-react";
import { normalizePhoneToE164 } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { SIGN_ROADMAP_COPY } from "./copy";

const PROJECT_LINKS = [
  { label: "EDGE Project", href: "https://edge.et/", display: "edge.et" },
  { label: "R&D Group", href: "https://randd-group.com", display: "randd-group.com" },
] as const;

const SUPPORT_PHONES = ["0999904925", "0999905731", "0999903895"] as const;

const RECRUITMENT_EMAIL = "Recruitment@randd-group.com";

const LINK =
  "text-action focus-visible:ring-ring/50 inline-block rounded-sm py-1 font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px]";

export function SupportChannels() {
  const copy = SIGN_ROADMAP_COPY;

  return (
    <footer className="border-t border-slate-200 pt-8 text-sm">
      <p className="font-medium text-slate-900">{copy.learnMore}</p>
      <ul className="mt-2">
        {PROJECT_LINKS.map((link) => (
          <li key={link.href} className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-slate-600">{link.label}:</span>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(LINK, "inline-flex items-center gap-1")}
            >
              {link.display}
              <ExternalLink className="size-3.5" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-8 font-medium text-slate-900">{copy.questionsHeader}</p>
      <ul className="mt-2">
        <li className="flex items-start gap-2">
          <Phone className="mt-1.5 size-4 shrink-0 text-slate-400" aria-hidden />
          <span className="sr-only">Phone:</span>
          <span className="flex flex-wrap items-center gap-x-2">
            {SUPPORT_PHONES.map((phone, index) => (
              <Fragment key={phone}>
                {index > 0 && (
                  <span className="text-slate-300" aria-hidden>
                    /
                  </span>
                )}
                <a href={`tel:${normalizePhoneToE164(phone)}`} className={cn(LINK, "tabular")}>
                  {phone}
                </a>
              </Fragment>
            ))}
          </span>
        </li>
        <li className="flex items-start gap-2">
          <Mail className="mt-1.5 size-4 shrink-0 text-slate-400" aria-hidden />
          <span className="sr-only">Email:</span>
          <a href={`mailto:${RECRUITMENT_EMAIL}`} className={cn(LINK, "break-all")}>
            {RECRUITMENT_EMAIL}
          </a>
        </li>
      </ul>

      <p className="mt-4 text-sm font-medium text-slate-900">{copy.closing}</p>
    </footer>
  );
}
