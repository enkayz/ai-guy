import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export type DemosceneCanvasProps = {
  /** Pause the animation loop without tearing down the scene */
  isPaused?: boolean;
  /** Adjusts how energetic the shader animation appears */
  intensity?: number;
  className?: string;
};

function supportsWebGL() {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return !!gl;
  } catch (error) {
    return false;
  }
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;

  // Simple 2D noise helpers
  vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float noise(vec2 p) {
    const float K1 = 0.366025404; // (sqrt(3)-1)/2
    const float K2 = 0.211324865; // (3-sqrt(3))/6
    vec2 i = floor(p + (p.x + p.y) * K1);
    vec2 a = p - i + (i.x + i.y) * K2;
    vec2 o = (a.x > a.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0 * K2;
    vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
    vec3 n = h * h * h * h * vec3(dot(a, hash(i)), dot(b, hash(i + o)), dot(c, hash(i + 1.0)));
    return dot(n, vec3(70.0));
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float t = uTime * 0.1;
    float intensity = mix(0.6, 1.4, clamp(uIntensity, 0.0, 2.0));

    float n = 0.0;
    vec2 p = uv * 1.5;
    for (int i = 0; i < 5; i++) {
      float f = float(i);
      float speed = 0.3 + f * 0.05;
      n += noise(p + vec2(t * speed, -t * 0.4)) / (f + 1.0);
      p = mat2(1.2, -1.1, 1.1, 1.2) * p * 1.2;
    }

    float glow = smoothstep(0.0, 1.0, n * intensity + 0.3);
    vec3 baseColor = mix(vec3(0.08, 0.05, 0.18), vec3(0.08, 0.2, 0.45), uv.y * 0.5 + 0.5);
    vec3 accent = vec3(0.52, 0.3, 0.9);
    vec3 color = baseColor + glow * accent;

    color += 0.1 * sin(vec3(0.7, 0.9, 1.1) * (n * 5.0 + t * 2.0));
    color = pow(color, vec3(0.9));

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function DemosceneCanvas({
  isPaused = false,
  intensity = 1,
  className = ""
}: DemosceneCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial>();
  const isPausedRef = useRef(isPaused);
  const [hasWebGL, setHasWebGL] = useState(() => supportsWebGL());

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    setHasWebGL(supportsWebGL());
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!hasWebGL || !canvas) {
      return;
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: intensity }
      },
      vertexShader,
      fragmentShader,
      transparent: true
    });

    materialRef.current = material;
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const clock = new THREE.Clock();
    let animationFrameId = 0;

    const handleResize = () => {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    const renderLoop = () => {
      if (!isPausedRef.current) {
        material.uniforms.uTime.value = clock.getElapsedTime();
      }
      renderer.render(scene, camera);
      animationFrameId = window.requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [hasWebGL]);

  useEffect(() => {
    const material = materialRef.current;
    if (material) {
      material.uniforms.uIntensity.value = intensity;
    }
  }, [intensity]);

  if (!hasWebGL) {
    return (
      <div
        className={`demoscene-fallback ${className}`.trim()}
        aria-hidden="true"
        role="presentation"
      ></div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`demoscene-canvas ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
