"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Check, HelpCircle, Zap, ArrowRight } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: 0,
    description: "For trying out Events Hub",
    credits: 50,
    features: [
      "50 check-in credits/month",
      "1 event",
      "Basic check-in",
      "CSV guest import",
      "CSV export",
    ],
    cta: "Get Started",
    variant: "outline" as const,
  },
  {
    name: "Planner",
    price: 39,
    description: "For small event planners",
    credits: 500,
    features: [
      "500 check-in credits/month",
      "Unlimited events",
      "Guest import (CSV/Excel)",
      "Real-time multi-device sync",
      "Custom branding",
      "Email support",
    ],
    cta: "Start Free Trial",
    variant: "outline" as const,
  },
  {
    name: "Professional",
    price: 79,
    description: "For growing event businesses",
    credits: 2000,
    popular: true,
    features: [
      "2,000 check-in credits/month",
      "Everything in Planner",
      "Ticket Studio (design & print)",
      "Online registration pages",
      "QR/barcode scanning",
      "Offline check-in mode",
      "Reports & analytics",
      "Priority support",
    ],
    cta: "Start Free Trial",
    variant: "default" as const,
  },
  {
    name: "Concierge",
    price: 199,
    description: "For large-scale operations",
    credits: 10000,
    features: [
      "10,000 check-in credits/month",
      "Everything in Professional",
      "White-label options",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
      "API access",
      "SSO / SAML",
    ],
    cta: "Contact Sales",
    variant: "outline" as const,
  },
];

const creditPackages = [
  { credits: 100, price: 10, perCredit: "0.10" },
  { credits: 500, price: 40, perCredit: "0.08" },
  { credits: 1000, price: 70, perCredit: "0.07" },
  { credits: 5000, price: 300, perCredit: "0.06" },
  { credits: 10000, price: 500, perCredit: "0.05" },
];

const faqs = [
  {
    q: "What is a check-in credit?",
    a: "One credit is used each time a guest is checked in at an event. Credits reset monthly based on your billing cycle.",
  },
  {
    q: "Can I change my plan at any time?",
    a: "Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the new rate applies at your next billing cycle.",
  },
  {
    q: "What happens if I run out of credits?",
    a: "You can purchase additional credit packages at any time. Your check-in functionality will continue to work -- you'll just need to buy more credits.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes! All paid plans include a 14-day free trial. No credit card required to start.",
  },
  {
    q: "Do you offer annual billing?",
    a: "Yes, save 20% with annual billing on any paid plan.",
  },
  {
    q: "Can I cancel my subscription?",
    a: "Absolutely. You can cancel at any time from your account settings. Your plan will remain active until the end of your current billing period.",
  },
];

export default function PricingPage() {
  const [sliderValue, setSliderValue] = useState([1000]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const estimatedCost = sliderValue[0] <= 50
    ? 0
    : sliderValue[0] <= 500
    ? 39
    : sliderValue[0] <= 2000
    ? 79
    : 199;

  return (
    <div className="bg-[#080911] text-white min-h-screen">
      {/* Hero */}
      <section className="relative px-4 pt-24 pb-20 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(124,58,237,0.12),transparent_70%)] pointer-events-none" />
        <div className="relative">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-white/70 backdrop-blur-md">
            14-day free trial on all plans
          </div>
          <h1 className="mx-auto max-w-3xl text-5xl font-black tracking-tighter text-white sm:text-6xl uppercase">
            Simple,{" "}
            <span className="bg-[linear-gradient(110deg,#2563eb,45%,#7c3aed,55%,#db2777)] bg-[length:200%_100%] bg-clip-text text-transparent animate-[shine_6s_linear_infinite]">
              Transparent Pricing
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60 font-medium">
            Start free. Scale as you grow. Only pay for the check-ins you use.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                plan.popular
                  ? "border-purple-500/40 bg-purple-500/5 shadow-[0_0_40px_rgba(124,58,237,0.12)]"
                  : "border-white/5 bg-white/[0.02]"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-[linear-gradient(135deg,#7c3aed,#db2777)] px-4 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="text-sm text-white/50 mt-1">{plan.description}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">${plan.price}</span>
                  <span className="text-white/40 text-sm">/month</span>
                </div>
                <p className="text-xs text-white/40 mt-1">
                  {plan.credits.toLocaleString()} credits included
                </p>
              </div>
              <hr className="border-white/5 my-4" />
              <ul className="space-y-2.5 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-white/70">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={`w-full mt-6 font-bold rounded-xl border-0 ${
                  plan.popular
                    ? "bg-[linear-gradient(135deg,#2563eb,#7c3aed,#db2777)] text-white shadow-[0_4px_24px_rgba(124,77,255,0.3)] hover:opacity-95"
                    : "bg-white/5 hover:bg-white/10 text-white"
                }`}
              >
                <Link href={plan.cta === "Contact Sales" ? "/contact" : "/signup"}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        {/* Enterprise */}
        <div className="mt-6 rounded-2xl border border-white/5 bg-[#0c0e17] p-8 text-center">
          <h3 className="text-xl font-bold text-white">Enterprise</h3>
          <p className="mt-2 text-white/60">
            Need a custom solution for large-scale events or multi-venue operations?
          </p>
          <Button
            asChild
            className="mt-4 gap-2 bg-[linear-gradient(135deg,#2563eb,#7c3aed,#db2777)] text-white border-0 font-bold rounded-full px-8 shadow-[0_4px_24px_rgba(124,77,255,0.3)] hover:opacity-95"
          >
            <Link href="/contact">
              Contact Sales <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Credit Calculator */}
      <section className="border-t border-white/5 bg-[#0c0e17] px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Zap className="h-5 w-5 text-yellow-400" />
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Credit Calculator</h2>
          </div>
          <p className="text-white/60 mt-2">Estimate which plan fits your needs.</p>

          <div className="mt-8 space-y-6">
            <div>
              <p className="mb-4 text-sm text-white/60">
                How many guests do you check in per month?
              </p>
              <Slider
                value={sliderValue}
                onValueChange={setSliderValue}
                min={0}
                max={15000}
                step={50}
                className="mx-auto max-w-lg"
              />
              <p className="mt-4 text-4xl font-black text-white">
                {sliderValue[0].toLocaleString()}{" "}
                <span className="text-base font-medium text-white/40">
                  guests/month
                </span>
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <p className="text-xs text-white/50 font-bold uppercase tracking-wider mb-2">
                Recommended plan
              </p>
              <p className="text-3xl font-black text-purple-400">
                {estimatedCost === 0
                  ? "Free"
                  : estimatedCost === 39
                  ? "Planner"
                  : estimatedCost === 79
                  ? "Professional"
                  : "Concierge"}
              </p>
              <p className="text-white/40 mt-1">${estimatedCost}/month</p>
            </div>
          </div>
        </div>
      </section>

      {/* Credit Packages */}
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="mb-2 text-center text-3xl font-black uppercase tracking-tighter text-white">
          On-Demand{" "}
          <span className="text-blue-400">Credit Packages</span>
        </h2>
        <p className="mb-8 text-center text-white/60">
          Need more credits? Buy additional packages anytime.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0c0e17]">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-white/40">Credits</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-white/40">Price</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-white/40">Per Credit</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-wider text-white/40">Action</th>
              </tr>
            </thead>
            <tbody>
              {creditPackages.map((pkg) => (
                <tr key={pkg.credits} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-bold text-white">{pkg.credits.toLocaleString()} credits</td>
                  <td className="px-6 py-4 text-white/70">${pkg.price}</td>
                  <td className="px-6 py-4 text-white/70">${pkg.perCredit}</td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      asChild
                      size="sm"
                      className="bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 hover:text-white rounded-lg font-bold"
                    >
                      <Link href="/signup">Buy</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-white/5 bg-[#0c0e17] px-4 py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-10 text-center text-3xl font-black uppercase tracking-tighter text-white">
            Frequently Asked <span className="text-purple-400">Questions</span>
          </h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
                <button
                  className="flex w-full items-center justify-between p-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-bold text-white">{faq.q}</span>
                  <HelpCircle
                    className={`h-4 w-4 text-white/40 transition-transform shrink-0 ml-4 ${
                      openFaq === i ? "rotate-180 text-purple-400" : ""
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="border-t border-white/5 px-5 pb-5 pt-4">
                    <p className="text-sm text-white/60 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_50%,rgba(124,77,255,0.08),transparent_80%)] pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-4xl font-black uppercase tracking-tighter text-white">
            Ready to{" "}
            <span className="bg-[linear-gradient(110deg,#2563eb,#7c3aed,#db2777)] bg-clip-text text-transparent">
              Get Started?
            </span>
          </h2>
          <p className="mt-4 text-white/60 text-lg">Start for free. No credit card required.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="gap-2 shadow-[0_4px_24px_0_rgba(124,77,255,0.4)] bg-[linear-gradient(135deg,#2563eb,#7c3aed,#db2777)] hover:opacity-95 text-white border-0 font-bold rounded-full px-8"
            >
              <Link href="/signup">Start Free Trial</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/20 bg-white/5 text-white backdrop-blur-md hover:bg-white/10 hover:text-white rounded-full font-bold px-8"
            >
              <Link href="/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
