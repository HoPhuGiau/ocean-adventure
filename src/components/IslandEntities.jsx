import { useMemo, useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { islandEntitiesConfig } from '../utils/islandEntities'

const tempVec3 = new THREE.Vector3()

const ENTITY_BOX_SIZE = [1.6, 1.6, 1.6]
const ENTITY_OUTLINE_SCALE = 1.18

function deriveEntities(island) {
  if (!island?.id) return []
  const rawEntities = islandEntitiesConfig[island.id] || []
  const radius = island.radius || 30
  const height = island.height || 0
  const islandPos = Array.isArray(island.position) ? island.position : [0, 0, 0]
  const margin = Math.max(4, radius * 0.18)

  return rawEntities.map((entity) => {
    const anchor = entity.anchor || {}
    const angle = anchor.angle ?? 0
    const distanceFactor = THREE.MathUtils.clamp(anchor.distance ?? 0.45, 0.15, 0.85)
    const maximumDistance = Math.max(radius - margin, radius * 0.4)
    const baseDistance = Math.min(maximumDistance, radius * distanceFactor)
    const islandSurface = islandPos[1] + height
    const verticalOffset = anchor.height ?? 1.6
    const centerPosition = [
      islandPos[0] + Math.cos(angle) * baseDistance,
      islandSurface + verticalOffset,
      islandPos[2] + Math.sin(angle) * baseDistance,
    ]

    let movement = null
    if (entity.movement) {
      const allowance = Math.max(0, (radius - margin) - baseDistance)
      const orbitRadius = Math.min(entity.movement.radius ?? 0, allowance)
      if (orbitRadius > 0.05) {
        movement = {
          ...entity.movement,
          radius: orbitRadius,
        }
      }
    }

    return {
      ...entity,
      centerPosition,
      movement,
    }
  })
}

export default function IslandEntities({
  island,
  movementEnabled,
  movementPaused,
  zoneData,
  selectedEntity,
  onSelectEntity,
  onClearSelection,
}) {
  const [hoveredId, setHoveredId] = useState(null)
  const [pressedId, setPressedId] = useState(null)
  const entityRefs = useRef([])
  const angleRefs = useRef([])

  const entities = useMemo(() => deriveEntities(island), [island])

  useEffect(() => {
    entityRefs.current = []
    angleRefs.current = entities.map(() => Math.random() * Math.PI * 2)
  }, [entities])

  useFrame((_, delta) => {
    if (!movementEnabled || movementPaused) return
    entities.forEach((entity, index) => {
      if (!entity.movement) return
      const ref = entityRefs.current[index]
      if (!ref) return

      const angle = angleRefs.current[index] + delta * entity.movement.speed * Math.PI
      angleRefs.current[index] = angle

      const radius = entity.movement.radius
      const center = entity.centerPosition
      tempVec3.set(
        center[0] + Math.cos(angle) * radius,
        center[1],
        center[2] + Math.sin(angle) * radius
      )
      ref.position.lerp(tempVec3, 1 - Math.pow(0.0025, delta * 60))
      ref.rotation.y += delta * 0.6
    })
  })

  if (!entities.length) return null

  return (
    <group>
      {entities.map((entity, index) => {
        const isSelected = selectedEntity?.id === entity.id
        const isHovered = hoveredId === entity.id
        const isPressed = pressedId === entity.id
        const showHighlight = isSelected || isHovered || isPressed
        const highlightOpacity = isSelected ? 0.45 : isPressed ? 0.4 : 0.3
        const zoneEntries =
          isSelected && selectedEntity?.zoneEntries
            ? selectedEntity.zoneEntries
            : entity.zoneDataKey && zoneData
              ? zoneData[entity.zoneDataKey] ?? []
              : []
        return (
          <group
            key={entity.id}
            ref={(node) => {
              if (node) {
                entityRefs.current[index] = node
                node.position.set(entity.centerPosition[0], entity.centerPosition[1], entity.centerPosition[2])
              }
            }}
            position={entity.centerPosition}
            onPointerOver={(event) => {
              event.stopPropagation()
              setHoveredId(entity.id)
            }}
            onPointerOut={(event) => {
              event.stopPropagation()
              setHoveredId((prev) => (prev === entity.id ? null : prev))
              setPressedId((prev) => (prev === entity.id ? null : prev))
            }}
            onPointerDown={(event) => {
              event.stopPropagation()
              setPressedId(entity.id)
            }}
            onPointerUp={(event) => {
              event.stopPropagation()
              setPressedId((prev) => (prev === entity.id ? null : prev))
            }}
            onClick={(event) => {
              event.stopPropagation()
              onSelectEntity(entity, zoneEntries)
            }}
          >
            <mesh scale={ENTITY_BOX_SIZE}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial
                color={entity.color}
                metalness={0.35}
                roughness={0.4}
                emissive={entity.color}
                emissiveIntensity={0.18}
              />
            </mesh>
            {showHighlight && (
              <mesh scale={ENTITY_BOX_SIZE.map((val) => val * ENTITY_OUTLINE_SCALE)}>
                <boxGeometry args={[1, 1, 1]} />
                <meshBasicMaterial color={entity.color} transparent opacity={highlightOpacity} depthWrite={false} />
              </mesh>
            )}
            {isSelected && (
              <Html
                position={[0, ENTITY_BOX_SIZE[1] * 0.6 + 2.4, 0]}
                distanceFactor={24}
                center
              >
                <div className="pointer-events-auto w-[640px] max-w-[85vw] rounded-2xl border border-lime-200/70 bg-emerald-900/95 px-8 py-6 text-emerald-50 shadow-[0_0_60px_rgba(34,197,94,0.65)] backdrop-blur">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-100">
                          {entity.zoneSection || 'Zone'}
                        </p>
                        <h4 className="text-lg font-semibold text-white">{entity.name}</h4>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          onClearSelection()
                        }}
                        className="rounded-full border border-emerald-100/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-100 hover:bg-emerald-100/20"
                      >
                        Close
                      </button>
                    </div>
                    <p className="text-[13px] leading-relaxed text-emerald-100/90">
                      {entity.description || 'Interact to reveal zone content.'}
                    </p>
                    {Array.isArray(zoneEntries) && zoneEntries.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3">
                        {zoneEntries.map((entry) => (
                          <a
                            key={entry.id}
                            href={entry.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 rounded-[18px] border border-emerald-100/30 bg-emerald-900/40 px-4 py-3 text-sm text-white transition hover:bg-emerald-800/50"
                          >
                            <div className="h-10 w-10 overflow-hidden rounded-xl border border-white/15 bg-white/10">
                              {entry.logoImage ? (
                                <img src={entry.logoImage} alt={entry.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-white/70">
                                  {entry.name?.slice(0, 2)?.toUpperCase() || 'DApp'}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-white drop-shadow-[0_0_10px_rgba(132,225,188,0.65)]">
                                {entry.name}
                              </p>
                              <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-100">
                                {(entry.categories || []).slice(0, 2).join(' • ') || 'Monad'}
                              </p>
                            </div>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100">
                              ↗
                            </span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[12px] text-emerald-100/70">
                        Zone data is loading. Please check back later.
                      </p>
                    )}
                  </div>
                </div>
              </Html>
            )}
          </group>
        )
      })}
    </group>
  )
}

