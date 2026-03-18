"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className }: BrandMarkProps) {
  const id = useId();
  const pinGradientId = `${id}-pin-gradient`;
  const highlightId = `${id}-pin-highlight`;
  const glowId = `${id}-pin-glow`;
  const ticketShadowId = `${id}-ticket-shadow`;
  const checkGradientId = `${id}-check-gradient`;
  const ticketMaskId = `${id}-ticket-mask`;

  return (
    <svg
      viewBox="0 0 96 112"
      aria-hidden="true"
      className={cn("h-11 w-11 shrink-0", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id={pinGradientId}
          x1="16"
          y1="10"
          x2="82"
          y2="92"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF5A7A" />
          <stop offset="0.32" stopColor="#FF6B8A" />
          <stop offset="0.72" stopColor="#7C4DFF" />
          <stop offset="1" stopColor="#5B3DF5" />
        </linearGradient>
        <radialGradient
          id={highlightId}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(34 22) rotate(42.2) scale(42 31)"
        >
          <stop stopColor="#FFFFFF" stopOpacity="0.62" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id={`${id}-orb-gradient`}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(48 39) rotate(90) scale(29)"
        >
          <stop stopColor="#FFFFFF" stopOpacity="0.24" />
          <stop offset="0.72" stopColor="#FFFFFF" stopOpacity="0.08" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id={`${id}-rim-gradient`}
          x1="20"
          y1="18"
          x2="73"
          y2="98"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFFFFF" stopOpacity="0.34" />
          <stop offset="0.45" stopColor="#FFFFFF" stopOpacity="0.08" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient
          id={`${id}-ticket-gradient`}
          x1="29"
          y1="27"
          x2="70"
          y2="58"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#FFF3FA" />
        </linearGradient>
        <filter
          id={glowId}
          x="2"
          y="4"
          width="92"
          height="104"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="4.5" result="blurred" />
          <feColorMatrix
            in="blurred"
            type="matrix"
            values="1 0 0 0 0  0 0.36 0 0 0  0 0 1 0 0  0 0 0 0.22 0"
            result="shadow"
          />
          <feBlend in="shadow" in2="SourceGraphic" mode="normal" />
        </filter>
        <filter
          id={ticketShadowId}
          x="20"
          y="20"
          width="56"
          height="43"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feOffset dy="3" />
          <feGaussianBlur stdDeviation="2.5" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.32549 0 0 0 0 0.215686 0 0 0 0 0.921569 0 0 0 0.22 0"
          />
          <feBlend in2="BackgroundImageFix" result="effect1_dropShadow_1_1" />
          <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_1" result="shape" />
        </filter>
        <linearGradient
          id={checkGradientId}
          x1="39"
          y1="30"
          x2="55"
          y2="46"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF5A7A" />
          <stop offset="1" stopColor="#7C4DFF" />
        </linearGradient>
        <mask id={ticketMaskId}>
          <rect x="24" y="24" width="48" height="34" rx="10" fill="white" />
          <circle cx="24" cy="41" r="5" fill="black" />
          <circle cx="72" cy="41" r="5" fill="black" />
        </mask>
      </defs>
      <g filter={`url(#${glowId})`}>
        <path
          d="M48 104C45.2 104 42.55 102.77 40.74 100.67C32.73 91.38 16 71.05 16 48C16 30.33 30.33 16 48 16C65.67 16 80 30.33 80 48C80 71.05 63.27 91.38 55.26 100.67C53.45 102.77 50.8 104 48 104Z"
          fill={`url(#${pinGradientId})`}
        />
        <path
          d="M48 104C45.2 104 42.55 102.77 40.74 100.67C32.73 91.38 16 71.05 16 48C16 30.33 30.33 16 48 16C65.67 16 80 30.33 80 48C80 71.05 63.27 91.38 55.26 100.67C53.45 102.77 50.8 104 48 104Z"
          fill={`url(#${highlightId})`}
        />
        <circle
          cx="48"
          cy="41"
          r="28"
          fill={`url(#${id}-orb-gradient)`}
        />
      </g>
      <path
        d="M48 104C45.2 104 42.55 102.77 40.74 100.67C32.73 91.38 16 71.05 16 48C16 30.33 30.33 16 48 16C65.67 16 80 30.33 80 48C80 71.05 63.27 91.38 55.26 100.67C53.45 102.77 50.8 104 48 104Z"
        stroke={`url(#${id}-rim-gradient)`}
        strokeWidth="1.5"
      />
      <g filter={`url(#${ticketShadowId})`}>
        <rect
          x="24"
          y="24"
          width="48"
          height="34"
          rx="10"
          fill={`url(#${id}-ticket-gradient)`}
          mask={`url(#${ticketMaskId})`}
        />
      </g>
      <path
        d="M30 28.5H58"
        stroke="white"
        strokeOpacity="0.62"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M36.5 40.5L45 48.5L60 32.5"
        stroke={`url(#${checkGradientId})`}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M48 98C44.6 98 41.4 96.5 39.16 93.94C30.9 84.48 21 70.7 21 53.71"
        stroke="white"
        strokeOpacity="0.24"
        strokeWidth="2.7"
        strokeLinecap="round"
      />
      <ellipse cx="48" cy="105.5" rx="15" ry="4.5" fill="#5B3DF5" fillOpacity="0.14" />
    </svg>
  );
}
