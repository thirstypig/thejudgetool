"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Flame, Eye, EyeOff } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/shared/components/ui/tabs";

const roleRedirects: Record<string, string> = {
  JUDGE: "/judge",
  TABLE_CAPTAIN: "/captain",
  ORGANIZER: "/organizer",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleJudgeLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const cbjNumber = formData.get("cbjNumber") as string;
    const pin = formData.get("pin") as string;

    try {
      const result = await signIn("judge-login", {
        cbjNumber,
        pin,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid CBJ number or PIN");
      } else {
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        const role = session?.user?.role;
        router.push(callbackUrl || roleRedirects[role] || "/judge");
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOrganizerLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("organizer-login", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push(callbackUrl || "/organizer");
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Flame className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">The Judge Tool</h1>
          <p className="text-sm text-muted-foreground">
            Competition Judging Platform
          </p>
        </div>

        <Tabs defaultValue="judge">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="judge" onClick={() => setError(null)}>
              Judge Login
            </TabsTrigger>
            <TabsTrigger value="organizer" onClick={() => setError(null)}>
              Organizer Login
            </TabsTrigger>
          </TabsList>

          <TabsContent value="judge">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Judge Login</CardTitle>
                <CardDescription>
                  Enter your CBJ number and PIN to access scoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleJudgeLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cbjNumber" className="text-base">Judge Number</Label>
                    <Input
                      id="cbjNumber"
                      name="cbjNumber"
                      inputMode="numeric"
                      placeholder="XXXXXX"
                      required
                      autoComplete="username"
                      className="h-12 text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pin" className="text-base">PIN</Label>
                    <div className="relative">
                      <Input
                        id="pin"
                        name="pin"
                        type={showPin ? "text" : "password"}
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="4-digit PIN"
                        required
                        autoComplete="current-password"
                        className="h-12 pr-10 text-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showPin ? "Hide PIN" : "Show PIN"}
                      >
                        {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  {error && (
                    <p role="alert" className="text-sm text-destructive">{error}</p>
                  )}
                  <Button type="submit" className="h-12 w-full text-lg" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In as Judge"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="organizer">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Organizer Login</CardTitle>
                <CardDescription>
                  Sign in with your organizer credentials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleOrganizerLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="admin@bbqjudge.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        required
                        autoComplete="current-password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  {error && (
                    <p role="alert" className="text-sm text-destructive">{error}</p>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In as Organizer"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
