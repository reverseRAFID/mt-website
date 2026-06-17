'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { prefersReducedMotion } from '@/lib/gsap'

/**
 * Animated low-poly Martian terrain rendered as an orange wireframe that flows
 * toward the camera — the hero centerpiece. Fully self-contained and defensive:
 *  - bails out cleanly if WebGL is unavailable (hero CSS fallback shows through),
 *  - renders a single static frame under reduced-motion,
 *  - pauses when offscreen or when the tab is hidden,
 *  - caps pixel ratio and disposes everything on unmount.
 */
export function MarsTerrain({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Animate only on capable, motion-allowed devices. Small/touch screens get a
    // crisp static terrain frame (same look, zero per-frame cost).
    const lowPower =
      window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches
    const reduce = prefersReducedMotion() || lowPower

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' })
    } catch {
      return // no WebGL — leave the canvas empty, CSS fallback remains
    }

    const parent = canvas.parentElement ?? canvas
    let width = parent.clientWidth || window.innerWidth
    let height = parent.clientHeight || window.innerHeight

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    renderer.setSize(width, height, false)
    renderer.setClearColor(0x000000, 0)

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x050505, 7, 24)

    const camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 100)
    camera.position.set(0, 3.1, 7)
    camera.lookAt(0, 0.2, -7)

    // Terrain plane (displaced along its local Z, which becomes world height
    // once the mesh is laid flat).
    const SEG_X = 60
    const SEG_Y = 120
    const geometry = new THREE.PlaneGeometry(26, 52, SEG_X, SEG_Y)
    const material = new THREE.MeshBasicMaterial({
      color: 0xff6b1a,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.z = -14
    scene.add(mesh)

    const pos = geometry.attributes.position as THREE.BufferAttribute
    const baseX = new Float32Array(pos.count)
    const baseY = new Float32Array(pos.count)
    for (let i = 0; i < pos.count; i++) {
      baseX[i] = pos.getX(i)
      baseY[i] = pos.getY(i)
    }

    const heightAt = (x: number, y: number) => {
      let h = 0
      h += Math.sin(x * 0.34) * 0.5
      h += Math.sin(y * 0.27) * 0.5
      h += Math.sin((x * 0.2 + y * 0.32)) * 0.4
      h += Math.sin(x * 0.9 + y * 0.6) * 0.14
      // flatten a channel down the middle for a "rover path"
      h *= 0.55 + 0.45 * Math.min(1, Math.abs(x) / 4)
      return h
    }

    const displace = (offset: number) => {
      for (let i = 0; i < pos.count; i++) {
        pos.setZ(i, heightAt(baseX[i], baseY[i] + offset))
      }
      pos.needsUpdate = true
    }

    // pointer parallax targets
    const pointer = { x: 0, y: 0 }
    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth - 0.5) * 2
      pointer.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    if (!reduce) window.addEventListener('pointermove', onPointer, { passive: true })

    const onResize = () => {
      width = parent.clientWidth || window.innerWidth
      height = parent.clientHeight || window.innerHeight
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    let offset = 0
    let running = true
    const speed = 0.02

    const renderFrame = () => {
      // ease camera toward pointer for subtle depth
      camera.position.x += (pointer.x * 0.9 - camera.position.x) * 0.04
      camera.position.y += (3.1 - pointer.y * 0.5 - camera.position.y) * 0.04
      camera.lookAt(0, 0.2, -7)
      renderer.render(scene, camera)
    }

    const loop = () => {
      if (!running) return
      offset += speed
      displace(offset)
      renderFrame()
      raf = requestAnimationFrame(loop)
    }

    const start = () => {
      if (running && !raf && !reduce) raf = requestAnimationFrame(loop)
    }
    const stop = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }

    // initial frame
    displace(0)
    renderFrame()

    if (reduce) {
      // one nicer static frame, no animation loop
      displace(2)
      renderFrame()
    } else {
      raf = requestAnimationFrame(loop)
    }

    // pause when offscreen
    const io = new IntersectionObserver(
      ([entry]) => {
        running = entry.isIntersecting
        if (running) start()
        else stop()
      },
      { threshold: 0 }
    )
    io.observe(canvas)

    const onVisibility = () => {
      if (document.hidden) {
        running = false
        stop()
      } else {
        running = true
        start()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stop()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointer)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [])

  return <canvas ref={canvasRef} className={className} aria-hidden />
}
