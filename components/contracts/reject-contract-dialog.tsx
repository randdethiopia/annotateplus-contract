"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MessageSquareWarning, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/system/field";
import { REJECTION_CATEGORY_OPTIONS } from "@/lib/rejection-categories";
import {
  rejectContractSchema,
  type RejectContractInput,
} from "@/lib/validations/contract.schema";
import type { RejectPayload } from "@/types/backend";

const DEFAULTS: RejectContractInput = {
  rejectionCategory: "OTHER",
  rejectionReasonEnglish: "",
  rejectionReasonAmharic: "",
};

export function RejectContractDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: RejectPayload) => void;
  isPending: boolean;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RejectContractInput>({
    resolver: zodResolver(rejectContractSchema),
    defaultValues: DEFAULTS,
  });

  const category = watch("rejectionCategory");

  useEffect(() => {
    if (!open) reset(DEFAULTS);
  }, [open, reset]);

  function handleFormSubmit(values: RejectContractInput) {
    onSubmit({
      rejectionCategory: values.rejectionCategory,
      rejectionReasonEnglish: values.rejectionReasonEnglish,
      rejectionReasonAmharic: values.rejectionReasonAmharic?.trim() || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <MessageSquareWarning className="size-5 shrink-0" aria-hidden />
            Reject with feedback
          </DialogTitle>
          <DialogDescription>
            The candidate receives this feedback by SMS and can resubmit if attempts remain.
            Write it so they know exactly what to fix.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <Field label="Rejection category" error={errors.rejectionCategory?.message}>
            <Select
              value={category}
              onValueChange={(v) =>
                setValue("rejectionCategory", v as RejectContractInput["rejectionCategory"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REJECTION_CATEGORY_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field
            id="rejectionReasonEnglish"
            label="Reason (English)"
            error={errors.rejectionReasonEnglish?.message}
            hint="Max 500 characters."
          >
            <Textarea
              id="rejectionReasonEnglish"
              rows={3}
              maxLength={500}
              autoFocus
              placeholder="e.g. The back of your ID is blurry — please retake it in brighter light."
              aria-invalid={!!errors.rejectionReasonEnglish}
              {...register("rejectionReasonEnglish")}
            />
          </Field>

          <Field
            id="rejectionReasonAmharic"
            label="Reason (Amharic)"
            labelAmharic="በአማርኛ"
            optional
            error={errors.rejectionReasonAmharic?.message}
            hint="Strongly recommended — most candidates read Amharic more comfortably."
          >
            <Textarea
              id="rejectionReasonAmharic"
              rows={3}
              maxLength={500}
              className="font-ethiopic"
              aria-invalid={!!errors.rejectionReasonAmharic}
              {...register("rejectionReasonAmharic")}
            />
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
              {isPending ? "Sending…" : "Reject with feedback"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
