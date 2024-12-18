import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { steamVertexShader, steamFragmentShader } from '@/lib/shaders/steam';

interface SceneProps {
  model: THREE.Group | null;
  settings: {
    steamIntensity: number;
    steamSpeed: number;
    steamDensity: number;
    autoRotate: boolean;
  };
}

export default function Scene({ model, settings }: SceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const controlsRef = useRef<OrbitControls>();
  const steamParticlesRef = useRef<THREE.Points>();
  const modelRef = useRef<THREE.Group>();
  const frameIdRef = useRef<number>();

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2, 5);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Steam particles
    const steamGeometry = new THREE.BufferGeometry();
    const steamParticles = new Float32Array(settings.steamDensity * 3);
    const steamVelocities = new Float32Array(settings.steamDensity * 3);

    for (let i = 0; i < settings.steamDensity; i++) {
      const i3 = i * 3;
      steamParticles[i3] = (Math.random() - 0.5) * 1.0;
      steamParticles[i3 + 1] = Math.random() * 0.5;
      steamParticles[i3 + 2] = (Math.random() - 0.5) * 1.0;
      
      steamVelocities[i3] = (Math.random() - 0.5) * 0.005;
      steamVelocities[i3 + 1] = Math.random() * 0.01;
      steamVelocities[i3 + 2] = (Math.random() - 0.5) * 0.005;
    }

    steamGeometry.setAttribute('position', new THREE.BufferAttribute(steamParticles, 3));
    steamGeometry.setAttribute('velocity', new THREE.BufferAttribute(steamVelocities, 3));

    const steamMaterial = new THREE.ShaderMaterial({
      vertexShader: steamVertexShader,
      fragmentShader: steamFragmentShader,
      transparent: true,
      uniforms: {
        time: { value: 0 },
        intensity: { value: settings.steamIntensity },
        speed: { value: settings.steamSpeed }
      }
    });

    const steamPoints = new THREE.Points(steamGeometry, steamMaterial);
    scene.add(steamPoints);
    steamParticlesRef.current = steamPoints;

    // Animation loop
    function animate() {
      frameIdRef.current = requestAnimationFrame(animate);

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (steamParticlesRef.current) {
        const material = steamParticlesRef.current.material as THREE.ShaderMaterial;
        material.uniforms.time.value += 0.01;
      }

      if (modelRef.current && settings.autoRotate) {
        modelRef.current.rotation.y += 0.001;
      }

      renderer.render(scene, camera);
    }

    animate();

    // Cleanup
    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      
      renderer.dispose();
      scene.clear();
      
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    function handleResize() {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();

      rendererRef.current.setSize(width, height);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update model
  useEffect(() => {
    if (!model || !sceneRef.current) return;

    if (modelRef.current) {
      sceneRef.current.remove(modelRef.current);
    }

    // Position and scale the model
    model.scale.set(0.5, 0.5, 0.5);
    model.position.set(0, 0, 0);
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    sceneRef.current.add(model);
    modelRef.current = model;
  }, [model]);

  // Update settings
  useEffect(() => {
    if (!steamParticlesRef.current) return;

    const steamMaterial = steamParticlesRef.current.material as THREE.ShaderMaterial;
    steamMaterial.uniforms.intensity.value = settings.steamIntensity;
    steamMaterial.uniforms.speed.value = settings.steamSpeed;
  }, [settings]);

  return <div ref={containerRef} className="w-full h-full" />;
}
