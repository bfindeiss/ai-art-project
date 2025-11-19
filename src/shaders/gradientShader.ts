export const gradientVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const gradientFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec3 colorA;
  uniform vec3 colorB;
  uniform vec3 colorC;
  uniform float time;

  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 4.1414))) * 43758.5453);
  }

  void main() {
    float t = 0.5 + 0.5 * sin(time * 0.05);
    vec3 base = mix(colorA, colorB, vUv.y + t * 0.1);
    float grain = noise(vUv * 20.0 + time * 0.02) * 0.15;
    vec3 finalColor = mix(base, colorC, 0.25 + 0.25 * sin((vUv.x + vUv.y + time * 0.02) * 3.14159));
    gl_FragColor = vec4(finalColor + grain, 1.0);
  }
`;
