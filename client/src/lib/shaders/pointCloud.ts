export const pointCloudVertexShader = `
  uniform float pointSize;
  
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = pointSize * (300.0 / -mvPosition.z);
  }
`;

export const pointCloudFragmentShader = `
  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    
    if (dist > 0.5) {
      discard;
    }
    
    float alpha = 1.0 - smoothstep(0.45, 0.5, dist);
    gl_FragColor = vec4(0.8, 0.2, 0.2, alpha);
  }
`;
