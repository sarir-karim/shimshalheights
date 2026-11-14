"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/admin/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { api, errorMessage } from "@/lib/adminApi";
import type { AdminUser } from "@/types/admin";

const schema = z.object({ email: z.string().trim().email("Enter your email address"), password: z.string().min(1, "Enter your password") });
type Values = z.infer<typeof schema>;

/** Only same-site /admin paths are accepted as a post-login destination (prevents open redirects). */
const safeNext = (n: string | null) => (n && /^\/admin(\/[\w\-./]*)?$/.test(n) && !n.startsWith("//") ? n : "/admin");

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading, setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });

  useEffect(() => { if (!loading && user) router.replace(safeNext(params.get("next"))); }, [loading, user, router, params]);

  const onSubmit = async (values: Values) => {
    setError(null);
    try {
      const res = await api<{ user: AdminUser }>("POST", "/auth/login", { body: values });
      setUser(res.data.user);
      router.replace(safeNext(params.get("next")));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="w-full max-w-md space-y-5 rounded-xl2 bg-white p-8 shadow-lift" aria-label="Sign in">
      <div>
        <p className="font-display text-3xl text-forest-dark">Shimshal Heights</p>
        <p className="mt-1 text-slate-soft">Sign in to manage the hotel.</p>
      </div>
      <Field id="login-email" label="Email" error={errors.email?.message}><input id="login-email" type="email" autoComplete="username" className="input-field" {...register("email")} /></Field>
      <Field id="login-password" label="Password" error={errors.password?.message}><input id="login-password" type="password" autoComplete="current-password" className="input-field" {...register("password")} /></Field>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? (<><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Signing in…</>) : "Sign in"}</Button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-forest-dark px-4 py-10">
      <Suspense fallback={null}><LoginForm /></Suspense>
    </main>
  );
}
