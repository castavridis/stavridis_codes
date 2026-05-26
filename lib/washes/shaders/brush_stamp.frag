#version 300 es
precision highp float;

// Brush stamping: deposits pigment/water/mask into state textures.
// Dispatched once per frame with queued brush commands.
// MRT output: 3 color attachments (same layout as transfer_evaporate).

uniform sampler2D u_fluid;      // (u, v, pressure, wet)
uniform sampler2D u_pigment;    // (g0, g1, g2, 0)
uniform sampler2D u_deposit;    // (d0, d1, d2, mask)
uniform vec2 u_texelSize;       // (1/GW, 1/GH)
uniform float u_maxPigment;     // 1.0

// Brush commands — up to 32 stamps per frame
// Each stamp: (cx, cy, radius, strength, pigmentIdx, wetAmount, pressureAmount, type)
// Packed into vec4 pairs for efficiency
const int MAX_STAMPS = 32;
uniform int u_stampCount;
uniform vec4 u_stampPosRad[MAX_STAMPS];   // (cx, cy, radius, strength)
uniform vec4 u_stampParams[MAX_STAMPS];   // (pigmentIdx, wetAmount, pressureAmount, type)
// type: 0=pigment, 1=water, 2=lift, 3=mask, 4=paper
// For pigment stamps, pigmentIdx encodes which pigment (0,1,2) or rainbow weights
uniform vec3 u_rainbowWeights;  // (w0, w1, w2) for rainbow brush

layout(location = 0) out vec4 out_pigment;   // (g0', g1', g2', 0)
layout(location = 1) out vec4 out_deposit;   // (d0', d1', d2', mask)
layout(location = 2) out vec4 out_fluid;     // (u, v, pressure, wet')

void main() {
  vec2 uv = gl_FragCoord.xy * u_texelSize;
  vec2 pos = gl_FragCoord.xy;

  vec4 fluid = texture(u_fluid, uv);
  vec4 pig = texture(u_pigment, uv);
  vec4 dep = texture(u_deposit, uv);

  vec3 g_val = pig.rgb;
  vec3 d_val = dep.rgb;
  float maskVal = dep.a;
  float wet = fluid.w;
  float pressure = fluid.z;
  float vel_u = fluid.x;
  float vel_v = fluid.y;

  for (int s = 0; s < MAX_STAMPS; s++) {
    if (s >= u_stampCount) break;

    vec4 posRad = u_stampPosRad[s];
    vec4 params = u_stampParams[s];

    float cx = posRad.x;
    float cy = posRad.y;
    float radius = posRad.z;
    float strength = posRad.w;
    int brushType = int(params.w);
    float wetAmount = params.y;
    float pressureAmount = params.z;

    // Distance check
    float dx = pos.x - cx;
    float dy = pos.y - cy;
    float d2 = dx * dx + dy * dy;
    float r2 = radius * radius;

    if (d2 >= r2) continue;

    float dist = sqrt(d2);
    float falloff = 1.0 - dist / radius;
    float f2 = falloff * falloff;

    if (brushType == 0) {
      // Pigment deposit
      int pigIdx = int(params.x);
      vec3 weights = vec3(0.0);
      if (pigIdx == 0) weights.x = 1.0;
      else if (pigIdx == 1) weights.y = 1.0;
      else if (pigIdx == 2) weights.z = 1.0;
      else if (pigIdx == 3) weights = u_rainbowWeights; // rainbow

      vec3 deposit = weights * falloff * strength;
      g_val = min(g_val + deposit, vec3(u_maxPigment));
      d_val = min(d_val + deposit * 0.5, vec3(u_maxPigment));
      wet = max(wet, f2 * wetAmount);
      pressure += f2 * pressureAmount;

    } else if (brushType == 1) {
      // Water brush
      wet = max(wet, f2 * wetAmount);
      pressure += f2 * pressureAmount;
      // Lift deposited pigment back into suspension
      float liftStr = f2 * strength * 0.18;
      vec3 lifted = min(d_val, vec3(liftStr));
      d_val -= lifted;
      g_val += lifted;

    } else if (brushType == 2) {
      // Lift brush — removes pigment
      float sub = f2 * strength;
      g_val *= (1.0 - sub);
      d_val *= (1.0 - sub);

    } else if (brushType == 3) {
      // Mask brush
      maskVal = min(maskVal + falloff * strength, 1.0);

    } else if (brushType == 4) {
      // Paper brush — clear pigment, add wetness
      float clear = f2 * strength;
      g_val *= (1.0 - clear);
      d_val *= (1.0 - clear);
      wet = max(wet, f2 * 0.3);
    }
  }

  out_pigment = vec4(g_val, 0.0);
  out_deposit = vec4(d_val, maskVal);
  out_fluid = vec4(vel_u, vel_v, pressure, wet);
}
