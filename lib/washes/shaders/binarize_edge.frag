#version 300 es
precision highp float;

// Binarize wet channel for edge darkening.
// Output: 1.0 where wet > threshold, 0.0 otherwise.

uniform sampler2D u_fluid;      // (u, v, pressure, wet)
uniform vec2 u_texelSize;       // (1/GW, 1/GH)

out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy * u_texelSize;
  float wet = texture(u_fluid, uv).w;
  float binary = wet > 0.04 ? 1.0 : 0.0;
  fragColor = vec4(binary, 0.0, 0.0, 0.0);
}
