import { Suspense } from 'react'
import { useGLTF } from '@react-three/drei'

function SeaMarkerModel({ modelPath, scale = [1, 1, 1], rotation = [0, 0, 0], offset = [0, 0, 0] }) {
  const gltf = useGLTF(modelPath)
  return (
    <group position={offset} scale={scale} rotation={rotation}>
      <primitive object={gltf.scene} dispose={null} />
    </group>
  )
}

export default function SeaMarkers({ markers = [], candidateId, activeMarker }) {
  if (!Array.isArray(markers) || markers.length === 0) return null

  return (
    <group>
      {markers.map((marker) => {
        const isCandidate = candidateId === marker.id
        const isActive = activeMarker?.id === marker.id
        const scaleBase = marker.collisionRadius
          ? Math.max(2.2, marker.collisionRadius * 0.7)
          : marker.scale ?? 2.2
        const scaleHeight = scaleBase * 0.65
        const color = marker.color ?? '#38bdf8'

        return (
          <group key={marker.id} position={marker.position}>
            {marker.modelPath ? (
              <Suspense fallback={null}>
                <SeaMarkerModel
                  modelPath={marker.modelPath}
                  scale={marker.modelScale || [1, 1, 1]}
                  rotation={marker.modelRotation || [0, 0, 0]}
                  offset={marker.modelOffset || [0, 0, 0]}
                />
              </Suspense>
            ) : (
              <>
                <mesh scale={[scaleBase, scaleHeight, scaleBase]}>
                  <cylinderGeometry args={[1, 1, 2.4, 24]} />
                  <meshStandardMaterial
                    color={color}
                    metalness={0.35}
                    roughness={0.5}
                    emissive={color}
                    emissiveIntensity={0.25}
                  />
                </mesh>
                <mesh position={[0, scaleHeight * 1.25, 0]} scale={scaleBase * 0.65}>
                  <icosahedronGeometry args={[1.1, 0]} />
                  <meshStandardMaterial
                    color="#0f172a"
                    roughness={0.55}
                    metalness={0.25}
                    emissive={color}
                    emissiveIntensity={0.15}
                  />
                </mesh>
              </>
            )}

            {(isCandidate || isActive) && (
              <mesh position={[0, scaleHeight * 0.3, 0]} scale={[scaleBase * 1.2, scaleHeight * 0.18, scaleBase * 1.2]}>
                <cylinderGeometry args={[1, 1, 0.3, 28, 1, true]} />
                <meshBasicMaterial color={color} transparent opacity={isActive ? 0.42 : 0.28} depthWrite={false} />
              </mesh>
            )}

          </group>
        )
      })}
    </group>
  )
}

