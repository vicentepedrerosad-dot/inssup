import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { writeFileSync, mkdirSync } from "fs";

// Fuentes pesadas del sistema (macOS)
GlobalFonts.registerFromPath("/System/Library/Fonts/Supplemental/Arial Black.ttf", "ArialBlack");
GlobalFonts.registerFromPath("/System/Library/Fonts/Supplemental/Arial Bold.ttf", "ArialBold");

mkdirSync("public/icons", { recursive: true });
mkdirSync("src/app", { recursive: true });

/** Dibuja el ícono INSSUP a tamaño S. mode: 'rounded' (esquinas transparentes) | 'square' (full-bleed). */
function drawIcon(S, mode) {
  const canvas = createCanvas(S, S);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, S, S);

  // Fondo
  ctx.save();
  if (mode === "rounded") {
    const r = S * 0.225;
    roundRect(ctx, 0, 0, S, S, r);
    ctx.clip();
  }
  const bg = ctx.createLinearGradient(0, 0, S, S);
  bg.addColorStop(0, "#12203a");
  bg.addColorStop(0.5, "#0b1526");
  bg.addColorStop(1, "#060a14");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, S, S);

  // Brillo azul superior (rim light)
  const rim = ctx.createLinearGradient(0, 0, 0, S * 0.5);
  rim.addColorStop(0, "rgba(59,130,246,0.35)");
  rim.addColorStop(1, "rgba(59,130,246,0)");
  ctx.fillStyle = rim;
  ctx.fillRect(0, 0, S, S * 0.5);
  ctx.restore();

  // Borde azul sutil (solo rounded)
  if (mode === "rounded") {
    ctx.save();
    roundRect(ctx, S * 0.012, S * 0.012, S - S * 0.024, S - S * 0.024, S * 0.21);
    ctx.lineWidth = S * 0.006;
    ctx.strokeStyle = "rgba(96,165,250,0.5)";
    ctx.stroke();
    ctx.restore();
  }

  // ===== "IN" azul italic pesado =====
  ctx.save();
  // slant italic
  ctx.translate(S * 0.5, S * 0.42);
  ctx.transform(1, 0, -0.2, 1, 0, 0);
  ctx.font = `${Math.round(S * 0.34)}px ArialBlack`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const inGrad = ctx.createLinearGradient(0, -S * 0.18, 0, S * 0.18);
  inGrad.addColorStop(0, "#5aa0ff");
  inGrad.addColorStop(0.55, "#2f6be0");
  inGrad.addColorStop(1, "#1b46b8");
  ctx.fillStyle = inGrad;
  // sombra/glow azul
  ctx.shadowColor = "rgba(37,99,235,0.55)";
  ctx.shadowBlur = S * 0.03;
  ctx.fillText("IN", -S * 0.05, 0);
  ctx.restore();

  // ===== Ondas de señal (gris) a la derecha =====
  ctx.save();
  const wcx = S * 0.605;
  const wcy = S * 0.4;
  const gg = ctx.createLinearGradient(wcx, wcy - S * 0.15, wcx + S * 0.2, wcy + S * 0.15);
  gg.addColorStop(0, "#e8ebf0");
  gg.addColorStop(1, "#6b7280");
  ctx.strokeStyle = gg;
  ctx.lineCap = "round";
  const radii = [0.085, 0.135, 0.185];
  radii.forEach((rf, i) => {
    ctx.beginPath();
    ctx.lineWidth = S * (0.03 - i * 0.003);
    ctx.arc(wcx, wcy, S * rf, -Math.PI / 3.1, Math.PI / 3.1);
    ctx.stroke();
  });
  ctx.restore();

  // ===== "INSSUP" + "LTDA." =====
  ctx.save();
  ctx.translate(S * 0.5, S * 0.72);
  ctx.transform(1, 0, -0.16, 1, 0, 0);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${Math.round(S * 0.12)}px ArialBlack`;
  ctx.fillStyle = "#f4f7fb";
  // letter-spacing manual
  drawTracked(ctx, "INSSUP", -S * 0.03, 0, S * 0.008);
  // LTDA
  ctx.font = `${Math.round(S * 0.046)}px ArialBold`;
  ctx.fillStyle = "#8b93a3";
  ctx.textAlign = "left";
  ctx.fillText("LTDA.", S * 0.3, S * 0.02);
  ctx.restore();

  return canvas;
}

function drawTracked(ctx, text, x, y, spacing) {
  const total = [...text].reduce((w, ch) => w + ctx.measureText(ch).width + spacing, -spacing);
  let cur = x - total / 2;
  ctx.textAlign = "left";
  for (const ch of text) {
    const w = ctx.measureText(ch).width;
    ctx.fillText(ch, cur, y);
    cur += w + spacing;
  }
  ctx.textAlign = "center";
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const out = (name, S, mode) => {
  const buf = drawIcon(S, mode).toBuffer("image/png");
  writeFileSync(name, buf);
  console.log("✓", name, `${S}px`, mode);
};

out("public/icons/icon-192.png", 192, "rounded");
out("public/icons/icon-512.png", 512, "rounded");
out("public/icons/maskable-192.png", 192, "square");
out("public/icons/maskable-512.png", 512, "square");
out("public/icons/apple-touch-icon.png", 180, "square");
out("src/app/apple-icon.png", 180, "square");
out("src/app/icon.png", 512, "rounded");
console.log("Listo.");
