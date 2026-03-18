import Link from "next/link";

export default function PublicEventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Powered by{" "}
        <Link href="/" className="font-medium text-primary hover:underline">
          Events Hub
        </Link>
      </footer>
    </div>
  );
}
