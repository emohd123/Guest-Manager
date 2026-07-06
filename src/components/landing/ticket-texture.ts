// Shared canvas textures for the 3D event-space scene. Pure 2D-canvas drawing
// (no network) -> fully offline. Callers wrap the returned canvas in a
// THREE.CanvasTexture.
import QRCode from "qrcode";

type QrPalette = {
  dark?: string;
  light?: string;
  /** When set, renders a real, scannable QR encoding this value. */
  text?: string;
};

/** A Stone-style branded ticket face matching the homepage reference pass. */
export function makeTicketCanvas(): HTMLCanvasElement {
  const w = 1200;
  const h = 768;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;

  ctx.clearRect(0, 0, w, h);

  // Deep premium background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, w, h);
  bgGrad.addColorStop(0, "#080a14");
  bgGrad.addColorStop(0.5, "#0e122b");
  bgGrad.addColorStop(1, "#04050a");
  ctx.fillStyle = bgGrad;
  roundRect(ctx, 0, 0, w, h, 44);
  ctx.fill();

  ctx.save();
  roundRect(ctx, 0, 0, w, h, 44);
  ctx.clip();

  // Draw futuristic grid lines
  ctx.strokeStyle = "rgba(124, 58, 237, 0.08)"; // subtle purple
  ctx.lineWidth = 1;
  const gridSize = 48;
  for (let x = 0; x < w; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Draw cybernetic details (lines & circles)
  ctx.strokeStyle = "rgba(37, 99, 235, 0.15)"; // subtle blue
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(30, 30);
  ctx.lineTo(150, 30);
  ctx.moveTo(30, 30);
  ctx.lineTo(30, 150);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(w - 30, 30);
  ctx.lineTo(w - 150, 30);
  ctx.moveTo(w - 30, 30);
  ctx.lineTo(w - 30, 150);
  ctx.stroke();

  // Subtly lighter header area
  const headerGrad = ctx.createRadialGradient(400, 150, 50, 600, 150, 600);
  headerGrad.addColorStop(0, "rgba(124, 58, 237, 0.25)"); // purple glow
  headerGrad.addColorStop(0.6, "rgba(37, 99, 235, 0.08)"); // blue glow
  headerGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = headerGrad;
  ctx.fillRect(0, 0, w, 318);

  // Glowing divider line between header and body
  const divGrad = ctx.createLinearGradient(0, 0, w, 0);
  divGrad.addColorStop(0, "rgba(37, 99, 235, 0)");
  divGrad.addColorStop(0.2, "rgba(37, 99, 235, 0.8)");
  divGrad.addColorStop(0.5, "rgba(219, 39, 119, 0.8)");
  divGrad.addColorStop(0.8, "rgba(124, 58, 237, 0.8)");
  divGrad.addColorStop(1, "rgba(124, 58, 237, 0)");
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(30, 318);
  ctx.lineTo(w - 30, 318);
  ctx.stroke();

  // Draw Logo (using mask color matching the header gradient background)
  drawStoneLogo(ctx, 160, 65, 230, "#0e1124"); 

  // Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 88px Arial";
  ctx.fillText("Events Hub", 440, 160);

  // Subtitle
  ctx.font = "600 28px Arial";
  ctx.fillStyle = "#7c3aed"; // OneStone purple
  ctx.fillText("A ONESTONE PLATFORM", 440, 215);

  // Draw VIP Ribbon / Badge
  ctx.save();
  ctx.translate(w - 180, 50);
  // Gold badge
  const badgeGrad = ctx.createLinearGradient(0, 0, 120, 120);
  badgeGrad.addColorStop(0, "#ffe066");
  badgeGrad.addColorStop(0.5, "#d4af37");
  badgeGrad.addColorStop(1, "#996515");
  ctx.fillStyle = badgeGrad;
  roundRect(ctx, 0, 0, 130, 50, 12);
  ctx.fill();

  ctx.fillStyle = "#06070a";
  ctx.font = "900 22px Arial";
  ctx.fillText("VIP PASS", 15, 33);
  ctx.restore();

  // Fields (with glowing color scheme)
  drawField(ctx, "EVENT", "GALA 2026", 60, 385, "#a2b2ee", "#ffffff");
  drawField(ctx, "DATE & TIME", "March 7, 2026\n08:00 PM", 360, 385, "#a2b2ee", "#ffffff");
  drawField(ctx, "PASS TYPE", "ALL ACCESS VIP", 700, 385, "#a2b2ee", "#d4af37"); // VIP in Gold

  drawField(ctx, "VENUE", "OneStone Grand Hall\nLondon, UK", 60, 515, "#a2b2ee", "#ffffff");
  drawField(ctx, "ATTENDEE", "ALEX RIVERA", 360, 515, "#a2b2ee", "#ffffff");

  // QR Code with glowing cyan pixels on dark background (real, scannable)
  drawQr(ctx, 1000, 375, 140, 19, {
    dark: "#00f0ff",
    light: "#0b0d1e",
    text: "https://app.eventshub.com/t/9021882",
  });
  ctx.fillStyle = "#8b9bb4";
  ctx.font = "600 14px Arial";
  ctx.fillText("PASS ID: 9021882", 1005, 545);

  // Bottom Divider
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, 615);
  ctx.lineTo(940, 615);
  ctx.stroke();

  // Visitor portal info
  ctx.fillStyle = "#ffe066"; // Gold
  ctx.font = "800 16px Arial";
  ctx.fillText("VISITOR PORTAL CODE", 60, 655);
  ctx.font = "900 32px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("0 8 1 9 C X 7 2", 60, 700);

  ctx.fillStyle = "#8b9bb4";
  ctx.font = "600 14px Arial";
  ctx.fillText("Scan QR or enter code in visitor app for real-time schedule & updates", 60, 732);

  // App download QR (real, scannable)
  drawQr(ctx, 848, 635, 64, 31, {
    dark: "#00f0ff",
    light: "#0b0d1e",
    text: "https://app.eventshub.com/download",
  });
  ctx.fillStyle = "#8b9bb4";
  ctx.font = "600 13px Arial";
  ctx.fillText("DOWNLOAD APP", 823, 725);

  // Draw translucent diagonal glass sheen across the whole ticket
  const sheenGrad = ctx.createLinearGradient(0, 0, w, h);
  sheenGrad.addColorStop(0, "rgba(255,255,255,0.0)");
  sheenGrad.addColorStop(0.35, "rgba(255,255,255,0.0)");
  sheenGrad.addColorStop(0.4, "rgba(255,255,255,0.12)"); // shine
  sheenGrad.addColorStop(0.45, "rgba(255,255,255,0.0)");
  sheenGrad.addColorStop(1, "rgba(255,255,255,0.0)");
  ctx.fillStyle = sheenGrad;
  ctx.fillRect(0, 0, w, h);

  ctx.restore();

  // Glowing Outer Border
  const borderGrad = ctx.createLinearGradient(0, 0, w, h);
  borderGrad.addColorStop(0, "rgba(37, 99, 235, 0.4)");   // blue
  borderGrad.addColorStop(0.5, "rgba(219, 39, 119, 0.4)"); // pink
  borderGrad.addColorStop(1, "rgba(124, 58, 237, 0.4)");   // purple
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 4;
  roundRect(ctx, 2, 2, w - 4, h - 4, 44);
  ctx.stroke();

  return c;
}

export function makeTicketBackCanvas(): HTMLCanvasElement {
  const w = 1200;
  const h = 768;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;

  ctx.clearRect(0, 0, w, h);

  // Background
  const bgGrad = ctx.createLinearGradient(w, h, 0, 0);
  bgGrad.addColorStop(0, "#06070c");
  bgGrad.addColorStop(0.5, "#0b0d1e");
  bgGrad.addColorStop(1, "#18132e");
  ctx.fillStyle = bgGrad;
  roundRect(ctx, 0, 0, w, h, 44);
  ctx.fill();

  ctx.save();
  roundRect(ctx, 0, 0, w, h, 44);
  ctx.clip();

  // Grid
  ctx.strokeStyle = "rgba(124, 58, 237, 0.08)";
  ctx.lineWidth = 1;
  const gridSize = 48;
  for (let x = 0; x < w; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Radial Brand Glow
  const glow = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, 400);
  glow.addColorStop(0, "rgba(219, 39, 119, 0.2)");
  glow.addColorStop(0.5, "rgba(124, 58, 237, 0.1)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // Logo in Center
  drawStoneLogo(ctx, 485, 240, 230, "#0b0d1e"); 

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 96px Arial";
  // Center align text
  ctx.textAlign = "center";
  ctx.fillText("Events Hub", w / 2, 520);
  
  ctx.fillStyle = "#7c3aed";
  ctx.font = "800 28px Arial";
  ctx.fillText("A ONESTONE PLATFORM", w / 2, 575);
  
  // Reset text align for other canvas draws
  ctx.textAlign = "left";

  // Draw translucent glass sheen
  const sheenGrad = ctx.createLinearGradient(0, 0, w, h);
  sheenGrad.addColorStop(0, "rgba(255,255,255,0.0)");
  sheenGrad.addColorStop(0.4, "rgba(255,255,255,0.05)");
  sheenGrad.addColorStop(0.45, "rgba(255,255,255,0.12)");
  sheenGrad.addColorStop(0.5, "rgba(255,255,255,0.0)");
  sheenGrad.addColorStop(1, "rgba(255,255,255,0.0)");
  ctx.fillStyle = sheenGrad;
  ctx.fillRect(0, 0, w, h);

  ctx.restore();

  // Border
  const borderGrad = ctx.createLinearGradient(w, h, 0, 0);
  borderGrad.addColorStop(0, "rgba(37, 99, 235, 0.4)");
  borderGrad.addColorStop(0.5, "rgba(219, 39, 119, 0.4)");
  borderGrad.addColorStop(1, "rgba(124, 58, 237, 0.4)");
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 4;
  roundRect(ctx, 2, 2, w - 4, h - 4, 44);
  ctx.stroke();

  return c;
}

/** A standalone faux-QR panel on a dark rounded card with a coral frame. */
export function makeQrCanvas(seed = 11): HTMLCanvasElement {
  const s = 512;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const ctx = c.getContext("2d")!;

  ctx.fillStyle = "#07080f";
  ctx.fillRect(0, 0, s, s);

  // Glow border
  ctx.strokeStyle = "#00f0ff";
  ctx.lineWidth = 8;
  ctx.strokeRect(16, 16, s - 32, s - 32);

  // Header text
  ctx.fillStyle = "#7c3aed";
  ctx.font = "900 32px Arial";
  ctx.textAlign = "center";
  ctx.fillText("SCAN TO ENTER", s / 2, 80);
  ctx.textAlign = "left";

  const pad = 90;
  // Real, scannable glowing tech QR
  drawQr(ctx, pad, pad + 28, s - 2 * pad, seed, {
    dark: "#00f0ff",
    light: "#0b0d1e",
    text: "https://app.eventshub.com/scan",
  });

  return c;
}

/**
 * Draw a QR into a context. When `palette.text` is set, renders a REAL scannable
 * QR (via the `qrcode` lib); otherwise falls back to a deterministic faux matrix.
 */
function drawQr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  seedInit: number,
  palette: QrPalette = {}
) {
  const light = palette.light ?? "#ffffff";
  const dark = palette.dark ?? "#0e1326";
  ctx.fillStyle = light;
  ctx.fillRect(x - 10, y - 10, size + 20, size + 20);
  ctx.fillStyle = dark;

  if (palette.text) {
    // Real, scannable QR.
    const qr = QRCode.create(palette.text, { errorCorrectionLevel: "M" });
    const n = qr.modules.size;
    const data = qr.modules.data;
    const cell = size / n;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (data[r * n + c]) {
          ctx.fillRect(x + c * cell, y + r * cell, Math.ceil(cell), Math.ceil(cell));
        }
      }
    }
    return;
  }

  // Faux fallback.
  const cells = 15;
  const cell = size / cells;
  let seed = seedInit;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let gy = 0; gy < cells; gy++) {
    for (let gx = 0; gx < cells; gx++) {
      const corner =
        (gx < 4 && gy < 4) || (gx >= cells - 4 && gy < 4) || (gx < 4 && gy >= cells - 4);
      if (corner ? gx % 3 !== 1 || gy % 3 !== 1 : rnd() > 0.5) {
        ctx.fillRect(x + gx * cell, y + gy * cell, cell - 1, cell - 1);
      }
    }
  }
}

function drawField(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: string,
  x: number,
  y: number,
  labelColor = "#d4ad17",
  valueColor = "#0e1118"
) {
  ctx.fillStyle = labelColor;
  ctx.font = "900 15px Arial";
  ctx.fillText(label, x, y);
  ctx.fillStyle = valueColor;
  ctx.font = "800 24px Arial";
  value.split("\n").forEach((line, index) => ctx.fillText(line, x, y + 39 + index * 29));
}

function drawStoneLogo(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, bgHex = "#151b31") {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale / 315, scale / 315);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const pink = ctx.createLinearGradient(0, 0, 145, 135);
  pink.addColorStop(0, "#d93c8e");
  pink.addColorStop(1, "#b936a6");
  ctx.strokeStyle = pink;
  ctx.lineWidth = 24;
  ctx.beginPath();
  ctx.arc(72, 72, 58, Math.PI * 0.52, Math.PI * 1.5, false);
  ctx.lineTo(136, 128);
  ctx.stroke();

  const cyan = ctx.createLinearGradient(142, 16, 292, 132);
  cyan.addColorStop(0, "#ba37ad");
  cyan.addColorStop(0.58, "#aa38b8");
  cyan.addColorStop(1, "#21bac4");
  ctx.strokeStyle = cyan;
  ctx.lineWidth = 17;
  ctx.beginPath();
  ctx.arc(208, 72, 58, Math.PI * 1.47, Math.PI * 0.5, false);
  ctx.stroke();

  ctx.fillStyle = bgHex;
  ctx.fillRect(98, 52, 96, 41);
  ctx.fillStyle = "#c7c9cd";
  ctx.fillRect(130, 62, 85, 20);
  ctx.fillRect(174, 36, 20, 70);
  ctx.fillStyle = bgHex;
  ctx.fillRect(146, 57, 36, 30);

  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
