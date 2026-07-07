import type { Metadata } from "next";
import { ServicesForOrganisers } from "@/components/marketing/services-for-organisers";

export const metadata: Metadata = {
  title: "Our Services — Events Hub for Organisers",
  description:
    "Ticketing, check-in, staffing, permits, and reporting for event organisers in Bahrain. Power your events with Events Hub's all-in-one platform.",
};

export default function ServicesPage() {
  return <ServicesForOrganisers />;
}
