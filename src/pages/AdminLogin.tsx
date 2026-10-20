import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/providers/trpc";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const { data: hasAdminSession, isLoading: isAdminSessionLoading } =
    trpc.auth.adminSessionStatus.useQuery();
  const login = trpc.auth.adminLogin.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      navigate("/admin", { replace: true });
    },
  });

  useEffect(() => {
    setMessage(login.error?.message ?? "");
  }, [login.error]);

  if (!isAdminSessionLoading && hasAdminSession) {
    return <Navigate to="/admin" replace />;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    login.mutate({ email, password });
  }

  return (
    <main className="min-h-[100svh] bg-crochic-cream flex items-center justify-center px-4 py-8 sm:px-6">
      <Card className="w-full max-w-md border-crochic-blush/50 shadow-xl">
        <CardHeader className="space-y-4 px-5 text-center sm:px-8 sm:pt-8">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-crochic-dark text-crochic-cream">
            <LockKeyhole aria-hidden="true" className="size-5" />
          </div>
          <div className="space-y-2">
            <CardTitle className="font-display text-2xl sm:text-3xl">
              Studio sign in
            </CardTitle>
            <p className="text-sm text-crochic-muted">
              Admin access only. Use the existing admin account credentials.
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-6 sm:px-8 sm:pb-8">
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="admin-email"
                className="block text-sm font-medium"
              >
                Email address
              </label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                maxLength={320}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={login.isPending}
                className="h-12 bg-white"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="admin-password"
                className="block text-sm font-medium"
              >
                Password
              </label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={256}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={login.isPending}
                className="h-12 bg-white"
              />
            </div>
            {message && (
              <p role="alert" className="text-sm text-destructive">
                {message}
              </p>
            )}
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full bg-crochic-dark text-crochic-cream hover:bg-crochic-rose"
              disabled={login.isPending || !email || !password}
            >
              {login.isPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
