import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/providers/trpc";

const LOGIN_ERRORS: Record<string, string> = {
  google_not_configured:
    "Google sign-in is not configured. Please use email or try again later.",
  invalid_oauth_state: "Your sign-in request expired. Please try again.",
  google_cancelled: "Google sign-in was cancelled. You can try again.",
  google_failed: "Google sign-in could not be completed. Please try again.",
  admin_account:
    "This is an admin account. Sign in through the private admin login page.",
};

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [message, setMessage] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const requestCode = trpc.auth.requestEmailOtp.useMutation({
    onSuccess: () => {
      setCodeSent(true);
      setCode("");
      setMessage(
        "If this address can receive email, a sign-in code is on its way.",
      );
    },
  });
  const verifyCode = trpc.auth.verifyEmailOtp.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      navigate("/", { replace: true });
    },
  });

  const error =
    requestCode.error || verifyCode.error
      ? getErrorMessage(requestCode.error ?? verifyCode.error)
      : (LOGIN_ERRORS[searchParams.get("error") ?? ""] ?? "");

  function submitEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (codeSent) {
      verifyCode.mutate({ email, code });
    } else {
      requestCode.mutate({ email });
    }
  }

  return (
    <main className="min-h-screen bg-crochic-cream flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-crochic-blush/50 shadow-xl">
        <CardHeader className="text-center space-y-3">
          <Link
            to="/"
            className="font-display text-3xl font-medium tracking-tight text-crochic-dark"
          >
            Cro<span className="italic text-crochic-rose">Chic</span>
          </Link>
          <CardTitle className="font-display text-2xl">Welcome</CardTitle>
          <p className="text-sm text-crochic-muted">
            Sign in or create your account to continue.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 bg-white"
            onClick={() => window.location.assign("/api/auth/google")}
          >
            <span
              aria-hidden="true"
              className="font-bold text-lg bg-gradient-to-br from-blue-600 via-green-600 to-red-500 bg-clip-text text-transparent"
            >
              G
            </span>
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-crochic-muted">
            <span className="h-px flex-1 bg-crochic-blush" />
            or use email
            <span className="h-px flex-1 bg-crochic-blush" />
          </div>

          <form onSubmit={submitEmail} className="space-y-4">
            <label htmlFor="login-email" className="block text-sm font-medium">
              Email address
            </label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              maxLength={320}
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={
                codeSent || requestCode.isPending || verifyCode.isPending
              }
              className="h-12 bg-white"
            />

            {codeSent && (
              <>
                <label
                  htmlFor="login-code"
                  className="block text-sm font-medium"
                >
                  Six-digit email code
                </label>
                <Input
                  id="login-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  minLength={6}
                  maxLength={6}
                  required
                  placeholder="000000"
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  disabled={verifyCode.isPending}
                  className="h-12 bg-white text-center text-xl tracking-[0.5em]"
                />
                <p className="text-xs text-crochic-muted">
                  Check your inbox. The code expires in 10 minutes.
                </p>
              </>
            )}

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            {message && (
              <p role="status" className="text-sm text-crochic-muted">
                {message}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full bg-crochic-dark text-crochic-cream hover:bg-crochic-rose"
              disabled={
                requestCode.isPending ||
                verifyCode.isPending ||
                (codeSent && code.length !== 6)
              }
            >
              {requestCode.isPending
                ? "Sending code…"
                : verifyCode.isPending
                  ? "Verifying…"
                  : codeSent
                    ? "Verify and sign in"
                    : "Email me a sign-in code"}
            </Button>
          </form>

          {codeSent && (
            <div className="flex flex-wrap justify-between gap-3 text-sm">
              <button
                type="button"
                className="text-crochic-rose underline underline-offset-4 disabled:opacity-50"
                onClick={() => {
                  setMessage("");
                  requestCode.mutate({ email });
                }}
                disabled={requestCode.isPending}
              >
                Resend code
              </button>
              <button
                type="button"
                className="text-crochic-muted underline underline-offset-4"
                onClick={() => {
                  setCodeSent(false);
                  setCode("");
                  setMessage("");
                  requestCode.reset();
                  verifyCode.reset();
                }}
              >
                Change email
              </button>
            </div>
          )}

          <p className="text-center text-xs text-crochic-muted">
            New here? Your account is created securely when you verify your
            first sign-in code.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
