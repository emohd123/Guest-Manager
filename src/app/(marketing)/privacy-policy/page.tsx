import { Badge } from "@/components/ui/badge";

const sections = [
  {
    title: "What We Collect",
    body: "Events Hub processes the account, attendee, ticketing, device, and communication details that event organizers choose to store in the platform. This can include names, email addresses, phone numbers, ticket records, event metadata, and operational logs needed to run check-in, registration, and guest management workflows.",
  },
  {
    title: "How We Use Information",
    body: "We use this information to operate the Events Hub website and mobile app, authenticate users, process ticketing and registration actions, send transactional communications, support event operations, improve reliability, and protect the platform against abuse or fraud.",
  },
  {
    title: "Sharing and Service Providers",
    body: "We only share information with service providers that help us run the product, such as infrastructure, payments, database hosting, analytics, authentication, and email delivery providers. These providers receive the minimum information needed to perform their services on our behalf.",
  },
  {
    title: "Data Retention and Security",
    body: "We retain event and account information for as long as needed to provide the service, comply with legal obligations, resolve disputes, and maintain operational records. Events Hub applies administrative, technical, and organizational safeguards to protect stored data, but no online system can be guaranteed to be perfectly secure.",
  },
  {
    title: "Your Choices",
    body: "Account owners can update or delete event data within the product, and can contact us for privacy-related requests, support, or data questions. If you are an attendee and your information was collected by an organizer using Events Hub, please contact that organizer first so they can handle your request directly.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div>
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            Legal
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            This policy explains how Events Hub collects, uses, and protects
            information across the website, dashboard, and mobile app.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8 rounded-3xl border border-border/60 bg-card/70 p-8 shadow-sm">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold">Overview</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              Events Hub provides event registration, ticketing, attendee
              engagement, guest management, and on-site check-in tools. By
              using our services, you agree that we may process information as
              described in this policy to deliver those services.
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

          <div id="cookies" className="space-y-3">
            <h2 className="text-2xl font-semibold">Cookies and Similar Technologies</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              Events Hub uses cookies and related technologies to keep users
              signed in, remember product preferences, measure product
              performance, and improve reliability. Where required, you should
              obtain any attendee consent needed for technologies you configure
              in your event experience.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-semibold">Contact</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              For privacy or data protection questions, contact our team at
              <span className="font-medium text-foreground"> info@onestonead.com</span>
              {" "}or visit the support page on our website.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
