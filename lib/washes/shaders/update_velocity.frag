#version 300 es
precision highp float;

// Velocity update: pressure gradient + paper tilt + viscosity + drag + gravity.
// Reads fluid_A (u, v, pressure, wet) + paper (paperH).
// Writes fluid_B (u_new, v_new, pressure * decay, wet).

uniform sampler2D u_fluid;      // (u, v, pressure, wet)
uniform sampler2D u_paper;      // (paperH, 0, 0, 0)
uniform sampler2D u_deposit;    // (.a = mask)
uniform vec2 u_texelSize;       // (1/GW, 1/GH)
uniform float u_DT;             // 0.42
uniform float u_viscosity;      // 0.10
uniform float u_drag;           // 0.014
uniform float u_paperTilt;      // 0.06
uniform float u_velClamp;       // VEL_CLAMP
uniform float u_pressureDecay;  // 0.94
uniform int u_maskActive;

// Gravity
uniform int u_gravityMode;      // 0=none, 1=fixed, 2=radial, 3=radial-in
uniform vec2 u_gravityBias;     // (biasX, biasY) for fixed mode
uniform float u_gravityStrength;
uniform vec2 u_gridCenter;      // ((GW-1)/2, (GH-1)/2)

// Edge boundary
uniform int u_edgeOpenLeft;
uniform int u_edgeOpenRight;
uniform int u_edgeOpenTop;
uniform int u_edgeOpenBottom;

out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy * u_texelSize;
  vec2 pos = gl_FragCoord.xy;
  vec2 gridSize = 1.0 / u_texelSize;

  vec4 c = texture(u_fluid, uv);
  float pressure_c = c.z;
  float wet_c = c.w;

  // Boundary cells: zero velocity, pass through
  if (pos.x < 1.5 || pos.x > gridSize.x - 1.5 ||
      pos.y < 1.5 || pos.y > gridSize.y - 1.5) {
    fragColor = vec4(0.0, 0.0, pressure_c * u_pressureDecay, wet_c);
    return;
  }

  // Mask check
  if (u_maskActive != 0) {
    float maskVal = texture(u_deposit, uv).a;
    if (maskVal > 0.1) {
      fragColor = vec4(0.0, 0.0, pressure_c * u_pressureDecay, wet_c);
      return;
    }
  }

  // Dry cells: no flow
  if (wet_c < 0.04) {
    fragColor = vec4(0.0, 0.0, pressure_c * u_pressureDecay, wet_c);
    return;
  }

  // Sample neighbors
  vec2 dx = vec2(u_texelSize.x, 0.0);
  vec2 dy = vec2(0.0, u_texelSize.y);

  vec4 fL = texture(u_fluid, uv - dx);
  vec4 fR = texture(u_fluid, uv + dx);
  vec4 fU = texture(u_fluid, uv + dy);
  vec4 fD = texture(u_fluid, uv - dy);

  // Pressure gradient (matches CPU: dpdy = pressure[i+GW] - pressure[i-GW])
  // uv+dy = texture row above = CPU y+1 = one row DOWN on screen
  float dpdx = fR.z - fL.z;
  float dpdy = fU.z - fD.z;

  // Paper slope
  float hL = texture(u_paper, uv - dx).r;
  float hR = texture(u_paper, uv + dx).r;
  float hU = texture(u_paper, uv + dy).r;
  float hD = texture(u_paper, uv - dy).r;
  float dhdx = hR - hL;
  float dhdy = hU - hD;

  // Viscous diffusion (Laplacian of velocity)
  float lapU = fL.x + fR.x + fU.x + fD.x - 4.0 * c.x;
  float lapV = fL.y + fR.y + fU.y + fD.y - 4.0 * c.y;

  float nu = c.x + u_DT * (-dpdx * 0.5 - dhdx * u_paperTilt + u_viscosity * lapU - u_drag * c.x);
  float nv = c.y + u_DT * (-dpdy * 0.5 - dhdy * u_paperTilt + u_viscosity * lapV - u_drag * c.y);

  // Gravity bias
  if (u_gravityMode == 1) {
    // Fixed direction
    nu += u_gravityBias.x;
    nv += u_gravityBias.y;
  } else if (u_gravityMode == 2 || u_gravityMode == 3) {
    // Radial (2=outward, 3=inward)
    vec2 r = pos - u_gridCenter;
    float rmag = length(r);
    if (rmag > 0.001) {
      float sign = u_gravityMode == 3 ? -1.0 : 1.0;
      float radialBias = sign * u_gravityStrength * u_velClamp;
      vec2 radialDir = r / rmag * radialBias;
      nu += radialDir.x;
      nv += radialDir.y;
    }
  }

  // Magnitude clamp (circular envelope)
  float mag = sqrt(nu * nu + nv * nv);
  if (mag > u_velClamp) {
    float s = u_velClamp / mag;
    nu *= s;
    nv *= s;
  }

  fragColor = vec4(nu, nv, pressure_c * u_pressureDecay, wet_c);
}
