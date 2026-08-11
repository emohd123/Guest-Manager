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
  const [verificationPhone, setVerificationPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);

  useEffect(() => {
    if (searchParams.get("verify") !== "1") return;
    createClient().auth.getUser().then(({ data }) => {
      const user = data.user;
      if (user) {
        setEmail(user.email ?? "");
        setVerificationEmail(user.email ?? "");
        setVerificationPhone(user.phone ?? user.user_metadata?.phone ?? "");
      }
    });
  }, [searchParams]);

  async function sendPhoneOtp() {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ phone: verificationPhone.trim() });
    setMessage(error ? error.message : "SMS code sent. Enter it below to verify your mobile.");
    setVerificationSent(!error);
  }

  async function verifyPhoneOtp() {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ phone: verificationPhone.trim(), token: verificationCode.trim(), type: "phone_change" });
    if (error) { setMessage(error.message); return; }
    window.location.assign(searchParams.get("redirectTo") || "/account");
  }

  async function sendEmailOtp() {
    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email: verificationEmail.trim() });
    setMessage(error ? error.message : "Email verification code sent. Enter it below.");
    setEmailVerificationSent(!error);
  }

  async function verifyEmailOtp() {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email: verificationEmail.trim(), token: emailCode.trim(), type: "signup" });
    if (error) { setMessage(error.message); return; }
    setMessage("Email verified. Now verify your mobile number below.");
  }

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

    window.location.assign("/account");
  }

  async function handleGoogle() {
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=/account`,
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
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=/account`,
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

        {searchParams.get("verify") === "1" ? (
          <div className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
            <p className="font-black text-slate-900">Verify your email and mobile</p>
            <Input className="mt-3 h-11 rounded-xl bg-white" type="email" value={verificationEmail} onChange={(event) => setVerificationEmail(event.target.value)} placeholder="Email address" />
            {!emailVerificationSent ? <Button type="button" onClick={sendEmailOtp} className="mt-3 w-full rounded-xl bg-slate-900 text-white">Send email code</Button> : <><Input className="mt-3 h-11 rounded-xl bg-white" inputMode="numeric" value={emailCode} onChange={(event) => setEmailCode(event.target.value)} placeholder="Email verification code" /><Button type="button" onClick={verifyEmailOtp} className="mt-3 w-full rounded-xl bg-slate-900 text-white">Verify email</Button></>}
            <p className="mt-5 text-sm font-bold text-slate-900">Mobile number</p>
            <Input className="mt-3 h-11 rounded-xl bg-white" type="tel" value={verificationPhone} onChange={(event) => setVerificationPhone(event.target.value)} placeholder="+20..." />
            {!verificationSent ? <Button type="button" onClick={sendPhoneOtp} className="mt-3 w-full rounded-xl bg-cyan-600 text-white">Send SMS code</Button> : <><Input className="mt-3 h-11 rounded-xl bg-white" inputMode="numeric" value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)} placeholder="6-digit code" /><Button type="button" onClick={verifyPhoneOtp} className="mt-3 w-full rounded-xl bg-cyan-600 text-white">Verify mobile</Button></>}
          </div>
        ) : null}

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

