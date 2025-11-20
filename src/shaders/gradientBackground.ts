import * as THREE from 'three';
import { gradientFragment, gradientVertex } from './gradientShader';

export function createGradientBackground(radius = 50): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(radius, 64, 64);
  geometry.scale(-1, 1, 1); // render inside sphere

  const material = new THREE.ShaderMaterial({
    vertexShader: gradientVertex,
    fragmentShader: gradientFragment,
    side: THREE.BackSide,
    uniforms: {
      colorA: { value: new THREE.Color('#051225') },
      colorB: { value: new THREE.Color('#0f2b46') },
      colorC: { value: new THREE.Color('#19f2ff') },
      time: { value: 0 }
    }
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'GradientBackground';
  return mesh;
}
