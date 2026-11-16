import { CalendarClock, MessageSquareText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function IntakeClosedView() {
  return (
    <section
      aria-labelledby="intake-closed-title"
      className="mt-10 flex w-full max-w-xl flex-col items-center text-center"
    >
      <Badge
        variant="ghost"
        className="gap-1.5 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-amber-800 uppercase"
      >
        <span
          aria-hidden
          className="size-1.5 rounded-full bg-amber-500 shadow-[0_0_0_3px] shadow-amber-500/25"
        />
        Applications Closed
      </Badge>

      <h2
        id="intake-closed-title"
        className="mt-5 text-xl font-semibold tracking-tight text-balance text-slate-900 sm:text-2xl"
      >
        We have completed recruiting for this quarter
      </h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-pretty text-slate-600">
        Thank you for your interest in R&amp;D Group. This quarter&apos;s annotator cohort is
        complete, so public applications are paused until next quarter&apos;s intake opens.
      </p>

      <Separator className="my-8 bg-slate-200" />

      <div className="w-full space-y-3 text-left">
        <Alert className="border-slate-200 bg-white shadow-2xs">
          <MessageSquareText className="text-slate-500" aria-hidden />
          <AlertTitle className="line-clamp-none text-slate-900">
            Already received a contract signing SMS?
          </AlertTitle>
          <AlertDescription className="text-slate-600">
            <p>
              Your signing link is not affected. Open the link in that SMS to review and sign your
              contract as usual.
            </p>
          </AlertDescription>
        </Alert>

        <div className="flex items-start gap-3 px-4 text-sm text-slate-500">
          <CalendarClock className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />
          <p className="leading-relaxed text-pretty">
            This page reopens automatically when the next intake begins. No action is needed
            from you until then.
          </p>
        </div>
      </div>
    </section>
  );
}
