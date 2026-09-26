"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { SubmitButton } from "@/components/shared/submit-button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { authClient, authErrorMessage } from "@/lib/auth-client";

import { AuthHeading, authInputClass, AuthNotice, FieldIcon } from "./auth-ui";

const loginSchema = z.object({
  email: z.email("Enter a valid e-mail address"),
  password: z.string().min(1, "Enter your password"),
});

type LoginValues = z.infer<typeof loginSchema>;

const NOTICES: Record<string, string> = {
  inactive: "Your account is not active. Please contact your administrator.",
  "signed-out": "You have been signed out.",
  "password-set": "Your password has been saved. Sign in to continue.",
};

export function LoginForm({ next, notice }: { next: string | null; notice: string | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const { error: signInError } = await authClient.signIn.email({
      email: values.email.trim().toLowerCase(),
      password: values.password,
      rememberMe: true,
    });
    if (signInError) {
      setError(authErrorMessage(signInError));
      form.setValue("password", "");
      return;
    }
    router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
    router.refresh();
  });

  const noticeText = notice ? NOTICES[notice] : null;

  return (
    <div>
      <AuthHeading
        title="Welcome back"
        description="Sign in with the e-mail address your administrator registered for you."
      />
      <Form {...form}>
        <form onSubmit={onSubmit} className="grid gap-5" noValidate>
          {noticeText ? (
            <AuthNotice tone={notice === "inactive" ? "error" : "info"} role="status">
              {noticeText}
            </AuthNotice>
          ) : null}
          {error ? (
            <AuthNotice tone="error" role="alert">
              {error}
            </AuthNotice>
          ) : null}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <div className="relative">
                  <FieldIcon icon={Mail} />
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="username"
                      autoFocus
                      placeholder="you@company.com"
                      className={authInputClass}
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <FieldIcon icon={Lock} />
                  <FormControl>
                    <PasswordInput
                      autoComplete="current-password"
                      placeholder="Your password"
                      className={authInputClass}
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <SubmitButton
            pending={form.formState.isSubmitting}
            size="lg"
            className="group mt-1 h-11 w-full"
          >
            Sign in
            {form.formState.isSubmitting ? null : (
              <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
            )}
          </SubmitButton>
        </form>
      </Form>
      <div className="mt-8 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        Access by invitation only
        <span className="h-px flex-1 bg-border" />
      </div>
      <p className="mt-3 text-center text-sm text-muted-foreground">
        Need an account? Ask your administrator to invite you.
      </p>
    </div>
  );
}
