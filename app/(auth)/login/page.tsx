"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BrandLogo } from "@/components/branding/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/system/field";
import { useAuth } from "@/lib/auth/auth-context";
import { describeError } from "@/lib/describe-error";
import { loginSchema, type LoginInput } from "@/lib/validations/contract.schema";
import type { StaffUserDto } from "@/types/backend";

const HOME_HREF: Record<StaffUserDto["role"], string> = {
  HR_REVIEWER: "/hr",
  FINANCE: "/finance",
  ADMIN: "/hr",
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    try {
      const user = await login(values.email, values.password);
      router.push(HOME_HREF[user.role]);
    } catch (err) {
      console.error("Login failed", err);
      toast.error(describeError(err, "Sign in failed"));
    }
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-3xl p-8 shadow-xs">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <BrandLogo size="lg" className="mx-auto mb-2" />
            <div>
              <h1 className="text-foreground text-lg font-bold tracking-tight">
                AnnotatePlus Contract
              </h1>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Sign in to the contract management portal
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Field id="email" label="Email" error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                autoFocus
                aria-invalid={!!errors.email}
                {...register("email")}
              />
            </Field>

            <Field id="password" label="Password" error={errors.password?.message}>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
            </Field>

            <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>

        <p className="text-muted-foreground mt-6 text-center text-xs">
          Staff access only. Candidates sign via the link sent to their phone.
        </p>
      </div>
    </div>
  );
}
