import { Badge } from "@/components/ui/badge";

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
    <div>
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            Legal
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            These terms govern access to the Events Hub website, dashboard, and
            companion mobile applications.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8 rounded-3xl border border-border/60 bg-card/70 p-8 shadow-sm">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold">Agreement</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              By creating an account, accessing the dashboard, or using the
              Events Hub mobile app, you agree to these terms and to our
              privacy policy. If you are using the service on behalf of an
              organization, you confirm that you are authorized to bind that
              organization to these terms.
            </p>
          </div>

          {sections.map((section) => (
            <div key={section.title} className="space-y-3">
              <h2 className="text-2xl font-semibold">{section.title}</h2>
              <p className="text-sm leading-7 text-muted-foreground">
                {section.body}
              </p>
            </div>
          ))}

          <div className="space-y-3">
            <h2 className="text-2xl font-semibold">Termination</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              We may suspend or terminate access to Events Hub if accounts are
              used unlawfully, abusively, or in a way that threatens the
              security, integrity, or availability of the platform.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-semibold">Contact</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              For legal notices, support questions, or account assistance,
              contact <span className="font-medium text-foreground">info@onestonead.com</span>
              {" "}or use the contact page on the Events Hub website.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
