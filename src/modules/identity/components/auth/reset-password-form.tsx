"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Link2Off, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { SubmitButton } from "@/components/shared/submit-button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { authClient, authErrorMessage } from "@/lib/auth-client";
import { PASSWORD_HINT } from "@/platform/auth/password-policy";

import { newPasswordSchema } from "../../schemas";
import { AuthHeading, authInputClass, AuthNotice, FieldIcon } from "./auth-ui";

type Values = z.infer<typeof newPasswordSchema>;

/** Choose a new password — used by the reset link and by invitations (M02-04, M02-10). */
export function ResetPasswordForm({ token, invite }: { token: string | null; invite: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  if (!token) {
    return (
      <div>
        <AuthHeading
          icon={Link2Off}
          title="Link not valid"
          description="This link is incomplete. Request a new password reset link."
        />
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const { error: resetError } = await authClient.resetPassword({
      newPassword: values.newPassword,
      token,
    });
    if (resetError) {
      setError(authErrorMessage(resetError));
      return;
    }
    router.replace("/login?notice=password-set");
  });

  return (
    <div>
      <AuthHeading
        icon={KeyRound}
        title={invite ? "Set up your account" : "Choose a new password"}
        description={
          invite
            ? "Welcome! Choose a password to activate your account."
            : "Enter a new password for your account."
        }
      />
      <Form {...form}>
        <form onSubmit={onSubmit} className="grid gap-5" noValidate>
          {error ? (
            <AuthNotice tone="error" role="alert">
              {error}{" "}
              {error.includes("expired") ? (
                <Link href="/forgot-password" className="font-medium underline">
                  Request a new link
                </Link>
              ) : null}
            </AuthNotice>
          ) : null}
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <div className="relative">
                  <FieldIcon icon={Lock} />
                  <FormControl>
                    <PasswordInput
                      autoComplete="new-password"
                      autoFocus
                      className={authInputClass}
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormDescription>{PASSWORD_HINT}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <div className="relative">
                  <FieldIcon icon={Lock} />
                  <FormControl>
                    <PasswordInput
                      autoComplete="new-password"
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
            className="mt-1 h-11 w-full"
          >
            {invite ? "Activate account" : "Save new password"}
          </SubmitButton>
        </form>
      </Form>
    </div>
  );
}
