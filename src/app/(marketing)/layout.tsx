import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { MarketingFooter } from "@/components/layout/marketing-footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f6f7fb] text-slate-900 selection:bg-blue-200">
      <MarketingNavbar />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
