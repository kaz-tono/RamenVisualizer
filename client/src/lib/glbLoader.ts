import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

export async function loadGLBModel(file: File): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    const url = URL.createObjectURL(file);

    loader.load(
      url,
      (gltf) => {
        URL.revokeObjectURL(url);
        resolve(gltf.scene);
      },
      undefined,
      (error) => {
        URL.revokeObjectURL(url);
        reject(new Error(`GLBファイルの読み込みエラー: ${error.message}`));
      }
    );
  });
}
