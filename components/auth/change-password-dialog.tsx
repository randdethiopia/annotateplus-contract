"use client";

import { useEffect, type RefObject } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { PasswordChecklist } from "@/components/auth/password-checklist";
import { PasswordInput } from "@/components/auth/password-input";
import { Field } from "@/components/system/field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { changeStaffPassword } from "@/lib/api/auth.api";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { describeError } from "@/lib/describe-error";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validations/password.schema";
import type { ChangePasswordPayload } from "@/types/backend";

const EMPTY_VALUES: ChangePasswordInput = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function isWrongCurrentPassword(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401 && err.code === "INVALID_CURRENT_PASSWORD";
}

function describeFailure(err: unknown): { title: string; message: string } {
  if (isWrongCurrentPassword(err)) {
    return {
      title: "Current password is incorrect.",
      message: "Re-enter the password you currently use to sign in. You are still signed in.",
    };
  }
  if (err instanceof ApiError && err.status === 401) {
    return {
      title: "Your session could not be confirmed",
      message: "Sign out and sign in again, then retry the password change.",
    };
  }
  if (err instanceof ApiError && err.status === 429) {
    return {
      title: "Too many attempts",
      message: err.retryAfterSeconds
        ? `Try again in ${err.retryAfterSeconds} seconds.`
        : "Wait a moment and try again.",
    };
  }
  return {
    title: "Password not updated",
    message: describeError(err, "Could not update your password"),
  };
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
  returnFocusRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}) {
  const { token, updateSession } = useAuth();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setFocus,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY_VALUES,
    mode: "onTouched",
  });
  const currentPassword = useWatch({ control, name: "currentPassword" });
  const newPassword = useWatch({ control, name: "newPassword" });
  const confirmPassword = useWatch({ control, name: "confirmPassword" });

  const {
    mutate,
    reset: resetMutation,
    isPending,
    isError,
    error,
  } = useMutation({
    retry: 0,
    gcTime: 0,
    mutationFn: (payload: ChangePasswordPayload) => {
      if (!token) {
        return Promise.reject(new Error("your session has ended"));
      }
      return changeStaffPassword(token, payload);
    },
    onSuccess: (data) => {
      updateSession(data.token, data.user);
      toast.success("Password updated. Older active sessions have been signed out.");
    },
  });

  const failure = isError ? describeFailure(error) : null;

  useEffect(() => {
    if (isWrongCurrentPassword(error)) {
      setFocus("currentPassword", { shouldSelect: true });
    }
  }, [error, setFocus]);

  function handleOpenChange(next: boolean) {
    if (!next && isPending) return;
    if (!next) {
      reset(EMPTY_VALUES);
      resetMutation();
    }
    onOpenChange(next);
  }

  function onSubmit(values: ChangePasswordInput) {
    mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          reset(EMPTY_VALUES);
          resetMutation();
          onOpenChange(false);
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!isPending}
        className="overflow-y-auto bg-white sm:max-w-md"
        onCloseAutoFocus={(event) => {
          if (returnFocusRef?.current) {
            event.preventDefault();
            returnFocusRef.current.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-foreground tracking-tight">Change password</DialogTitle>
          <DialogDescription>
            Saving a new password signs out every other active session. You stay signed in here.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="min-w-0 space-y-6">
          <fieldset disabled={isPending} className="min-w-0 space-y-5">
            <legend className="sr-only">Update your password</legend>

            {failure && (
              <Alert className="border-red-200 bg-destructive-soft text-red-900 [&>svg]:text-destructive">
                <TriangleAlert aria-hidden />
                <AlertTitle className="line-clamp-none">{failure.title}</AlertTitle>
                <AlertDescription className="text-red-800">{failure.message}</AlertDescription>
              </Alert>
            )}

            <Field
              id="current-password"
              label="Current password"
              error={errors.currentPassword?.message}
            >
              <PasswordInput
                id="current-password"
                autoComplete="current-password"
                aria-invalid={!!errors.currentPassword || isWrongCurrentPassword(error)}
                {...register("currentPassword")}
              />
            </Field>

            <Separator className="bg-slate-200" />

            <Field id="change-new-password" label="New password" error={errors.newPassword?.message}>
              <PasswordInput
                id="change-new-password"
                autoComplete="new-password"
                aria-invalid={!!errors.newPassword}
                aria-describedby="change-password-requirements"
                {...register("newPassword")}
              />
            </Field>

            <PasswordChecklist
              id="change-password-requirements"
              password={newPassword}
              confirmPassword={confirmPassword}
              currentPassword={currentPassword}
            />

            <Field
              id="change-confirm-password"
              label="Confirm new password"
              error={errors.confirmPassword?.message}
            >
              <PasswordInput
                id="change-confirm-password"
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                {...register("confirmPassword")}
              />
            </Field>
          </fieldset>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden />}
              {isPending ? "Updating…" : "Update password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
