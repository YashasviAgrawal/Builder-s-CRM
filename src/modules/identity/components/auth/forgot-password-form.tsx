"use client";

import { ArrowLeft, Mail, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { SubmitButton } from "@/components/shared/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient, authErrorMessage } from "@/lib/auth-client";

import { AuthHeading, authInputClass, AuthNotice, FieldIcon } from "./auth-ui";

function BackToSignIn() {
  return (
    <Link
      href="/login"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Back to sign in
    </Link>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (sent) {
    return (
      <div>
        <AuthHeading
          icon={MailCheck}
          title="Check your e-mail"
          description={
            <>
              If an account exists for <span className="font-medium text-foreground">{email}</span>,
              we sent a link to reset the password. The link is valid for 1 hour.
            </>
          }
        />
        <BackToSignIn />
      </div>
    );
  }

  return (
    <div>
      <AuthHeading
        title="Forgot your password?"
        description="Enter your e-mail and we will send you a link to choose a new one."
      />
      <form
        className="grid gap-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError(null);
          const { error: requestError } = await authClient.requestPasswordReset({
            email: email.trim().toLowerCase(),
            redirectTo: "/reset-password",
          });
          setPending(false);
          if (requestError) setError(authErrorMessage(requestError));
          else setSent(true);
        }}
      >
        {error ? (
          <AuthNotice tone="error" role="alert">
            {error}
          </AuthNotice>
        ) : null}
        <div className="grid gap-2">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <FieldIcon icon={Mail} />
            <Input
              id="email"
              type="email"
              required
              autoFocus
              placeholder="you@company.com"
              className={authInputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <SubmitButton pending={pending} size="lg" className="mt-1 h-11 w-full">
          Send reset link
        </SubmitButton>
        <div className="flex justify-center">
          <BackToSignIn />
        </div>
      </form>
    </div>
  );
}
