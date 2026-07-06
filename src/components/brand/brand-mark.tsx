"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className }: BrandMarkProps) {
  const id = useId();
  const brandGradientId = `${id}-brand-gradient`;
  const glowFilterId = `${id}-glow`;

  return (
    <svg
      viewBox="0 0 96 112"
      aria-hidden="true"
      className={cn("h-11 w-11 shrink-0 group/logo cursor-pointer", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>{`
        /* Smooth audio visualizer / soundwave equalizer animation */
        .eq-bar {
          transform-origin: 50% 56px;
          animation: equalize 1.6s ease-in-out infinite;
          transition: fill 0.3s ease;
        }
        .eq-bar-1 { animation-delay: 0.1s; animation-duration: 1.2s; }
        .eq-bar-2 { animation-delay: 0.4s; animation-duration: 1.6s; }
        .eq-bar-3 { animation-delay: 0.2s; animation-duration: 1.3s; }
        .eq-bar-4 { animation-delay: 0.6s; animation-duration: 1.7s; }
        .eq-bar-5 { animation-delay: 0.3s; animation-duration: 1.4s; }
        .eq-bar-6 { animation-delay: 0.5s; animation-duration: 1.5s; }

        @keyframes equalize {
          0%, 100% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(0.3);
          }
        }

        /* Interactive logo hover effects */
        .ticket-path {
          transform-origin: 48px 56px;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), filter 0.4s ease;
        }

        .group\\/logo:hover .ticket-path {
          transform: scale(1.05) rotate(-2deg);
        }
        
        .group\\/logo:hover .eq-bar {
          animation-duration: 0.8s; /* Double the visualizer speed on hover! */
        }
      `}</style>

      <defs>
        {/* Brand linear gradient (Blue -> Purple -> Pink) */}
        <linearGradient
          id={brandGradientId}
          x1="14"
          y1="34"
          x2="82"
          y2="78"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#2563eb" />
          <stop offset="0.5" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#db2777" />
        </linearGradient>

        {/* Clean neon glow filter */}
        <filter
          id={glowFilterId}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComponentTransfer in="blur" result="glow">
            <feFuncA type="linear" slope="0.65" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Ticket Base Outline - transparent fill, with smooth transform classes */}
      <path
        className="ticket-path"
        d="M 22,34 H 74 Q 82,34 82,42 V 48 A 7,7 0 0,0 82,64 V 70 Q 82,78 74,78 H 22 Q 14,78 14,70 V 64 A 7,7 0 0,0 14,48 V 42 Q 14,34 22,34 Z"
        stroke={`url(#${brandGradientId})`}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${glowFilterId})`}
      />

      {/* Balanced soundwave bars centered inside the ticket */}
      <rect className="eq-bar eq-bar-1" x="34" y="48" width="4.5" height="16" rx="2.25" fill={`url(#${brandGradientId})`} />
      <rect className="eq-bar eq-bar-2" x="42.5" y="42" width="4.5" height="28" rx="2.25" fill={`url(#${brandGradientId})`} />
      <rect className="eq-bar eq-bar-3" x="51" y="37" width="4.5" height="38" rx="2.25" fill={`url(#${brandGradientId})`} />
      <rect className="eq-bar eq-bar-4" x="59.5" y="44" width="4.5" height="24" rx="2.25" fill={`url(#${brandGradientId})`} />
      <rect className="eq-bar eq-bar-5" x="68" y="47" width="4.5" height="18" rx="2.25" fill={`url(#${brandGradientId})`} />
    </svg>
  );
}
