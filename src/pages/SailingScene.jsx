import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Sky, KeyboardControls, useKeyboardControls } from '@react-three/drei'
import * as THREE from 'three'
import ChogsBoat from '../components/ChogsBoat'
import Water from '../components/Water'
import WalletConnect from '../components/WalletConnect'
import IslandEntities from '../components/IslandEntities'
import { useQuestStore } from '../store/questStore'
import { dAppsData } from '../utils/dappsData'

const followOffset = new THREE.Vector3(0, 5.2, 11.5)
const lookAtOffset = new THREE.Vector3(0, 1.6, 0)
const tempDirection = new THREE.Vector3()
const tempPosition = new THREE.Vector3()
const tempQuat = new THREE.Quaternion()
const tempEuler = new THREE.Euler(0, 0, 0, 'YXZ')
const tempLookAtPosition = new THREE.Vector3()
const tempSide = new THREE.Vector3()
const Y_AXIS = new THREE.Vector3(0, 1, 0)

const keyboardMap = [
  { name: 'forward', keys: ['KeyW', 'ArrowUp'] },
  { name: 'backward', keys: ['KeyS', 'ArrowDown'] },
  { name: 'left', keys: ['KeyA', 'ArrowLeft'] },
  { name: 'right', keys: ['KeyD', 'ArrowRight'] },
]

const HUB_PANEL_CLASS =
  'pointer-events-auto rounded-[28px] border border-lime-300/75 bg-gradient-to-r from-emerald-600/60 via-emerald-500/50 to-lime-400/55 shadow-[0_0_60px_rgba(34,197,94,0.6)] backdrop-blur'
const HUB_SECTION_CLASS =
  'pointer-events-auto rounded-[24px] border border-lime-200/60 bg-gradient-to-br from-emerald-500/45 via-emerald-500/35 to-lime-400/40 shadow-[0_0_45px_rgba(34,197,94,0.45)] backdrop-blur'
const HUB_HEADING_CLASS =
  'text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-100 drop-shadow-[0_0_12px_rgba(34,197,94,0.85)]'
const HUB_TITLE_CLASS = 'text-lg font-semibold text-white drop-shadow-[0_0_16px_rgba(34,197,94,0.65)]'
const HUB_BODY_CLASS = 'text-[12px] text-emerald-100 leading-relaxed drop-shadow-[0_0_10px_rgba(34,197,94,0.55)]'
const HUB_SUBTEXT_CLASS =
  'text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-100 drop-shadow-[0_0_10px_rgba(34,197,94,0.75)]'
const HUB_SUBTEXT_INLINE_CLASS =
  'text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-100 drop-shadow-[0_0_10px_rgba(34,197,94,0.75)]'
const HUB_BUTTON_BASE =
  'rounded-full px-5 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] transition shadow-[0_0_30px_rgba(134,239,172,0.65)]'
const HUB_BUTTON_ACTIVE = `${HUB_BUTTON_BASE} bg-lime-200 text-emerald-900 hover:bg-lime-100`
const HUB_BUTTON_INACTIVE = `${HUB_BUTTON_BASE} bg-lime-400 text-emerald-950 hover:bg-lime-300`
const HUB_BADGE_CLASS =
  'rounded-full border border-lime-200/70 bg-lime-300/45 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-50 drop-shadow-[0_0_10px_rgba(132,225,188,0.85)]'
const HUB_PROGRESS_TRACK = 'mt-3 h-3 rounded-full bg-black/25 shadow-[inset_0_2px_10px_rgba(0,0,0,0.45)]'
const HUB_PROGRESS_FILL =
  'h-full rounded-full bg-gradient-to-r from-amber-200 via-lime-200 to-emerald-400 shadow-[0_0_24px_rgba(74,222,128,0.85)] transition-all'
const HUB_ANCHOR_CLASS =
  'flex items-center gap-3 rounded-[18px] border border-lime-200/60 bg-lime-400/20 px-3 py-2 text-sm text-white transition hover:bg-lime-300/35 hover:border-lime-200 shadow-[0_0_20px_rgba(132,225,188,0.4)]'

const CAMERA_DRAG_CONFIG = {
  yawSensitivity: 0.0022,
  pitchSensitivity: 0.0016,
  yawLimit: 0.65,
  pitchLimit: 0.35,
}

const mashSeed = (seedString) => {
  let seed = 0
  for (let i = 0; i < seedString.length; i += 1) {
    seed = (seed * 1664525 + seedString.charCodeAt(i) + 1013904223) >>> 0
  }
  return seed
}

const createSeededRng = (seedString) => {
  let state = mashSeed(seedString)
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

const DISTANT_ISLANDS = [
  {
    id: 'defi',
    label: 'DeFi Island',
    seed: 'island-defi',
    position: [220, 0, -160],
    radius: 46,
    height: 16,
    baseColor: '#2f855a',
    topColor: '#14532d',
    beachColor: '#d9872d',
    treeCount: 28,
    treePalette: {
      trunk: '#5b3a29',
      foliage: ['#3fb982', '#2f855a', '#4ade80'],
    },
    hills: [
      { radius: 12, height: 9, offset: [0, 0] },
      { radius: 9, height: 7, offset: [-10, -6] },
      { radius: 8, height: 6, offset: [12, 5] },
    ],
    pedestals: [
      { offset: [14, 6], color: '#38bdf8' },
      { offset: [-10, 8], color: '#fbbf24' },
      { offset: [2, -14], color: '#f97316' },
    ],
  },
  {
    id: 'gaming',
    label: 'Gaming Island',
    seed: 'island-gaming',
    position: [-260, 0, 120],
    radius: 38,
    height: 14,
    baseColor: '#9d6b53',
    topColor: '#7b341e',
    beachColor: '#c56a1c',
    treeCount: 18,
    treePalette: {
      trunk: '#4a2f1f',
      foliage: ['#ec4899', '#f97316', '#facc15'],
    },
    hills: [
      { radius: 11, height: 7.4, offset: [3, 2] },
      { radius: 8, height: 6, offset: [-10, -4] },
    ],
    pedestals: [
      { offset: [10, -8], color: '#22d3ee' },
      { offset: [-12, 6], color: '#fb7185' },
    ],
  },
  {
    id: 'infra',
    label: 'Infrastructure Island',
    seed: 'island-infra',
    position: [140, 0, 260],
    radius: 34,
    height: 13,
    baseColor: '#1f3d7a',
    topColor: '#243b6b',
    beachColor: '#d9a066',
    treeCount: 20,
    treePalette: {
      trunk: '#374151',
      foliage: ['#67e8f9', '#38bdf8'],
    },
    hills: [
      { radius: 9, height: 6.5, offset: [5, -4] },
      { radius: 7, height: 5.5, offset: [-8, 5] },
    ],
    pedestals: [
      { offset: [9, 9], color: '#a855f7' },
      { offset: [-8, -10], color: '#22c55e' },
    ],
  },
  {
    id: 'wallet',
    label: 'Wallet Island',
    seed: 'island-wallet',
    position: [-200, 0, -240],
    radius: 40,
    height: 15,
    baseColor: '#6b21a8',
    topColor: '#4c1d95',
    beachColor: '#eab308',
    treeCount: 24,
    treePalette: {
      trunk: '#553c9a',
      foliage: ['#c084fc', '#a855f7', '#d8b4fe'],
    },
    hills: [
      { radius: 10, height: 7.5, offset: [8, -5] },
      { radius: 8, height: 6.2, offset: [-9, 4] },
    ],
    pedestals: [
      { offset: [0, 0], color: '#f0abfc' },
      { offset: [13, 10], color: '#34d399' },
      { offset: [-15, -9], color: '#fde68a' },
    ],
  },
  {
    id: 'art',
    label: 'Art Island',
    seed: 'island-art',
    position: [0, 0, 340],
    radius: 50,
    height: 17,
    baseColor: '#b45309',
    topColor: '#92400e',
    beachColor: '#fbbf24',
    treeCount: 32,
    treePalette: {
      trunk: '#713f12',
      foliage: ['#fb7185', '#f472b6', '#facc15', '#34d399'],
    },
    hills: [
      { radius: 15, height: 9, offset: [0, 0] },
      { radius: 10, height: 7.5, offset: [-12, 6] },
      { radius: 9, height: 6.3, offset: [13, -8] },
    ],
    pedestals: [
      { offset: [16, 4], color: '#f472b6' },
      { offset: [-18, -6], color: '#fb7185' },
      { offset: [2, -18], color: '#facc15' },
      { offset: [0, 12], color: '#22d3ee' },
    ],
  },
]

function BoatCameraRig({ boatRef, cameraDragRef }) {
  const smoothedPosition = useRef(new THREE.Vector3())
  const smoothedLookAt = useRef(new THREE.Vector3())

  useFrame((state, delta) => {
    if (!boatRef.current) return

    const boat = boatRef.current
    const camera = state.camera
    const drag = cameraDragRef?.current

    let yawOffset = 0
    let pitchOffset = 0

    if (drag) {
      drag.currentYaw = THREE.MathUtils.damp(drag.currentYaw || 0, drag.targetYaw || 0, 6, delta)
      drag.currentPitch = THREE.MathUtils.damp(drag.currentPitch || 0, drag.targetPitch || 0, 6, delta)
      yawOffset = drag.currentYaw
      pitchOffset = drag.currentPitch
    }

    tempDirection.set(0, 0, -1).applyQuaternion(boat.quaternion).applyAxisAngle(Y_AXIS, yawOffset).normalize()
    tempPosition.copy(boat.position).addScaledVector(tempDirection, -followOffset.z)
    tempPosition.y = boat.position.y + followOffset.y + pitchOffset * -1.4
    tempPosition.x += followOffset.x

    smoothedPosition.current.lerp(tempPosition, 1 - Math.pow(0.0015, delta * 60))
    camera.position.copy(smoothedPosition.current)

    tempLookAtPosition.copy(boat.position).add(lookAtOffset)
    tempSide.set(1, 0, 0).applyQuaternion(boat.quaternion).normalize()
    tempLookAtPosition.addScaledVector(tempSide, Math.sin(yawOffset) * 2.2)
    tempLookAtPosition.y += pitchOffset * -5.5

    smoothedLookAt.current.lerp(tempLookAtPosition, 1 - Math.pow(0.0008, delta * 60))
    camera.lookAt(smoothedLookAt.current)
  })

  return null
}

function IslandPreview({ island }) {
  const features = useMemo(() => {
    const rng = createSeededRng(island.seed || island.id)
    const treeEntries = Array.from({ length: island.treeCount || 0 }, (_, index) => {
      const angle = rng() * Math.PI * 2
      const radius = (Math.sqrt(rng()) * (island.radius - 4)) || 0
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      const trunkHeight = 1.6 + rng() * 0.8
      const foliageHeight = 1.8 + rng() * 1.1
      const foliageScale = 1.6 + rng() * 0.8
      const foliageColor = Array.isArray(island.treePalette?.foliage)
        ? island.treePalette.foliage[index % island.treePalette.foliage.length]
        : island.treePalette?.foliage || '#38bdf8'
      return {
        position: [x, 0, z],
        trunkHeight,
        foliageHeight,
        foliageScale,
        foliageColor,
        rotation: rng() * Math.PI * 2,
      }
    })

    const beachRim = Math.max(island.radius * 1.06, island.radius + 2)

    return {
      trees: treeEntries,
      beachRadius: beachRim,
    }
  }, [island])

  const surfaceHeight = island.height - 0.4

  return (
    <group position={island.position}>
      <mesh castShadow receiveShadow position={[0, island.height / 2 - 0.4, 0]} scale={[island.radius, island.height, island.radius]}>
        <cylinderGeometry args={[1.05, 1.18, 1, 10]} />
        <meshStandardMaterial color={island.baseColor} roughness={0.72} metalness={0.18} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, island.height * 0.15, 0]} scale={[features.beachRadius, island.height * 0.3, features.beachRadius]}>
        <cylinderGeometry args={[1.1, 1.1, 1, 16]} />
        <meshStandardMaterial color={island.beachColor || '#cbd5f5'} roughness={0.8} metalness={0.1} />
      </mesh>

      {island.hills?.map((hill, idx) => (
        <mesh
          key={`hill-${island.id}-${idx}`}
          castShadow
          position={[hill.offset[0], surfaceHeight + hill.height / 2, hill.offset[1]]}
        >
          <coneGeometry args={[hill.radius, hill.height, 6]} />
          <meshStandardMaterial color={island.topColor} roughness={0.6} metalness={0.12} />
        </mesh>
      ))}

      {features.trees.map((tree, idx) => (
        <group key={`tree-${island.id}-${idx}`} position={[tree.position[0], surfaceHeight, tree.position[2]]} rotation={[0, tree.rotation, 0]}>
          <mesh position={[0, tree.trunkHeight / 2, 0]} castShadow>
            <cylinderGeometry args={[0.24, 0.3, tree.trunkHeight, 6]} />
            <meshStandardMaterial color={island.treePalette?.trunk || '#4a3f35'} roughness={0.7} metalness={0.1} />
          </mesh>
          <mesh position={[0, tree.trunkHeight + tree.foliageHeight / 2, 0]} castShadow>
            <coneGeometry args={[tree.foliageScale, tree.foliageHeight, 6]} />
            <meshStandardMaterial color={tree.foliageColor} roughness={0.55} metalness={0.08} />
          </mesh>
        </group>
      ))}

      {island.pedestals?.map((pedestal, idx) => (
        <group key={`pedestal-${island.id}-${idx}`} position={[pedestal.offset[0], surfaceHeight + 0.4, pedestal.offset[1]]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[1.4, 1.2, 0.6, 12]} />
            <meshStandardMaterial color="#1f2937" roughness={0.4} metalness={0.35} />
          </mesh>
          <mesh position={[0, 0.6, 0]} castShadow>
            <cylinderGeometry args={[1.1, 1.1, 0.2, 12]} />
            <meshStandardMaterial color={pedestal.color || '#38bdf8'} roughness={0.3} metalness={0.4} emissive={(pedestal.color || '#38bdf8')} emissiveIntensity={0.35} />
          </mesh>
          <mesh position={[0, 1.1, 0]} castShadow rotation={[Math.PI / 2, 0, 0]}>
            <octahedronGeometry args={[0.45, 0]} />
            <meshStandardMaterial color="#e0f2fe" emissive="#93c5fd" emissiveIntensity={0.45} roughness={0.25} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function SeaScenery({ size, islands }) {
  return (
    <group>
      <Water
        size={size}
        resolution={320}
        position={[0, 0, 0]}
        materialConfig={{
          uWaveHeight: 0.82,
          uWaveScale: 0.18,
          uWaveSpeed: 0.48,
          uColorDeep: new THREE.Color('#04366d'),
          uColorShallow: new THREE.Color('#1aa9ff'),
          uFoamThreshold: 0.32,
        }}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.75, 0]} receiveShadow>
        <planeGeometry args={[size * 1.2, size * 1.2]} />
        <meshStandardMaterial color="#062a4f" roughness={0.95} metalness={0.05} />
      </mesh>

      {islands.map((island) => (
        <IslandPreview key={island.id} island={island} />
      ))}
    </group>
  )
}

function BoatTracker({ boatRef, islands, onUpdate, onNearIsland }) {
  const lastUpdate = useRef(0)

  useFrame(({ clock }) => {
    const boat = boatRef.current
    if (!boat) return
    if (clock.elapsedTime - lastUpdate.current < 0.08) return
    boat.getWorldQuaternion(tempQuat)
    tempEuler.setFromQuaternion(tempQuat, 'YXZ')
    const updatePayload = {
      x: boat.position.x,
      z: boat.position.z,
      heading: tempEuler.y,
    }
    onUpdate(updatePayload)

    if (Array.isArray(islands) && onNearIsland) {
      let closest = null
      let closestDist = Infinity
      islands.forEach((island) => {
        const dx = boat.position.x - island.position[0]
        const dz = boat.position.z - island.position[2]
        const dist = Math.sqrt(dx * dx + dz * dz) - (island.radius || 40)
        if (dist < closestDist) {
          closestDist = dist
          closest = island
        }
      })
      onNearIsland({
        island: closest,
        distance: closestDist,
        boat: updatePayload,
      })
    }
    lastUpdate.current = clock.elapsedTime
  })

  return null
}

function ControlsHint({ visible }) {
  if (!visible) return null

  return (
    <div className="pointer-events-none absolute bottom-16 left-8">
      <div className={`${HUB_PANEL_CLASS} flex items-center gap-3 px-5 py-3 text-white`}>
        <div className="flex items-center gap-1 text-xs font-semibold tracking-widest text-white">
          {['W', 'A', 'S', 'D'].map((key) => (
            <span
              key={key}
              className="rounded-md border border-lime-200/70 bg-lime-100/25 px-2 py-1 shadow-[0_0_10px_rgba(132,225,188,0.45)]"
            >
              {key}
            </span>
          ))}
        </div>
        <span className={HUB_SUBTEXT_INLINE_CLASS}>Space: Brake</span>
      </div>
    </div>
  )
}

function QuestProgressBar({ discovered, total, levelInfo }) {
  const progress = total > 0 ? Math.min(1, discovered / total) : 0
  const displayProgress = Math.max(progress * 100, 4)

  return (
    <div className="pointer-events-none absolute top-[320px] right-8 w-[260px]">
      <div className={`${HUB_PANEL_CLASS} px-5 py-3 text-white`}>
        <div className="flex items-center justify-between">
          <span className={`${HUB_HEADING_CLASS} flex items-center gap-2`}>
            <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(253,224,71,0.95)]" />
            Quest • Island Exploration
          </span>
          <span className={`${HUB_HEADING_CLASS} text-white`}>
            Lv {levelInfo.level} · {discovered}/{total}
          </span>
        </div>
        <div className={`${HUB_PROGRESS_TRACK} mt-2 h-2`}>
          <div className={`${HUB_PROGRESS_FILL} shadow-none`} style={{ width: `${displayProgress}%` }} />
        </div>
        <div className={`mt-2 ${HUB_SUBTEXT_CLASS}`}>
          Rewards unlock on every island
        </div>
      </div>
    </div>
  )
}

const walkFront = new THREE.Vector2()
const walkSide = new THREE.Vector2()

function IslandWalkRig({ island, onRequestExit }) {
  const [, getKeys] = useKeyboardControls()
  const positionRef = useRef(new THREE.Vector2(0, 0))
  const avatarRef = useRef(null)
  const cameraHeightRef = useRef(island ? island.height + 14 : 18)

  useEffect(() => {
    positionRef.current.set(0, 0)
  }, [island?.id])

  useEffect(() => {
    const handleKey = (event) => {
      if (event.repeat) return
      if (event.code === 'KeyB') {
        onRequestExit()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onRequestExit])

  useFrame(({ camera }, delta) => {
    if (!island) return
    const { forward, backward, left, right } = getKeys()
    walkFront.set(0, Number(backward) - Number(forward))
    walkSide.set(Number(right) - Number(left), 0)
    const move = walkSide.add(walkFront)
    const explorationLimit = Math.max(island.radius - 4, 6)
    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(Math.max(island.radius * 0.4, 8) * delta)
      positionRef.current.add(move)
      const currentLen = positionRef.current.length()
      if (currentLen > explorationLimit) {
        positionRef.current.multiplyScalar(explorationLimit / currentLen)
      }
    }

    const worldTarget = new THREE.Vector3(
      island.position[0] + positionRef.current.x,
      island.height * 0.12,
      island.position[2] + positionRef.current.y
    )
    const targetHeight = island.height + 12
    cameraHeightRef.current = THREE.MathUtils.damp(cameraHeightRef.current, targetHeight, 4, delta)
    const cameraOffset = new THREE.Vector3(0, cameraHeightRef.current, island.radius * 0.55)
    const desiredPosition = worldTarget.clone().add(cameraOffset)
    camera.position.lerp(desiredPosition, 1 - Math.pow(0.0025, delta * 60))

    const lookTarget = worldTarget.clone().add(new THREE.Vector3(0, island.height * 0.6 + 6, 0))
    camera.lookAt(lookTarget)

    camera.rotation.z = 0

    if (avatarRef.current) {
      avatarRef.current.position.set(worldTarget.x, worldTarget.y + 0.8, worldTarget.z)
    }
  })

  if (!island) return null

  return (
    <group>
      <mesh ref={avatarRef} castShadow>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshStandardMaterial color="#f97316" roughness={0.4} metalness={0.15} emissive="#fb923c" emissiveIntensity={0.2} />
      </mesh>
    </group>
  )
}

function MiniMapOverlay({ boat, islands, walletConnected, walletAddress, onConnect, onDisconnect }) {
  const size = 150
  const radius = size / 2 - 8
  const worldRadius = 360

  const project = (x, z) => {
    const len = Math.sqrt(x * x + z * z)
    const scale = len > worldRadius ? worldRadius / len : 1
    return {
      x: (x * scale / worldRadius) * radius,
      y: (z * scale / worldRadius) * radius,
    }
  }

  const pos = project(boat.x, boat.z)
  const headingDeg = ((boat.heading ?? 0) * 180) / Math.PI * -1

  return (
    <div className="pointer-events-none absolute top-8 right-8 flex flex-col items-end gap-3">
      <div className="pointer-events-auto rounded-full border border-white/20 bg-black/35 px-4 py-2 text-white/80 backdrop-blur">
        <WalletConnect
          walletConnected={walletConnected}
          walletAddress={walletAddress}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
          variant="overlay"
        />
      </div>

      <div className="relative flex h-[150px] w-[150px] items-center justify-center rounded-full border border-white/25 bg-white/10 shadow-[0_25px_60px_rgba(15,40,80,0.55)] backdrop-blur-xl">
        <svg width={size} height={size}>
          <defs>
            <radialGradient id="oceanGlow" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="rgba(40,148,255,0.65)" />
              <stop offset="70%" stopColor="rgba(8,53,120,0.85)" />
              <stop offset="100%" stopColor="rgba(3,24,65,0.95)" />
            </radialGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="url(#oceanGlow)" stroke="rgba(165,215,255,0.45)" strokeWidth="2.5" />
          <circle cx={size / 2} cy={size / 2} r={radius * 0.66} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" strokeDasharray="6 6" />
          <circle cx={size / 2} cy={size / 2} r={radius * 0.33} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.2" strokeDasharray="4 6" />

          {islands.map((island) => {
            const projected = project(island.position[0], island.position[2])
            return (
              <g key={`island-marker-${island.id}`} transform={`translate(${size / 2 + projected.x} ${size / 2 + projected.y})`}>
                <circle cx={0} cy={0} r={4.5} fill="rgba(255,255,255,0.75)" />
                <circle cx={0} cy={0} r={3} fill={island.accent} />
              </g>
            )
          })}

          <g transform={`translate(${size / 2 + pos.x} ${size / 2 + pos.y})`}>
            <circle cx={0} cy={0} r={6} fill="#38bdf8" stroke="#fff" strokeWidth={2} />
            <g transform={`rotate(${headingDeg})`}>
              <path d="M0 -14 L-5 -3 L5 -3 Z" fill="#38bdf8" stroke="#fff" strokeWidth={1.4} strokeLinejoin="round" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  )
}

function LandingPrompt({ candidate }) {
  if (!candidate?.island) return null
  const { island } = candidate
  return (
    <div className="pointer-events-none absolute bottom-28 left-1/2 -translate-x-1/2">
      <div className={`${HUB_PANEL_CLASS} flex items-center gap-6 px-6 py-4 text-white`}>
        <div className="flex flex-col gap-1">
          <span className={HUB_HEADING_CLASS}>Approach</span>
          <span className={`${HUB_TITLE_CLASS} text-xl`}>{island.label || `Island ${island.id}`}</span>
        </div>
        <span className={HUB_SUBTEXT_INLINE_CLASS}>Press E to dock</span>
      </div>
    </div>
  )
}

function computeIslandZones(islandId, baseDapps, questList) {
  const categoryMap = {
    defi: 'DeFi',
    gaming: 'Gaming',
    infra: 'Infrastructure',
    wallet: 'Wallet',
    art: 'Art',
  }
  const category = categoryMap[islandId]
  const relevant = baseDapps.filter((dapp) =>
    !category ? true : (Array.isArray(dapp.categories) && dapp.categories.some((cat) => cat?.toLowerCase().includes(category.toLowerCase())))
  )
  const fallback = baseDapps.length ? baseDapps : relevant
  const byPopularity = [...relevant].sort(
    (a, b) => (b.tvl || b.popularityScore || 0) - (a.tvl || a.popularityScore || 0)
  )
  const byNewest = [...relevant].sort(
    (a, b) =>
      new Date(b.launchDate || b.createdAt || b.updatedAt || 0).getTime() -
      new Date(a.launchDate || a.createdAt || a.updatedAt || 0).getTime()
  )

  const incompleteQuest = (questList || []).find((quest) => quest.unlocked && !quest.completed)
  const questCategory = Array.isArray(incompleteQuest?.categories)
    ? incompleteQuest.categories[0]
    : incompleteQuest?.category

  let questCandidates = []
  if (questCategory) {
    questCandidates = baseDapps.filter(
      (dapp) =>
        Array.isArray(dapp.categories) &&
        dapp.categories.some((cat) => cat?.toLowerCase().includes(String(questCategory).toLowerCase()))
    )
  }
  if (!questCandidates || questCandidates.length === 0) {
    questCandidates = relevant.length ? relevant : fallback
  }

  return {
    hot: byPopularity.slice(0, 4),
    newcomers: byNewest.slice(0, 4),
    quest: questCandidates.slice(0, 4),
  }
}

function IslandZonesPanel() {
  return null
}

export default function SailingScene({ walletConnected, walletAddress, onConnect, onDisconnect }) {
  const boatRef = useRef(null)
  const cameraDragRef = useRef({
    active: false,
    pointerId: null,
    lastX: 0,
    lastY: 0,
    targetYaw: 0,
    targetPitch: 0,
    currentYaw: 0,
    currentPitch: 0,
  })
  const [boatState, setBoatState] = useState({ x: 0, z: 0, heading: 0 })
  const oceanSize = 520
  const [showControls, setShowControls] = useState(false)
  const [mode, setMode] = useState('sailing')
  const [landingCandidate, setLandingCandidate] = useState(null)
  const [activeIslandId, setActiveIslandId] = useState(null)
  const [boatEnabled, setBoatEnabled] = useState(true)
  const [boostActive, setBoostActive] = useState(false)
  const [isCameraDragging, setIsCameraDragging] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState(null)
  const boatSavedStateRef = useRef({
    position: new THREE.Vector3(),
    rotationY: 0,
  })

  const activeIsland = useMemo(
    () => DISTANT_ISLANDS.find((island) => island.id === activeIslandId) || null,
    [activeIslandId]
  )

  const baseDapps = useMemo(() => dAppsData.filter((dapp) => !dapp.hidden), [])

  const discoveredIslands = useQuestStore((state) =>
    Math.min(DISTANT_ISLANDS.length, state.visitedDapps?.length || 0)
  )
  const levelInfo = useQuestStore((state) => state.getLevelInfo())
  const questList = useQuestStore((state) => state.getQuestList())

  const islandZones = useMemo(
    () => (activeIsland ? computeIslandZones(activeIsland.id, baseDapps, questList) : null),
    [activeIsland, baseDapps, questList]
  )

  useEffect(() => {
    if (!selectedEntity?.id || !islandZones) return
    setSelectedEntity((prev) => {
      if (!prev?.id) return prev
      const zoneKey = prev.zoneDataKey
      if (!zoneKey) return prev
      const updatedEntries = islandZones[zoneKey] ?? prev.zoneEntries ?? []
      return {
        ...prev,
        zoneEntries: updatedEntries,
      }
    })
  }, [islandZones, selectedEntity?.id])

  const islandColliders = useMemo(
    () =>
      DISTANT_ISLANDS.map((island) => ({
        id: `island-${island.id}`,
        position: island.position,
        radius: Math.max((island.radius || 32) + 6, 20),
      })),
    []
  )

  const canvasCursorClass =
    mode === 'sailing' ? (isCameraDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-auto'

  useEffect(() => {
    if (mode === 'island') {
      setShowControls(true)
      const timeout = setTimeout(() => setShowControls(false), 5000)
      return () => clearTimeout(timeout)
    }
    setShowControls(false)
    return undefined
  }, [mode, activeIslandId])

  useEffect(() => {
    if (mode !== 'island') {
      setSelectedEntity(null)
    }
  }, [mode])

  useEffect(() => {
    const drag = cameraDragRef.current
    if (!drag) return
    if (mode !== 'sailing') {
      drag.active = false
      drag.currentYaw = 0
      drag.currentPitch = 0
      setIsCameraDragging(false)
    }
    drag.pointerId = null
    drag.lastX = 0
    drag.lastY = 0
    drag.targetYaw = 0
    drag.targetPitch = 0
  }, [mode])

  const handleExitIsland = useCallback(() => {
    if (mode !== 'island') return
    if (boatRef.current) {
      boatRef.current.visible = true
      boatRef.current.position.copy(boatSavedStateRef.current.position)
      boatRef.current.rotation.y = boatSavedStateRef.current.rotationY
    }
    setMode('sailing')
    setActiveIslandId(null)
    setBoatEnabled(true)
    setLandingCandidate(null)
    setSelectedEntity(null)
  }, [mode])

  const handleNearIsland = useCallback(
    ({ island, distance }) => {
      if (mode !== 'sailing') return
      if (island && distance < Math.max(island.radius * 0.35, 28)) {
        setLandingCandidate({ island, distance })
      } else {
        setLandingCandidate(null)
      }
    },
    [mode]
  )

  const handleSelectEntity = useCallback(
    (entity, zoneEntries = []) => {
      if (!entity || selectedEntity?.id === entity.id) {
        setSelectedEntity(null)
        return
      }
      setSelectedEntity({
        ...entity,
        zoneEntries,
      })
    },
    [selectedEntity]
  )

  const handleClearEntitySelection = useCallback(() => {
    setSelectedEntity(null)
  }, [])

  const finishCameraDrag = useCallback(() => {
    const drag = cameraDragRef.current
    if (!drag.active) return
    drag.active = false
    drag.pointerId = null
    drag.lastX = 0
    drag.lastY = 0
    drag.targetYaw = 0
    drag.targetPitch = 0
    setIsCameraDragging(false)
  }, [])

  const handlePointerDown = useCallback(
    (event) => {
      if (mode !== 'sailing' || event.button !== 0) return
      event.stopPropagation()
      const drag = cameraDragRef.current
      drag.active = true
      drag.pointerId = event.pointerId
      drag.lastX = event.clientX
      drag.lastY = event.clientY
      drag.targetYaw = drag.currentYaw || 0
      drag.targetPitch = drag.currentPitch || 0
      setIsCameraDragging(true)
      if (typeof event.target?.setPointerCapture === 'function') {
        try {
          event.target.setPointerCapture(event.pointerId)
        } catch (err) {
          /* ignore pointer capture errors */
        }
      }
    },
    [mode]
  )

  const handlePointerMove = useCallback(
    (event) => {
      const drag = cameraDragRef.current
      if (!drag.active || event.pointerId !== drag.pointerId) return
      if (mode !== 'sailing') {
        finishCameraDrag()
        return
      }
      event.stopPropagation()
      const deltaX = event.clientX - drag.lastX
      const deltaY = event.clientY - drag.lastY
      drag.lastX = event.clientX
      drag.lastY = event.clientY
      drag.targetYaw = THREE.MathUtils.clamp(
        (drag.targetYaw || 0) + deltaX * CAMERA_DRAG_CONFIG.yawSensitivity,
        -CAMERA_DRAG_CONFIG.yawLimit,
        CAMERA_DRAG_CONFIG.yawLimit
      )
      drag.targetPitch = THREE.MathUtils.clamp(
        (drag.targetPitch || 0) + deltaY * CAMERA_DRAG_CONFIG.pitchSensitivity,
        -CAMERA_DRAG_CONFIG.pitchLimit,
        CAMERA_DRAG_CONFIG.pitchLimit
      )
    },
    [finishCameraDrag, mode]
  )

  const handlePointerUp = useCallback(
    (event) => {
      const drag = cameraDragRef.current
      if (!drag.active || event.pointerId !== drag.pointerId) return
      event.stopPropagation()
      if (typeof event.target?.releasePointerCapture === 'function') {
        try {
          event.target.releasePointerCapture(event.pointerId)
        } catch (err) {
          /* ignore release errors */
        }
      }
      finishCameraDrag()
    },
    [finishCameraDrag]
  )

  const handlePointerCancel = useCallback(
    (event) => {
      const drag = cameraDragRef.current
      if (!drag.active || (event && event.pointerId !== drag.pointerId)) return
      finishCameraDrag()
    },
    [finishCameraDrag]
  )

  const handlePointerLeave = useCallback(() => {
    if (!cameraDragRef.current.active) return
    finishCameraDrag()
  }, [finishCameraDrag])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.repeat) return
      if (mode === 'sailing' && landingCandidate?.island && event.code === 'KeyE') {
        if (boatRef.current) {
          boatSavedStateRef.current.position = boatRef.current.position.clone()
          boatSavedStateRef.current.rotationY = boatRef.current.rotation.y
          boatRef.current.visible = false
        }
        setBoatEnabled(false)
        setActiveIslandId(landingCandidate.island.id)
        setMode('island')
        setLandingCandidate(null)
      }
      if (mode === 'island' && event.code === 'KeyB') {
        handleExitIsland()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mode, landingCandidate, handleExitIsland])

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div
        className={`absolute inset-0 border border-white/8 bg-gradient-to-br from-[#071126] via-[#030712] to-[#02030a] shadow-[0_45px_120px_rgba(6,15,35,0.65)] overflow-hidden ${canvasCursorClass}`}
      >
        <KeyboardControls map={keyboardMap}>
          <Canvas
            shadows
            camera={{ position: [0, 4.5, 12], fov: 55, near: 0.1, far: 500 }}
            onCreated={({ scene }) => {
              scene.fog = new THREE.FogExp2('#093a70', 0.0075)
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            onPointerCancel={handlePointerCancel}
            onPointerMissed={() => {
              if (mode === 'island') {
                handleClearEntitySelection()
              }
            }}
          >
            <color attach="background" args={['#0a2c59']} />
            <ambientLight intensity={0.32} color="#a8c8ff" />
            <directionalLight
              castShadow
              position={[15, 25, 12]}
              intensity={1.2}
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-camera-near={1}
              shadow-camera-far={160}
              shadow-camera-left={-60}
              shadow-camera-right={60}
              shadow-camera-top={60}
              shadow-camera-bottom={-60}
            />
            <directionalLight position={[-30, 18, -24]} intensity={0.35} color="#90caf9" />

            <Sky
              distance={450000}
              sunPosition={[0.25, 1.35, -0.4]}
              mieCoefficient={0.0025}
              mieDirectionalG={0.92}
              rayleigh={2.4}
              turbidity={3.2}
              inclination={0.52}
            />

            <Environment preset="dawn" background={false} />

                <Suspense fallback={null}>
              <SeaScenery size={oceanSize} islands={DISTANT_ISLANDS} />
              <ChogsBoat
                ref={boatRef}
                position={[0, 0.9, 0]}
                enabled={boatEnabled && mode === 'sailing'}
                visible={mode === 'sailing'}
                maxSpeed={boostActive ? 14 : 9}
                acceleration={boostActive ? 8 : 5.2}
                braking={boostActive ? 8 : 6.5}
                driftDamping={boostActive ? 0.987 : 0.982}
                colliders={islandColliders}
                collisionRadius={3.2}
                collisionSlideFactor={1.9}
                slideDamping={0.78}
                turnSpeed={THREE.MathUtils.degToRad(boostActive ? 90 : 75)}
              />
              {mode === 'island' && activeIsland && (
                <IslandEntities
                  island={activeIsland}
                  movementEnabled={mode === 'island'}
                  movementPaused={Boolean(selectedEntity)}
                  onSelectEntity={handleSelectEntity}
                  onClearSelection={handleClearEntitySelection}
                  zoneData={islandZones}
                  selectedEntity={selectedEntity}
                />
              )}
            </Suspense>

            {mode === 'sailing' ? (
              <>
                <BoatCameraRig boatRef={boatRef} cameraDragRef={cameraDragRef} />
                <BoatTracker
                  boatRef={boatRef}
                  islands={DISTANT_ISLANDS}
                  onUpdate={setBoatState}
                  onNearIsland={handleNearIsland}
                />
              </>
            ) : (
              <IslandWalkRig island={activeIsland} onRequestExit={handleExitIsland} />
            )}
          </Canvas>
        </KeyboardControls>
      </div>

      <div className="pointer-events-none absolute top-6 left-6 w-[320px] text-white/80">
        <div className={`${HUB_PANEL_CLASS} px-5 py-4 text-white`}>
          <div className="flex items-center justify-between">
            <span className={HUB_HEADING_CLASS}>Chog&apos;s Immersive Gallery</span>
            <span className={HUB_BADGE_CLASS}>Monad Expedition</span>
          </div>
          <h2 className={`${HUB_TITLE_CLASS} mt-2`}>Embark on the Monad Voyage</h2>
          <p className={`${HUB_BODY_CLASS} mt-2`}>
            {mode === 'sailing'
              ? 'Scan the horizon — glowing islands mark new adventures.'
              : 'You have docked — explore zones and discover featured dApps.'}
          </p>
        </div>
      </div>

      {mode === 'sailing' ? (
        <>
          <MiniMapOverlay
            boat={boatState}
            islands={DISTANT_ISLANDS}
            walletConnected={walletConnected}
            walletAddress={walletAddress}
            onConnect={onConnect}
            onDisconnect={onDisconnect}
          />
          <LandingPrompt candidate={landingCandidate} />
          <div className="pointer-events-none absolute bottom-16 left-8">
            <div className={`${HUB_PANEL_CLASS} flex items-center gap-3 px-5 py-3 text-white`}>
              <button
                type="button"
                onClick={() => setBoostActive((prev) => !prev)}
                className={boostActive ? HUB_BUTTON_ACTIVE : HUB_BUTTON_INACTIVE}
              >
                {boostActive ? 'Boost x2' : 'Boost x1'}
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <ControlsHint visible={showControls} />
          <div className="pointer-events-none absolute top-6 right-6 w-[240px] text-white">
            <div className={`${HUB_PANEL_CLASS} px-5 py-3 text-white`}>
              <div className="flex items-center justify-between">
                <span className={HUB_HEADING_CLASS}>Docked</span>
                <span className={HUB_BADGE_CLASS}>Island Mode</span>
              </div>
              <p className={`${HUB_BODY_CLASS} mt-2`}>
                Press <span className="font-semibold text-white">B</span> to return to the ocean.
              </p>
            </div>
          </div>
        </>
      )}

      {mode === 'sailing' && (
        <QuestProgressBar
          discovered={discoveredIslands}
          total={DISTANT_ISLANDS.length}
          levelInfo={levelInfo}
        />
      )}
    </div>
  )
}


