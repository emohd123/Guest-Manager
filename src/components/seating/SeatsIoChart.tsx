"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

type Props = {
  eventId: string;
  eventKey?: string;
  workspaceKey: string;
  chartKey?: string;
  basePrice?: number;
  currency?: string;
  ticketTypeId?: string;
  ticketTypeName?: string;
  autoOpen?: boolean;
  returnTo?: string;
  companySlug?: string;
  eventSlug?: string;
  pricing?: Array<{ category: string | number; price: number }>;
  onSelection?: (ids: string[]) => void;
};
export function SeatsIoChart({
  eventId,
  eventKey,
  workspaceKey,
  chartKey,
  basePrice = 0,
  currency = "EGP",
  ticketTypeId,
  ticketTypeName = "Reserved seat",
  autoOpen = false,
  returnTo,
  companySlug,
  eventSlug,
  pricing = [],
  onSelection,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [fullScreen, setFullScreen] = useState(autoOpen);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<Record<string, number>>(
    {},
  );
  const [secondsLeft, setSecondsLeft] = useState(900);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!fullScreen) return;
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    document.documentElement.style.overflow = "hidden";
    const timer = window.setInterval(
      () => setSecondsLeft((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => {
      window.clearInterval(timer);
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [fullScreen]);
  useEffect(() => {
    let chart: any;
    let cancelled = false;
    const load = async () => {
      if (!fullScreen || !mounted) return;
      if (cancelled || !ref.current) return;
      const render = () => {
        if (!ref.current || !(window as any).seatsio) return;
        chart = new (window as any).seatsio.SeatingChart({
          divId: ref.current.id,
          workspaceKey,
          event: eventKey ?? eventId,
          session: "continue",
          selectionMode: "multi",
          showTooltip: false,
          pricing: { prices: pricing },
          priceFormatter: (price: number) => `${currency} ${price}`,
          onObjectSelected: (obj: any) =>
            setSelected((current) => {
              const id = obj.id || obj.label;
              const next = current.includes(id) ? current : [...current, id];
              const rawCategory =
                obj.category && typeof obj.category === "object"
                  ? (obj.category.key ?? obj.category.label)
                  : obj.category;
              const categoryPrice =
                pricing.find(
                  (item) => String(item.category) === String(rawCategory),
                )?.price ?? basePrice;
              setSelectedPrices((prices) => ({
                ...prices,
                [id]: categoryPrice,
              }));
              onSelection?.(next);
              return next;
            }),
          onObjectDeselected: (obj: any) =>
            setSelected((current) => {
              const id = obj.id || obj.label;
              const next = current.filter((value) => value !== id);
              setSelectedPrices((prices) => {
                const copy = { ...prices };
                delete copy[id];
                return copy;
              });
              onSelection?.(next);
              return next;
            }),
        }).render();
      };
      if ((window as any).seatsio) render();
      else {
        const s = document.createElement("script");
        s.src = "https://cdn-eu.seatsio.net/chart.js";
        s.onload = render;
        document.head.appendChild(s);
      }
    };
    void load();
    return () => {
      cancelled = true;
      chart?.destroy?.();
    };
  }, [
    eventId,
    eventKey,
    workspaceKey,
    chartKey,
    onSelection,
    fullScreen,
    mounted,
    pricing,
    currency,
    basePrice,
  ]);
  const seatPicker =
    fullScreen && mounted
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Choose seats"
            className="fixed inset-0 z-[2147483647] grid w-screen grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden overscroll-none bg-white"
            style={{ height: "100dvh", maxHeight: "100dvh" }}
          >
            <header
              className="relative z-30 flex min-h-14 shrink-0 items-center border-b border-zinc-200 bg-white px-3 shadow-sm sm:min-h-16 sm:px-4"
              style={{ paddingTop: "env(safe-area-inset-top)" }}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFullScreen(false)}
                  aria-label="Back to event"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-zinc-300 text-xl font-black text-zinc-900"
                >
                  ←
                </button>
                <p className="text-base font-black text-zinc-900 sm:text-lg">
                  Choose your seats
                </p>
              </div>
            </header>

            <main className="relative min-h-0 w-full overflow-hidden bg-white">
              <div
                id={`seatsio-${eventId}`}
                ref={ref}
                className="absolute inset-0 h-full min-h-0 w-full overflow-hidden bg-white"
              />
            </main>

            <footer
              className="relative z-30 grid min-h-16 shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-t border-zinc-200 bg-white px-3 text-xs shadow-[0_-4px_16px_rgba(0,0,0,.12)] sm:min-h-20 sm:gap-4 sm:px-5 sm:text-sm"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <span className="font-black text-zinc-900">
                🎟 {selected.length} selected
              </span>
              <span className="min-w-0 text-center text-zinc-600">
                Time remaining{" "}
                <strong className="ml-1 inline-block rounded bg-emerald-100 px-2 py-1 text-emerald-700">
                  {Math.floor(secondsLeft / 60)}:
                  {String(secondsLeft % 60).padStart(2, "0")}
                </strong>
              </span>
              <button
                type="button"
                disabled={!selected.length}
                onClick={() => {
                  const safeReturnTo =
                    returnTo ||
                    (companySlug && eventSlug
                      ? `/e/${companySlug}/${eventSlug}?openSeats=1#tickets`
                      : "");
                  if (safeReturnTo) {
                    try {
                      window.sessionStorage.setItem(
                        "iticket.seatReturnTo",
                        safeReturnTo,
                      );
                    } catch {}
                  }
                  const grouped = new Map<number, number>();
                  selected.forEach((id) => {
                    const price = selectedPrices[id] ?? basePrice;
                    grouped.set(price, (grouped.get(price) ?? 0) + 1);
                  });
                  const items = Array.from(grouped, ([price, quantity]) => ({
                    ticketTypeId: ticketTypeId || "",
                    name: ticketTypeName,
                    price,
                    currency,
                    quantity,
                  }));
                  const params = new URLSearchParams({
                    event: eventSlug || "",
                    company: companySlug || "",
                    items: JSON.stringify(items),
                    seats: selected.join(","),
                    seatsIo: "1",
                  });
                  if (safeReturnTo) params.set("returnTo", safeReturnTo);
                  router.push(`/checkout/tickets?${params.toString()}`);
                }}
                className="rounded-lg bg-zinc-900 px-4 py-2 font-black text-white disabled:cursor-not-allowed disabled:opacity-40 sm:px-7 sm:py-3"
              >
                Next
              </button>
            </footer>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSecondsLeft(900);
          setFullScreen(true);
        }}
        className="mb-3 inline-flex items-center rounded-full bg-cyan-600 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-cyan-700"
      >
        Choose seats
      </button>
      {seatPicker}
    </>
  );
}
