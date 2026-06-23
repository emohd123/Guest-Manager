import Link from "next/link";
import { FileText } from "lucide-react";

const sections = [
  {
    title: "Use of the Service",
    body: "Events Hub may be used by event organizers, venue teams, and authorized staff to manage registrations, guests, ticketing, attendee communications, and check-in operations. You are responsible for maintaining accurate account information and for ensuring that your team uses the platform lawfully and responsibly.",
  },
  {
    title: "Customer Responsibilities",
    body: "You are responsible for the content, attendee data, ticketing rules, pricing, communications, and operational decisions configured in your account. You must only collect and use attendee information when you have the right to do so and must comply with any laws, regulations, venue rules, or contractual obligations that apply to your events.",
  },
  {
    title: "Payments and Third-Party Services",
    body: "Payments, email delivery, authentication, hosting, and other platform functions may rely on third-party providers. Events Hub is not responsible for outages, delays, or failures caused by those providers, but we will make commercially reasonable efforts to maintain reliable service.",
  },
  {
    title: "Availability and Changes",
    body: "We may improve, modify, or discontinue features from time to time. We aim to keep Events Hub available and secure, but we do not guarantee uninterrupted or error-free service, especially during maintenance windows, network failures, or incidents outside our control.",
  },
  {
    title: "Liability",
    body: "To the maximum extent permitted by law, Events Hub is provided on an as-available basis. We are not liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits, lost data, or event losses arising from use of the service.",
  },
];

export default function TermsOfServicePage() {
  return (
    <div className="bg-[#080911] text-white min-h-screen">
      {/* Hero */}
      <section className="relative px-4 pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(37,99,235,0.08),transparent_70%)] pointer-events-none" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-white/70 backdrop-blur-md">
            <FileText className="h-3.5 w-3.5 text-blue-400" />
            Legal
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white sm:text-6xl uppercase leading-none">
            Terms of{" "}
            <span className="bg-[linear-gradient(110deg,#2563eb,45%,#7c3aed,55%,#db2777)] bg-[length:200%_100%] bg-clip-text text-transparent animate-[shine_6s_linear_infinite]">
              Service
            </span>
          </h1>
          <p className="mt-6 text-lg text-white/60 leading-relaxed max-w-2xl mx-auto font-medium">
            These terms govern access to the Events Hub website, dashboard, and
            companion mobile applications.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-4xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="space-y-6 rounded-2xl border border-white/10 bg-[#0c0e17] p-8 shadow-2xl">
          <div className="space-y-3 pb-6 border-b border-white/5">
            <h2 className="text-xl font-bold text-white">Agreement</h2>
            <p className="text-sm leading-7 text-white/60">
              By creating an account, accessing the dashboard, or using the
              Events Hub mobile app, you agree to these terms and to our{" "}
              <Link href="/privacy-policy" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                privacy policy
              </Link>. If you are using the service on behalf of an
              organization, you confirm that you are authorized to bind that
              organization to these terms.
            </p>
          </div>

          {sections.map((section, i) => (
            <div key={section.title} className={`space-y-3 ${i < sections.length - 1 ? "pb-6 border-b border-white/5" : ""}`}>
              <h2 className="text-xl font-bold text-white">{section.title}</h2>
              <p className="text-sm leading-7 text-white/60">{section.body}</p>
            </div>
          ))}

          <div className="space-y-3 pt-2 pb-6 border-b border-white/5">
            <h2 className="text-xl font-bold text-white">Termination</h2>
            <p className="text-sm leading-7 text-white/60">
              We may suspend or terminate access to Events Hub if accounts are
              used unlawfully, abusively, or in a way that threatens the
              security, integrity, or availability of the platform.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white">Contact</h2>
            <p className="text-sm leading-7 text-white/60">
              For legal notices, support questions, or account assistance,
              contact{" "}
              <Link href="mailto:info@onestonead.com" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                info@onestonead.com
              </Link>
              {" "}or use the{" "}
              <Link href="/contact" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                contact page
              </Link>{" "}
              on the Events Hub website.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-white/30 mt-8">Last updated: June 2026 · Events Hub, a OneStone Ads platform</p>
      </section>
    </div>
  );
}
