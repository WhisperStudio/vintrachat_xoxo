// @ts-nocheck
import { useEffect, useRef, useState, useMemo, type CSSProperties, type MouseEventHandler, type SVGProps } from 'react';

const glyphPointCache = new Map();

type GlassOrbAvatarProps = SVGProps<SVGSVGElement> & {
  sender?: unknown;
  isTyping?: boolean;
  maintenance?: boolean;
  style?: CSSProperties;
  className?: string;
  size?: number | string;
  skin?: string;
  glyph?: string;
  glyphFont?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
  isOpen?: boolean;
  variant?: string;
  interactive?: boolean;
  forceState?: string | null;
  forceGlyphReveal?: boolean;
  hideRingParticles?: boolean;
  orbMode?: 'spin' | 'hover' | 'reply' | 'inactive';
}

const GlassOrbAvatar = ({
  sender,
  isTyping,
  maintenance = false,
  style,
  className,
  size = '100%',
  skin = 'default',
  glyph = 'A',
  glyphFont = 'Times New Roman',
  onClick,
  isOpen = false,
  variant = 'default',
  interactive = true,
  forceState = null,
  forceGlyphReveal = false,
  hideRingParticles = false,
  orbMode = 'spin',
}: GlassOrbAvatarProps) => {
  const [, setIsHovered] = useState(false);
  const mouseRef = useRef({ x: null, y: null });
  const hoveredRef = useRef(false);
  const colorStateRef = useRef('idle');
  const skinRef = useRef(skin);
  const orbModeRef = useRef(orbMode);
  const debugFrameRef = useRef(0);
  const debugLastModeRef = useRef<string | null>(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationRef = useRef(null);

  const [colorState, setColorState] = useState('idle');

  const colorPalettes = useMemo(
    () => ({
      idle: [
        { r: 0, g: 255, b: 255 },
        { r: 0, g: 240, b: 190 },
        { r: 50, g: 255, b: 255 },
        { r: 0, g: 200, b: 255 },
        { r: 0, g: 255, b: 180 },
        { r: 100, g: 255, b: 255 },
      ],
      maintenance: [
        { r: 255, g: 193, b: 7 },
        { r: 245, g: 158, b: 11 },
        { r: 255, g: 140, b: 0 },
        { r: 96, g: 165, b: 250 },
        { r: 59, g: 130, b: 246 },
        { r: 129, g: 140, b: 248 },
      ],
      typing: [
        { r: 50, g: 220, b: 50 },
        { r: 70, g: 240, b: 70 },
        { r: 100, g: 255, b: 100 },
      ],
      listening: [
        { r: 255, g: 50, b: 50 },
        { r: 255, g: 80, b: 80 },
        { r: 255, g: 120, b: 120 },
      ],
    }),
    []
  );

  useEffect(() => {
    if (forceState) {
      setColorState(forceState);
      return;
    }

    if (maintenance) {
      setColorState('maintenance');
      return;
    }

    if (isTyping) setColorState(sender === 'user' ? 'typing' : 'listening');
    else setColorState('idle');
  }, [isTyping, sender, maintenance, forceState]);

  useEffect(() => {
    colorStateRef.current = colorState;
  }, [colorState]);

  useEffect(() => {
    skinRef.current = skin;
  }, [skin]);

  useEffect(() => {
    orbModeRef.current = orbMode;
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[GlassOrbAvatar] orbMode changed', orbMode);
    }
  }, [orbMode]);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    const baseCanvas = document.createElement('canvas');
    const baseCtx = baseCanvas.getContext('2d', { alpha: true });

    let sizePx = 0;
    let dpr = 1;

    let centerX = 0;
    let centerY = 0;

    let orbRadius = 0;

    let casingOuter = 0;
    let casingInner = 0;

    let ringOuter = 0;
    let ringInner = 0;

    let centerRadius = 0;

    const portal = {
      rimStroke: 'rgba(175, 185, 200, 0.70)',
      rimGlow: 'rgba(110, 130, 155, 0.35)',
      casing1: 'rgba(10, 12, 18, 1)',
      casing2: 'rgba(18, 22, 32, 1)',
      deep1: 'rgba(6, 8, 14, 1)',
      deep2: 'rgba(10, 13, 22, 1)',
      deep3: 'rgba(14, 20, 40, 1)',
    };

    const clampDpr = () => {
      const raw = window.devicePixelRatio || 1;
      if (sizePx < 260) return Math.min(raw, 1);
      return Math.min(raw, 1.2);
    };

    function drawPortalBase(targetCtx) {
      if (!targetCtx) return;

      const g = targetCtx.createRadialGradient(centerX, centerY, orbRadius * 0.08, centerX, centerY, orbRadius);
      g.addColorStop(0, portal.deep2);
      g.addColorStop(0.55, portal.deep3);
      g.addColorStop(1, portal.deep1);

      targetCtx.clearRect(0, 0, sizePx, sizePx);
      targetCtx.fillStyle = g;
      targetCtx.beginPath();
      targetCtx.arc(centerX, centerY, casingOuter, 0, Math.PI * 2);
      targetCtx.fill();

      targetCtx.save();
      const cg = targetCtx.createRadialGradient(centerX, centerY, casingInner, centerX, centerY, casingOuter);
      cg.addColorStop(0, portal.casing2);
      cg.addColorStop(1, portal.casing1);

      targetCtx.fillStyle = cg;
      targetCtx.beginPath();
      targetCtx.arc(centerX, centerY, casingOuter, 0, Math.PI * 2);
      targetCtx.arc(centerX, centerY, casingInner, 0, Math.PI * 2, true);
      targetCtx.fill('evenodd');
      targetCtx.restore();

      targetCtx.save();
      const dg = targetCtx.createRadialGradient(centerX, centerY, centerRadius * 0.05, centerX, centerY, centerRadius);
      dg.addColorStop(0, portal.deep3);
      dg.addColorStop(0.65, portal.deep2);
      dg.addColorStop(1, portal.deep1);

      targetCtx.fillStyle = dg;
      targetCtx.beginPath();
      targetCtx.arc(centerX, centerY, centerRadius, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.restore();

      targetCtx.save();
      targetCtx.shadowBlur = 18 * (sizePx / 500);
      targetCtx.shadowColor = portal.rimGlow;
      targetCtx.strokeStyle = portal.rimStroke;
      targetCtx.lineWidth = Math.max(2, sizePx / 140);
      targetCtx.beginPath();
      targetCtx.arc(centerX, centerY, casingOuter - targetCtx.lineWidth * 0.5, 0, Math.PI * 2);
      targetCtx.stroke();
      targetCtx.restore();
    }

    const updateDimensions = () => {
      sizePx = Math.min(container.offsetWidth, container.offsetHeight);
      dpr = clampDpr();

      canvas.width = Math.floor(sizePx * dpr);
      canvas.height = Math.floor(sizePx * dpr);
      canvas.style.width = `${sizePx}px`;
      canvas.style.height = `${sizePx}px`;

      baseCanvas.width = Math.floor(sizePx * dpr);
      baseCanvas.height = Math.floor(sizePx * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (baseCtx) {
        baseCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      centerX = sizePx / 2;
      centerY = sizePx / 2;

      orbRadius = sizePx / 2;

      casingOuter = orbRadius * 0.995;
      casingInner = orbRadius * 0.9;

      ringOuter = orbRadius * 0.95;
      ringInner = orbRadius * 0.5;

      centerRadius = ringInner * 0.985;
      refreshGlyphTargets();

      drawPortalBase(baseCtx);
    };

    let colorIndex = 0;
    let colorProgress = 0;
    let frame = 0;
    let isVisible = true;
    let visibilityObserver = null;

    let currentPalette = colorPalettes[colorStateRef.current].map((c) => ({ ...c }));
    let targetPalette = colorPalettes[colorStateRef.current].map((c) => ({ ...c }));
    let paletteT = 1;

    const getRingColorRGB = (offset = 0) => {
      const cols = currentPalette.map((cur, i) => {
        const tgt = targetPalette[i] || targetPalette[targetPalette.length - 1];
        return {
          r: Math.floor(cur.r + (tgt.r - cur.r) * paletteT),
          g: Math.floor(cur.g + (tgt.g - cur.g) * paletteT),
          b: Math.floor(cur.b + (tgt.b - cur.b) * paletteT),
        };
      });

      const base = (colorIndex + offset) % cols.length;
      const a = cols[base];
      const b = cols[(base + 1) % cols.length];

      return {
        r: Math.floor(a.r + (b.r - a.r) * colorProgress),
        g: Math.floor(a.g + (b.g - a.g) * colorProgress),
        b: Math.floor(a.b + (b.b - a.b) * colorProgress),
      };
    };

    const rgba = (c, a) => `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;
    const mix = (a, b, t) => a + (b - a) * t;
    const mixRGB = (a, b, t) => ({
      r: Math.round(mix(a.r, b.r, t)),
      g: Math.round(mix(a.g, b.g, t)),
      b: Math.round(mix(a.b, b.b, t)),
    });

    const buildGlyphPoints = (char) => {
      const normalizedChar = char?.slice(0, 1) || '';
      if (!normalizedChar.trim()) {
        return [];
      }

      const cacheKey = `${glyphFont}::${normalizedChar}`;
      const cached = glyphPointCache.get(cacheKey);
      if (cached) return cached;

      const off = document.createElement('canvas');
      const offSize = 220;
      off.width = offSize;
      off.height = offSize;

      const octx = off.getContext('2d');
      if (!octx) return [{ x: 0, y: 0 }];

      octx.clearRect(0, 0, offSize, offSize);
      octx.fillStyle = 'black';
      octx.fillRect(0, 0, offSize, offSize);

      const fontSize = 170;
      octx.font = `900 ${fontSize}px ${glyphFont}`;
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      octx.fillStyle = 'white';
      octx.fillText(normalizedChar, offSize / 2, offSize / 2 + 6);

      const img = octx.getImageData(0, 0, offSize, offSize).data;

      const step = 2;
      const threshold = 45;
      const pts = [];

      for (let y = 0; y < offSize; y += step) {
        for (let x = 0; x < offSize; x += step) {
          const i = (y * offSize + x) * 4;
          const r = img[i];
          const g = img[i + 1];
          const b = img[i + 2];
          const brightness = (r + g + b) / 3;

          if (brightness > 255 - threshold) {
            const nx = (x / offSize) * 2 - 1;
            const ny = (y / offSize) * 2 - 1;
            const glyphScale = 1.7;
            pts.push({ x: nx * glyphScale, y: ny * glyphScale });
          }
        }
      }

      const result = pts.length ? pts : [];
      glyphPointCache.set(cacheKey, result);
      return result;
    };

    const runeNorm = buildGlyphPoints(glyph);
    const hasGlyph = runeNorm.length > 0;

    const runeTargets = () => {
      if (!hasGlyph) return [];

      const radius = centerRadius * 0.78;
      return runeNorm.map((p) => ({
        tx: centerX + p.x * radius,
        ty: centerY + p.y * radius,
      }));
    };

    let ringParticles = [];
    let glyphTargets = [];
    let morphBlend = 0;
    let morphState = 'spin';

    function refreshGlyphTargets() {
      glyphTargets = runeTargets();
    }

    updateDimensions();

    const initRingParticles = () => {
      const count = 80 + Math.floor(Math.random() * 21);
      ringParticles = new Array(count).fill(0).map((_, index) => new RingParticle(index, count));
    };

    class RingParticle {
      constructor(index, count) {
        this.index = index;
        this.count = count;
        this.radius = ringInner + Math.random() * (ringOuter - ringInner);
        this.angle = Math.random() * Math.PI * 2;
        this.speed = (Math.random() * 0.01 + 0.004) * (Math.random() < 0.5 ? 1 : -1);
        this.size = (Math.random() * 1.8 + 2.6) * (sizePx / 320);
        this.colorOffset = (Math.random() * 9999) | 0;
        this.prevX = null;
        this.prevY = null;
        this.x = centerX + Math.cos(this.angle) * this.radius;
        this.y = centerY + Math.sin(this.angle) * this.radius;
        this.homeX = this.x;
        this.homeY = this.y;
        this.enterX = this.x;
        this.enterY = this.y;
        this.exitX = this.x;
        this.exitY = this.y;
        this.transitionState = 'spin';
        this.morphFromX = this.x;
        this.morphFromY = this.y;
        this.morphToX = this.x;
        this.morphToY = this.y;
      }

      update(speedMul, blend, state) {
        const orbitX = centerX + Math.cos(this.angle) * this.radius;
        const orbitY = centerY + Math.sin(this.angle) * this.radius;
        const targetIndex = glyphTargets.length
          ? Math.floor((this.index / Math.max(1, this.count - 1)) * Math.max(1, glyphTargets.length - 1))
          : 0;
        const target = glyphTargets.length ? glyphTargets[targetIndex] : null;

        this.prevX = this.x;
        this.prevY = this.y;

        if (state === 'enter') {
          if (this.transitionState !== 'enter') {
            this.homeX = orbitX;
            this.homeY = orbitY;
            this.morphFromX = this.prevX ?? orbitX;
            this.morphFromY = this.prevY ?? orbitY;
            this.morphToX = target ? target.tx : orbitX;
            this.morphToY = target ? target.ty : orbitY;
          }

          const enterT = blend * blend * (3 - 2 * blend);
          this.enterX = this.morphFromX;
          this.enterY = this.morphFromY;
          this.exitX = this.morphToX;
          this.exitY = this.morphToY;
          this.x = mix(this.morphFromX, this.morphToX, enterT);
          this.y = mix(this.morphFromY, this.morphToY, enterT);
        } else if (state === 'leave') {
          if (this.transitionState !== 'leave') {
            this.morphFromX = this.prevX ?? this.x ?? orbitX;
            this.morphFromY = this.prevY ?? this.y ?? orbitY;
            this.morphToX = this.homeX;
            this.morphToY = this.homeY;
          }

          const leaveT = 1 - blend;
          const leaveEase = leaveT * leaveT * (3 - 2 * leaveT);
          this.enterX = this.morphFromX;
          this.enterY = this.morphFromY;
          this.exitX = this.morphToX;
          this.exitY = this.morphToY;
          this.x = mix(this.morphFromX, this.morphToX, leaveEase);
          this.y = mix(this.morphFromY, this.morphToY, leaveEase);
        } else {
          this.homeX = orbitX;
          this.homeY = orbitY;
          this.morphFromX = orbitX;
          this.morphFromY = orbitY;
          this.morphToX = orbitX;
          this.morphToY = orbitY;
          this.x = orbitX;
          this.y = orbitY;
        }

        if (this.transitionState !== state) {
          this.transitionState = state;
        }

        if (state === 'spin') {
          this.angle += this.speed * speedMul;
        } else if (state === 'leave') {
          this.angle += this.speed * speedMul * 0.82;
        }
      }

      draw(speedMul, hovered, paletteBoost) {
        let baseA = 0.3;
        let glowA = 0.18;

        if (hovered) {
          baseA *= 1.12;
          glowA *= 1.4;
        }

        const rgb = getRingColorRGB(this.colorOffset + paletteBoost);
        const fill = rgba(rgb, baseA);
        const glow = rgba(rgb, glowA);

        if (this.prevX !== null && this.prevY !== null) {
          ctx.save();
          ctx.shadowBlur = (8 + 3 * speedMul) * (sizePx / 500);
          ctx.shadowColor = rgba(rgb, glowA * 1.1);
          ctx.strokeStyle = rgba(rgb, hovered ? 0.46 : 0.32);
          ctx.lineWidth = Math.max(1, this.size * 0.65);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(this.prevX, this.prevY);
          ctx.lineTo(this.x, this.y);
          ctx.stroke();
          ctx.restore();
        }

        ctx.shadowBlur = (12 + 4 * speedMul) * (sizePx / 500);
        ctx.shadowColor = glow;

        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 0.12;
        ctx.shadowBlur = 18 * (sizePx / 500);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size + 2.0 * (sizePx / 500), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // Enklere sirkler for header-variant
    let miniOrbs = [];

    const initMiniOrbs = () => {
  const count = variant === 'chatHeader' ? 6 : 4;

  miniOrbs = new Array(count).fill(0).map((_, i) => ({
    angle: (Math.PI * 2 * i) / count,
    radius: centerRadius * (0.18 + Math.random() * 0.22),
    speed: 0.003 + Math.random() * 0.0065,
    size:
      variant === 'chatHeader'
        ? (sizePx / 100) * (1.4 + Math.random() * 2.0)
        : (sizePx / 100) * (2.0 + Math.random() * 2.2),
    offset: i * 17,
  }));
};
    const drawMiniOrbs = () => {
  const miniSpeedFactor =
    variant === 'chatHeader'
      ? colorStateRef.current === 'typing'
        ? 0.45
        : 0.8
      : 1;

  for (const orb of miniOrbs) {
    orb.angle += orb.speed * miniSpeedFactor;

    const x = centerX + Math.cos(orb.angle) * orb.radius;
    const y = centerY + Math.sin(orb.angle) * orb.radius;

    const rgb = getRingColorRGB(orb.offset);
    ctx.shadowBlur = 10 * (sizePx / 100);
    ctx.shadowColor = rgba(rgb, 0.3);
    ctx.fillStyle = rgba(rgb, 0.88);

    ctx.beginPath();
    ctx.arc(x, y, orb.size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 12 * (sizePx / 100);
  ctx.shadowColor = 'rgba(255,255,255,0.08)';
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.beginPath();
  ctx.arc(centerX, centerY, centerRadius * 0.2, 0, Math.PI * 2);
  ctx.fill();
};

    const clipRing = () => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringOuter, 0, Math.PI * 2);
      ctx.arc(centerX, centerY, ringInner, 0, Math.PI * 2, true);
      ctx.clip('evenodd');
    };

    const clipOrb = () => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, casingOuter, 0, Math.PI * 2);
      ctx.clip();
    };

    const unclip = () => ctx.restore();

    let snowflakes = [];

    const initSnowflakes = () => {
      const count = Math.max(34, Math.min(110, Math.floor(64 * (sizePx / 260))));
      snowflakes = new Array(count).fill(0).map(() => ({
        x: Math.random() * sizePx,
        y: Math.random() * sizePx,
        r: (Math.random() * 1.2 + 0.4) * (sizePx / 220),
        s: (Math.random() * 0.33 + 0.16) * (sizePx / 240),
      }));
    };

    const drawSnow = () => {
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      for (const f of snowflakes) {
        f.y += f.s;
        if (f.y > sizePx + 6) {
          f.y = -10;
          f.x = Math.random() * sizePx;
        }
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    initRingParticles();
    initMiniOrbs();
    if (skinRef.current === 'juleskin') initSnowflakes();

    const ro = new ResizeObserver(() => {
      updateDimensions();
      initMiniOrbs();
    });
    ro.observe(container);

    const animate = () => {
      if (!isVisible) return;

      frame += 1;
      debugFrameRef.current += 1;
      colorProgress += 0.0032;
      if (colorProgress >= 1) {
        colorProgress = 0;
        colorIndex = (colorIndex + 1) % Math.max(1, targetPalette.length);
      }

      const currentOrbMode = orbModeRef.current;
      const paletteState =
        currentOrbMode === 'reply'
          ? 'typing'
          : currentOrbMode === 'inactive'
            ? 'maintenance'
            : colorStateRef.current;

      const nextPalette = colorPalettes[paletteState];
      if (currentPalette[0]?.r !== nextPalette[0]?.r) {
        targetPalette = nextPalette.map((c) => ({ ...c }));
        paletteT = 0;
      }
      if (paletteT < 1) paletteT = Math.min(1, paletteT + 0.03);

      currentPalette = currentPalette.map((cur, i) => {
        const tgt = targetPalette[i] || targetPalette[targetPalette.length - 1];
        return {
          r: Math.floor(cur.r + (tgt.r - cur.r) * 0.1),
          g: Math.floor(cur.g + (tgt.g - cur.g) * 0.1),
          b: Math.floor(cur.b + (tgt.b - cur.b) * 0.1),
        };
      });

      const hovered = interactive ? hoveredRef.current : false;
      const speedMul = hovered ? 3.0 : 1.0;
      const shouldUpdateHeavy = frame % 2 === 0;
      const nextMorphState =
        hasGlyph && currentOrbMode !== 'spin'
          ? 'enter'
          : morphBlend > 0.01
            ? 'leave'
            : 'spin';

      morphState = nextMorphState;

      const targetMorphBlend = morphState === 'enter' ? 1 : 0;
      const morphEase =
        morphState === 'enter'
          ? 0.055
          : morphState === 'leave'
            ? 0.038
            : 0.022;
      morphBlend += (targetMorphBlend - morphBlend) * morphEase;
      morphBlend = Math.max(0, Math.min(1, morphBlend));

      if (process.env.NODE_ENV !== 'production') {
        if (debugLastModeRef.current !== currentOrbMode) {
          debugLastModeRef.current = currentOrbMode;
          console.debug('[GlassOrbAvatar] orb mode change', {
            mode: currentOrbMode,
            morphState,
            morphBlend: Number(morphBlend.toFixed(3)),
          });
        }

        if (ringParticles.length > 0 && debugFrameRef.current % 20 === 0) {
          const tracked = ringParticles[0];
          const orbitX = centerX + Math.cos(tracked.angle) * tracked.radius;
          const orbitY = centerY + Math.sin(tracked.angle) * tracked.radius;
          console.debug('[GlassOrbAvatar] tracked orb path', {
            frame: debugFrameRef.current,
            mode: currentOrbMode,
            morphState,
            morphBlend: Number(morphBlend.toFixed(3)),
            orbit: {
              x: Number(orbitX.toFixed(2)),
              y: Number(orbitY.toFixed(2)),
            },
            particle: {
              x: Number(tracked.x.toFixed(2)),
              y: Number(tracked.y.toFixed(2)),
              prevX: tracked.prevX === null ? null : Number(tracked.prevX.toFixed(2)),
              prevY: tracked.prevY === null ? null : Number(tracked.prevY.toFixed(2)),
              homeX: Number(tracked.homeX.toFixed(2)),
              homeY: Number(tracked.homeY.toFixed(2)),
              enterX: Number(tracked.enterX.toFixed(2)),
              enterY: Number(tracked.enterY.toFixed(2)),
              exitX: Number(tracked.exitX.toFixed(2)),
              exitY: Number(tracked.exitY.toFixed(2)),
              transitionState: tracked.transitionState,
              morphFromX: Number(tracked.morphFromX.toFixed(2)),
              morphFromY: Number(tracked.morphFromY.toFixed(2)),
              morphToX: Number(tracked.morphToX.toFixed(2)),
              morphToY: Number(tracked.morphToY.toFixed(2)),
            },
          });
        }
      }

      ctx.clearRect(0, 0, sizePx, sizePx);
      if (baseCanvas) {
        ctx.drawImage(baseCanvas, 0, 0, sizePx, sizePx);
      }

      if (variant === 'default') {
        if (!hideRingParticles) {
          clipOrb();
          if (skinRef.current === 'juleskin') drawSnow();
          for (const p of ringParticles) {
            p.update(speedMul, morphBlend, morphState);
            p.draw(speedMul, hovered, colorIndex);
          }
          unclip();
        }
      }

      if (variant === 'chatHeader') {
        if (shouldUpdateHeavy) {
          // keep header orbs smooth without redrawing the expensive path every frame
        }
        clipOrb();
        drawMiniOrbs();
        unclip();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (animationRef.current || !isVisible) return;
      animationRef.current = requestAnimationFrame(animate);
    };

    const stopAnimation = () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    };

    const handleVisibilityChange = () => {
      const nextVisible = !document.hidden;
      isVisible = nextVisible;

      if (nextVisible) {
        startAnimation();
      } else {
        stopAnimation();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    if (typeof IntersectionObserver !== 'undefined') {
      visibilityObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;

          isVisible = entry.isIntersecting && !document.hidden;

          if (isVisible) {
            startAnimation();
          } else {
            stopAnimation();
          }
        },
        { threshold: 0.05 }
      );
      visibilityObserver.observe(container);
    }

    startAnimation();

    return () => {
      stopAnimation();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (visibilityObserver) visibilityObserver.disconnect();
      ro.disconnect();
    };
  }, [colorPalettes, glyph, glyphFont, variant, interactive, forceGlyphReveal, hideRingParticles]);

  const portalBackground =
    'radial-gradient(circle at 50% 45%, ' +
    'rgba(18,18,22,1) 0%, ' +
    'rgba(8,8,10,0.98) 58%, ' +
    'rgba(0,0,0,1) 100%)';

  const portalBoxShadow =
    skin === 'juleskin'
      ? '0 0 70px rgba(255,80,80,0.22), 0 0 140px rgba(255,40,40,0.14)'
      : '0 0 70px rgba(30,255,190,0.18), 0 0 140px rgba(30,255,190,0.12)';

  return (
    <div
      ref={containerRef}
      className={className}
      onClick={onClick}
      onPointerEnter={() => {
        if (!interactive) return;
        setIsHovered(true);
        hoveredRef.current = true;
      }}
      onPointerLeave={() => {
        if (!interactive) return;
        setIsHovered(false);
        hoveredRef.current = false;
        mouseRef.current.x = null;
        mouseRef.current.y = null;
      }}
      onPointerMove={(e) => {
        if (!interactive || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        mouseRef.current.x = e.clientX - rect.left;
        mouseRef.current.y = e.clientY - rect.top;
      }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        background: 'none',
        width: style?.width || (typeof size === 'number' ? `${size}px` : size) || '100%',
        height: style?.height || (typeof size === 'number' ? `${size}px` : size) || '100%',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: portalBackground,
          boxShadow: portalBoxShadow,
          pointerEvents: 'none',
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          background: 'none',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

export default GlassOrbAvatar;
