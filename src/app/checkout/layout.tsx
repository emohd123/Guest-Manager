import { Suspense } from "react";
import { PublicLocaleSync } from "@/components/layout/public-locale-sync";

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <><Suspense fallback={null}><PublicLocaleSync /></Suspense>{children}</>;
}
