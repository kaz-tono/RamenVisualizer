export const steamVertexShader = `
  attribute vec3 velocity;
  uniform float time;
  uniform float speed;
  
  void main() {
    vec3 pos = position;
    
    // Add swirling motion
    float swirl = sin(time * 2.0 + pos.y) * 0.1;
    pos.x += velocity.x * time * speed + swirl;
    pos.y += velocity.y * time * speed;
    pos.z += velocity.z * time * speed + cos(time * 2.0 + pos.y) * 0.1;
    
    // Reset particles that move too high or too far
    if (pos.y > 3.0 || length(pos - position) > 2.0) {
      pos = position;
    }
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size variation based on height
    float sizeVar = 1.0 + sin(time * 3.0 + pos.y * 2.0) * 0.3;
    gl_PointSize = 2.0 * sizeVar;
  }
`;

export const steamFragmentShader = `
  uniform float intensity;
  
  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    
    if (dist > 0.5) {
      discard;
    }
    
    float alpha = (1.0 - dist * 2.0) * intensity;
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * 0.3);
  }
`;
