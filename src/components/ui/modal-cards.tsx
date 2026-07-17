"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Modal Cards — expandable cards that open into full-screen modals.
 *
 * Interim implementation of the React Bits Pro "Modal Cards" component
 * (https://pro.reactbits.dev/docs/components/modal-cards) with a compatible
 * props surface (cards / className / gradientColor / animationSpeed).
 * Entrance/exit run as pure CSS keyframe animations (mount-triggered, no
 * state races); unmount happens on a timer after the exit animation. Once
 * REACTBITS_LICENSE_KEY is added to .env.local,
 * `npx shadcn@latest add @reactbits-starter/modal-cards-tw` can replace this
 * file in place — call sites won't need to change.
 */

export type ModalCard = {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  badge?: string;
  /** Rich body shown inside the opened modal. */
  content?: React.ReactNode;
  /** Optional footer actions rendered inside the modal. */
  actions?: React.ReactNode;
};

export type ModalCardsProps = {
  cards: ModalCard[];
  className?: string;
  /** Accent used for the card hover glow and modal backdrop tint. */
  gradientColor?: string;
  /** Multiplier on the open/close animation (1 = default). */
  animationSpeed?: number;
  dir?: "ltr" | "rtl";
};

const KEYFRAMES = `
@keyframes mcOverlayIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes mcOverlayOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes mcDialogIn {
  from { opacity: 0; transform: scale(0.92) translateY(28px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes mcDialogOut {
  from { opacity: 1; transform: scale(1) translateY(0); }
  to { opacity: 0; transform: scale(0.94) translateY(16px); }
}
@keyframes mcImageIn { from { transform: scale(1.14); } to { transform: scale(1); } }
@keyframes mcRiseIn {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

export function ModalCards({
  cards,
  className,
  gradientColor = "rgba(103, 232, 249, 0.35)",
  animationSpeed = 1,
  dir = "ltr",
}: ModalCardsProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [closing, setClosing] = React.useState(false);
  // Once the entrance window has passed, pin the final styles. This is a
  // failsafe for environments where CSS animations are paused or removed
  // (hidden/background tabs, prefers-reduced-motion) so the modal can never
  // get stuck invisible.
  const [settled, setSettled] = React.useState(false);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = cards.find((card) => card.id === activeId) ?? null;
  const durationMs = Math.round(420 / Math.max(animationSpeed, 0.1));
  const ease = "cubic-bezier(0.32, 0.72, 0, 1)";

  const open = React.useCallback((id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setClosing(false);
    setSettled(false);
    setActiveId(id);
  }, []);

  const close = React.useCallback(() => {
    setClosing(true);
    setSettled(false);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setActiveId(null);
      setClosing(false);
    }, durationMs + 40);
  }, [durationMs]);

  React.useEffect(() => {
    if (!activeId || closing) return;
    const timer = setTimeout(() => setSettled(true), durationMs * 1.7 + 80);
    return () => clearTimeout(timer);
  }, [activeId, closing, durationMs]);

  // Escape closes; lock body scroll while a modal is open.
  React.useEffect(() => {
    if (!activeId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [activeId, close]);

  React.useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    []
  );

  const anim = (name: string, delayFactor = 0) =>
    `${name} ${durationMs}ms ${ease} ${Math.round(durationMs * delayFactor)}ms both`;

  /** Entrance style that self-heals to the final state once settled. */
  const entrance = (name: string, delayFactor = 0): React.CSSProperties =>
    settled
      ? { animation: "none", opacity: 1, transform: "none" }
      : { animation: anim(name, delayFactor) };

  return (
    <div dir={dir} className={cn("grid gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4", className)}>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
      {cards.map((card) => (
        <button
          key={card.id}
          type="button"
          onClick={() => open(card.id)}
          className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-3xl border border-white/10 text-start transition-all duration-300 hover:-translate-y-1.5 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:aspect-[4/3]"
          onMouseEnter={(event) => {
            (event.currentTarget as HTMLElement).style.boxShadow = `0 18px 50px -18px ${gradientColor}`;
          }}
          onMouseLeave={(event) => {
            (event.currentTarget as HTMLElement).style.boxShadow = "0 0 0 rgba(0,0,0,0)";
          }}
        >
          <img
            src={card.image}
            alt={card.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
          {card.badge ? (
            <span className="absolute start-4 top-4 rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white backdrop-blur">
              {card.badge}
            </span>
          ) : null}
          <div className="relative p-5">
            <h3 className="text-xl font-black tracking-tight text-white">{card.title}</h3>
            {card.subtitle ? <p className="mt-1 text-sm font-bold text-cyan-100/85">{card.subtitle}</p> : null}
          </div>
        </button>
      ))}

      {active ? (
        <div
          dir={dir}
          className="fixed inset-0 z-[90] flex items-stretch justify-center"
          style={{
            background: `radial-gradient(120% 120% at 50% 0%, ${gradientColor} 0%, rgba(3,6,16,0.92) 45%)`,
            ...(closing ? { animation: anim("mcOverlayOut") } : entrance("mcOverlayIn")),
            pointerEvents: closing ? "none" : "auto",
          }}
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={active.title}
            onClick={(event) => event.stopPropagation()}
            className="relative m-0 flex h-full w-full max-w-none flex-col overflow-hidden bg-[#05070f] sm:m-6 sm:h-auto sm:max-h-[calc(100vh-3rem)] sm:max-w-4xl sm:rounded-[2rem] sm:border sm:border-white/12"
            style={closing ? { animation: anim("mcDialogOut") } : entrance("mcDialogIn")}
          >
            <div className="relative h-[38vh] shrink-0 overflow-hidden sm:h-72">
              <img
                src={active.image}
                alt={active.title}
                className="absolute inset-0 h-full w-full object-cover"
                style={
                  closing
                    ? undefined
                    : settled
                      ? { animation: "none", transform: "none" }
                      : { animation: `mcImageIn ${durationMs * 1.6}ms ${ease} both` }
                }
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05070f] via-transparent to-black/30" />
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="absolute end-4 top-4 rounded-full bg-black/55 p-2.5 text-white backdrop-blur transition hover:bg-black/80"
              >
                <X className="h-5 w-5" />
              </button>
              {active.badge ? (
                <span className="absolute start-5 top-5 rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white backdrop-blur">
                  {active.badge}
                </span>
              ) : null}
            </div>
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              <h2
                className="text-3xl font-black tracking-tight text-white sm:text-4xl"
                style={closing ? undefined : entrance("mcRiseIn", 0.25)}
              >
                {active.title}
              </h2>
              {active.subtitle ? <p className="mt-2 text-base font-bold text-cyan-100/85">{active.subtitle}</p> : null}
              {active.content ? (
                <div className="mt-5 text-white/75" style={closing ? undefined : entrance("mcRiseIn", 0.4)}>
                  {active.content}
                </div>
              ) : null}
            </div>
            {active.actions ? (
              <div
                className="shrink-0 border-t border-white/10 bg-black/30 p-5 sm:p-6"
                style={closing ? undefined : entrance("mcRiseIn", 0.5)}
              >
                {active.actions}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
