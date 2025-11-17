import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { extend, useFrame } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'

const WaterMaterial = shaderMaterial(
  {
    uTime: 0,
    uWaveHeight: 0.52,
    uWaveScale: 0.24,
    uWaveSpeed: 0.65,
    uColorDeep: new THREE.Color('#2a9fd4'),
    uColorShallow: new THREE.Color('#87ceeb'),
    uSunDirection: new THREE.Vector3(0.45, 1.3, 0.18).normalize(),
    uFoamThreshold: 0.42,
  },
  /* glsl */ `
    precision highp float;

    uniform float uTime;
    uniform float uWaveHeight;
    uniform float uWaveScale;
    uniform float uWaveSpeed;

    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying float vElevation;

    vec3 computeNormal(vec2 position, float time) {
      vec2 pos = position * uWaveScale;
      
      float waveA = sin(pos.x * 1.0 + time * uWaveSpeed * 1.0);
      float waveB = cos(pos.y * 1.0 - time * uWaveSpeed * 1.3);
      float waveC = sin((pos.x + pos.y) * 0.7 - time * uWaveSpeed * 0.8);
      float waveD = cos((pos.x - pos.y) * 0.8 + time * uWaveSpeed * 0.9);
      float waveE = sin(pos.x * 1.5 + pos.y * 0.5 - time * uWaveSpeed * 1.1);
      float waveF = cos(pos.y * 1.3 + pos.x * 0.6 + time * uWaveSpeed * 0.7);
      
      float dHdX = uWaveHeight * (
        cos(pos.x * 1.0 + time * uWaveSpeed * 1.0) * uWaveScale * 1.0 +
        cos((pos.x + pos.y) * 0.7 - time * uWaveSpeed * 0.8) * uWaveScale * 0.7 +
        cos((pos.x - pos.y) * 0.8 + time * uWaveSpeed * 0.9) * uWaveScale * 0.8 +
        cos(pos.x * 1.5 + pos.y * 0.5 - time * uWaveSpeed * 1.1) * uWaveScale * 1.5
      ) / 4.0;

      float dHdY = uWaveHeight * (
        -sin(pos.y * 1.0 - time * uWaveSpeed * 1.3) * uWaveScale * 1.0 +
        cos((pos.x + pos.y) * 0.7 - time * uWaveSpeed * 0.8) * uWaveScale * 0.7 +
        -sin((pos.x - pos.y) * 0.8 + time * uWaveSpeed * 0.9) * uWaveScale * 0.8 +
        -sin(pos.y * 1.3 + pos.x * 0.6 + time * uWaveSpeed * 0.7) * uWaveScale * 1.3
      ) / 4.0;

      vec3 tangentX = normalize(vec3(1.0, 0.0, dHdX));
      vec3 tangentY = normalize(vec3(0.0, 1.0, dHdY));
      return normalize(cross(tangentY, tangentX));
    }

    void main() {
      vec3 pos = position;
      vec2 pos2D = position.xy * uWaveScale;

      float waveA = sin(pos2D.x * 1.0 + uTime * uWaveSpeed * 1.0);
      float waveB = cos(pos2D.y * 1.0 - uTime * uWaveSpeed * 1.3);
      float waveC = sin((pos2D.x + pos2D.y) * 0.7 - uTime * uWaveSpeed * 0.8);
      float waveD = cos((pos2D.x - pos2D.y) * 0.8 + uTime * uWaveSpeed * 0.9);
      float waveE = sin(pos2D.x * 1.5 + pos2D.y * 0.5 - uTime * uWaveSpeed * 1.1);
      float waveF = cos(pos2D.y * 1.3 + pos2D.x * 0.6 + uTime * uWaveSpeed * 0.7);
      
      float elevation = (waveA + waveB + waveC + waveD + waveE * 0.7 + waveF * 0.7) / 5.4 * uWaveHeight;

      pos.z += elevation;

      vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
      vWorldPosition = worldPosition.xyz;
      vElevation = elevation;

      vec3 localNormal = computeNormal(position.xy, uTime);
      vNormal = normalize(normalMatrix * localNormal);

      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  /* glsl */ `
    precision highp float;

    uniform vec3 uColorDeep;
    uniform vec3 uColorShallow;
    uniform vec3 uSunDirection;
    uniform float uFoamThreshold;

    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying float vElevation;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 sunDir = normalize(uSunDirection);
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);

      float diffuse = max(dot(normal, sunDir), 0.0);
      vec3 halfway = normalize(sunDir + viewDir);
      float specular = pow(max(dot(normal, halfway), 0.0), 48.0);

      float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);
      float foam = smoothstep(uFoamThreshold - 0.05, uFoamThreshold + 0.05, abs(vElevation));

      float colorMix = clamp((vElevation * 1.8) + 0.45, 0.0, 1.0);
      vec3 baseColor = mix(uColorDeep, uColorShallow, colorMix);

      float smoothDiffuse = mix(0.98, 1.08, smoothstep(-0.3, 0.3, diffuse * 0.4));
      vec3 lighting = baseColor * smoothDiffuse * 1.08 + vec3(0.92, 0.95, 0.98) * specular * 0.12;
      vec3 foamColor = mix(vec3(0.92, 0.96, 1.0), baseColor * 1.05, 0.7);

      vec3 finalColor = mix(lighting, foamColor, foam * 0.15 + fresnel * 0.04);
      finalColor += fresnel * 0.08;
      finalColor = max(finalColor, baseColor * 0.92);

      gl_FragColor = vec4(finalColor, 0.92);
    }
  `
)

extend({ WaterMaterial })

export default function Water({
  size = 400,
  resolution = 256,
  position = [0, 0, 0],
  materialConfig = {},
}) {
  const materialRef = useRef(null)

  const geometryArgs = useMemo(() => [size, size, resolution, resolution], [size, size, resolution, resolution])

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uTime += delta
    }
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={position} receiveShadow>
      <planeGeometry args={geometryArgs} />
      <waterMaterial ref={materialRef} transparent {...materialConfig} />
    </mesh>
  )
}


