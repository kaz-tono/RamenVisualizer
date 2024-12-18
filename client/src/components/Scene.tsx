import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { pointCloudVertexShader, pointCloudFragmentShader } from '@/lib/shaders/pointCloud';
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
  const sceneRef = useRef<THREE.Scene>(new THREE.Scene());
  const cameraRef = useRef<THREE.PerspectiveCamera>(new THREE.PerspectiveCamera());
  const rendererRef = useRef<THREE.WebGLRenderer>();
  sceneRef.current = sceneRef.current || new THREE.Scene();
  const controlsRef = useRef<OrbitControls>();
  const steamParticlesRef = useRef<THREE.Points>();
  const modelRef = useRef<THREE.Group>();

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    camera.position.z = 5;
    
    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Steam particles
    const steamGeometry = new THREE.BufferGeometry();
    const steamParticles = new Float32Array(settings.steamDensity * 3);
    const steamVelocities = new Float32Array(settings.steamDensity * 3);

    for (let i = 0; i < settings.steamDensity; i++) {
      const i3 = i * 3;
      // Adjust steam particle spawn area to match model size
      steamParticles[i3] = (Math.random() - 0.5) * 1.0;  // Smaller spread for x
      steamParticles[i3 + 1] = Math.random() * 0.5;      // Start lower
      steamParticles[i3 + 2] = (Math.random() - 0.5) * 1.0;  // Smaller spread for z
      
      // Adjust velocity for more realistic steam movement
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

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      
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
    };

    animate();

    // Cleanup
    return () => {
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Update point cloud when data changes
  useEffect(() => {
    if (!model || !sceneRef.current) return;

    if (modelRef.current) {
      sceneRef.current.remove(modelRef.current);
    }

    // Add ambient and directional light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    
    sceneRef.current.add(ambientLight);
    sceneRef.current.add(directionalLight);

    // Scale and position the model
    model.scale.set(0.5, 0.5, 0.5);
    model.position.set(0, -1, 0);
    
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
