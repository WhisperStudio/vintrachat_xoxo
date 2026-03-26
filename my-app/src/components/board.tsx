'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

type CircuitBoardViewerProps = {
  modelPath?: string
  height?: number | string
  autoRotate?: boolean
  className?: string
}

export default function CircuitBoardViewer({
  modelPath = '/models/Donut_GLB.glb',
  height = 620,
  autoRotate = true,
  className = '',
}: CircuitBoardViewerProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let disposed = false
    let loadedRoot: THREE.Object3D | null = null

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#050816')
    scene.fog = new THREE.Fog('#050816', 10, 22)

    const camera = new THREE.PerspectiveCamera(
      40,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    )
    camera.position.set(0, 1.4, 7.8)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    mount.appendChild(renderer.domElement)

    // Ambient fill
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45)
    scene.add(ambientLight)

    // Strong top/front key light
    const keyLight = new THREE.SpotLight(0xffffff, 18, 30, Math.PI / 6, 0.45, 1.2)
    keyLight.position.set(4, 8, 6)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    keyLight.shadow.bias = -0.00008
    scene.add(keyLight)
    scene.add(keyLight.target)

    // Blue rim light
    const rimLight = new THREE.PointLight(0x4f8cff, 12, 20, 2)
    rimLight.position.set(-5, 2, -4)
    scene.add(rimLight)

    // Soft pink secondary light
    const accentLight = new THREE.PointLight(0xc084fc, 8, 18, 2)
    accentLight.position.set(5, -1, 3)
    scene.add(accentLight)

    // Soft light under model so it feels like it floats
    const underGlow = new THREE.PointLight(0x6ee7ff, 6, 10, 2)
    underGlow.position.set(0, -2.2, 0)
    scene.add(underGlow)

    // Fake floating glow disc under the object
    const glowTextureCanvas = document.createElement('canvas')
    glowTextureCanvas.width = 256
    glowTextureCanvas.height = 256
    const ctx = glowTextureCanvas.getContext('2d')

    if (ctx) {
      const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 120)
      gradient.addColorStop(0, 'rgba(130,180,255,0.55)')
      gradient.addColorStop(0.45, 'rgba(130,180,255,0.18)')
      gradient.addColorStop(1, 'rgba(130,180,255,0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 256, 256)
    }

    const glowTexture = new THREE.CanvasTexture(glowTextureCanvas)
    const glowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      transparent: true,
      depthWrite: false,
    })
    const glowSprite = new THREE.Sprite(glowMaterial)
    glowSprite.position.set(0, -1.55, 0)
    glowSprite.scale.set(3.8, 3.8, 1)
    scene.add(glowSprite)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.enablePan = false
    controls.autoRotate = autoRotate
    controls.autoRotateSpeed = 0.8
    controls.minDistance = 4.8
    controls.maxDistance = 11
    controls.minPolarAngle = 0.9
    controls.maxPolarAngle = 2.05
    controls.target.set(0, 0.2, 0)

    const loader = new GLTFLoader()

    loader.load(
      modelPath,
      (gltf) => {
        if (disposed) return

        loadedRoot = gltf.scene

        loadedRoot.traverse((child) => {
  const mesh = child as THREE.Mesh

  if (mesh.isMesh) {
    // Fjern store "bakvegger"
    const box = new THREE.Box3().setFromObject(mesh)
    const size = new THREE.Vector3()
    box.getSize(size)

    // Hvis den er ekstremt stor = sannsynligvis bakgrunn
    if (size.x > 5 || size.y > 5 || size.z > 5) {
      mesh.visible = false
      return
    }

    mesh.castShadow = true
    mesh.receiveShadow = true
  }
})

        // Compute bounds before scaling
        const box = new THREE.Box3().setFromObject(loadedRoot)
        const size = new THREE.Vector3()
        const center = new THREE.Vector3()
        box.getSize(size)
        box.getCenter(center)

        // Center model
        loadedRoot.position.sub(center)

        // Bigger autoscale so it is actually visible
        const maxAxis = Math.max(size.x, size.y, size.z) || 1
        const targetVisualSize = 135.4
        const scale = targetVisualSize / maxAxis
        loadedRoot.scale.setScalar(scale)

        // Recompute after scaling
        const scaledBox = new THREE.Box3().setFromObject(loadedRoot)
        const scaledSize = new THREE.Vector3()
        const scaledCenter = new THREE.Vector3()
        scaledBox.getSize(scaledSize)
        scaledBox.getCenter(scaledCenter)

        // Re-center after scale
        loadedRoot.position.x -= scaledCenter.x
        loadedRoot.position.y -= scaledCenter.y
        loadedRoot.position.z -= scaledCenter.z

        // Float in the air
        loadedRoot.position.y = 0.35

        // Small tilt for better presentation
        loadedRoot.rotation.x = -0.18
        loadedRoot.rotation.y = 0.55

        scene.add(loadedRoot)

        // Move camera farther if needed
        camera.position.set(0, 1.1, 8.5)
        controls.target.set(0, 0.2, 0)
        controls.update()

        setIsLoading(false)
      },
      undefined,
      () => {
        if (disposed) return
        setError('Could not load the 3D model.')
        setIsLoading(false)
      }
    )

    const handleResize = () => {
      if (!mount) return
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }

    window.addEventListener('resize', handleResize)

    const clock = new THREE.Clock()

    const animate = () => {
      if (disposed) return

      const t = clock.getElapsedTime()

      if (loadedRoot) {
        loadedRoot.position.y = 0.35 + Math.sin(t * 1.2) * 0.06
      }

      glowSprite.material.opacity = 0.7 + Math.sin(t * 1.6) * 0.08

      controls.update()
      renderer.render(scene, camera)
    }

    renderer.setAnimationLoop(animate)

    return () => {
      disposed = true
      window.removeEventListener('resize', handleResize)
      renderer.setAnimationLoop(null)
      controls.dispose()

      if (loadedRoot) {
        scene.remove(loadedRoot)
      }

      glowTexture.dispose()
      glowMaterial.dispose()
      renderer.dispose()

      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [modelPath, autoRotate])

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height,
        minHeight: 420,
        borderRadius: 28,
        overflow: 'hidden',
        border: '1px solid rgba(148, 163, 184, 0.14)',
        background:
          'radial-gradient(700px 300px at 50% 10%, rgba(59,130,246,0.08), transparent 60%), linear-gradient(180deg, #050816 0%, #0a1020 100%)',
        boxShadow: '0 28px 80px rgba(2, 6, 23, 0.45)',
      }}
    >
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {isLoading && !error && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(5,8,22,0.34)',
            backdropFilter: 'blur(10px)',
            color: '#dbeafe',
            fontWeight: 600,
            letterSpacing: '0.01em',
          }}
        >
          Loading 3D viewer...
        </div>
      )}

      {error && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            padding: 24,
            textAlign: 'center',
            background: 'rgba(5,8,22,0.46)',
            backdropFilter: 'blur(10px)',
            color: '#fecaca',
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          left: 18,
          bottom: 18,
          padding: '10px 14px',
          borderRadius: 999,
          background: 'rgba(15, 23, 42, 0.58)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#e2e8f0',
          fontSize: 13,
          fontWeight: 600,
          backdropFilter: 'blur(10px)',
        }}
      >
        Drag to rotate ΓÇó Scroll to zoom
      </div>
    </div>
  )
}
