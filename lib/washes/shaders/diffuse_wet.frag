#version 300 es
precision highp float;

// Wet diffusion: 4-neighbor Laplacian on wet channel.
// Reads fluid_A, writes fluid_B with diffused wet.

uniform sampler2D u_fluid;      // (u, v, pressure, wet)
uniform sampler2D u_deposit;    // (.a = mask)
uniform vec2 u_texelSize;       // (1/GW, 1/GH)
uniform float u_wetDiffusion;   // WET_DIFFUSION coefficient
uniform int u_maskActive;

out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy * u_texelSize;
  vec4 c = texture(u_fluid, uv);

  // Boundary cells (first/last row/col) pass through unchanged
  vec2 pos = gl_FragCoord.xy;
  vec2 gridSize = 1.0 / u_texelSize;
  if (pos.x < 1.5 || pos.x > gridSize.x - 1.5 ||
      pos.y < 1.5 || pos.y > gridSize.y - 1.5) {
    fragColor = c;
    return;
  }

  // Mask check
  if (u_maskActive != 0) {
    float maskVal = texture(u_deposit, uv).a;
    if (maskVal > 0.1) {
      fragColor = c;
      return;
    }
  }

  float wet_c = c.w;
  float wet_l = texture(u_fluid, uv + vec2(-u_texelSize.x, 0.0)).w;
  float wet_r = texture(u_fluid, uv + vec2( u_texelSize.x, 0.0)).w;
  float wet_u = texture(u_fluid, uv + vec2(0.0,  u_texelSize.y)).w;
  float wet_d = texture(u_fluid, uv + vec2(0.0, -u_texelSize.y)).w;

  // Skip cells with no wet in the stencil
  if (wet_c < 1e-6 && wet_l < 1e-6 && wet_r < 1e-6 && wet_u < 1e-6 && wet_d < 1e-6) {
    fragColor = c;
    return;
  }

  float newWet = wet_c + u_wetDiffusion * (wet_l + wet_r + wet_u + wet_d - 4.0 * wet_c);
  fragColor = vec4(c.xyz, newWet);
}
