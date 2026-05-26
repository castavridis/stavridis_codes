#version 300 es
precision highp float;

// Vertical separable box blur.
// Reads from source texture .r channel, writes blurred value.

uniform sampler2D u_source;
uniform vec2 u_texelSize;   // (1/GW, 1/GH)
uniform int u_radius;

out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy * u_texelSize;
  float sum = 0.0;
  int r = u_radius;
  float count = float(2 * r + 1);

  for (int i = -r; i <= r; i++) {
    vec2 sampleUV = uv + vec2(0.0, float(i) * u_texelSize.y);
    // Clamp to [0,1] for boundary handling
    sampleUV.y = clamp(sampleUV.y, 0.0, 1.0);
    sum += texture(u_source, sampleUV).r;
  }

  fragColor = vec4(sum / count, 0.0, 0.0, 0.0);
}
