#version 300 es
precision highp float;

// Edge darkening: apply pressure reduction at wet boundaries.
// Reads blurred wet (small + large kernel), fluid state.
// Writes modified fluid with reduced pressure at wet edges.

uniform sampler2D u_fluid;          // (u, v, pressure, wet)
uniform sampler2D u_blurSmall;      // small-kernel blur of binary wet
uniform sampler2D u_blurLarge;      // large-kernel blur of binary wet
uniform sampler2D u_deposit;        // (.a = mask)
uniform vec2 u_texelSize;
uniform float u_edgeEta;            // EDGE_ETA = 0.045
uniform float u_edgeWetActive;      // 0.40
uniform float u_edgeWetOff;         // 0.10
uniform int u_maskActive;

out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy * u_texelSize;
  vec4 fluid = texture(u_fluid, uv);

  // Mask check
  if (u_maskActive != 0) {
    float maskVal = texture(u_deposit, uv).a;
    if (maskVal > 0.1) {
      fragColor = fluid;
      return;
    }
  }

  float wet = fluid.w;
  float pressure = fluid.z;

  if (wet > 0.04) {
    float blurS = texture(u_blurSmall, uv).r;
    float deficit = 1.0 - blurS;

    if (deficit > 0.0) {
      float blurL = texture(u_blurLarge, uv).r;

      // Smooth activation ramp
      float activeRange = u_edgeWetActive - u_edgeWetOff;
      float activation = wet >= u_edgeWetActive ? 1.0
                       : wet <= u_edgeWetOff    ? 0.0
                       : (wet - u_edgeWetOff) / activeRange;

      pressure -= u_edgeEta * deficit * blurL * wet * activation;
    }
  }

  fragColor = vec4(fluid.xy, pressure, wet);
}
