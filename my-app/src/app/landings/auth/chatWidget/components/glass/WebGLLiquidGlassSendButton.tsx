'use client'

import { ButtonHTMLAttributes, ReactNode, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { FiSend } from 'react-icons/fi'
import './WebGLLiquidGlassSendButton.css'

type WebGLLiquidGlassSendButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode
  icon?: ReactNode
  width?: number
  height?: number
  radius?: number | string
}

type LiquidGlassState = {
  x: number
  y: number
  gw: number
  gh: number
  gr: number
  thick: number
  bezel: number
  ior: number
  blur: number
  spec: number
  tint: number
  shadow: number
  press: number
}

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}`

const fragmentShader = `
precision highp float;
varying vec2 vUv;

uniform vec2 uResolution;
uniform vec2 uGlassCenter;
uniform vec2 uGlassSize;
uniform float uRadius;
uniform float uBezel;
uniform float uThickness;
uniform float uIOR;
uniform float uBlur;
uniform float uSpecular;
uniform float uTint;
uniform float uShadow;
uniform float uPress;
uniform sampler2D uBgTex;

float sdRoundedRect(vec2 p, vec2 halfSize, float r) {
  vec2 q = abs(p) - halfSize + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

float surfaceHeight(float t) {
  float s = 1.0 - t;
  return pow(1.0 - s*s*s*s, 0.25);
}

vec3 sampleBg(vec2 screenUV) {
  vec2 uv = screenUV;
  uv.y = 1.0 - uv.y;
  return texture2D(uBgTex, uv).rgb;
}

vec3 sampleBgBlurred(vec2 uv, float radius) {
  if (radius < 0.5) return sampleBg(uv);

  vec3 sum = vec3(0.0);
  vec2 px = 1.0 / uResolution;

  vec2 offsets[16];
  offsets[0]  = vec2(-0.94201, -0.39906);
  offsets[1]  = vec2( 0.94558, -0.76890);
  offsets[2]  = vec2(-0.09418, -0.92938);
  offsets[3]  = vec2( 0.34495,  0.29387);
  offsets[4]  = vec2(-0.91588, -0.45771);
  offsets[5]  = vec2(-0.81544,  0.48568);
  offsets[6]  = vec2(-0.38277, -0.56071);
  offsets[7]  = vec2(-0.12675,  0.84686);
  offsets[8]  = vec2( 0.89642,  0.41254);
  offsets[9]  = vec2( 0.18150, -0.30020);
  offsets[10] = vec2(-0.01445, -0.16001);
  offsets[11] = vec2( 0.59614,  0.71118);
  offsets[12] = vec2( 0.49742, -0.47280);
  offsets[13] = vec2( 0.80685,  0.04588);
  offsets[14] = vec2(-0.32490, -0.03965);
  offsets[15] = vec2(-0.60975,  0.06566);

  for (int i = 0; i < 16; i++) {
    sum += sampleBg(uv + offsets[i] * radius * px);
  }

  return sum / 16.0;
}

void main() {
  vec2 screenPx = vec2(vUv.x, 1.0 - vUv.y) * uResolution;
  vec2 p = screenPx - uGlassCenter;
  vec2 halfSize = uGlassSize * 0.5;

  float sd = sdRoundedRect(p, halfSize, uRadius);

  if (sd > 0.0) {
    float shadowFalloff = exp(-sd * sd / 700.0);
    float shadowAlpha = uShadow * shadowFalloff * 0.48;
    gl_FragColor = vec4(0.0, 0.0, 0.0, shadowAlpha);
    return;
  }

  float distFromEdge = -sd;
  float bezel = min(uBezel, min(uRadius, min(halfSize.x, halfSize.y)) - 1.0);
  float t = clamp(distFromEdge / bezel, 0.0, 1.0);

  float h = surfaceHeight(t);
  float dt = 0.001;
  float h2 = surfaceHeight(min(t + dt, 1.0));
  float dh = (h2 - h) / dt;

  float activeThickness = uThickness * mix(1.0, 1.18, uPress);
  float slopeAngle = atan(dh * (activeThickness / bezel));
  float sinR = sin(slopeAngle) / uIOR;
  sinR = clamp(sinR, -1.0, 1.0);
  float thetaR = asin(sinR);
  float displacement = h * activeThickness * (tan(slopeAngle) - tan(thetaR));

  vec2 grad;
  float eps = 0.5;
  grad.x = sdRoundedRect(p + vec2(eps, 0.0), halfSize, uRadius) - sd;
  grad.y = sdRoundedRect(p + vec2(0.0, eps), halfSize, uRadius) - sd;
  grad = normalize(grad);

  vec2 screenUV = screenPx / uResolution;
  vec2 offset = -grad * displacement / uResolution;

  vec3 color = sampleBgBlurred(screenUV + offset, uBlur);

  vec2 lightDir = normalize(vec2(0.5, -0.7));
  float rimDot = abs(dot(grad, lightDir));
  float rimFalloff = 1.0 - smoothstep(0.0, bezel * 0.4, distFromEdge);
  float specHighlight = pow(rimDot * rimFalloff, 1.5);

  color += vec3(specHighlight * uSpecular);

  float innerShadow = 1.0 - smoothstep(0.0, bezel * 0.6, distFromEdge);
  color *= mix(1.0, 0.68, innerShadow * 0.28);

  float innerRim = smoothstep(0.0, 2.0, distFromEdge) * (1.0 - smoothstep(2.0, 5.0, distFromEdge));
  color += vec3(innerRim * 0.16 * uSpecular);

  float topShine = smoothstep(halfSize.y, halfSize.y - bezel * 0.8, abs(p.y + halfSize.y * 0.56));
  topShine *= smoothstep(-halfSize.x, halfSize.x, p.x);
  color += vec3(topShine * 0.045);

  color = mix(color, vec3(1.0), uTint);

  float alpha = smoothstep(0.0, 1.5, distFromEdge);
  gl_FragColor = vec4(color, alpha);
}`

function getNumericRadius(radius: number | string | undefined, width: number, height: number) {
  if (typeof radius === 'number' && Number.isFinite(radius)) {
    return Math.max(1, Math.min(radius, Math.min(width, height) / 2))
  }

  if (typeof radius === 'string') {
    if (radius.trim().endsWith('%')) {
      const percent = Number.parseFloat(radius)
      if (Number.isFinite(percent)) {
        return Math.max(1, Math.min(width, height) * (percent / 100))
      }
    }

    const parsed = Number.parseFloat(radius)
    if (Number.isFinite(parsed)) {
      return Math.max(1, Math.min(parsed, Math.min(width, height) / 2))
    }
  }

  return Math.min(width, height) / 2
}

function getCssRadius(radius: number | string | undefined, fallback: number) {
  if (typeof radius === 'number' && Number.isFinite(radius)) return `${radius}px`
  if (typeof radius === 'string' && radius.trim()) return radius
  return `${fallback}px`
}

function makeBgTexture(bgCanvas: HTMLCanvasElement, bgCtx: CanvasRenderingContext2D, bgTexture: THREE.CanvasTexture) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  bgCanvas.width = Math.floor(window.innerWidth * dpr)
  bgCanvas.height = Math.floor(window.innerHeight * dpr)

  const w = bgCanvas.width
  const h = bgCanvas.height

  const g = bgCtx.createLinearGradient(0, 0, w, h)
  g.addColorStop(0, '#111319')
  g.addColorStop(0.42, '#1c2027')
  g.addColorStop(1, '#0f1718')
  bgCtx.fillStyle = g
  bgCtx.fillRect(0, 0, w, h)

  const r1 = bgCtx.createRadialGradient(w * 0.20, h * 0.16, 0, w * 0.20, h * 0.16, w * 0.30)
  r1.addColorStop(0, 'rgba(143,116,255,0.42)')
  r1.addColorStop(1, 'rgba(143,116,255,0)')
  bgCtx.fillStyle = r1
  bgCtx.fillRect(0, 0, w, h)

  const r2 = bgCtx.createRadialGradient(w * 0.82, h * 0.72, 0, w * 0.82, h * 0.72, w * 0.34)
  r2.addColorStop(0, 'rgba(70,235,207,0.32)')
  r2.addColorStop(1, 'rgba(70,235,207,0)')
  bgCtx.fillStyle = r2
  bgCtx.fillRect(0, 0, w, h)

  bgCtx.strokeStyle = 'rgba(255,255,255,0.045)'
  bgCtx.lineWidth = Math.max(1, dpr)
  for (let y = 35 * dpr; y < h; y += 36 * dpr) {
    bgCtx.beginPath()
    bgCtx.moveTo(0, y)
    bgCtx.lineTo(w, y)
    bgCtx.stroke()
  }

  bgCtx.strokeStyle = 'rgba(255,255,255,0.035)'
  for (let x = 35 * dpr; x < w; x += 36 * dpr) {
    bgCtx.beginPath()
    bgCtx.moveTo(x, 0)
    bgCtx.lineTo(x, h)
    bgCtx.stroke()
  }

  bgCtx.strokeStyle = 'rgba(255,255,255,0.13)'
  bgCtx.lineWidth = Math.max(2, 2 * dpr)
  bgCtx.beginPath()
  bgCtx.moveTo(0, h * 0.5)
  bgCtx.lineTo(w, h * 0.5)
  bgCtx.stroke()

  bgTexture.needsUpdate = true
}

export default function WebGLLiquidGlassSendButton({
  children,
  icon,
  width = 82,
  height = 58,
  radius = 29,
  className = '',
  onClick,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  style,
  type = 'button',
  ...buttonProps
}: WebGLLiquidGlassSendButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const currentButton = buttonRef.current
    if (!currentButton) return
    const sendButton: HTMLButtonElement = currentButton

    const canvas = document.createElement('canvas')
    canvas.className = 'webgl-liquid-glass-canvas'
    document.body.appendChild(canvas)

    const state: LiquidGlassState = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      gw: width,
      gh: height,
      gr: getNumericRadius(radius, width, height),
      thick: 200,
      bezel: 60,
      ior: 3.0,
      blur: 12.0,
      spec: 0.40,
      tint: 0.26,
      shadow: 0.45,
      press: 0,
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
    })

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const bgCanvas = document.createElement('canvas')
    const bgCtx = bgCanvas.getContext('2d')
    if (!bgCtx) return

    const bgTexture = new THREE.CanvasTexture(bgCanvas)
    bgTexture.minFilter = THREE.LinearFilter
    bgTexture.magFilter = THREE.LinearFilter
    makeBgTexture(bgCanvas, bgCtx, bgTexture)

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uGlassCenter: { value: new THREE.Vector2(state.x, state.y) },
        uGlassSize: { value: new THREE.Vector2(state.gw, state.gh) },
        uRadius: { value: state.gr },
        uBezel: { value: state.bezel },
        uThickness: { value: state.thick },
        uIOR: { value: state.ior },
        uBlur: { value: state.blur },
        uSpecular: { value: state.spec },
        uTint: { value: state.tint },
        uShadow: { value: state.shadow },
        uPress: { value: state.press },
        uBgTex: { value: bgTexture },
      },
      transparent: true,
      depthTest: false,
    })

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
    scene.add(mesh)

    let animationFrameId = 0

    function syncButton() {
      const rect = sendButton.getBoundingClientRect()
      state.x = rect.left + rect.width / 2
      state.y = rect.top + rect.height / 2
      state.gr = getNumericRadius(radius, width, height)
      sendButton.style.width = `${width}px`
      sendButton.style.height = `${height}px`
      sendButton.style.borderRadius = getCssRadius(radius, state.gr)
    }

    function render() {
      const targetW = sendButton.classList.contains('is-pressed') ? width * (76 / 82) : width
      const targetH = sendButton.classList.contains('is-pressed') ? height * (54 / 58) : height
      const targetPress = sendButton.classList.contains('is-pressed') ? 1 : 0

      state.gw += (targetW - state.gw) * 0.18
      state.gh += (targetH - state.gh) * 0.18
      state.press += (targetPress - state.press) * 0.16

      const u = material.uniforms
      u.uResolution.value.set(window.innerWidth, window.innerHeight)
      u.uGlassCenter.value.set(state.x, state.y)
      u.uGlassSize.value.set(state.gw, state.gh)
      u.uRadius.value = state.gr
      u.uBezel.value = state.bezel
      u.uThickness.value = state.thick
      u.uIOR.value = state.ior
      u.uBlur.value = state.blur
      u.uSpecular.value = state.spec
      u.uTint.value = state.tint
      u.uShadow.value = state.shadow
      u.uPress.value = state.press

      syncButton()
      renderer.render(scene, camera)
      animationFrameId = requestAnimationFrame(render)
    }

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight)
      makeBgTexture(bgCanvas, bgCtx, bgTexture)
      syncButton()
    }

    syncButton()
    render()

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', syncButton, true)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', syncButton, true)
      scene.remove(mesh)
      mesh.geometry.dispose()
      material.dispose()
      bgTexture.dispose()
      renderer.dispose()
      canvas.remove()
    }
  }, [height, radius, width])

  return (
    <button
      {...buttonProps}
      ref={buttonRef}
      type={type}
      className={`send-button ${className}`.trim()}
      style={{
        ...style,
        width,
        height,
        borderRadius: getCssRadius(radius, getNumericRadius(radius, width, height)),
      }}
      onPointerDown={(event) => {
        event.currentTarget.classList.add('is-pressed')
        onPointerDown?.(event)
      }}
      onPointerUp={(event) => {
        event.currentTarget.classList.remove('is-pressed')
        onPointerUp?.(event)
      }}
      onPointerLeave={(event) => {
        event.currentTarget.classList.remove('is-pressed')
        onPointerLeave?.(event)
      }}
      onClick={(event) => {
        event.currentTarget.animate(
          [
            { transform: 'scale(1)' },
            { transform: 'scale(0.92)' },
            { transform: 'scale(1)' },
          ],
          {
            duration: 320,
            easing: 'cubic-bezier(.2,.9,.2,1)',
          }
        )
        onClick?.(event)
      }}
    >
      {icon || children || <FiSend aria-hidden="true" />}
    </button>
  )
}
