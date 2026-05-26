#version 300 es
precision highp float;

// Fused pass: transferPigment + evaporate + drainBoundaries.
// Per-cell (no neighbor reads except for drain boundary detection).
// MRT output: 3 color attachments.

uniform sampler2D u_fluid;      // (u, v, pressure, wet)
uniform sampler2D u_pigment;    // (g0, g1, g2, 0)
uniform sampler2D u_deposit;    // (d0, d1, d2, mask)
uniform sampler2D u_paper;      // (paperH, 0, 0, 0)
uniform vec2 u_texelSize;       // (1/GW, 1/GH)
uniform int u_maskActive;
uniform float u_evaporationRate;  // 0.9988
uniform float u_maxPigment;       // 1.0
uniform float u_drainAdt;         // DT * 0.7

// Per-pigment constants (3 pigments)
uniform vec3 u_density;         // (den0, den1, den2)
uniform vec3 u_staining;        // (sta0, sta1, sta2)
uniform vec3 u_granulation;     // (gra0, gra1, gra2)

// Edge drain flags
uniform int u_edgeOpenLeft;
uniform int u_edgeOpenRight;
uniform int u_edgeOpenTop;
uniform int u_edgeOpenBottom;

layout(location = 0) out vec4 out_pigment;   // (g0', g1', g2', 0)
layout(location = 1) out vec4 out_deposit;   // (d0', d1', d2', mask)
layout(location = 2) out vec4 out_fluid;     // (u, v, pressure, wet')

void main() {
  vec2 uv = gl_FragCoord.xy * u_texelSize;
  vec2 pos = gl_FragCoord.xy;
  vec2 gridSize = 1.0 / u_texelSize;

  vec4 fluid = texture(u_fluid, uv);
  vec4 pig = texture(u_pigment, uv);
  vec4 dep = texture(u_deposit, uv);
  float paperH = texture(u_paper, uv).r;

  float wet = fluid.w;
  float pressure = fluid.z;
  float vel_u = fluid.x;
  float vel_v = fluid.y;
  vec3 g_val = pig.rgb;
  vec3 d_val = dep.rgb;
  float maskVal = dep.a;

  // Mask check — frozen cells pass through unchanged
  if (u_maskActive != 0 && maskVal > 0.1) {
    out_pigment = pig;
    out_deposit = dep;
    out_fluid = fluid;
    return;
  }

  // --- Drain Boundaries ---
  // Detect if this cell is on an open boundary edge and apply drain
  float flux = 0.0;
  bool isBoundary = false;

  // Bottom edge (y == 1 in grid, pos.y ~1.5 in frag coords)
  if (u_edgeOpenBottom != 0 && pos.y < 2.5 && pos.y >= 1.5) {
    float outVel = -vel_v; // bottom edge: -v is outward (y=0 is bottom)
    if (outVel > 0.0) {
      flux = min(outVel * u_drainAdt, 1.0);
      isBoundary = true;
    }
  }
  // Top edge
  if (u_edgeOpenTop != 0 && pos.y > gridSize.y - 2.5 && pos.y <= gridSize.y - 1.5) {
    float outVel = vel_v; // top edge: +v is outward
    if (outVel > 0.0) {
      flux = min(outVel * u_drainAdt, 1.0);
      isBoundary = true;
    }
  }
  // Left edge
  if (u_edgeOpenLeft != 0 && pos.x < 2.5 && pos.x >= 1.5) {
    float outVel = -vel_u;
    if (outVel > 0.0) {
      flux = min(outVel * u_drainAdt, 1.0);
      isBoundary = true;
    }
  }
  // Right edge
  if (u_edgeOpenRight != 0 && pos.x > gridSize.x - 2.5 && pos.x <= gridSize.x - 1.5) {
    float outVel = vel_u;
    if (outVel > 0.0) {
      flux = min(outVel * u_drainAdt, 1.0);
      isBoundary = true;
    }
  }

  if (isBoundary) {
    float retain = 1.0 - flux;
    g_val *= retain;
    d_val *= retain;
    wet *= retain;
    pressure *= retain;
  }

  // --- Transfer Pigment (only in wet cells) ---
  if (wet >= 0.04) {
    for (int k = 0; k < 3; k++) {
      float gi = g_val[k];
      float di = d_val[k];
      float den = u_density[k];
      float sta = u_staining[k];
      float gra = u_granulation[k];

      float hg = 1.0 - paperH * gra;
      float hu = 1.0 + (paperH - 1.0) * gra;

      float down = gi * hg * den;
      float up = di * hu * den / sta;

      down = max(down, 0.0);
      up = max(up, 0.0);

      // Cap so d doesn't exceed 1
      if (di + down > 1.0) down = max(1.0 - di, 0.0);
      if (gi + up > 1.0) up = max(1.0 - gi, 0.0);

      d_val[k] = di + down - up;
      g_val[k] = gi + up - down;
    }
  }

  // --- Evaporate ---
  wet *= u_evaporationRate;

  // When cell goes dry, dump suspended pigment to deposited
  if (wet < 0.025) {
    for (int k = 0; k < 3; k++) {
      float nd = d_val[k] + g_val[k];
      d_val[k] = min(nd, u_maxPigment);
      g_val[k] = 0.0;
    }
    wet = 0.0;
    vel_u = 0.0;
    vel_v = 0.0;
  }

  out_pigment = vec4(g_val, 0.0);
  out_deposit = vec4(d_val, maskVal);
  out_fluid = vec4(vel_u, vel_v, pressure, wet);
}
