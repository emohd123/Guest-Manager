import React, { useMemo } from "react";

type Wave = "top" | "middle" | "bottom";

type FloatingLinesProps = {
  linesGradient?: string[];
  enabledWaves?: Wave[];
  lineCount?: number | number[];
  lineDistance?: number | number[];
  topWavePosition?: { x: number; y: number; rotate: number };
  middleWavePosition?: { x: number; y: number; rotate: number };
  bottomWavePosition?: { x: number; y: number; rotate: number };
  animationSpeed?: number;
};

const DEFAULT_GRADIENT = ["#3B82F6", "#8B5CF6", "#EC4899"];

export function FloatingLines({
  linesGradient = DEFAULT_GRADIENT,
  enabledWaves = ["top", "middle", "bottom"],
  lineCount = [12, 18, 22],
  lineDistance = [8, 6, 4],
  topWavePosition = { x: -8, y: 12, rotate: -8 },
  middleWavePosition = { x: 6, y: 38, rotate: 5 },
  bottomWavePosition = { x: -4, y: 68, rotate: -7 },
  animationSpeed = 1,
}: FloatingLinesProps) {
  const waves = useMemo(
    () =>
      [
        { key: "top" as const, position: topWavePosition, opacity: 0.76 },
        { key: "middle" as const, position: middleWavePosition, opacity: 0.9 },
        { key: "bottom" as const, position: bottomWavePosition, opacity: 0.68 },
      ].filter((wave) => enabledWaves.includes(wave.key)),
    [bottomWavePosition, enabledWaves, middleWavePosition, topWavePosition]
  );

  function getValue(value: number | number[], index: number, fallback: number) {
    return Array.isArray(value) ? value[index] ?? fallback : value;
  }

  return React.createElement(
    "div",
    {
      "aria-hidden": true,
      style: {
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        background:
          "radial-gradient(circle at 20% 24%, rgba(37,99,235,0.34), transparent 34%), radial-gradient(circle at 78% 40%, rgba(124,58,237,0.26), transparent 32%), radial-gradient(circle at 48% 76%, rgba(219,39,119,0.22), transparent 36%)",
      },
    },
    React.createElement("style", {
      dangerouslySetInnerHTML: {
        __html: `
          @keyframes eventsHubFloatLines {
            0%, 100% { transform: translate3d(-4%, 0, 0) rotate(var(--wave-rotate)); }
            50% { transform: translate3d(5%, -18px, 0) rotate(calc(var(--wave-rotate) * -0.45)); }
          }
          @keyframes eventsHubLinePulse {
            0%, 100% { opacity: var(--line-opacity); filter: brightness(1.22); }
            50% { opacity: calc(var(--line-opacity) + 0.26); filter: brightness(1.72); }
          }
        `,
      },
    }),
    waves.map((wave, waveIndex) => {
      const count = Math.max(1, getValue(lineCount, waveIndex, 10));
      const distance = getValue(lineDistance, waveIndex, 6);

      return React.createElement(
        "div",
        {
          key: wave.key,
          style: {
            position: "absolute",
            left: "-8%",
            top: `${wave.position.y}%`,
            width: "118%",
            height: 260,
            opacity: wave.opacity,
            transformOrigin: "50% 50%",
            ["--wave-rotate" as string]: `${wave.position.rotate}deg`,
            animation: `eventsHubFloatLines ${Math.max(5.6, 9 / animationSpeed)}s ease-in-out infinite`,
            animationDelay: `${waveIndex * -1.4}s`,
          },
        },
        Array.from({ length: count }).map((_, index) => {
          const color = linesGradient[index % linesGradient.length] ?? DEFAULT_GRADIENT[0];
          const width = 190 + (index % 6) * 54;
          const left = wave.position.x + index * distance * 1.9;
          const top = 26 + Math.sin(index * 0.82) * 42 + index * 7;
          const opacity = 0.42 + (index % 5) * 0.07;

          return React.createElement("div", {
            key: `${wave.key}-${index}`,
            style: {
              position: "absolute",
              left: `${left}%`,
              top,
              width,
              height: 2,
              borderRadius: 999,
              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
              boxShadow: `0 0 22px ${color}, 0 0 48px ${color}`,
              ["--line-opacity" as string]: opacity,
              animation: `eventsHubLinePulse ${3.4 + (index % 4) * 0.35}s ease-in-out infinite`,
              animationDelay: `${index * -0.16}s`,
            },
          });
        })
      );
    })
  );
}
