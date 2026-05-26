#version 300 es
precision highp float;

uniform sampler2D u_source;
uniform vec2 u_texelSize;

out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy * u_texelSize;
  fragColor = texture(u_source, uv);
}
