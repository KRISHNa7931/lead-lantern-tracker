import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Lead Manager" },
      {
        name: "description",
        content: "Log in or sign up to manage your team's sales leads.",
      },
      { property: "og:title", content: "Sign in · Lead Manager" },
      {
        property: "og:description",
        content: "Log in or sign up to manage your team's sales leads.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function friendlyAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) {
    return "Wrong email or password. Please try again.";
  }
  if (/already registered/i.test(message)) {
    return "An account with this email already exists. Try logging in instead.";
  }
  if (/at least 6/i.test(message)) {
    return "Password must be at least 6 characters.";
  }
  if (/rate limit/i.test(message)) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  return message;
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  // Already signed in? Go straight to the leads.
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setNeedsConfirmation(false);

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          setError(friendlyAuthError(signInError.message));
          return;
        }
        navigate({ to: "/" });
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (signUpError) {
          setError(friendlyAuthError(signUpError.message));
          return;
        }
        if (!data.session) {
          setNeedsConfirmation(true);
          return;
        }
        navigate({ to: "/" });
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary">
            <Users className="size-6 text-primary-foreground" />
          </span>
          <h1 className="text-xl font-semibold tracking-tight">Lead Manager</h1>
          <p className="text-sm text-muted-foreground">
            Track leads and follow up on WhatsApp — one shared list for the
            whole team.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          {needsConfirmation ? (
            <div className="space-y-3 text-center">
              <p className="font-medium">Check your email</p>
              <p className="text-sm text-muted-foreground">
                We sent a confirmation link to {email.trim()}. Click it to
                activate your account, then log in.
              </p>
              <Button
                variant="outline"
                className="h-11 w-full"
                onClick={() => {
                  setNeedsConfirmation(false);
                  setMode("login");
                }}
              >
                Back to log in
              </Button>
            </div>
          ) : (
            <Tabs
              value={mode}
              onValueChange={(value) => {
                setMode(value as "login" | "signup");
                setError(null);
              }}
            >
              <TabsList className="mb-4 grid h-11 w-full grid-cols-2 sm:h-9">
                <TabsTrigger value="login">Log in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-0">
                <AuthForm
                  mode="login"
                  email={email}
                  password={password}
                  submitting={submitting}
                  error={error}
                  onEmailChange={setEmail}
                  onPasswordChange={setPassword}
                  onSubmit={handleSubmit}
                  ctaLabel="Log in"
                />
              </TabsContent>
              <TabsContent value="signup" className="mt-0">
                <AuthForm
                  mode="signup"
                  email={email}
                  password={password}
                  submitting={submitting}
                  error={error}
                  onEmailChange={setEmail}
                  onPasswordChange={setPassword}
                  onSubmit={handleSubmit}
                  ctaLabel="Create account"
                />
              </TabsContent>
            </Tabs>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Team app — anyone on the team can sign up and see all leads. Demo
          login details are in the README.
        </p>
      </div>
    </div>
  );
}

interface AuthFormProps {
  mode: "login" | "signup";
  email: string;
  password: string;
  submitting: boolean;
  error: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  ctaLabel: string;
}

function AuthForm({
  mode,
  email,
  password,
  submitting,
  error,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  ctaLabel,
}: AuthFormProps) {
  void mode;
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="you@example.com"
          className="h-11"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
          className="h-11"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" className="h-11 w-full" disabled={submitting}>
        {submitting && <Loader2 className="size-4 animate-spin" />}
        {ctaLabel}
      </Button>
    </form>
  );
}

// Keep the toast import used for future auth feedback (tree-shaken otherwise).
void toast;
