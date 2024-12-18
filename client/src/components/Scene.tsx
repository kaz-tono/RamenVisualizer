import { useEffect, useRef, useState } from 'react';
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
  const [steamPosition, setSteamPosition] = useState<THREE.Vector3>(new THREE.Vector3(0, 0.5, 0));

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
      steamParticles[i3] = (Math.random() - 0.5) * 1.0 + steamPosition.x;
      steamParticles[i3 + 1] = Math.random() * 0.5 + steamPosition.y;
      steamParticles[i3 + 2] = (Math.random() - 0.5) * 1.0 + steamPosition.z;

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
      // scene.clear(); //Removed to prevent clearing the scene on unmount

      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [settings.steamDensity, settings.steamIntensity, settings.steamSpeed, steamPosition]);

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

    // Keep track of the current model to remove it later
    const currentModel = modelRef.current;

    // Clone the model to avoid reference issues
    const newModel = model.clone();
    newModel.scale.set(0.5, 0.5, 0.5);
    newModel.position.set(0, 0, 0);
    
    // Apply shadows to all meshes in the model
    newModel.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    // Add new model first, then remove old one to avoid flickering
    sceneRef.current.add(newModel);
    modelRef.current = newModel;

    if (currentModel) {
      sceneRef.current.remove(currentModel);
    }

    return () => {
      if (newModel && sceneRef.current) {
        sceneRef.current.remove(newModel);
      }
    };
  }, [model]);

  // Update settings and handle right click
  useEffect(() => {
    if (!steamParticlesRef.current || !cameraRef.current || !sceneRef.current) return;

    const steamMaterial = steamParticlesRef.current.material as THREE.ShaderMaterial;
    steamMaterial.uniforms.intensity.value = settings.steamIntensity;
    steamMaterial.uniforms.speed.value = settings.steamSpeed;

    // Update steam particles position
    const positions = steamParticlesRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < settings.steamDensity; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 1.0 + steamPosition.x;
      positions[i3 + 1] = Math.random() * 0.5 + steamPosition.y + 0.1 * Math.sin(i/10); // Added slight vertical movement
      positions[i3 + 2] = (Math.random() - 0.5) * 1.0 + steamPosition.z;
    }
    steamParticlesRef.current.geometry.attributes.position.needsUpdate = true;
  }, [settings, steamPosition]);

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    if (!sceneRef.current || !cameraRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    // Create a plane that represents the ground
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPoint = new THREE.Vector3();
    
    if (raycaster.ray.intersectPlane(plane, intersectPoint)) {
      setSteamPosition(intersectPoint);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
      onContextMenu={handleContextMenu}
    />
  );
}