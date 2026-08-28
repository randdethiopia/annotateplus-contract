"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REJECTION_CATEGORY_OPTIONS } from "@/lib/rejection-categories";
import {
  rejectContractSchema,
  type RejectContractInput,
} from "@/lib/validations/contract.schema";
import type { RejectPayload } from "@/types/backend";

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
    defaultValues: {
      rejectionCategory: "OTHER",
      rejectionReasonEnglish: "",
      rejectionReasonAmharic: "",
    },
  });

  const category = watch("rejectionCategory");

  useEffect(() => {
    if (!open) {
      reset({
        rejectionCategory: "OTHER",
        rejectionReasonEnglish: "",
        rejectionReasonAmharic: "",
      });
    }
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject with feedback</DialogTitle>
          <DialogDescription>
            The candidate will receive your feedback by SMS and may resubmit if attempts remain.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Rejection category</Label>
            <Select
              value={category}
              onValueChange={(v) =>
                setValue("rejectionCategory", v as RejectContractInput["rejectionCategory"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="w-full bg-[#F4F4F5] border-0">
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
          </div>
          <div className="space-y-1.5">
            <Label>Reason (English) — required</Label>
            <Textarea
              rows={3}
              maxLength={500}
              className="bg-[#F4F4F5] border-0"
              {...register("rejectionReasonEnglish")}
            />
            {errors.rejectionReasonEnglish && (
              <p className="text-sm text-red-500">{errors.rejectionReasonEnglish.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Reason (Amharic) — optional</Label>
            <Textarea
              rows={3}
              maxLength={500}
              className="font-ethiopic bg-[#F4F4F5] border-0"
              {...register("rejectionReasonAmharic")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Reject with Feedback
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
