import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const registry = new Map()

function DrakenPlaceholder({ scale = 1, color = '#22d3ee', emissive = '#38bdf8' }) {
  return (
    <group scale={scale}>
      <mesh castShadow receiveShadow>
        <torusKnotGeometry args={[1.4, 0.4, 120, 16]} />
        <meshStandardMaterial
          color={color}
          roughness={0.32}
          metalness={0.55}
          emissive={emissive}
          emissiveIntensity={0.55}
        />
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow>
        <icosahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial
          color="#0ea5e9"
          roughness={0.28}
          metalness={0.25}
          emissive={emissive}
          emissiveIntensity={0.65}
        />
      </mesh>
      <mesh position={[0, -0.6, 0]} receiveShadow>
        <ringGeometry args={[1.1, 1.5, 48]} />
        <meshStandardMaterial
          color="#082f49"
          roughness={0.75}
          metalness={0.15}
          emissive={emissive}
          emissiveIntensity={0.12}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight color={emissive} intensity={3.8} distance={12} decay={2} />
    </group>
  )
}

function LanternfishPlaceholder({ scale = 1, bodyColor = '#fbbf24', glowColor = '#fde68a' }) {
  return (
    <group scale={scale}>
      <mesh castShadow>
        <capsuleGeometry args={[1.1, 2.8, 8, 18]} />
        <meshStandardMaterial
          color={bodyColor}
          roughness={0.45}
          metalness={0.25}
          emissive={glowColor}
          emissiveIntensity={0.35}
        />
      </mesh>
      <mesh position={[0, 0.18, 1.5]} castShadow>
        <sphereGeometry args={[0.42, 16, 16]} />
        <meshStandardMaterial
          color="#fff7ed"
          roughness={0.2}
          metalness={0.4}
          emissive="#fef3c7"
          emissiveIntensity={0.65}
        />
      </mesh>
      <mesh position={[0, 0.4, 2.4]} castShadow>
        <coneGeometry args={[0.18, 0.9, 8]} />
        <meshStandardMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={0.85}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0, 0.15, -2]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <planeGeometry args={[2.4, 1.2]} />
        <meshStandardMaterial
          color="#fb923c"
          emissive="#fb7185"
          emissiveIntensity={0.35}
          roughness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight color={glowColor} intensity={2.4} distance={9} decay={2} />
    </group>
  )
}

function BeaconPlaceholder({ scale = 1, color = '#34d399', emissive = '#6ee7b7' }) {
  return (
    <group scale={scale}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.4, 0.6, 2.6, 12]} />
        <meshStandardMaterial color="#0f172a" roughness={0.55} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow>
        <octahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial
          color={color}
          roughness={0.2}
          metalness={0.4}
          emissive={emissive}
          emissiveIntensity={0.75}
        />
      </mesh>
      <mesh position={[0, 1.4, 0]} castShadow>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshStandardMaterial
          color="#ecfeff"
          roughness={0.1}
          metalness={0.3}
          emissive={emissive}
          emissiveIntensity={0.9}
        />
      </mesh>
      <pointLight color={emissive} intensity={3} distance={10} decay={2} />
    </group>
  )
}

export function registerModel(id, descriptor) {
  if (!id) throw new Error('Model id is required.')
  registry.set(id, descriptor)
}

export function hasModel(id) {
  return registry.has(id)
}

export function getModelMetadata(id) {
  return registry.get(id)?.metadata || null
}

export function ModelInstance({ id, ...props }) {
  const descriptor = registry.get(id)
  if (!descriptor) {
    throw new Error(`Model "${id}" is not registered in the model registry.`)
  }

  if (descriptor.type === 'glb') {
    const { scene } = useGLTF(descriptor.src, descriptor.options || {})
    const cloned = useMemo(() => scene.clone(true), [scene])
    return (
      <primitive
        object={cloned}
        {...descriptor.defaultProps}
        {...props}
      />
    )
  }

  const PlaceholderComponent = descriptor.Component
  return (
    <PlaceholderComponent
      {...descriptor.defaultProps}
      {...props}
    />
  )
}

registerModel('creature.draken.placeholder', {
  type: 'placeholder',
  Component: DrakenPlaceholder,
  defaultProps: { scale: 1 },
  metadata: {
    placeholder: true,
    boundingRadius: 8,
    notes: 'Replace with the final Draken GLB when ready.',
  },
})

registerModel('creature.lanternfish.placeholder', {
  type: 'placeholder',
  Component: LanternfishPlaceholder,
  defaultProps: { scale: 1 },
  metadata: {
    placeholder: true,
    boundingRadius: 6,
    notes: 'Lanternfish glowing scout placeholder.',
  },
})

registerModel('poi.beacon.placeholder', {
  type: 'placeholder',
  Component: BeaconPlaceholder,
  defaultProps: { scale: 1 },
  metadata: {
    placeholder: true,
    boundingRadius: 3.5,
  },
})

export default registry

