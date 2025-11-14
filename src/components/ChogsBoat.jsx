import { forwardRef, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Trail, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

function BoatModelVisual({ path, scale = [1, 1, 1], rotation = [0, 0, 0], offset = [0, 0, 0] }) {
  const gltf = useGLTF(path)
  return (
    <group position={offset} scale={scale} rotation={rotation}>
      <primitive object={gltf.scene} dispose={null} />
    </group>
  )
}

const KEY_BINDINGS = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'backward',
  ArrowDown: 'backward',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  Space: 'brake',
}

function useBoatControls() {
  const pressedRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
  })

  useEffect(() => {
    const handleKeyDown = (event) => {
      const action = KEY_BINDINGS[event.code]
      if (!action) return
      pressedRef.current[action] = true
    }

    const handleKeyUp = (event) => {
      const action = KEY_BINDINGS[event.code]
      if (!action) return
      pressedRef.current[action] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return pressedRef
}

const forwardVector = new THREE.Vector3()
const tempMotion = new THREE.Vector3()
const tempPosition = new THREE.Vector3()
const tempVec2 = new THREE.Vector2()
const tempVec2B = new THREE.Vector2()
const tempVec2T = new THREE.Vector2()

const assignRef = (ref, value) => {
  if (!ref) return
  if (typeof ref === 'function') {
    ref(value)
  } else {
    ref.current = value
  }
}

const ChogsBoat = forwardRef(function ChogsBoat(
  {
    maxSpeed = 6,
    acceleration = 3.5,
    braking = 6,
    turnSpeed = THREE.MathUtils.degToRad(60),
    driftDamping = 0.98,
    bodyColor = '#f97316',
    trimColor = '#0f172a',
    position = [0, 0.9, 0],
    enabled = true,
    visible = true,
    colliders = [],
    collisionRadius = 2.8,
    collisionSlideFactor = 1.8,
    slideDamping = 0.78,
    modelPath = null,
    modelScale = [1, 1, 1],
    modelRotation = [0, 0, 0],
    modelOffset = [0, 0, 0],
  },
  ref
) {
  const boatRef = useRef(null)
  const velocityRef = useRef(0)
  const controlsRef = useBoatControls()
  const slideRef = useRef(new THREE.Vector2(0, 0))
  const currentTurnRateRef = useRef(0)

  useEffect(() => {
    assignRef(ref, boatRef.current)
    return () => assignRef(ref, null)
  }, [ref])

  useEffect(() => {
    if (!enabled) {
      velocityRef.current = 0
      slideRef.current.set(0, 0)
    }
  }, [enabled])

  const hullGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0.6)
    shape.lineTo(-0.9, 0.24)
    shape.lineTo(-1.05, -0.18)
    shape.lineTo(-0.7, -0.62)
    shape.lineTo(0, -0.78)
    shape.lineTo(0.7, -0.62)
    shape.lineTo(1.05, -0.18)
    shape.lineTo(0.9, 0.24)
    shape.lineTo(0, 0.6)

    const extrudeSettings = {
      depth: 2.4,
      bevelEnabled: false,
    }
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    geometry.center()
    geometry.rotateX(Math.PI / 2)
    geometry.rotateZ(Math.PI)
    return geometry
  }, [])

  const deckGeometry = useMemo(() => {
    const geometry = new THREE.BoxGeometry(1.6, 0.22, 2.6)
    geometry.translate(0, 0.45, 0)
    return geometry
  }, [])

  const canopyGeometry = useMemo(() => {
    const geometry = new THREE.CylinderGeometry(0.3, 0.55, 1.6, 6, 1, true)
    geometry.rotateZ(Math.PI / 2)
    geometry.translate(0, 0.92, -0.15)
    return geometry
  }, [])

  const sailGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const vertices = new Float32Array([
      0, 0, 0,
      0, 2.5, 0,
      -1.5, 1.2, 0,
    ])
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    geometry.computeVertexNormals()
    return geometry
  }, [])

  useFrame((_, delta) => {
    if (!boatRef.current || !enabled) return

    const { forward, backward, left, right, brake } = controlsRef.current
    const velocity = velocityRef.current

    let targetAcceleration = 0
    if (forward) targetAcceleration += acceleration
    if (backward) targetAcceleration -= acceleration * 0.6

    let nextVelocity = velocity + targetAcceleration * delta

    if (!forward && !backward) {
      const damping = Math.pow(driftDamping, delta * 60)
      nextVelocity *= damping
    }

    if (brake) {
      const reduction = braking * delta
      nextVelocity =
        nextVelocity > 0 ? Math.max(0, nextVelocity - reduction) : Math.min(0, nextVelocity + reduction)
    }

    nextVelocity = THREE.MathUtils.clamp(nextVelocity, -maxSpeed * 0.55, maxSpeed)
    velocityRef.current = nextVelocity

    const speedFactor = THREE.MathUtils.clamp(Math.abs(nextVelocity) / maxSpeed, 0, 1)
    const turning = (left ? 1 : 0) - (right ? 1 : 0)
    const currentTurnRate = currentTurnRateRef.current
    
    let targetTurnRate = 0
    if (turning !== 0 && Math.abs(nextVelocity) > 0.01) {
      targetTurnRate = turning * turnSpeed * (0.35 + speedFactor * 0.65)
    }
    
    const turnAcceleration = turnSpeed * 2.4
    const turnDamping = 5.2
    const turnDelta = targetTurnRate - currentTurnRate
    
    let nextTurnRate = currentTurnRate
    if (Math.abs(turnDelta) > 0.001) {
      if (targetTurnRate === 0) {
        nextTurnRate = THREE.MathUtils.damp(currentTurnRate, 0, turnDamping, delta)
      } else {
        const accelDirection = Math.sign(turnDelta)
        const accelAmount = Math.min(Math.abs(turnDelta), turnAcceleration * delta)
        nextTurnRate = currentTurnRate + accelDirection * accelAmount
      }
    }
    
    currentTurnRateRef.current = nextTurnRate
    
    if (Math.abs(nextTurnRate) > 0.001) {
      boatRef.current.rotation.y += nextTurnRate * delta
    }

    const slideVector = slideRef.current
    if (slideVector.lengthSq() > 1e-6) {
      const dampingFactor = Math.pow(slideDamping, delta * 60)
      slideVector.multiplyScalar(dampingFactor)
      if (slideVector.lengthSq() < 1e-5) {
        slideVector.set(0, 0)
      }
    }

    forwardVector.set(0, 0, -1).applyQuaternion(boatRef.current.quaternion)
    tempMotion.set(forwardVector.x, 0, forwardVector.z).multiplyScalar(nextVelocity * delta)
    tempMotion.x += slideVector.x * delta
    tempMotion.z += slideVector.y * delta
    tempPosition.copy(boatRef.current.position).add(tempMotion)

    let collided = false
    if (Array.isArray(colliders) && colliders.length > 0) {
      for (let i = 0; i < colliders.length; i += 1) {
        const collider = colliders[i]
        if (!collider) continue
        const sourcePos = Array.isArray(collider.position) ? collider.position : null
        const colliderRadius = Number(collider.radius) || 0
        if (!sourcePos || sourcePos.length < 2 || colliderRadius <= 0) continue
        const colliderX = sourcePos[0]
        const colliderZ = sourcePos.length > 2 ? sourcePos[2] : sourcePos[1]

        tempVec2.set(tempPosition.x - colliderX, tempPosition.z - colliderZ)
        const minDistance = colliderRadius + collisionRadius
        if (tempVec2.lengthSq() > minDistance * minDistance) continue

        const distance = tempVec2.length() || 0.0001
        const penetration = minDistance - distance
        tempVec2.divideScalar(distance)

        tempPosition.x = colliderX + tempVec2.x * minDistance
        tempPosition.z = colliderZ + tempVec2.y * minDistance

        tempVec2B.set(forwardVector.x, forwardVector.z)
        const tangent = tempVec2T.set(-tempVec2.y, tempVec2.x)
        if (tempVec2B.dot(tangent) < 0) {
          tangent.multiplyScalar(-1)
        }
        if (tangent.lengthSq() > 0) {
          tangent.normalize()
          const speedMagnitude = Math.abs(nextVelocity)
          const slideDistance = Math.max(speedMagnitude * delta * 1.4, penetration * 0.75)
          tempPosition.x += tangent.x * slideDistance
          tempPosition.z += tangent.y * slideDistance
          const slideStrength = Math.max(
            speedMagnitude * collisionSlideFactor + penetration * 2.7,
            speedMagnitude * 1.35,
            3.4
          )
          slideVector.set(tangent.x * slideStrength, tangent.y * slideStrength)
        }

        const directionSign = nextVelocity >= 0 ? 1 : -1
        const preservedSpeed = Math.abs(nextVelocity) * 0.965
        nextVelocity = directionSign * preservedSpeed
        collided = true
      }
    }

    boatRef.current.position.copy(tempPosition)
    velocityRef.current = nextVelocity
  })

  return (
    <group ref={boatRef} position={position} rotation={[0, Math.PI, 0]} visible={visible}>
      {modelPath ? (
        <BoatModelVisual path={modelPath} scale={modelScale} rotation={modelRotation} offset={modelOffset} />
      ) : (
        <>
          <mesh geometry={hullGeometry} castShadow receiveShadow>
            <meshStandardMaterial color={bodyColor} metalness={0.22} roughness={0.68} />
          </mesh>

          <mesh geometry={deckGeometry} castShadow receiveShadow>
            <meshStandardMaterial color={trimColor} metalness={0.3} roughness={0.4} />
          </mesh>

          <mesh geometry={canopyGeometry} castShadow receiveShadow>
            <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.15} side={THREE.DoubleSide} />
          </mesh>

          <mesh position={[0, 1.35, 0.15]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 3, 8]} />
            <meshStandardMaterial color="#facc15" roughness={0.38} metalness={0.5} />
          </mesh>

          <mesh position={[0, 0.18, 0.9]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.25, 0.08, 1.2, 6]} />
            <meshStandardMaterial color="#1f2937" roughness={0.55} metalness={0.25} />
          </mesh>

          <mesh geometry={sailGeometry} position={[0.02, 1.2, 0.4]} castShadow>
            <meshStandardMaterial
              color="#e0f2fe"
              roughness={0.28}
              metalness={0.05}
              side={THREE.DoubleSide}
              emissive="#bae6fd"
              emissiveIntensity={0.22}
            />
          </mesh>

          <mesh geometry={sailGeometry} position={[0.02, 1.2, 0.4]} rotation={[0, Math.PI, 0]} castShadow>
            <meshStandardMaterial
              color="#e0f2fe"
              roughness={0.28}
              metalness={0.05}
              side={THREE.DoubleSide}
              emissive="#bae6fd"
              emissiveIntensity={0.2}
            />
          </mesh>

          <mesh position={[0, 2.5, 0.38]} rotation={[0, Math.PI / 10, 0]} castShadow>
            <planeGeometry args={[0.7, 0.4]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#0ea5e9"
              emissiveIntensity={0.55}
              side={THREE.DoubleSide}
            />
          </mesh>
        </>
      )}

      <Trail width={0.9} length={6} decay={0.7} color="#8be9ff" attenuation={(t) => Math.pow(1 - t, 1.8)}>
        <mesh position={[0, 0.15, -1.2]}>
          <sphereGeometry args={[0.02, 6, 6]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </Trail>
    </group>
  )
})

export default ChogsBoat


