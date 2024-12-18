import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { pointCloudVertexShader, pointCloudFragmentShader } from '@/lib/shaders/pointCloud';
import { steamVertexShader, steamFragmentShader } from '@/lib/shaders/steam';

interface SceneProps {
  pointCloudData: Float32Array | null;
  settings: {
    pointSize: number;
    steamIntensity: number;
    steamSpeed: number;
    steamDensity: number;
    autoRotate: boolean;
  };
}

export default function Scene({ pointCloudData, settings }: SceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const controlsRef = useRef<OrbitControls>();
  const steamParticlesRef = useRef<THREE.Points>();
  const pointCloudRef = useRef<THREE.Points>();

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
      steamParticles[i3] = (Math.random() - 0.5) * 2;
      steamParticles[i3 + 1] = Math.random() * 2;
      steamParticles[i3 + 2] = (Math.random() - 0.5) * 2;
      
      steamVelocities[i3] = (Math.random() - 0.5) * 0.01;
      steamVelocities[i3 + 1] = Math.random() * 0.02;
      steamVelocities[i3 + 2] = (Math.random() - 0.5) * 0.01;
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

      if (pointCloudRef.current && settings.autoRotate) {
        pointCloudRef.current.rotation.y += 0.001;
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
    if (!pointCloudData || !sceneRef.current) return;

    if (pointCloudRef.current) {
      sceneRef.current.remove(pointCloudRef.current);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(pointCloudData, 3));

    const material = new THREE.ShaderMaterial({
      vertexShader: pointCloudVertexShader,
      fragmentShader: pointCloudFragmentShader,
      uniforms: {
        pointSize: { value: settings.pointSize }
      }
    });

    const points = new THREE.Points(geometry, material);
    sceneRef.current.add(points);
    pointCloudRef.current = points;
  }, [pointCloudData]);

  // Update settings
  useEffect(() => {
    if (!steamParticlesRef.current || !pointCloudRef.current) return;

    const steamMaterial = steamParticlesRef.current.material as THREE.ShaderMaterial;
    steamMaterial.uniforms.intensity.value = settings.steamIntensity;
    steamMaterial.uniforms.speed.value = settings.steamSpeed;

    const pointMaterial = pointCloudRef.current.material as THREE.ShaderMaterial;
    pointMaterial.uniforms.pointSize.value = settings.pointSize;
  }, [settings]);

  return <div ref={containerRef} className="w-full h-full" />;
}
