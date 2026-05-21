import React, { useEffect, useRef, useState, useCallback } from "react";
import { useVintraLanguage } from "@/lib/i18n";

type Lang = "no" | "en";

interface Pt {
  sx: number;
  sy: number;
  color: string;
}

type GlobeSwitcherProps = {
  size?: number;
  style?: React.CSSProperties;
  glass?: boolean;
};

function angularDistance(a: number, b: number): number {
  let d = Math.abs(a - b) % (Math.PI * 2);
  return d > Math.PI ? Math.PI * 2 - d : d;
}

/**
 * UK / Great Britain flag config.
 *
 * Her kan du styre plassering og størrelse på fargene.
 */
const gbConfig = {
  centerX: 0,
  centerY: 0,

  whiteCrossHalfWidth: 0.18,
  redCrossHalfWidth: 0.085,

  whiteDiagHalfWidth: 0.23,
  redDiagHalfWidth: 0.095,

  diagOffset1: 0,
  diagOffset2: 0,

  scaleX: 1,
  scaleY: 1,
};

/**
 * UK flag as a color layer.
 *
 * Dette tegner ikke nye wires.
 * Det bestemmer bare hvilken farge hvert punkt på wireframen skal ha.
 */
function gbColor(u: number, v: number): string {
  const blue = "#012169";
  const white = "#FFFFFF";
  const red = "#CF142B";

  const {
    centerX,
    centerY,
    whiteCrossHalfWidth,
    redCrossHalfWidth,
    whiteDiagHalfWidth,
    redDiagHalfWidth,
    diagOffset1,
    diagOffset2,
    scaleX,
    scaleY,
  } = gbConfig;

  const x = ((u * 2 - 1) - centerX) * scaleX;
  const y = ((v * 2 - 1) - centerY) * scaleY;

  const absX = Math.abs(x);
  const absY = Math.abs(y);

  const d1 = Math.abs(x - y - diagOffset1);
  const d2 = Math.abs(x + y - diagOffset2);

  const inWhiteCross =
    absX < whiteCrossHalfWidth || absY < whiteCrossHalfWidth;

  const inRedCross =
    absX < redCrossHalfWidth || absY < redCrossHalfWidth;

  const inWhiteDiag =
    d1 < whiteDiagHalfWidth || d2 < whiteDiagHalfWidth;

  const inRedDiag =
    d1 < redDiagHalfWidth || d2 < redDiagHalfWidth;

  if (inRedCross) return red;
  if (inWhiteCross) return white;

  if (inRedDiag) return red;
  if (inWhiteDiag) return white;

  return blue;
}

/**
 * Norway flag config.
 */
const norwayConfig = {
  /**
   * Flytter vertikalt kors venstre/høyre rundt globen.
   */
  verticalCenterPhi: -0.54,

  /**
   * Flytter horisontalt kors opp/ned.
   */
  horizontalCenterY: 0.0008,

  /**
   * Bredde på hvit vertikal stripe.
   */
  verticalWhiteHalfWidth: 0.35,

  /**
   * Høyde på hvit horisontal stripe.
   */
  horizontalWhiteHalfHeight: 0.330,

  /**
   * Bredde på blå vertikal stripe.
   */
  verticalBlueHalfWidth: 0.20,

  /**
   * Høyde på blå horisontal stripe.
   */
  horizontalBlueHalfHeight: 0.210,
};

/**
 * Norway flag as a pure color layer.
 */
function norwayWireColor(phi: number, y0: number): string {
  const red = "#EF2B2D";
  const white = "#ffffff";
  const blue = "#00205B";

  const {
    verticalCenterPhi,
    horizontalCenterY,
    verticalWhiteHalfWidth,
    horizontalWhiteHalfHeight,
    verticalBlueHalfWidth,
    horizontalBlueHalfHeight,
  } = norwayConfig;

  const inWhiteVertical =
    angularDistance(phi, verticalCenterPhi) < verticalWhiteHalfWidth;

  const inBlueVertical =
    angularDistance(phi, verticalCenterPhi) < verticalBlueHalfWidth;

  const inWhiteHorizontal =
    Math.abs(y0 - horizontalCenterY) < horizontalWhiteHalfHeight;

  const inBlueHorizontal =
    Math.abs(y0 - horizontalCenterY) < horizontalBlueHalfHeight;

  if (inBlueVertical || inBlueHorizontal) return blue;
  if (inWhiteVertical || inWhiteHorizontal) return white;

  return red;
}

function getFlagColor(
  lang: Lang,
  phi: number,
  y0: number,
  x0: number
): string {
  if (lang === "no") {
    return norwayWireColor(phi, y0);
  }

  const u = Math.max(0, Math.min(1, 0.5 + x0 * 0.5));
  const v = Math.max(0, Math.min(1, 0.5 - y0 * 0.5));

  return gbColor(u, v);
}

function drawRun(
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
  from: number,
  to: number,
  color: string
) {
  if (to <= from) return;

  const draw = (lineWidth: number, alpha: number, blur: number) => {
    ctx.save();

    ctx.beginPath();
    ctx.moveTo(pts[from].sx, pts[from].sy);

    for (let i = from + 1; i <= to; i++) {
      ctx.lineTo(pts[i].sx, pts[i].sy);
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.globalAlpha = alpha;
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    ctx.restore();
  };

  // Tynnere glow, bedre for liten globe
  draw(2.2, 0.22, 8);

  // Tynnere mid-glow
  draw(1.1, 0.45, 4);

  // Tynn crisp wire
  draw(0.75, 1, 1.5);
}

function drawColoredLine(ctx: CanvasRenderingContext2D, pts: Pt[]) {
  if (pts.length < 2) return;

  let start = 0;

  for (let i = 1; i < pts.length; i++) {
    const previousColor = pts[i - 1].color;
    const currentColor = pts[i].color;

    if (previousColor !== currentColor) {
      drawRun(ctx, pts, start, i, previousColor);
      start = i;
    }
  }

  drawRun(ctx, pts, start, pts.length - 1, pts[start].color);
}

function drawGlobe(
  ctx: CanvasRenderingContext2D,
  R: number,
  CX: number,
  CY: number,
  spin: number,
  lang: Lang
) {
  const size = CX * 2;

  ctx.clearRect(0, 0, size, size);

  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, R, 0, Math.PI * 2);
  ctx.clip();

  const cosS = Math.cos(spin);
  const sinS = Math.sin(spin);

  /**
   * Litt større steg og færre wires gir mer luft.
   */
  const STEP = 1.1;

  /**
   * Før:
   * const nLat = 16;
   * const nLon = 36;
   *
   * Nå:
   * færre horisontale og vertikale wires.
   */
  const nLat = 10;
  const nLon = 22;

  const makePoint = (phi: number, lat: number): Pt | null => {
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);

    const x0 = cosLat * Math.sin(phi);
    const y0 = sinLat;
    const z0 = cosLat * Math.cos(phi);

    const xr = x0 * cosS + z0 * sinS;
    const zr = -x0 * sinS + z0 * cosS;

    // Only draw front-facing wires
    if (zr <= 0) return null;

    const sx = CX + xr * R;
    const sy = CY - y0 * R;

    const color = getFlagColor(lang, phi, y0, x0);

    return { sx, sy, color };
  };

  /**
   * Horizontal wires / latitudes.
   */
  for (let li = 1; li < nLat; li++) {
    const lat = (-90 + li * (180 / nLat)) * (Math.PI / 180);

    let pts: Pt[] = [];

    for (let deg = 0; deg <= 360; deg += STEP) {
      const phi = deg * (Math.PI / 180);
      const pt = makePoint(phi, lat);

      if (!pt) {
        drawColoredLine(ctx, pts);
        pts = [];
        continue;
      }

      pts.push(pt);
    }

    drawColoredLine(ctx, pts);
  }

  /**
   * Vertical wires / meridians.
   */
  for (let li = 0; li < nLon; li++) {
    const phi = (li / nLon) * Math.PI * 2;

    let pts: Pt[] = [];

    for (let deg = -90; deg <= 90; deg += STEP) {
      const lat = deg * (Math.PI / 180);
      const pt = makePoint(phi, lat);

      if (!pt) {
        drawColoredLine(ctx, pts);
        pts = [];
        continue;
      }

      pts.push(pt);
    }

    drawColoredLine(ctx, pts);
  }

  ctx.restore();

  // Outer ring glow
  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, R, 0, Math.PI * 2);
  ctx.strokeStyle =
    lang === "no" ? "rgba(239,43,45,0.55)" : "rgba(70,120,255,0.55)";
  ctx.lineWidth = Math.max(0.7, R * 0.018);
  ctx.shadowColor = lang === "no" ? "#EF2B2D" : "#3E7BFF";
  ctx.shadowBlur = Math.max(5, R * 0.16);
  ctx.stroke();
  ctx.restore();

  // Clean inner rim
  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, R - 0.8, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.24)";
  ctx.lineWidth = Math.max(0.5, R * 0.01);
  ctx.stroke();
  ctx.restore();
}

export default function GlobeSwitcher({
  size = 72,
  style,
  glass = true,
}: GlobeSwitcherProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spinRef = useRef(0);
  const { language, setLanguage } = useVintraLanguage();
  const langRef = useRef<Lang>(language);

  const [lang, setLang] = useState<Lang>(language);
  const [spinning, setSpinning] = useState(false);

  const draw = useCallback(
    (overrideLang?: Lang) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const cssSize = size;

      if (canvas.width !== cssSize * dpr || canvas.height !== cssSize * dpr) {
        canvas.width = cssSize * dpr;
        canvas.height = cssSize * dpr;
        canvas.style.width = `${cssSize}px`;
        canvas.style.height = `${cssSize}px`;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const center = cssSize / 2;

      /**
       * Litt mindre radius gir mer luft rundt globen.
       */
      const radius = cssSize * 0.42;

      drawGlobe(
        ctx,
        radius,
        center,
        center,
        spinRef.current,
        overrideLang ?? langRef.current
      );
    },
    [size]
  );

  useEffect(() => {
    langRef.current = language;
    setLang(language);
    draw(language);

    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [draw, language]);

  const doSpin = useCallback(
    (toLang: Lang) => {
      if (spinning) return;

      setSpinning(true);

      const fromLang = langRef.current;
      const start = spinRef.current;
      const end = start + Math.PI;
      const duration = 850;
      const startTime = performance.now();

      const frame = (now: number) => {
        const p = Math.min(1, (now - startTime) / duration);

        const ease =
          p < 0.5
            ? 4 * p * p * p
            : 1 - Math.pow(-2 * p + 2, 3) / 2;

        spinRef.current = start + ease * (end - start);

        const activeLang = ease < 0.5 ? fromLang : toLang;
        draw(activeLang);

        if (p < 1) {
          requestAnimationFrame(frame);
        } else {
          spinRef.current = end;
          langRef.current = toLang;
          setLang(toLang);
          setLanguage(toLang);
          setSpinning(false);
          draw(toLang);
        }
      };

      requestAnimationFrame(frame);
    },
    [draw, spinning]
  );

  const handleGlobeClick = () => {
    if (!spinning) {
      doSpin(lang === "no" ? "en" : "no");
    }
  };

  const labelSize = Math.max(16, size * 0.14);

  return (
  <div
    style={{
      display: "inline-flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: Math.max(2, size * 0.04),
      padding: 0,
      margin: 0,
      fontFamily: "'DM Mono', 'Fira Mono', monospace",
      lineHeight: 1,
      ...style,
    }}
  >
    <div
      onClick={handleGlobeClick}
      style={{
        width: `${size + 8}px`,
        height: `${size + 8}px`,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: spinning ? "default" : "pointer",
        background: glass
          ? "rgba(255, 255, 255, 0.16)"
          : "transparent",
        boxShadow: glass
          ? "0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(255, 255, 255, 0.1), inset 0 0 6px 3px rgba(255, 255, 255, 0.3)"
          : "none",
        border: glass ? "1px solid rgba(255, 255, 255, 0.3)" : "0",
        backdropFilter: glass ? "blur(5px)" : "none",
        WebkitBackdropFilter: glass ? "blur(5px)" : "none",
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.16s ease, filter 0.16s ease",
        filter: spinning ? "brightness(1.12)" : "brightness(1)",
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "scale(0.96)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {glass ? (
        <>
          <span
            aria-hidden="true"
            style={{
              content: "''",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "1px",
              borderRadius: "50%",
              background:
                "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)",
              pointerEvents: "none",
            }}
          />
          <span
            aria-hidden="true"
            style={{
              content: "''",
              position: "absolute",
              top: 0,
              left: 0,
              width: "1px",
              height: "100%",
              borderRadius: "50%",
              background:
                "linear-gradient(180deg, rgba(255, 255, 255, 0.8), transparent, rgba(255, 255, 255, 0.3))",
              pointerEvents: "none",
            }}
          />
        </>
      ) : null}

      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          background: "radial-gradient(circle at center, rgba(15,23,42,0.24), rgba(15,23,42,0.04))",
          pointerEvents: "none",
        }}
      />
    </div>

    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "2px",
        fontSize: `${labelSize}px`,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      <button
        type="button"
        aria-label="Bytt språk til norsk"
        onClick={() => {
          if (spinning || lang === "no") return;
          setLanguage("no");
          doSpin("no");
        }}
        style={{
          border: 0,
          padding: 0,
          margin: 0,
          background: "transparent",
          color: lang === "no" ? "#3B82F6" : "#888780",
          cursor: lang === "no" || spinning ? "default" : "pointer",
          font: "inherit",
          lineHeight: 1,
          letterSpacing: "inherit",
          textTransform: "inherit",
        }}
      >
        NO
      </button>

      <span
        aria-hidden="true"
        style={{
          color: "#888780",
        }}
      >
        /
      </span>

      <button
        type="button"
        aria-label="Switch language to English"
        onClick={() => {
          if (spinning || lang === "en") return;
          setLanguage("en");
          doSpin("en");
        }}
        style={{
          border: 0,
          padding: 0,
          margin: 0,
          background: "transparent",
          color: lang === "en" ? "#3B82F6" : "#888780",
          cursor: lang === "en" || spinning ? "default" : "pointer",
          font: "inherit",
          lineHeight: 1,
          letterSpacing: "inherit",
          textTransform: "inherit",
        }}
      >
        EN
      </button>
    </div>
  </div>
);
}
