"use client";

import { useEffect, useRef } from "react";
import {
  Clock,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";

type Wave = "top" | "middle" | "bottom";

type WavePosition = {
  x: number;
  y: number;
  rotate: number;
};

type FloatingLinesProps = {
  linesGradient?: string[];
  enabledWaves?: Wave[];
  lineCount?: number | number[];
  lineDistance?: number | number[];
  topWavePosition?: WavePosition;
  middleWavePosition?: WavePosition;
  bottomWavePosition?: WavePosition;
  animationSpeed?: number;
  interactive?: boolean;
  bendRadius?: number;
  bendStrength?: number;
  mouseDamping?: number;
  parallax?: boolean;
  parallaxStrength?: number;
  mixBlendMode?: React.CSSProperties["mixBlendMode"];
  intensity?: number;
  className?: string;
};

const vertexShader = `
precision highp float;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float iTime;
uniform vec3 iResolution;
uniform float animationSpeed;
uniform bool enableTop;
uniform bool enableMiddle;
uniform bool enableBottom;
uniform int topLineCount;
uniform int middleLineCount;
uniform int bottomLineCount;
uniform float topLineDistance;
uniform float middleLineDistance;
uniform float bottomLineDistance;
uniform vec3 topWavePosition;
uniform vec3 middleWavePosition;
uniform vec3 bottomWavePosition;
uniform vec2 iMouse;
uniform bool interactive;
uniform float bendRadius;
uniform float bendStrength;
uniform float bendInfluence;
uniform bool parallax;
uniform float parallaxStrength;
uniform vec2 parallaxOffset;
uniform vec3 lineGradient[8];
uniform int lineGradientCount;
uniform float intensity;

const vec3 BLACK = vec3(0.0);
const vec3 PINK = vec3(233.0, 71.0, 245.0) / 255.0;
const vec3 BLUE = vec3(47.0, 75.0, 162.0) / 255.0;

mat2 rotate(float r) {
  return mat2(cos(r), sin(r), -sin(r), cos(r));
}

vec3 background_color(vec2 uv) {
  vec3 col = vec3(0.0);
  float y = sin(uv.x - 0.2) * 0.3 - 0.1;
  float m = uv.y - y;
  col += mix(BLUE, BLACK, smoothstep(0.0, 1.0, abs(m)));
  col += mix(PINK, BLACK, smoothstep(0.0, 1.0, abs(m - 0.8)));
  return col * 0.5;
}

vec3 getLineColor(float t, vec3 baseColor) {
  if (lineGradientCount <= 0) return baseColor;
  vec3 gradientColor;
  if (lineGradientCount == 1) {
    gradientColor = lineGradient[0];
  } else {
    float clampedT = clamp(t, 0.0, 0.9999);
    float scaled = clampedT * float(lineGradientCount - 1);
    int idx = int(floor(scaled));
    float f = fract(scaled);
    int idx2 = min(idx + 1, lineGradientCount - 1);
    gradientColor = mix(lineGradient[idx], lineGradient[idx2], f);
  }
  return gradientColor * 0.5;
}

float wave(vec2 uv, float offset, vec2 screenUv, vec2 mouseUv, bool shouldBend) {
  float time = iTime * animationSpeed;
  float amp = sin(offset + time * 0.2) * 0.3;
  float y = sin(uv.x + offset + time * 0.1) * amp;

  if (shouldBend) {
    vec2 d = screenUv - mouseUv;
    float influence = exp(-dot(d, d) * bendRadius);
    y += (mouseUv.y - screenUv.y) * influence * bendStrength * bendInfluence;
  }

  float m = uv.y - y;
  return 0.0065 / max(abs(m) + 0.009, 1e-3);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 baseUv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
  baseUv.y *= -1.0;
  if (parallax) baseUv += parallaxOffset;

  vec3 col = vec3(0.0);
  vec3 b = lineGradientCount > 0 ? vec3(0.0) : background_color(baseUv);
  vec2 mouseUv = vec2(0.0);
  if (interactive) {
    mouseUv = (2.0 * iMouse - iResolution.xy) / iResolution.y;
    mouseUv.y *= -1.0;
  }

  if (enableBottom) {
    for (int i = 0; i < bottomLineCount; ++i) {
      float fi = float(i);
      float t = fi / max(float(bottomLineCount - 1), 1.0);
      vec2 ruv = baseUv * rotate(bottomWavePosition.z * log(length(baseUv) + 1.0));
      col += getLineColor(t, b) * wave(ruv + vec2(bottomLineDistance * fi + bottomWavePosition.x, bottomWavePosition.y), 1.5 + 0.2 * fi, baseUv, mouseUv, interactive) * 0.14;
    }
  }

  if (enableMiddle) {
    for (int i = 0; i < middleLineCount; ++i) {
      float fi = float(i);
      float t = fi / max(float(middleLineCount - 1), 1.0);
      vec2 ruv = baseUv * rotate(middleWavePosition.z * log(length(baseUv) + 1.0));
      col += getLineColor(t, b) * wave(ruv + vec2(middleLineDistance * fi + middleWavePosition.x, middleWavePosition.y), 2.0 + 0.15 * fi, baseUv, mouseUv, interactive) * 0.5;
    }
  }

  if (enableTop) {
    for (int i = 0; i < topLineCount; ++i) {
      float fi = float(i);
      float t = fi / max(float(topLineCount - 1), 1.0);
      vec2 ruv = baseUv * rotate(topWavePosition.z * log(length(baseUv) + 1.0));
      ruv.x *= -1.0;
      col += getLineColor(t, b) * wave(ruv + vec2(topLineDistance * fi + topWavePosition.x, topWavePosition.y), 1.0 + 0.2 * fi, baseUv, mouseUv, interactive) * 0.08;
    }
  }

  fragColor = vec4(col * intensity, 1.0);
}

void main() {
  vec4 color = vec4(0.0);
  mainImage(color, gl_FragCoord.xy);
  gl_FragColor = color;
}
`;

const MAX_GRADIENT_STOPS = 8;

function hexToVec3(hex: string) {
  const value = hex.trim().replace("#", "");
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value;

  const r = parseInt(normalized.slice(0, 2) || "ff", 16);
  const g = parseInt(normalized.slice(2, 4) || "ff", 16);
  const b = parseInt(normalized.slice(4, 6) || "ff", 16);
  return new Vector3(r / 255, g / 255, b / 255);
}

export function FloatingLines({
  linesGradient,
  enabledWaves = ["top", "middle", "bottom"],
  lineCount = [6],
  lineDistance = [5],
  topWavePosition,
  middleWavePosition,
  bottomWavePosition = { x: 2.0, y: -0.7, rotate: -1 },
  animationSpeed = 1,
  interactive = true,
  bendRadius = 5.0,
  bendStrength = -0.5,
  mouseDamping = 0.05,
  parallax = true,
  parallaxStrength = 0.2,
  mixBlendMode = "screen",
  intensity = 1,
  className = "",
}: FloatingLinesProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const targetMouseRef = useRef(new Vector2(-1000, -1000));
  const currentMouseRef = useRef(new Vector2(-1000, -1000));
  const targetInfluenceRef = useRef(0);
  const currentInfluenceRef = useRef(0);
  const targetParallaxRef = useRef(new Vector2(0, 0));
  const currentParallaxRef = useRef(new Vector2(0, 0));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getLineCount = (waveType: Wave) => {
      if (typeof lineCount === "number") return lineCount;
      if (!enabledWaves.includes(waveType)) return 0;
      return lineCount[enabledWaves.indexOf(waveType)] ?? 6;
    };

    const getLineDistance = (waveType: Wave) => {
      if (typeof lineDistance === "number") return lineDistance;
      if (!enabledWaves.includes(waveType)) return 0.1;
      return lineDistance[enabledWaves.indexOf(waveType)] ?? 0.1;
    };

    const topLineCount = enabledWaves.includes("top") ? getLineCount("top") : 0;
    const middleLineCount = enabledWaves.includes("middle") ? getLineCount("middle") : 0;
    const bottomLineCount = enabledWaves.includes("bottom") ? getLineCount("bottom") : 0;

    let active = true;
    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;

    const renderer = new WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new Vector3(1, 1, 1) },
      animationSpeed: { value: animationSpeed },
      enableTop: { value: enabledWaves.includes("top") },
      enableMiddle: { value: enabledWaves.includes("middle") },
      enableBottom: { value: enabledWaves.includes("bottom") },
      topLineCount: { value: topLineCount },
      middleLineCount: { value: middleLineCount },
      bottomLineCount: { value: bottomLineCount },
      topLineDistance: { value: getLineDistance("top") * 0.01 },
      middleLineDistance: { value: getLineDistance("middle") * 0.01 },
      bottomLineDistance: { value: getLineDistance("bottom") * 0.01 },
      topWavePosition: {
        value: new Vector3(topWavePosition?.x ?? 10.0, topWavePosition?.y ?? 0.5, topWavePosition?.rotate ?? -0.4),
      },
      middleWavePosition: {
        value: new Vector3(middleWavePosition?.x ?? 5.0, middleWavePosition?.y ?? 0.0, middleWavePosition?.rotate ?? 0.2),
      },
      bottomWavePosition: {
        value: new Vector3(bottomWavePosition.x, bottomWavePosition.y, bottomWavePosition.rotate),
      },
      iMouse: { value: new Vector2(-1000, -1000) },
      interactive: { value: interactive },
      bendRadius: { value: bendRadius },
      bendStrength: { value: bendStrength },
      bendInfluence: { value: 0 },
      parallax: { value: parallax },
      parallaxStrength: { value: parallaxStrength },
      parallaxOffset: { value: new Vector2(0, 0) },
      lineGradient: {
        value: Array.from({ length: MAX_GRADIENT_STOPS }, () => new Vector3(1, 1, 1)),
      },
      lineGradientCount: { value: 0 },
      intensity: { value: intensity },
    };

    if (linesGradient?.length) {
      const stops = linesGradient.slice(0, MAX_GRADIENT_STOPS);
      uniforms.lineGradientCount.value = stops.length;
      stops.forEach((hex, index) => {
        uniforms.lineGradient.value[index].copy(hexToVec3(hex));
      });
    }

    const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader });
    const geometry = new PlaneGeometry(2, 2);
    scene.add(new Mesh(geometry, material));

    const clock = new Clock();
    const setSize = () => {
      if (!active) return;
      renderer.setSize(container.clientWidth || 1, container.clientHeight || 1, false);
      uniforms.iResolution.value.set(renderer.domElement.width, renderer.domElement.height, 1);
    };

    const resizeObserver = new ResizeObserver(setSize);
    resizeObserver.observe(container);
    setSize();

    const handlePointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const dpr = renderer.getPixelRatio();
      targetMouseRef.current.set(x * dpr, (rect.height - y) * dpr);
      targetInfluenceRef.current = 1;

      if (parallax) {
        targetParallaxRef.current.set(
          ((x - rect.width / 2) / rect.width) * parallaxStrength,
          (-(y - rect.height / 2) / rect.height) * parallaxStrength
        );
      }
    };

    const handlePointerLeave = () => {
      targetInfluenceRef.current = 0;
    };

    if (interactive) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerleave", handlePointerLeave);
    }

    let raf = 0;
    const renderLoop = () => {
      if (!active) return;

      uniforms.iTime.value = clock.getElapsedTime();
      currentMouseRef.current.lerp(targetMouseRef.current, mouseDamping);
      uniforms.iMouse.value.copy(currentMouseRef.current);
      currentInfluenceRef.current += (targetInfluenceRef.current - currentInfluenceRef.current) * mouseDamping;
      uniforms.bendInfluence.value = currentInfluenceRef.current;
      currentParallaxRef.current.lerp(targetParallaxRef.current, mouseDamping);
      uniforms.parallaxOffset.value.copy(currentParallaxRef.current);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    return () => {
      active = false;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [
    animationSpeed,
    bendRadius,
    bendStrength,
    bottomWavePosition,
    enabledWaves,
    interactive,
    intensity,
    lineCount,
    lineDistance,
    linesGradient,
    middleWavePosition,
    mouseDamping,
    parallax,
    parallaxStrength,
    topWavePosition,
  ]);

  return (
    <div
      ref={containerRef}
      className={`h-full w-full overflow-hidden ${className}`}
      style={{ mixBlendMode }}
    />
  );
}
