"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BrandLogo } from "@/components/branding/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border-0 bg-white p-8 shadow-xs">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <BrandLogo className="h-10" width={200} height={48} />
          <p className="text-sm text-muted-foreground">
            Sign in to R&amp;D Contract Management Portal
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              className="h-11 px-4"
              {...register("email")}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              className="h-11 px-4"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-lg bg-[#1A4428] font-semibold text-white hover:bg-[#13331e]"
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
