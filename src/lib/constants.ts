export const PRICING_PLANS = {
  free: {
    name: "Free",
    price: 0,
    credits: 50,
    devices: 2,
    ticketFee: 100, // cents
    features: [
      "50 free credits",
      "2 devices",
      "All features included",
      "5-minute setup",
    ],
  },
  planner: {
    name: "Planner",
    price: 3900, // cents
    credits: 3600,
    devices: 4,
    ticketFee: 100,
    features: [
      "3,600 credits/year",
      "4 devices",
      "$1.00 ticket fee",
      "Priority support",
    ],
  },
  professional: {
    name: "Professional",
    price: 7900,
    credits: 9600,
    devices: 8,
    ticketFee: 75,
    features: [
      "9,600 credits/year",
      "8 devices",
      "$0.75 ticket fee",
      "Advanced reporting",
    ],
  },
  concierge: {
    name: "Concierge",
    price: 19900,
    credits: 24000,
    devices: -1, // unlimited
    ticketFee: 50,
    features: [
      "24,000 credits/year",
      "Unlimited devices",
      "$0.50 ticket fee",
      "Concierge onboarding",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: -1, // custom
    credits: -1,
    devices: -1,
    ticketFee: -1,
    features: [
      "Unlimited attendees",
      "Unlimited devices",
      "Custom pricing",
      "Dedicated support",
    ],
  },
} as const;

export const CREDIT_PACKAGES = [
  { credits: 100, price: 3000 },
  { credits: 250, price: 6000 },
  { credits: 500, price: 10000 },
  { credits: 1000, price: 17500 },
  { credits: 2500, price: 37500 },
  { credits: 5000, price: 62500 },
  { credits: 10000, price: 96000 },
] as const;
