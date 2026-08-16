"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function BuyerLoginPageContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const postLoginRedirect = searchParams.get("redirectTo") || "/account";

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      const user = data.user;
      if (user) {
        const redirectTo = searchParams.get("redirectTo");
        if (redirectTo) {
          window.location.replace(redirectTo);
          return;
        }
        setEmail(user.email ?? "");
      }
    });
  }, [searchParams]);

  async function handleEmailAuth(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const supabase = createClient();

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: name || email.split("@")[0],
                phone,
                nationality,
                role: "visitor",
              },
              emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=/account`,
            },
          });

    if (result.error) {
      setMessage(result.error.message);
      setLoading(false);
      return;
    }

    if (mode === "signup" && !result.data.session) {
      setMessage("Check your email to confirm your account, then sign in here.");
      setLoading(false);
      return;
    }

    window.location.assign(postLoginRedirect);
  }

  async function handleGoogle() {
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(postLoginRedirect)}`,
      },
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  async function handleFacebook() {
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(postLoginRedirect)}`,
      },
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white px-4 py-28 text-slate-900">
      <div className="mx-auto max-w-md rounded-[2rem] border border-slate-200 bg-white p-7 shadow-2xl">
        <Link href="/" className="mb-8 flex justify-center">
          <BrandWordmark
            className="gap-3"
            markClassName="h-12 w-12"
            textClassName="text-[2rem] text-slate-900"
          />
        </Link>
        <h1 className="text-center text-3xl font-black">
          {mode === "login" ? "Open your tickets" : "Create buyer account"}
        </h1>
        <p className="mt-3 text-center text-sm leading-6 text-slate-600">
          Use the same email you used at checkout to see your orders, QR tickets, favorites, and event updates.
        </p>

        <Button
          type="button"
          variant="outline"
          className="mt-8 h-12 w-full rounded-2xl border-slate-200 bg-white text-black hover:bg-white/90"
          onClick={handleGoogle}
          disabled={loading}
        >
          Continue with Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className="mt-3 h-12 w-full rounded-2xl border-slate-200 bg-[#1877F2] text-white hover:bg-[#166fe5]"
          onClick={handleFacebook}
          disabled={loading}
        >
          Continue with Facebook
        </Button>

        <Link
          href="/staff-access"
          className="mt-5 flex min-h-12 w-full items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 px-4 text-sm font-black text-cyan-900 transition-colors hover:bg-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
        >
          Staff Access / Check-in
        </Link>
        <p className="mt-2 text-center text-xs text-slate-500">
          For event staff. Use the access code and PIN shared by the organiser.
        </p>

        <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-slate-500">
          <span className="h-px flex-1 bg-slate-100" />
          or
          <span className="h-px flex-1 bg-slate-100" />
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {mode === "signup" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(event) => setName(event.target.value)} required className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-slate-900" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile number</Label>
                <Input id="phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required placeholder="+20..." className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-slate-900" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Input id="nationality" value={nationality} onChange={(event) => setNationality(event.target.value)} required className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-slate-900" />
              </div>
            </>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-slate-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
                className="h-12 rounded-2xl border-slate-200 bg-slate-50 pr-12 text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-600 transition-colors hover:text-slate-900"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          {message ? <p className="rounded-2xl bg-slate-100 p-3 text-sm text-slate-600">{message}</p> : null}
          <Button
            type="submit"
            className="h-12 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 font-black text-slate-900 hover:opacity-95"
            disabled={loading}
          >
            {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <button
          type="button"
          className="mt-6 w-full text-center text-sm font-bold text-blue-600"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login" ? "New buyer? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

export default function BuyerLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <BuyerLoginPageContent />
    </Suspense>
  );
}

