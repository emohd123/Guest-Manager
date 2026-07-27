import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  if (process.env.NEXT_PUBLIC_ENABLE_PUBLIC_ORGANIZER_SIGNUP !== "true") {
    redirect("/contact?source=admin-access");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070910] px-4 py-20 text-center text-white">
      <div className="max-w-lg rounded-[2rem] border border-white/10 bg-white/[0.06] p-8">
        <Link href="/" className="mb-8 flex justify-center">
          <BrandWordmark
            className="gap-3"
            markClassName="h-12 w-12"
            textClassName="text-[2rem] text-white"
          />
        </Link>
        <h1 className="text-3xl font-black">Admin access is invite-only</h1>
        <p className="mt-4 text-white/65">
          iTicket creates and manages event dashboards internally. For managed event,
          ticketing, or check-in support, contact the team and we will set up the right workspace.
        </p>
        <Button asChild className="mt-8 rounded-full bg-white px-8 font-black text-black hover:bg-white/90">
          <Link href="/contact?source=admin-access">Request admin access</Link>
        </Button>
      </div>
    </div>
  );
}
