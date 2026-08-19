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
  const [fullScreen, setFullScreen] = useState(autoOpen);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<Record<string, number>>(
    {},
  );
  const [selectedNames, setSelectedNames] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(900);
  const resolvedEventKey =
    eventKey || (chartKey ? `iticket-${eventId}-${chartKey}`.slice(0, 128) : eventId);
  useEffect(() => {
    if (!fullScreen) return;
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    const previousViewportContent =
      viewportMeta?.getAttribute("content") ?? null;
    if (viewportMeta)
      viewportMeta.setAttribute(
        "content",
        "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
      );
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    document.documentElement.style.overflow = "hidden";
    setSecondsLeft(900);
    const timer = window.setInterval(
      () => setSecondsLeft((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => {
      window.clearInterval(timer);
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
      document.documentElement.style.overflow = previousHtmlOverflow;
      if (viewportMeta && previousViewportContent)
        viewportMeta.setAttribute("content", previousViewportContent);
    };
  }, [fullScreen]);
  useEffect(() => {
    let chart: any;
    let cancelled = false;
    const load = async () => {
      if (!fullScreen) return;
      if (cancelled || !ref.current) return;
      if (chartKey) {
        const ensureResponse = await fetch(`/api/seatsio/events/${encodeURIComponent(eventId)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventKey: resolvedEventKey, chartKey }),
        });
        if (!ensureResponse.ok) {
          const payload = await ensureResponse.json().catch(() => ({}));
          throw new Error(payload.error || "Unable to initialize the seating chart");
        }
      }
      if (cancelled || !ref.current) return;
      const render = () => {
        if (!ref.current || !(window as any).seatsio) return;
        chart = new (window as any).seatsio.SeatingChart({
          divId: ref.current.id,
          workspaceKey,
          event: resolvedEventKey,
          session: "continue",
          selectionMode: "multi",
          showTooltip: false,
          pricing,
          priceFormatter: (price: number) => `${currency} ${price}`,
          onObjectSelected: (obj: any) =>
            setSelected((current) => {
              const id = obj.id || obj.label;
              const label = obj.label || obj.id || ticketTypeName;
              const next = current.includes(id) ? current : [...current, id];
              const rawCategory =
                obj.category && typeof obj.category === "object"
                  ? (obj.category.key ?? obj.category.label)
                  : obj.category;
              const configuredPrice = pricing.find(
                (item) => String(item.category) === String(rawCategory),
              )?.price;
              // Category prices are entered in major currency units (e.g. EGP 100),
              // while checkout and orders use hundredths (10000).
              const categoryPrice = configuredPrice == null
                ? basePrice
                : configuredPrice * 100;
              setSelectedPrices((prices) => ({
                ...prices,
                [id]: categoryPrice,
              }));
              setSelectedNames((names) => ({ ...names, [id]: String(label) }));
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
              setSelectedNames((names) => {
                const copy = { ...names };
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
    pricing,
    currency,
    basePrice,
  ]);
  return (
    <>
      <button
        type="button"
        onClick={() => setFullScreen(true)}
        className="mb-3 inline-flex items-center rounded-full bg-cyan-600 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-cyan-700"
      >
        Choose seats
      </button>
      <div
        className={
          fullScreen
            ? "fixed inset-0 z-[200] flex flex-col bg-white overscroll-none"
            : "w-full"
        }
        role={fullScreen ? "dialog" : undefined}
        aria-modal={fullScreen ? true : undefined}
        aria-label={fullScreen ? "Choose seats" : "Choose seats"}
      >
        {fullScreen && typeof document !== "undefined"
          ? createPortal(
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  zIndex: 2147483647,
                  transform: "translateZ(0)",
                }}
                className="fixed inset-x-0 top-0 z-[2147483647] flex h-14 items-center border-b border-zinc-200 bg-white px-3 shadow-sm sm:h-16 sm:px-4"
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFullScreen(false)}
                    aria-label="Back to event"
                    className="rounded-full border border-zinc-300 px-3 py-2 text-lg font-black text-zinc-900"
                  >
                    ←
                  </button>
                  <p className="font-black text-zinc-900">Choose your seats</p>
                </div>
              </div>,
              document.body,
            )
          : null}
        {fullScreen ? (
          <div
            id={`seatsio-${eventId}`}
            ref={ref}
            className="min-h-0 flex-1 w-full bg-white pb-16 pt-14 sm:pb-20 sm:pt-16"
          />
        ) : null}
        {fullScreen && typeof document !== "undefined"
          ? createPortal(
              <div
                style={{
                  position: "fixed",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  zIndex: 2147483647,
                  transform: "translateZ(0)",
                }}
                className="fixed inset-x-0 bottom-0 z-[2147483647] grid h-16 grid-cols-[auto_1fr_auto] items-center gap-2 border-t border-zinc-200 bg-white px-3 pb-[env(safe-area-inset-bottom)] text-xs shadow-[0_-4px_16px_rgba(0,0,0,.12)] sm:h-20 sm:gap-4 sm:px-5 sm:text-sm"
              >
                <span className="font-black text-zinc-900">
                  🎟 {selected.length} selected
                </span>
                <span className="text-zinc-600">
                  Time remaining{" "}
                  <strong className="ml-1 rounded bg-emerald-100 px-2 py-1 text-emerald-700">
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
                    const grouped = new Map<string, { price: number; name: string; quantity: number }>();
                    selected.forEach((id) => {
                      const price = selectedPrices[id] ?? basePrice;
                      const name = selectedNames[id] || ticketTypeName;
                      const key = `${price}|${name}`;
                      const current = grouped.get(key);
                      grouped.set(key, current
                        ? { ...current, quantity: current.quantity + 1 }
                        : { price, name, quantity: 1 });
                    });
                    const items = Array.from(grouped.values(), ({ price, name, quantity }) => ({
                      ticketTypeId: ticketTypeId || "",
                      name,
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
              </div>,
              document.body,
            )
          : null}
      </div>
    </>
  );
}

