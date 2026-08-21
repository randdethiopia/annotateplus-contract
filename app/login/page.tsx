"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/backend/client";
import type { StaffUserDto } from "@/types/backend";

const HOME_HREF: Record<StaffUserDto["role"], string> = {
  HR_REVIEWER: "/hr",
  FINANCE: "/finance",
  ADMIN: "/admin",
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: (user) => router.push(HOME_HREF[user.role]),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutate();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-50 px-4">
      <Image
        src="/src/logo/R&D__Logo_and_Slogan.png"
        alt="R&D"
        width={220}
        height={100}
        className="h-12 w-auto object-contain"
      />

      <Card className="w-full max-w-sm border-t-2 border-t-[#ef5325] shadow-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use your HR, Finance, or Admin account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-500">
                {error instanceof ApiError ? error.message : "Something went wrong"}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
