"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarDays,
  MapPin,
  Clock,
  Users,
  Ticket,
  Check,
  DollarSign,
  Share2,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type CartItem = {
  ticketTypeId: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
};

export default function PublicEventPage({
  params,
}: {
  params: Promise<{ companySlug: string; eventSlug: string }>;
}) {
  const { companySlug, eventSlug } = use(params);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutStep, setCheckoutStep] = useState<"tickets" | "info" | "confirm">("tickets");
  const [attendeeInfo, setAttendeeInfo] = useState({ name: "", email: "" });
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: event, isLoading: eventLoading } = trpc.events.getBySlug.useQuery({
    companySlug,
    eventSlug,
  });

  const { data: ticketTypeList, isLoading: ticketsLoading } = trpc.ticketTypes.listPublic.useQuery(
    { eventId: event?.id ?? "" },
    { enabled: !!event?.id }
  );

  // Handle Stripe success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "1") {
      setCheckoutStep("confirm");
      // Clean up the URL
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (params.get("cancelled") === "1") {
      toast.error("Payment was cancelled. Your order was not placed.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  function updateCart(ticketTypeId: string, name: string, price: number, currency: string, delta: number) {
    setCart((prev) => {
      const existing = prev.find((i) => i.ticketTypeId === ticketTypeId);
      if (!existing) {
        if (delta <= 0) return prev;
        return [...prev, { ticketTypeId, name, price, currency, quantity: delta }];
      }
      const newQty = existing.quantity + delta;
      if (newQty <= 0) return prev.filter((i) => i.ticketTypeId !== ticketTypeId);
      return prev.map((i) => i.ticketTypeId === ticketTypeId ? { ...i, quantity: newQty } : i);
    });
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  const isFree = cartTotal === 0;

  function handleCheckout() {
    if (cart.length === 0) {
      toast.error("Please select at least one ticket");
      return;
    }
    setCheckoutStep("info");
  }

  async function handleCompleteOrder() {
    if (!attendeeInfo.name || !attendeeInfo.email) {
      toast.error("Please fill in your name and email");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attendeeInfo.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companySlug,
          eventSlug,
          attendeeName: attendeeInfo.name,
          attendeeEmail: attendeeInfo.email,
          cartItems: cart,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to complete registration");
      }

      // Paid order: redirect to Stripe
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      // Free order: show confirmation
      setOrderNumber(data.orderNumber ?? null);
      setCheckoutStep("confirm");
      toast.success("Registration complete! Check your email for confirmation.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (eventLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <Ticket className="h-16 w-16 text-muted-foreground/30" />
        <h1 className="text-2xl font-bold">Event Not Found</h1>
        <p className="text-muted-foreground">
          This event may have been cancelled, is not published, or the link is incorrect.
        </p>
        <Link href="/">
          <Button variant="outline">Go Home</Button>
        </Link>
      </div>
    );
  }

  if (checkoutStep === "confirm") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">You&apos;re registered!</h1>
          <p className="mt-2 text-muted-foreground">
            A confirmation has been sent to <strong>{attendeeInfo.email || "your email"}</strong>.
          </p>
          <div className="mt-6 rounded-lg border bg-card p-4 text-left">
            <p className="font-semibold">{event.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {format(new Date(event.startsAt), "EEEE, MMMM d, yyyy · h:mm a")}
            </p>
            {orderNumber && (
              <p className="mt-1 text-xs text-muted-foreground">Order #{orderNumber}</p>
            )}
            {cart.length > 0 && (
              <div className="mt-3 divide-y text-sm">
                {cart.map((item) => (
                  <div key={item.ticketTypeId} className="flex justify-between py-2">
                    <span>{item.name} × {item.quantity}</span>
                    <span>
                      {item.price === 0
                        ? "Free"
                        : `$${((item.price * item.quantity) / 100).toFixed(2)}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button
            className="mt-6 w-full"
            onClick={() => {
              setCheckoutStep("tickets");
              setCart([]);
              setAttendeeInfo({ name: "", email: "" });
              setOrderNumber(null);
            }}
          >
            Register Another Person
          </Button>
          <Link href="/" className="mt-3 block text-sm text-muted-foreground hover:underline">
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Image / Header */}
      <div
        className={`relative h-48 sm:h-64 lg:h-80 ${
          event.coverImageUrl
            ? "bg-cover bg-center"
            : "bg-gradient-to-br from-primary/80 to-primary"
        }`}
        style={event.coverImageUrl ? { backgroundImage: `url(${event.coverImageUrl})` } : undefined}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="mx-auto max-w-4xl">
            <Badge
              variant="secondary"
              className="mb-3 bg-white/20 text-white backdrop-blur"
            >
              {event.eventType.replace("_", " ")}
            </Badge>
            <h1 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
              {event.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: Event Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Meta */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-4 w-4 text-primary" />
                <span>{format(new Date(event.startsAt), "EEEE, MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
                <span>{format(new Date(event.startsAt), "h:mm a")}</span>
                {event.endsAt && (
                  <span>– {format(new Date(event.endsAt), "h:mm a")}</span>
                )}
              </div>
              {event.maxCapacity && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  <span>{event.maxCapacity} capacity</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Description */}
            {event.description && (
              <div>
                <h2 className="mb-3 text-lg font-semibold">About This Event</h2>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                  {event.description}
                </p>
              </div>
            )}

            {/* Tickets section on mobile */}
            <div className="lg:hidden">
              <TicketSelector
                ticketTypes={ticketTypeList ?? []}
                isLoading={ticketsLoading}
                cart={cart}
                updateCart={updateCart}
                cartTotal={cartTotal}
                cartQty={cartQty}
                isFree={isFree}
                checkoutStep={checkoutStep}
                attendeeInfo={attendeeInfo}
                setAttendeeInfo={setAttendeeInfo}
                onCheckout={handleCheckout}
                onCompleteOrder={handleCompleteOrder}
                onBack={() => setCheckoutStep("tickets")}
                registrationEnabled={event.registrationEnabled ?? false}
                isSubmitting={isSubmitting}
              />
            </div>

            {/* Share */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied!");
                }}
              >
                <Share2 className="h-4 w-4" /> Share Event
              </Button>
            </div>
          </div>

          {/* Right: Ticket selector (desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <TicketSelector
                ticketTypes={ticketTypeList ?? []}
                isLoading={ticketsLoading}
                cart={cart}
                updateCart={updateCart}
                cartTotal={cartTotal}
                cartQty={cartQty}
                isFree={isFree}
                checkoutStep={checkoutStep}
                attendeeInfo={attendeeInfo}
                setAttendeeInfo={setAttendeeInfo}
                onCheckout={handleCheckout}
                onCompleteOrder={handleCompleteOrder}
                onBack={() => setCheckoutStep("tickets")}
                registrationEnabled={event.registrationEnabled ?? false}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TicketSelector({
  ticketTypes,
  isLoading,
  cart,
  updateCart,
  cartTotal,
  cartQty,
  isFree,
  checkoutStep,
  attendeeInfo,
  setAttendeeInfo,
  onCheckout,
  onCompleteOrder,
  onBack,
  registrationEnabled,
  isSubmitting,
}: {
  ticketTypes: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number | null;
    currency: string | null;
    quantityTotal: number | null;
    quantitySold: number | null;
    maxPerOrder: number | null;
    minPerOrder: number | null;
  }>;
  isLoading: boolean;
  cart: CartItem[];
  updateCart: (id: string, name: string, price: number, currency: string, delta: number) => void;
  cartTotal: number;
  cartQty: number;
  isFree: boolean;
  checkoutStep: "tickets" | "info" | "confirm";
  attendeeInfo: { name: string; email: string };
  setAttendeeInfo: React.Dispatch<React.SetStateAction<{ name: string; email: string }>>;
  onCheckout: () => void;
  onCompleteOrder: () => void;
  onBack: () => void;
  registrationEnabled: boolean;
  isSubmitting: boolean;
}) {
  if (!registrationEnabled) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Ticket className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">Registration Not Open</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Registration for this event is not currently available.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (checkoutStep === "info") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Information</CardTitle>
          <CardDescription>
            {isFree
              ? "We'll send your confirmation to this email."
              : "We'll send your tickets to this email."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name *</label>
            <input
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="John Doe"
              value={attendeeInfo.name}
              onChange={(e) => setAttendeeInfo((a) => ({ ...a, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address *</label>
            <input
              type="email"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="john@example.com"
              value={attendeeInfo.email}
              onChange={(e) => setAttendeeInfo((a) => ({ ...a, email: e.target.value }))}
            />
          </div>

          <Separator />

          <div className="text-sm">
            <p className="font-medium mb-2">Order Summary</p>
            {cart.map((item) => (
              <div key={item.ticketTypeId} className="flex justify-between py-1">
                <span className="text-muted-foreground">{item.name} × {item.quantity}</span>
                <span>
                  {item.price === 0
                    ? "Free"
                    : `$${((item.price * item.quantity) / 100).toFixed(2)}`}
                </span>
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{isFree ? "Free" : `$${(cartTotal / 100).toFixed(2)}`}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onBack} disabled={isSubmitting}>
              Back
            </Button>
            <Button className="flex-1 gap-2" onClick={onCompleteOrder} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isFree ? "Registering..." : "Redirecting..."}
                </>
              ) : isFree ? (
                "Complete Registration"
              ) : (
                <>
                  <DollarSign className="h-4 w-4" /> Pay ${(cartTotal / 100).toFixed(2)}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {isLoading ? "Loading tickets..." : "Select Tickets"}
        </CardTitle>
        {!isLoading && ticketTypes.length > 0 && (
          <CardDescription>Choose the tickets you&apos;d like</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : ticketTypes.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            <Ticket className="mx-auto mb-2 h-8 w-8 opacity-30" />
            No tickets available yet.
          </div>
        ) : (
          <>
            {ticketTypes.map((tt) => {
              const cartItem = cart.find((i) => i.ticketTypeId === tt.id);
              const qty = cartItem?.quantity ?? 0;
              const available =
                tt.quantityTotal != null
                  ? tt.quantityTotal - (tt.quantitySold ?? 0)
                  : null;
              const maxQty = Math.min(
                tt.maxPerOrder ?? 10,
                available ?? 10
              );
              const isSoldOut = available !== null && available <= 0;

              return (
                <div
                  key={tt.id}
                  className={`rounded-lg border p-4 ${
                    qty > 0 ? "border-primary/50 bg-primary/5" : ""
                  } ${isSoldOut ? "opacity-50" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{tt.name}</p>
                      {tt.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                          {tt.description}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm font-semibold text-primary">
                          {(tt.price ?? 0) === 0
                            ? "Free"
                            : `$${((tt.price ?? 0) / 100).toFixed(2)}`}
                        </span>
                        {available !== null && (
                          <span className="text-xs text-muted-foreground">
                            {isSoldOut ? "Sold out" : `${available} left`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {qty > 0 ? (
                        <>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateCart(tt.id, tt.name, tt.price ?? 0, tt.currency ?? "USD", -1)}
                          >
                            −
                          </Button>
                          <span className="w-5 text-center text-sm font-medium">{qty}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            disabled={qty >= maxQty}
                            onClick={() => updateCart(tt.id, tt.name, tt.price ?? 0, tt.currency ?? "USD", 1)}
                          >
                            +
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isSoldOut}
                          onClick={() => updateCart(tt.id, tt.name, tt.price ?? 0, tt.currency ?? "USD", 1)}
                        >
                          {isSoldOut ? "Sold Out" : "Add"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {cartQty > 0 && (
              <>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {cartQty} ticket{cartQty !== 1 ? "s" : ""}
                  </span>
                  <span className="font-semibold">
                    {isFree ? "Free" : `$${(cartTotal / 100).toFixed(2)}`}
                  </span>
                </div>
                <Button className="w-full gap-2" onClick={onCheckout}>
                  {isFree ? (
                    <>
                      <Check className="h-4 w-4" /> Register Free
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4" /> Checkout
                    </>
                  )}
                </Button>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
