"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Check, HelpCircle, Zap, ArrowRight } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: 0,
    description: "For trying out GuestManager",
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
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-20 text-center">
        <Badge variant="secondary" className="mb-4">
          14-day free trial on all plans
        </Badge>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Start free. Scale as you grow. Only pay for the check-ins you use.
        </p>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${
                plan.popular
                  ? "border-primary shadow-lg shadow-primary/10"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary px-4">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {plan.credits.toLocaleString()} credits included
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/signup">
                  <Button
                    variant={plan.variant}
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enterprise */}
        <div className="mt-8 rounded-2xl border bg-muted/30 p-8 text-center">
          <h3 className="text-xl font-bold">Enterprise</h3>
          <p className="mt-2 text-muted-foreground">
            Need a custom solution for large-scale events or multi-venue
            operations?
          </p>
          <Link href="/contact">
            <Button className="mt-4 gap-2">
              Contact Sales <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Credit Calculator */}
      <section className="border-t bg-muted/20 px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Credit Calculator</h2>
          </div>
          <p className="text-muted-foreground">
            Estimate which plan fits your needs.
          </p>

          <div className="mt-8 space-y-6">
            <div>
              <p className="mb-2 text-sm text-muted-foreground">
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
              <p className="mt-3 text-3xl font-bold">
                {sliderValue[0].toLocaleString()}{" "}
                <span className="text-base font-normal text-muted-foreground">
                  guests/month
                </span>
              </p>
            </div>
            <div className="rounded-lg border bg-background p-6">
              <p className="text-sm text-muted-foreground">
                Recommended plan
              </p>
              <p className="text-2xl font-bold text-primary">
                {estimatedCost === 0
                  ? "Free"
                  : estimatedCost === 39
                  ? "Planner"
                  : estimatedCost === 79
                  ? "Professional"
                  : "Concierge"}
              </p>
              <p className="text-muted-foreground">
                ${estimatedCost}/month
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Credit Packages */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-2 text-center text-2xl font-bold">
          On-Demand Credit Packages
        </h2>
        <p className="mb-8 text-center text-muted-foreground">
          Need more credits? Buy additional packages anytime.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="pb-3 text-sm font-medium text-muted-foreground">
                  Credits
                </th>
                <th className="pb-3 text-sm font-medium text-muted-foreground">
                  Price
                </th>
                <th className="pb-3 text-sm font-medium text-muted-foreground">
                  Per Credit
                </th>
                <th className="pb-3 text-right text-sm font-medium text-muted-foreground">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {creditPackages.map((pkg) => (
                <tr key={pkg.credits} className="border-b">
                  <td className="py-4 font-medium">
                    {pkg.credits.toLocaleString()} credits
                  </td>
                  <td className="py-4">${pkg.price}</td>
                  <td className="py-4">${pkg.perCredit}</td>
                  <td className="py-4 text-right">
                    <Button variant="outline" size="sm">
                      Buy
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t bg-muted/20 px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-8 text-center text-2xl font-bold">
            Frequently Asked Questions
          </h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-lg border bg-background">
                <button
                  className="flex w-full items-center justify-between p-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium">{faq.q}</span>
                  <HelpCircle
                    className={`h-4 w-4 text-muted-foreground transition-transform ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="border-t px-4 pb-4 pt-3">
                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 text-center">
        <h2 className="text-3xl font-bold">Ready to get started?</h2>
        <p className="mt-3 text-muted-foreground">
          Start for free. No credit card required.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/signup">
            <Button size="lg">Start Free Trial</Button>
          </Link>
          <Link href="/contact">
            <Button size="lg" variant="outline">
              Contact Sales
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
