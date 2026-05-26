#version 300 es
// Fullscreen triangle from gl_VertexID — no vertex buffer needed.
// Covers [-1,1]² with a single oversized triangle.
void main() {
  float x = float((gl_VertexID & 1) << 2) - 1.0;
  float y = float((gl_VertexID & 2) << 1) - 1.0;
  gl_Position = vec4(x, y, 0.0, 1.0);
}
