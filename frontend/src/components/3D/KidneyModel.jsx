import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Float } from '@react-three/drei'
import * as THREE from 'three'

function createKidneyGeometry() {
  const widthSegments = 112
  const heightSegments = 80
  const positions = []
  const indices = []

  for (let row = 0; row <= heightSegments; row += 1) {
    const latitude = (row / heightSegments) * Math.PI
    for (let column = 0; column <= widthSegments; column += 1) {
      const longitude = (column / widthSegments) * Math.PI * 2
      const nx = Math.sin(latitude) * Math.cos(longitude)
      const ny = Math.cos(latitude)
      const nz = Math.sin(latitude) * Math.sin(longitude)
      const organic = 1 + 0.018 * Math.sin(longitude * 3 + ny * 4) * Math.sin(latitude)
      const x = nx * 0.8 * organic - 0.45 * Math.pow(Math.max(nx, 0), 5) * Math.exp(-((ny / 0.38) ** 2))
      const y = ny * 1.12 * organic
      const z = nz * 0.53 * organic - 0.075 * Math.exp(-(((x - 0.2) / 0.2) ** 2) - ((ny / 0.25) ** 2)) * Math.pow(Math.max(nz, 0), 4)
      positions.push(x, y, z)
    }
  }

  for (let row = 0; row < heightSegments; row += 1) {
    for (let column = 0; column < widthSegments; column += 1) {
      const current = row * (widthSegments + 1) + column
      const next = current + widthSegments + 1
      indices.push(current, current + 1, next, next, current + 1, next + 1)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function Vessel({ points, color, radius }) {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z))),
    [points],
  )

  return (
    <mesh>
      <tubeGeometry args={[curve, 36, radius, 10, false]} />
      <meshPhysicalMaterial color={color} roughness={0.28} clearcoat={0.4} clearcoatRoughness={0.22} />
    </mesh>
  )
}

function KidneyMesh({ riskScore = null, spin = true }) {
  const meshRef = useRef()
  const geometry = useMemo(createKidneyGeometry, [])
  const color = useMemo(() => {
    const c1 = new THREE.Color('#98515C')
    const c2 = new THREE.Color('#B66A70')
    const c3 = new THREE.Color('#C18D6E')
    if (riskScore == null) return c1
    if (riskScore < 0.5) return c1.lerp(c2, riskScore * 2)
    return c2.lerp(c3, (riskScore - 0.5) * 1.2)
  }, [riskScore])

  useFrame((state) => {
    if (!meshRef.current) return
    const elapsed = state.clock.elapsedTime
    if (spin) {
      meshRef.current.rotation.y = Math.sin(elapsed * 0.32) * 0.34
      meshRef.current.rotation.z = Math.sin(elapsed * 0.18) * 0.045
    }
    const pulseSpeed = 1 + (riskScore ?? 0) * 0.28
    const scale = 1 + Math.sin(elapsed * pulseSpeed) * 0.017
    meshRef.current.scale.set(scale, scale, scale)
  })

  return (
    <group ref={meshRef}>
      <mesh geometry={geometry}>
        <meshPhysicalMaterial
          color={color}
          roughness={0.24}
          metalness={0.035}
          clearcoat={0.68}
          clearcoatRoughness={0.18}
          sheen={0.34}
          sheenColor="#E5A4A0"
          emissive="#35131E"
          emissiveIntensity={0.08}
        />
      </mesh>
      <Vessel color="#D98C80" radius={0.035} points={[[0.99, 0.4, 0.12], [0.7, 0.32, 0.3], [0.43, 0.19, 0.55], [0.2, 0.13, 0.57]]} />
      <Vessel color="#73BFC8" radius={0.043} points={[[1.01, 0.12, 0.08], [0.71, 0.11, 0.3], [0.43, 0.05, 0.55], [0.2, 0.04, 0.57]]} />
      <Vessel color="#D4B5A0" radius={0.052} points={[[0.2, -0.06, 0.57], [0.23, -0.29, 0.53], [0.2, -0.57, 0.43], [0.14, -0.9, 0.28]]} />
    </group>
  )
}

function MedicalLighting() {
  const highlightRef = useRef()
  const scanRef = useRef()

  useFrame(({ clock }) => {
    const elapsed = clock.elapsedTime
    if (highlightRef.current) {
      highlightRef.current.position.set(
        Math.sin(elapsed * 0.65) * 2.15,
        3.8,
        2.5 + Math.cos(elapsed * 0.65) * 0.55,
      )
    }
    if (scanRef.current) scanRef.current.position.x = Math.sin(elapsed * 0.48) * 1.8
  })

  return (
    <>
      <ambientLight intensity={0.54} />
      <directionalLight position={[-3, 4.5, 4]} intensity={2.1} color="#FFF1E8" />
      <pointLight ref={highlightRef} position={[0, 3.8, 2.5]} intensity={2.4} distance={8} color="#F4FFFF" />
      <spotLight ref={scanRef} position={[-1.8, 1.8, 2.7]} angle={0.46} penumbra={0.82} intensity={2.8} distance={7} color="#85F2FF" />
      <pointLight position={[3, 1, 2]} intensity={1.7} color="#22D3EE" />
      <pointLight position={[-4, -2, -3]} intensity={1.1} color="#1597FF" />
      <pointLight position={[0, -3, 3]} intensity={0.55} color="#F3B5A0" />
    </>
  )
}

export default function KidneyModel({ riskScore = null, height = 380, interactive = true }) {
  return (
    <div style={{ height }} className="kidney-model w-full">
      <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }}>
        <MedicalLighting />
        <Float speed={0.95} rotationIntensity={0.1} floatIntensity={0.16}>
          <KidneyMesh riskScore={riskScore} />
        </Float>
        {interactive && (
          <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
        )}
      </Canvas>
      <span className="kidney-model__scan-beam" aria-hidden="true" />
    </div>
  )
}
