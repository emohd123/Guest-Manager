import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Ticket,
  Palette,
  Send,
  ScanLine,
  QrCode,
  Smartphone,
  FileText,
  Mail,
  Shield,
  ArrowRight,
} from "lucide-react";

const designFeatures = [
  {
    icon: Palette,
    title: "Visual Ticket Designer",
    description:
      "Drag-and-drop editor to create stunning PDF and Apple Wallet tickets with your branding.",
  },
  {
    icon: QrCode,
    title: "Multiple Barcode Types",
    description:
      "Generate QR codes, PDF417, and Code128 barcodes. Each ticket gets a unique, scannable identifier.",
  },
  {
    icon: FileText,
    title: "PDF Generation",
    description:
      "High-quality PDF tickets generated server-side, ready for print or digital delivery.",
  },
];

const distributeFeatures = [
  {
    icon: Mail,
    title: "Email Delivery",
    description:
      "Automatically send tickets to attendees via email with PDF attachments or download links.",
  },
  {
    icon: Send,
    title: "Bulk Distribution",
    description:
      "Send tickets to your entire guest list with one click. Track delivery status in real-time.",
  },
  {
    icon: Smartphone,
    title: "Mobile-Ready",
    description:
      "Tickets display beautifully on any device. Attendees can show their ticket right from their phone.",
  },
];

const scanFeatures = [
  {
    icon: ScanLine,
    title: "Camera Scanning",
    description:
      "Turn any smartphone into a ticket scanner. No special hardware needed.",
  },
  {
    icon: Shield,
    title: "Duplicate Detection",
    description:
      "Instantly detect and flag duplicate scans. Prevent unauthorized entry with real-time validation.",
  },
  {
    icon: Ticket,
    title: "Scan Logging",
    description:
      "Every scan is logged with timestamp, device, and location. Full audit trail for your records.",
  },
];

export default function TicketStudioPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            Ticket Studio
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Design, distribute, and scan tickets
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Create beautiful branded tickets with unique barcodes. Send them via
            email and scan at the door with any device.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Try It Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline">
                See It Live
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Design */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12">
          <Badge className="mb-2 bg-primary/10 text-primary">Step 1</Badge>
          <h2 className="text-3xl font-bold">Design</h2>
          <p className="mt-2 text-muted-foreground">
            Create professional tickets with our visual editor.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {designFeatures.map((feature) => (
            <Card key={feature.title}>
              <CardContent className="p-6">
                <feature.icon className="mb-4 h-8 w-8 text-primary" />
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Distribute */}
      <section className="border-t bg-muted/20 px-4 py-16">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-12">
            <Badge className="mb-2 bg-primary/10 text-primary">Step 2</Badge>
            <h2 className="text-3xl font-bold">Distribute</h2>
            <p className="mt-2 text-muted-foreground">
              Get tickets into the hands of your attendees effortlessly.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {distributeFeatures.map((feature) => (
              <Card key={feature.title}>
                <CardContent className="p-6">
                  <feature.icon className="mb-4 h-8 w-8 text-primary" />
                  <h3 className="mb-2 font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Scan */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12">
          <Badge className="mb-2 bg-primary/10 text-primary">Step 3</Badge>
          <h2 className="text-3xl font-bold">Scan</h2>
          <p className="mt-2 text-muted-foreground">
            Validate tickets at the door with confidence.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {scanFeatures.map((feature) => (
            <Card key={feature.title}>
              <CardContent className="p-6">
                <feature.icon className="mb-4 h-8 w-8 text-primary" />
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Barcode Showcase */}
      <section className="border-t bg-muted/20 px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-8 text-3xl font-bold">Supported Barcode Types</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { name: "QR Code", desc: "Most popular for mobile tickets" },
              { name: "PDF417", desc: "Used by airlines and major venues" },
              { name: "Code128", desc: "Standard linear barcode" },
            ].map((barcode) => (
              <Card key={barcode.name}>
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-lg bg-muted">
                    <QrCode className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold">{barcode.name}</h3>
                  <p className="text-sm text-muted-foreground">{barcode.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 text-center">
        <h2 className="text-3xl font-bold">
          Start designing tickets today
        </h2>
        <p className="mt-3 text-muted-foreground">
          Create professional tickets in minutes, not hours.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/signup">
            <Button size="lg">Start Free Trial</Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline">
              View Pricing
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
