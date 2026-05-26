#version 300 es
precision highp float;

// Semi-Lagrangian advection with mass-conserving divergence correction.
// Backward-traces each cell along velocity, bilinear-samples pigment.
// Also applies isotropic pigment diffusion (Laplacian).

uniform sampler2D u_fluid;      // (u, v, pressure, wet) — velocity source
uniform sampler2D u_pigment;    // (g0, g1, g2, 0) — pigment to advect (LINEAR filtering)
uniform sampler2D u_deposit;    // (.a = mask)
uniform vec2 u_texelSize;       // (1/GW, 1/GH)
uniform float u_adt;            // DT * 0.7 = advection timestep
uniform float u_pigmentDiffusion; // PIGMENT_DIFFUSION coefficient
uniform int u_maskActive;

// Open boundary flags
uniform int u_edgeOpenLeft;
uniform int u_edgeOpenRight;
uniform int u_edgeOpenTop;
uniform int u_edgeOpenBottom;

out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy * u_texelSize;
  vec2 pos = gl_FragCoord.xy;
  vec2 gridSize = 1.0 / u_texelSize;

  // Boundary cells pass through
  if (pos.x < 1.5 || pos.x > gridSize.x - 1.5 ||
      pos.y < 1.5 || pos.y > gridSize.y - 1.5) {
    fragColor = texture(u_pigment, uv);
    return;
  }

  // Mask check
  if (u_maskActive != 0) {
    float maskVal = texture(u_deposit, uv).a;
    if (maskVal > 0.1) {
      fragColor = texture(u_pigment, uv);
      return;
    }
  }

  vec4 fluid = texture(u_fluid, uv);
  float wet = fluid.w;

  // Dry cells: no advection
  if (wet < 0.04) {
    fragColor = texture(u_pigment, uv);
    return;
  }

  float ux = fluid.x;
  float vy = fluid.y;

  // Divergence for mass conservation (central difference)
  vec2 dx = vec2(u_texelSize.x, 0.0);
  vec2 dy = vec2(0.0, u_texelSize.y);
  float uR = texture(u_fluid, uv + dx).x;
  float uL = texture(u_fluid, uv - dx).x;
  float vU = texture(u_fluid, uv + dy).y;
  float vD = texture(u_fluid, uv - dy).y;
  float div = (uR - uL) * 0.5 + (vU - vD) * 0.5;
  float areaRatio = exp(-div * u_adt);

  // Backward trace in grid coordinates (matches CPU: sy = y - vy * adt)
  float sx = pos.x - ux * u_adt;
  float sy = pos.y - vy * u_adt;

  // Open boundary check: if trace goes off an open edge, zero pigment
  bool offCanvas = false;
  if (sx < 0.0) {
    if (u_edgeOpenLeft != 0) offCanvas = true;
    else sx = 0.0;
  } else if (sx > gridSize.x - 1.001) {
    if (u_edgeOpenRight != 0) offCanvas = true;
    else sx = gridSize.x - 1.001;
  }
  if (sy < 0.0) {
    if (u_edgeOpenTop != 0) offCanvas = true;
    else sy = 0.0;
  } else if (sy > gridSize.y - 1.001) {
    if (u_edgeOpenBottom != 0) offCanvas = true;
    else sy = gridSize.y - 1.001;
  }

  if (offCanvas) {
    fragColor = vec4(0.0);
    return;
  }

  // Convert back to UV for texture sampling (hardware bilinear)
  // pos = gl_FragCoord.xy is already at pixel center, so no +0.5 needed
  vec2 srcUV = vec2(sx, sy) * u_texelSize;
  vec4 advected = texture(u_pigment, srcUV) * areaRatio;

  // Isotropic pigment diffusion (Laplacian)
  vec4 pC = texture(u_pigment, uv);
  vec4 pL = texture(u_pigment, uv - dx);
  vec4 pR = texture(u_pigment, uv + dx);
  vec4 pU = texture(u_pigment, uv + dy);
  vec4 pD = texture(u_pigment, uv - dy);
  vec4 laplacian = pL + pR + pU + pD - 4.0 * pC;
  vec4 diffused = advected + u_pigmentDiffusion * laplacian;

  fragColor = max(diffused, vec4(0.0));
}
