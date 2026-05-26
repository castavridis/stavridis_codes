/**
 * washes-gpu-sim.ts — WebGL2 GPGPU simulation backend for Washes.
 *
 * Runs the full Curtis-et-al watercolor simulation on the GPU using
 * fragment-shader-based compute (ping-pong textures, fullscreen draws).
 *
 * Entry point: `initGpuSim(gl, GW, GH, params)` returns a handle with
 * `step()`, `stampBrush()`, `uploadState()`, `downloadState()`, and
 * `destroy()`.
 */

// Shader sources (Vite ?raw imports)
import fullscreenVert from "./shaders/fullscreen.vert?raw";
import diffuseWetFrag from "./shaders/diffuse_wet.frag?raw";
import binarizeEdgeFrag from "./shaders/binarize_edge.frag?raw";
import blurHFrag from "./shaders/blur_h.frag?raw";
import blurVFrag from "./shaders/blur_v.frag?raw";
import edgeApplyFrag from "./shaders/edge_apply.frag?raw";
import updateVelocityFrag from "./shaders/update_velocity.frag?raw";
import advectSemilagFrag from "./shaders/advect_semilag.frag?raw";
import transferEvaporateFrag from "./shaders/transfer_evaporate.frag?raw";
import brushStampFrag from "./shaders/brush_stamp.frag?raw";
import copyTextureFrag from "./shaders/copy_texture.frag?raw";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GpuSimParams {
  DT: number;
  viscosity: number;
  drag: number;
  paperTilt: number;
  velClamp: number;
  pressureDecay: number;
  wetDiffusion: number;
  pigmentDiffusion: number;
  evaporationRate: number;
  maxPigment: number;
  edgeEta: number;
  edgeWetActive: number;
  edgeWetOff: number;
  edgeKernel: number;
  edgeKernelLarge: number;
  edgeOpen: { left: boolean; right: boolean; top: boolean; bottom: boolean };
  gravityMode: number; // 0=none, 1=fixed, 2=radial, 3=radial-in
  gravityBias: [number, number];
  gravityStrength: number;
  maskActive: boolean;
  edgeDarkeningEnabled: boolean;
  dryingPaused: boolean;
  // Per-pigment (3 slots)
  pigDensity: [number, number, number];
  pigStaining: [number, number, number];
  pigGranulation: [number, number, number];
}

export interface BrushStamp {
  cx: number;
  cy: number;
  radius: number;
  strength: number;
  brushType: number; // 0=pigment, 1=water, 2=lift, 3=mask, 4=paper
  pigmentIdx: number;
  wetAmount: number;
  pressureAmount: number;
}

export interface GpuSimHandle {
  /** Run one full sim step (all passes). */
  step(params: GpuSimParams): void;
  /** Queue brush stamps for next step. */
  stampBrush(stamps: BrushStamp[]): void;
  /** Upload CPU state arrays into GPU textures. */
  uploadState(state: GpuStateArrays): void;
  /** Read GPU textures back to CPU arrays (expensive — use sparingly). */
  downloadState(state: GpuStateArrays): void;
  /** Get fluid texture for render shader sampling. */
  getFluidTexture(): WebGLTexture;
  /** Get pigment texture for render shader sampling. */
  getPigmentTexture(): WebGLTexture;
  /** Get deposit texture for render shader sampling. */
  getDepositTexture(): WebGLTexture;
  /** Debug: fill pigment texture with a visible GPU-owned test pattern. */
  debugFillPigmentTexture(): void;
  /** Debug: apply queued brush stamps without running any sim passes. */
  debugApplyBrushStampsOnly(): void;
  /** Debug: apply queued brush stamps, then run only transfer/evaporate/drain. */
  debugApplyTransferOnly(params: GpuSimParams): void;
  /** Debug: apply queued brush stamps, then run only wet diffusion. */
  debugApplyWetDiffusionOnly(params: GpuSimParams): void;
  /** Debug: apply brush stamps, wet diffusion, then velocity update only. */
  debugApplyVelocityOnly(params: GpuSimParams): void;
  /** Debug: apply brush stamps, wet diffusion, velocity, then pigment advection only. */
  debugApplyAdvectionOnly(params: GpuSimParams): void;
  /** Free all GPU resources. */
  destroy(): void;
}

export interface GpuStateArrays {
  /** Float32Array[GW*GH*4]: (u, v, pressure, wet) */
  fluid: Float32Array;
  /** Float32Array[GW*GH*4]: (g0, g1, g2, 0) */
  pigment: Float32Array;
  /** Float32Array[GW*GH*4]: (d0, d1, d2, mask) */
  deposit: Float32Array;
  /** Float32Array[GW*GH*4]: (paperH, 0, 0, 0) — static */
  paper: Float32Array;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_STAMPS_PER_FRAME = 32;

// Pinned texture units
const TEX_FLUID_A = 0;
const TEX_FLUID_B = 1;
const TEX_PIGMENT_A = 2;
const TEX_PIGMENT_B = 3;
const TEX_DEPOSIT_A = 4;
const TEX_DEPOSIT_B = 5;
const TEX_PAPER = 6;
const TEX_BLUR_TMP = 7;
const TEX_BLUR_TMP2 = 8;
const TEX_BINARIZE = 9;

const GPU_SIM_DEBUG_LOGS = false;
const GPU_SIM_DEBUG_READBACK = false;

function gpuSimDebugLogs(): boolean {
  return GPU_SIM_DEBUG_LOGS;
}

function gpuSimDebugReadbackEnabled(): boolean {
  return GPU_SIM_DEBUG_READBACK;
}

let debugStampLogCount = 0;
let debugBrushPassLogCount = 0;
let debugReadbackLogCount = 0;
let debugReadbackPaintFrameCount = 0;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(
      `Shader compile error:\n${log}\n\nSource:\n${source.slice(0, 300)}`,
    );
  }
  return shader;
}

function linkProgram(
  gl: WebGL2RenderingContext,
  vs: WebGLShader,
  fs: WebGLShader,
): WebGLProgram {
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(prog);
    gl.deleteProgram(prog);
    throw new Error(`Program link error:\n${log}`);
  }
  return prog;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertSrc: string,
  fragSrc: string,
): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  const prog = linkProgram(gl, vs, fs);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return prog;
}

function createFloat32Texture(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  data: Float32Array | null,
  filter: number = gl.NEAREST,
): WebGLTexture {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA32F,
    width,
    height,
    0,
    gl.RGBA,
    gl.FLOAT,
    data,
  );
  return tex;
}

function createFBO(
  gl: WebGL2RenderingContext,
  colorAttachments: WebGLTexture[],
): WebGLFramebuffer {
  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  const drawBuffers: number[] = [];
  for (let i = 0; i < colorAttachments.length; i++) {
    const attachment = gl.COLOR_ATTACHMENT0 + i;
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      attachment,
      gl.TEXTURE_2D,
      colorAttachments[i],
      0,
    );
    drawBuffers.push(attachment);
  }
  gl.drawBuffers(drawBuffers);
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error(`Framebuffer incomplete: 0x${status.toString(16)}`);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return fbo;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initGpuSim(
  gl: WebGL2RenderingContext,
  GW: number,
  GH: number,
): GpuSimHandle {
  // Ensure required extensions
  const extFloat = gl.getExtension("EXT_color_buffer_float");
  if (!extFloat) {
    throw new Error(
      "EXT_color_buffer_float not available — cannot render to float textures",
    );
  }
  gl.getExtension("OES_texture_float_linear");

  const texelSize: [number, number] = [1.0 / GW, 1.0 / GH];

  // ─── Create textures ──────────────────────────────────────────────────
  const textures: WebGLTexture[] = [];

  function makeTex(filter: number = gl.NEAREST) {
    const tex = createFloat32Texture(gl, GW, GH, null, filter);
    textures.push(tex);
    return tex;
  }

  const fluidA = makeTex();
  const fluidB = makeTex();
  const pigmentA = makeTex(gl.LINEAR); // LINEAR for bilinear advection sampling
  const pigmentB = makeTex(gl.LINEAR);
  const depositA = makeTex();
  const depositB = makeTex();
  const paper = makeTex();
  const blurTmp = makeTex();
  const blurTmp2 = makeTex();
  const binarizeTex = makeTex();

  // ─── Bind to pinned texture units ─────────────────────────────────────
  function bindTextureUnit(unit: number, tex: WebGLTexture) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
  }

  function bindAllTextures() {
    bindTextureUnit(TEX_FLUID_A, fluidA);
    bindTextureUnit(TEX_FLUID_B, fluidB);
    bindTextureUnit(TEX_PIGMENT_A, pigmentA);
    bindTextureUnit(TEX_PIGMENT_B, pigmentB);
    bindTextureUnit(TEX_DEPOSIT_A, depositA);
    bindTextureUnit(TEX_DEPOSIT_B, depositB);
    bindTextureUnit(TEX_PAPER, paper);
    bindTextureUnit(TEX_BLUR_TMP, blurTmp);
    bindTextureUnit(TEX_BLUR_TMP2, blurTmp2);
    bindTextureUnit(TEX_BINARIZE, binarizeTex);
  }

  // ─── Create FBOs ──────────────────────────────────────────────────────
  const fboFluidB = createFBO(gl, [fluidB]);
  const fboFluidA = createFBO(gl, [fluidA]);
  const fboPigmentB = createFBO(gl, [pigmentB]);
  const fboPigmentA = createFBO(gl, [pigmentA]);
  const fboDepositB = createFBO(gl, [depositB]);
  const fboDepositA = createFBO(gl, [depositA]);
  const fboBinarize = createFBO(gl, [binarizeTex]);
  const fboBlurTmp = createFBO(gl, [blurTmp]);
  const fboBlurTmp2 = createFBO(gl, [blurTmp2]);
  // MRT FBO for transfer_evaporate.
  const fboTransferA = createFBO(gl, [pigmentA, depositA, fluidA]);
  const fboTransferB = createFBO(gl, [pigmentB, depositB, fluidB]);
  // MRT FBO for brush_stamp (same pattern)
  const fboBrushA = createFBO(gl, [pigmentA, depositA, fluidA]);
  const fboBrushB = createFBO(gl, [pigmentB, depositB, fluidB]);

  // ─── Compile programs ─────────────────────────────────────────────────
  const progDiffuseWet = createProgram(gl, fullscreenVert, diffuseWetFrag);
  const progBinarize = createProgram(gl, fullscreenVert, binarizeEdgeFrag);
  const progBlurH = createProgram(gl, fullscreenVert, blurHFrag);
  const progBlurV = createProgram(gl, fullscreenVert, blurVFrag);
  const progEdgeApply = createProgram(gl, fullscreenVert, edgeApplyFrag);
  const progVelocity = createProgram(gl, fullscreenVert, updateVelocityFrag);
  const progAdvect = createProgram(gl, fullscreenVert, advectSemilagFrag);
  const progTransfer = createProgram(gl, fullscreenVert, transferEvaporateFrag);
  const progBrush = createProgram(gl, fullscreenVert, brushStampFrag);
  const progCopy = createProgram(gl, fullscreenVert, copyTextureFrag);

  const programs = [
    progDiffuseWet,
    progBinarize,
    progBlurH,
    progBlurV,
    progEdgeApply,
    progVelocity,
    progAdvect,
    progTransfer,
    progBrush,
    progCopy,
  ];

  // ─── Fullscreen VAO (empty — vertex shader uses gl_VertexID) ──────────
  const vao = gl.createVertexArray()!;

  // ─── Uniform cache ────────────────────────────────────────────────────
  type UCache = Record<string, WebGLUniformLocation | null>;
  const uniformCache = new Map<WebGLProgram, UCache>();

  function getUniforms(prog: WebGLProgram): UCache {
    let cache = uniformCache.get(prog);
    if (!cache) {
      cache = {};
      const count = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS) as number;
      for (let i = 0; i < count; i++) {
        const info = gl.getActiveUniform(prog, i);
        if (info) {
          // For arrays, getUniformLocation needs the base name
          const name = info.name.replace(/\[0\]$/, "");
          cache[name] = gl.getUniformLocation(prog, info.name);
          // Also cache array entries we use
          if (info.size > 1) {
            for (let j = 0; j < info.size; j++) {
              const arrName = `${name}[${j}]`;
              cache[arrName] = gl.getUniformLocation(prog, arrName);
            }
          }
        }
      }
      uniformCache.set(prog, cache);
    }
    return cache;
  }

  // ─── Draw dispatch ────────────────────────────────────────────────────
  function draw() {
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function useProgram(prog: WebGLProgram) {
    gl.useProgram(prog);
    return getUniforms(prog);
  }

  // ─── Ping-pong tracking ───────────────────────────────────────────────
  // After each full sim step, A textures hold the latest state.
  // During a step, passes alternate writing to B then back to A.
  // Track which is "current read" for fluid and pigment.
  let fluidRead = TEX_FLUID_A;
  let pigmentRead = TEX_PIGMENT_A;
  let depositRead = TEX_DEPOSIT_A;

  // Brush stamp queue
  let pendingStamps: BrushStamp[] = [];
  let debugReadFbo: WebGLFramebuffer | null = null;
  let debugFluidReadback: Float32Array | null = null;
  let debugPigmentReadback: Float32Array | null = null;

  // ─── Rainbow weights (CPU-computed, uploaded per-frame) ───────────────
  const rainbowWeights: [number, number, number] = [1, 0, 0];

  // ─── Pass implementations ─────────────────────────────────────────────

  function passDiffuseWet(params: GpuSimParams) {
    // Reads fluidA, writes fluidB
    gl.bindFramebuffer(gl.FRAMEBUFFER, fboFluidB);
    gl.viewport(0, 0, GW, GH);
    const u = useProgram(progDiffuseWet);
    gl.uniform1i(u["u_fluid"], TEX_FLUID_A);
    gl.uniform1i(u["u_deposit"], TEX_DEPOSIT_A);
    gl.uniform2f(u["u_texelSize"], texelSize[0], texelSize[1]);
    gl.uniform1f(u["u_wetDiffusion"], params.wetDiffusion);
    gl.uniform1i(u["u_maskActive"], params.maskActive ? 1 : 0);
    draw();
    // Swap: fluid read is now B
    fluidRead = TEX_FLUID_B;
  }

  function passEdgeDarkening(params: GpuSimParams) {
    // Step 1: Binarize wet from fluidB -> binarizeTex
    gl.bindFramebuffer(gl.FRAMEBUFFER, fboBinarize);
    gl.viewport(0, 0, GW, GH);
    let u = useProgram(progBinarize);
    gl.uniform1i(u["u_fluid"], TEX_FLUID_B);
    gl.uniform2f(u["u_texelSize"], texelSize[0], texelSize[1]);
    draw();

    // Step 2: Blur small (H then V) -> blurTmp
    // H pass: binarize -> blurTmp2
    gl.bindFramebuffer(gl.FRAMEBUFFER, fboBlurTmp2);
    gl.viewport(0, 0, GW, GH);
    u = useProgram(progBlurH);
    gl.uniform1i(u["u_source"], TEX_BINARIZE);
    gl.uniform2f(u["u_texelSize"], texelSize[0], texelSize[1]);
    gl.uniform1i(u["u_radius"], params.edgeKernel);
    draw();

    // V pass: blurTmp2 -> blurTmp (small kernel result)
    gl.bindFramebuffer(gl.FRAMEBUFFER, fboBlurTmp);
    gl.viewport(0, 0, GW, GH);
    u = useProgram(progBlurV);
    gl.uniform1i(u["u_source"], TEX_BLUR_TMP2);
    gl.uniform2f(u["u_texelSize"], texelSize[0], texelSize[1]);
    gl.uniform1i(u["u_radius"], params.edgeKernel);
    draw();

    // Step 3: Blur large (H then V) -> blurTmp2
    // H pass: binarize -> blurTmp2 (reuse)
    gl.bindFramebuffer(gl.FRAMEBUFFER, fboBlurTmp2);
    gl.viewport(0, 0, GW, GH);
    u = useProgram(progBlurH);
    gl.uniform1i(u["u_source"], TEX_BINARIZE);
    gl.uniform2f(u["u_texelSize"], texelSize[0], texelSize[1]);
    gl.uniform1i(u["u_radius"], params.edgeKernelLarge);
    draw();

    // V pass: blurTmp2 -> binarizeTex (reuse as large blur output)
    // We store large blur result in binarizeTex since we no longer need the binary
    gl.bindFramebuffer(gl.FRAMEBUFFER, fboBinarize);
    gl.viewport(0, 0, GW, GH);
    u = useProgram(progBlurV);
    gl.uniform1i(u["u_source"], TEX_BLUR_TMP2);
    gl.uniform2f(u["u_texelSize"], texelSize[0], texelSize[1]);
    gl.uniform1i(u["u_radius"], params.edgeKernelLarge);
    draw();

    // Step 4: Apply edge darkening — reads fluidB + blurTmp (small) + binarize (large) -> fluidA
    gl.bindFramebuffer(gl.FRAMEBUFFER, fboFluidA);
    gl.viewport(0, 0, GW, GH);
    u = useProgram(progEdgeApply);
    gl.uniform1i(u["u_fluid"], TEX_FLUID_B);
    gl.uniform1i(u["u_blurSmall"], TEX_BLUR_TMP);
    gl.uniform1i(u["u_blurLarge"], TEX_BINARIZE);
    gl.uniform1i(u["u_deposit"], TEX_DEPOSIT_A);
    gl.uniform2f(u["u_texelSize"], texelSize[0], texelSize[1]);
    gl.uniform1f(u["u_edgeEta"], params.edgeEta);
    gl.uniform1f(u["u_edgeWetActive"], params.edgeWetActive);
    gl.uniform1f(u["u_edgeWetOff"], params.edgeWetOff);
    gl.uniform1i(u["u_maskActive"], params.maskActive ? 1 : 0);
    draw();

    // Now fluidA has the edge-darkened state
    fluidRead = TEX_FLUID_A;
  }

  function passBrush(stamps: BrushStamp[]) {
    if (stamps.length === 0) return;

    // Brush must ping-pong: WebGL forbids sampling from textures that are
    // attached to the framebuffer currently being rendered into.
    const writeToB = pigmentRead === TEX_PIGMENT_A;
    if (gpuSimDebugLogs() && debugBrushPassLogCount < 12) {
      console.debug("[GPU-SIM] passBrush draw", {
        count: stamps.length,
        writeTarget: writeToB ? "B" : "A",
        fluidRead,
        pigmentRead,
        depositRead,
      });
      debugBrushPassLogCount++;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, writeToB ? fboBrushB : fboBrushA);
    gl.viewport(0, 0, GW, GH);
    const u = useProgram(progBrush);

    // Bind current-read textures as inputs
    gl.uniform1i(u["u_fluid"], fluidRead);
    gl.uniform1i(u["u_pigment"], pigmentRead);
    gl.uniform1i(u["u_deposit"], depositRead);
    gl.uniform2f(u["u_texelSize"], texelSize[0], texelSize[1]);
    gl.uniform1f(u["u_maxPigment"], 1.0);
    gl.uniform3f(
      u["u_rainbowWeights"],
      rainbowWeights[0],
      rainbowWeights[1],
      rainbowWeights[2],
    );

    const count = Math.min(stamps.length, MAX_STAMPS_PER_FRAME);
    gl.uniform1i(u["u_stampCount"], count);

    // Upload stamp data as uniform arrays
    for (let i = 0; i < count; i++) {
      const s = stamps[i];
      const posRadLoc = u[`u_stampPosRad[${i}]`];
      const paramsLoc = u[`u_stampParams[${i}]`];
      if (posRadLoc) gl.uniform4f(posRadLoc, s.cx, s.cy, s.radius, s.strength);
      if (paramsLoc)
        gl.uniform4f(
          paramsLoc,
          s.pigmentIdx,
          s.wetAmount,
          s.pressureAmount,
          s.brushType,
        );
    }

    draw();

    if (writeToB) {
      fluidRead = TEX_FLUID_B;
      pigmentRead = TEX_PIGMENT_B;
      depositRead = TEX_DEPOSIT_B;
    } else {
      fluidRead = TEX_FLUID_A;
      pigmentRead = TEX_PIGMENT_A;
      depositRead = TEX_DEPOSIT_A;
    }
  }

  function copyTexture(sourceUnit: number, targetFbo: WebGLFramebuffer) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, targetFbo);
    gl.viewport(0, 0, GW, GH);
    const u = useProgram(progCopy);
    gl.uniform1i(u["u_source"], sourceUnit);
    gl.uniform2f(u["u_texelSize"], texelSize[0], texelSize[1]);
    draw();
  }

  function alignReadStateToB() {
    if (fluidRead !== TEX_FLUID_B) copyTexture(fluidRead, fboFluidB);
    if (pigmentRead !== TEX_PIGMENT_B) copyTexture(pigmentRead, fboPigmentB);
    if (depositRead !== TEX_DEPOSIT_B) copyTexture(depositRead, fboDepositB);

    fluidRead = TEX_FLUID_B;
    pigmentRead = TEX_PIGMENT_B;
    depositRead = TEX_DEPOSIT_B;
    bindAllTextures();
  }

  function readTextureInto(texture: WebGLTexture, target: Float32Array) {
    if (!debugReadFbo) debugReadFbo = gl.createFramebuffer();
    if (!debugReadFbo) return;
    gl.bindFramebuffer(gl.FRAMEBUFFER, debugReadFbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );
    gl.readPixels(0, 0, GW, GH, gl.RGBA, gl.FLOAT, target);
  }

  function logDebugReadback(label: string) {
    if (!gpuSimDebugReadbackEnabled()) return;
    if (debugReadbackLogCount >= 36) return;

    if (!debugFluidReadback) debugFluidReadback = new Float32Array(GW * GH * 4);
    if (!debugPigmentReadback)
      debugPigmentReadback = new Float32Array(GW * GH * 4);

    readTextureInto(
      fluidRead === TEX_FLUID_B ? fluidB : fluidA,
      debugFluidReadback,
    );
    readTextureInto(
      pigmentRead === TEX_PIGMENT_B ? pigmentB : pigmentA,
      debugPigmentReadback,
    );

    let wetMass = 0;
    let weightedU = 0;
    let weightedV = 0;
    let maxSpeed = -1;
    let maxSpeedX = 0;
    let maxSpeedGLY = 0;
    let minU = Infinity;
    let maxU = -Infinity;
    let minV = Infinity;
    let maxV = -Infinity;

    let pigmentMass = 0;
    let pigmentX = 0;
    let pigmentGLY = 0;
    let pigmentWeightedU = 0;
    let pigmentWeightedV = 0;
    let maxPigment = -1;
    let maxPigmentX = 0;
    let maxPigmentGLY = 0;

    for (let y = 0; y < GH; y++) {
      for (let x = 0; x < GW; x++) {
        const i = (y * GW + x) * 4;
        const velU = debugFluidReadback[i];
        const velV = debugFluidReadback[i + 1];
        const wet = debugFluidReadback[i + 3];
        const speed = Math.hypot(velU, velV);

        if (wet > 0.001) {
          wetMass += wet;
          weightedU += velU * wet;
          weightedV += velV * wet;
        }
        if (speed > maxSpeed) {
          maxSpeed = speed;
          maxSpeedX = x;
          maxSpeedGLY = y;
        }
        minU = Math.min(minU, velU);
        maxU = Math.max(maxU, velU);
        minV = Math.min(minV, velV);
        maxV = Math.max(maxV, velV);

        const pigment =
          debugPigmentReadback[i] +
          debugPigmentReadback[i + 1] +
          debugPigmentReadback[i + 2];
        if (pigment > 0.00001) {
          pigmentMass += pigment;
          pigmentX += x * pigment;
          pigmentGLY += y * pigment;
          pigmentWeightedU += velU * pigment;
          pigmentWeightedV += velV * pigment;
        }
        if (pigment > maxPigment) {
          maxPigment = pigment;
          maxPigmentX = x;
          maxPigmentGLY = y;
        }
      }
    }

    const avgU = wetMass > 0 ? weightedU / wetMass : 0;
    const avgV = wetMass > 0 ? weightedV / wetMass : 0;
    const centerX = pigmentMass > 0 ? pigmentX / pigmentMass : null;
    const centerGLY = pigmentMass > 0 ? pigmentGLY / pigmentMass : null;
    const centerVisibleY = centerGLY;
    const pigmentAvgU = pigmentMass > 0 ? pigmentWeightedU / pigmentMass : 0;
    const pigmentAvgV = pigmentMass > 0 ? pigmentWeightedV / pigmentMass : 0;

    console.log(
      `[GPU-SIM] readback ${label} ${JSON.stringify({
        grid: [GW, GH],
        textures: { fluidRead, pigmentRead, depositRead },
        velocity: {
          wetMass: Number(wetMass.toFixed(4)),
          avgU: Number(avgU.toFixed(5)),
          avgV: Number(avgV.toFixed(5)),
          minU: Number(minU.toFixed(5)),
          maxU: Number(maxU.toFixed(5)),
          minV: Number(minV.toFixed(5)),
          maxV: Number(maxV.toFixed(5)),
          maxSpeed: Number(maxSpeed.toFixed(5)),
          maxSpeedAt: {
            x: maxSpeedX,
            glY: maxSpeedGLY,
            visibleY: maxSpeedGLY,
          },
        },
        pigment: {
          mass: Number(pigmentMass.toFixed(4)),
          localVelocity: {
            avgU: Number(pigmentAvgU.toFixed(5)),
            avgV: Number(pigmentAvgV.toFixed(5)),
          },
          center:
            centerX == null
              ? null
              : {
                  x: Number(centerX.toFixed(2)),
                  glY: Number(centerGLY!.toFixed(2)),
                  visibleY: Number(centerVisibleY!.toFixed(2)),
                },
          max: Number(maxPigment.toFixed(5)),
          maxAt: {
            x: maxPigmentX,
            glY: maxPigmentGLY,
            visibleY: maxPigmentGLY,
          },
        },
      })}`,
    );
    debugReadbackLogCount++;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  // ─── Public API ───────────────────────────────────────────────────────

  function step(params: GpuSimParams) {
    gl.viewport(0, 0, GW, GH);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);

    bindAllTextures();

    // Apply brush stamps first (before sim)
    if (pendingStamps.length > 0) {
      alignReadStateToB();
      passBrush(pendingStamps);
      pendingStamps = [];
      // Re-bind after brush modified textures
      bindAllTextures();
    }

    // 1. Diffuse wet: fluidA -> fluidB
    passDiffuseWet(params);
    bindTextureUnit(TEX_FLUID_B, fluidB);

    // 2. Edge darkening (optional): fluidB -> fluidA
    if (params.edgeDarkeningEnabled) {
      passEdgeDarkening(params);
      bindTextureUnit(TEX_FLUID_A, fluidA);
    } else {
      // Skip edge darkening — copy fluidB to A conceptually
      // Actually just swap the read pointers
      // velocity pass reads from whatever is current
      fluidRead = TEX_FLUID_B;
    }

    // 3. Update velocity: fluid(current) -> fluid(other)
    // After edge darkening: fluidA is current, writes to fluidB
    // Without edge darkening: fluidB is current, writes to fluidA
    if (fluidRead === TEX_FLUID_A) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fboFluidB);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fboFluidA);
    }
    gl.viewport(0, 0, GW, GH);
    {
      const u = useProgram(progVelocity);
      gl.uniform1i(u["u_fluid"], fluidRead);
      gl.uniform1i(u["u_paper"], TEX_PAPER);
      gl.uniform1i(u["u_deposit"], depositRead);
      gl.uniform2f(u["u_texelSize"], texelSize[0], texelSize[1]);
      gl.uniform1f(u["u_DT"], params.DT);
      gl.uniform1f(u["u_viscosity"], params.viscosity);
      gl.uniform1f(u["u_drag"], params.drag);
      gl.uniform1f(u["u_paperTilt"], params.paperTilt);
      gl.uniform1f(u["u_velClamp"], params.velClamp);
      gl.uniform1f(u["u_pressureDecay"], params.pressureDecay);
      gl.uniform1i(u["u_maskActive"], params.maskActive ? 1 : 0);
      gl.uniform1i(u["u_gravityMode"], params.gravityMode);
      gl.uniform2f(
        u["u_gravityBias"],
        params.gravityBias[0],
        params.gravityBias[1],
      );
      gl.uniform1f(u["u_gravityStrength"], params.gravityStrength);
      gl.uniform2f(u["u_gridCenter"], (GW - 1) / 2, (GH - 1) / 2);
      gl.uniform1i(u["u_edgeOpenLeft"], params.edgeOpen.left ? 1 : 0);
      gl.uniform1i(u["u_edgeOpenRight"], params.edgeOpen.right ? 1 : 0);
      gl.uniform1i(u["u_edgeOpenTop"], params.edgeOpen.top ? 1 : 0);
      gl.uniform1i(u["u_edgeOpenBottom"], params.edgeOpen.bottom ? 1 : 0);
      draw();
    }
    // After velocity: output is in the "other" buffer
    if (fluidRead === TEX_FLUID_A) {
      fluidRead = TEX_FLUID_B;
      bindTextureUnit(TEX_FLUID_B, fluidB);
    } else {
      fluidRead = TEX_FLUID_A;
      bindTextureUnit(TEX_FLUID_A, fluidA);
    }

    // 4. Advection (movePigment): reads fluid(current) + pigmentA -> pigmentB
    {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fboPigmentB);
      gl.viewport(0, 0, GW, GH);
      const u = useProgram(progAdvect);
      gl.uniform1i(u["u_fluid"], fluidRead);
      gl.uniform1i(u["u_pigment"], TEX_PIGMENT_A);
      gl.uniform1i(u["u_deposit"], depositRead);
      gl.uniform2f(u["u_texelSize"], texelSize[0], texelSize[1]);
      gl.uniform1f(u["u_adt"], params.DT * 0.7);
      gl.uniform1f(u["u_pigmentDiffusion"], params.pigmentDiffusion);
      gl.uniform1i(u["u_maskActive"], params.maskActive ? 1 : 0);
      gl.uniform1i(u["u_edgeOpenLeft"], params.edgeOpen.left ? 1 : 0);
      gl.uniform1i(u["u_edgeOpenRight"], params.edgeOpen.right ? 1 : 0);
      gl.uniform1i(u["u_edgeOpenTop"], params.edgeOpen.top ? 1 : 0);
      gl.uniform1i(u["u_edgeOpenBottom"], params.edgeOpen.bottom ? 1 : 0);
      draw();
      pigmentRead = TEX_PIGMENT_B;
      bindTextureUnit(TEX_PIGMENT_B, pigmentB);
    }

    // 5. Transfer + evaporate + drain (MRT)
    // Align reads to B so the MRT can safely write authoritative state to A.
    alignReadStateToB();
    {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fboTransferA);
      gl.viewport(0, 0, GW, GH);
      const u = useProgram(progTransfer);
      gl.uniform1i(u["u_fluid"], fluidRead);
      gl.uniform1i(u["u_pigment"], pigmentRead);
      gl.uniform1i(u["u_deposit"], depositRead);
      gl.uniform1i(u["u_paper"], TEX_PAPER);
      gl.uniform2f(u["u_texelSize"], texelSize[0], texelSize[1]);
      gl.uniform1i(u["u_maskActive"], params.maskActive ? 1 : 0);
      gl.uniform1f(
        u["u_evaporationRate"],
        params.dryingPaused ? 1.0 : params.evaporationRate,
      );
      gl.uniform1f(u["u_maxPigment"], params.maxPigment);
      gl.uniform1f(u["u_drainAdt"], params.DT * 0.7);
      gl.uniform3f(
        u["u_density"],
        params.pigDensity[0],
        params.pigDensity[1],
        params.pigDensity[2],
      );
      gl.uniform3f(
        u["u_staining"],
        params.pigStaining[0],
        params.pigStaining[1],
        params.pigStaining[2],
      );
      gl.uniform3f(
        u["u_granulation"],
        params.pigGranulation[0],
        params.pigGranulation[1],
        params.pigGranulation[2],
      );
      gl.uniform1i(u["u_edgeOpenLeft"], params.edgeOpen.left ? 1 : 0);
      gl.uniform1i(u["u_edgeOpenRight"], params.edgeOpen.right ? 1 : 0);
      gl.uniform1i(u["u_edgeOpenTop"], params.edgeOpen.top ? 1 : 0);
      gl.uniform1i(u["u_edgeOpenBottom"], params.edgeOpen.bottom ? 1 : 0);
      draw();

      // After MRT: pigmentA, depositA, fluidA are current
      fluidRead = TEX_FLUID_A;
      pigmentRead = TEX_PIGMENT_A;
      depositRead = TEX_DEPOSIT_A;
    }

    // Rebind for next step / render sampling
    bindAllTextures();

    // At end of step: fluidA, pigmentA, depositA hold authoritative state
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function stampBrush(stamps: BrushStamp[]) {
    if (gpuSimDebugLogs() && debugStampLogCount < 12) {
      console.debug("[GPU-SIM] handle.stampBrush queued", {
        count: stamps.length,
        first: stamps[0] ?? null,
      });
      debugStampLogCount++;
    }
    pendingStamps.push(...stamps);
  }

  function debugApplyBrushStampsOnly() {
    if (pendingStamps.length === 0) {
      if (gpuSimDebugLogs() && debugBrushPassLogCount < 12) {
        console.debug("[GPU-SIM] debugApplyBrushStampsOnly no pending stamps");
        debugBrushPassLogCount++;
      }
      return;
    }
    if (gpuSimDebugLogs() && debugBrushPassLogCount < 12) {
      console.debug("[GPU-SIM] debugApplyBrushStampsOnly flushing", {
        pending: pendingStamps.length,
      });
      debugBrushPassLogCount++;
    }
    gl.viewport(0, 0, GW, GH);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    bindAllTextures();
    alignReadStateToB();
    passBrush(pendingStamps);
    pendingStamps = [];
    bindAllTextures();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function debugApplyTransferOnly(params: GpuSimParams) {
    gl.viewport(0, 0, GW, GH);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    bindAllTextures();

    if (pendingStamps.length > 0) {
      alignReadStateToB();
      passBrush(pendingStamps);
      pendingStamps = [];
      bindAllTextures();
    }

    const writeToB = pigmentRead === TEX_PIGMENT_A;
    if (gpuSimDebugLogs() && debugBrushPassLogCount < 12) {
      console.debug("[GPU-SIM] debugApplyTransferOnly draw", {
        writeTarget: writeToB ? "B" : "A",
        fluidRead,
        pigmentRead,
        depositRead,
      });
      debugBrushPassLogCount++;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, writeToB ? fboBrushB : fboBrushA);
    const u = useProgram(progTransfer);
    gl.uniform1i(u["u_fluid"], fluidRead);
    gl.uniform1i(u["u_pigment"], pigmentRead);
    gl.uniform1i(u["u_deposit"], depositRead);
    gl.uniform1i(u["u_paper"], TEX_PAPER);
    gl.uniform2f(u["u_texelSize"], texelSize[0], texelSize[1]);
    gl.uniform1i(u["u_maskActive"], params.maskActive ? 1 : 0);
    gl.uniform1f(u["u_evaporationRate"], 1.0);
    gl.uniform1f(u["u_maxPigment"], params.maxPigment);
    gl.uniform1f(u["u_drainAdt"], 0.0);
    gl.uniform3f(
      u["u_density"],
      params.pigDensity[0],
      params.pigDensity[1],
      params.pigDensity[2],
    );
    gl.uniform3f(
      u["u_staining"],
      params.pigStaining[0],
      params.pigStaining[1],
      params.pigStaining[2],
    );
    gl.uniform3f(
      u["u_granulation"],
      params.pigGranulation[0],
      params.pigGranulation[1],
      params.pigGranulation[2],
    );
    gl.uniform1i(u["u_edgeOpenLeft"], 0);
    gl.uniform1i(u["u_edgeOpenRight"], 0);
    gl.uniform1i(u["u_edgeOpenTop"], 0);
    gl.uniform1i(u["u_edgeOpenBottom"], 0);
    draw();

    if (writeToB) {
      fluidRead = TEX_FLUID_B;
      pigmentRead = TEX_PIGMENT_B;
      depositRead = TEX_DEPOSIT_B;
    } else {
      fluidRead = TEX_FLUID_A;
      pigmentRead = TEX_PIGMENT_A;
      depositRead = TEX_DEPOSIT_A;
    }

    bindAllTextures();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function debugApplyWetDiffusionOnly(params: GpuSimParams) {
    gl.viewport(0, 0, GW, GH);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    bindAllTextures();

    if (pendingStamps.length > 0) {
      alignReadStateToB();
      passBrush(pendingStamps);
      pendingStamps = [];
      bindAllTextures();
    }

    const writeToB = fluidRead === TEX_FLUID_A;
    if (gpuSimDebugLogs() && debugBrushPassLogCount < 12) {
      console.debug("[GPU-SIM] debugApplyWetDiffusionOnly draw", {
        writeTarget: writeToB ? "B" : "A",
        fluidRead,
        depositRead,
      });
      debugBrushPassLogCount++;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, writeToB ? fboFluidB : fboFluidA);
    const u = useProgram(progDiffuseWet);
    gl.uniform1i(u["u_fluid"], fluidRead);
    gl.uniform1i(u["u_deposit"], depositRead);
    gl.uniform2f(u["u_texelSize"], texelSize[0], texelSize[1]);
    gl.uniform1f(u["u_wetDiffusion"], params.wetDiffusion);
    gl.uniform1i(u["u_maskActive"], params.maskActive ? 1 : 0);
    draw();

    fluidRead = writeToB ? TEX_FLUID_B : TEX_FLUID_A;
    // This checkpoint renders only fluid.w. Keep all current pointers on
    // the same side so the next brush pass can safely render to the opposite
    // side without sampling any texture attached to the target FBO.
    pigmentRead = writeToB ? TEX_PIGMENT_B : TEX_PIGMENT_A;
    depositRead = writeToB ? TEX_DEPOSIT_B : TEX_DEPOSIT_A;
    bindAllTextures();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function debugApplyVelocityOnly(params: GpuSimParams) {
    debugApplyWetDiffusionOnly(params);
    bindAllTextures();

    const writeToB = fluidRead === TEX_FLUID_A;
    if (gpuSimDebugLogs() && debugBrushPassLogCount < 12) {
      console.debug("[GPU-SIM] debugApplyVelocityOnly draw", {
        writeTarget: writeToB ? "B" : "A",
        fluidRead,
        depositRead,
      });
      debugBrushPassLogCount++;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, writeToB ? fboFluidB : fboFluidA);
    const u = useProgram(progVelocity);
    gl.uniform1i(u["u_fluid"], fluidRead);
    gl.uniform1i(u["u_paper"], TEX_PAPER);
    gl.uniform1i(u["u_deposit"], depositRead);
    gl.uniform2f(u["u_texelSize"], texelSize[0], texelSize[1]);
    gl.uniform1f(u["u_DT"], params.DT);
    gl.uniform1f(u["u_viscosity"], params.viscosity);
    gl.uniform1f(u["u_drag"], params.drag);
    gl.uniform1f(u["u_paperTilt"], params.paperTilt);
    gl.uniform1f(u["u_velClamp"], params.velClamp);
    gl.uniform1f(u["u_pressureDecay"], params.pressureDecay);
    gl.uniform1i(u["u_maskActive"], params.maskActive ? 1 : 0);
    gl.uniform1i(u["u_gravityMode"], params.gravityMode);
    gl.uniform2f(
      u["u_gravityBias"],
      params.gravityBias[0],
      params.gravityBias[1],
    );
    gl.uniform1f(u["u_gravityStrength"], params.gravityStrength);
    gl.uniform2f(u["u_gridCenter"], (GW - 1) / 2, (GH - 1) / 2);
    gl.uniform1i(u["u_edgeOpenLeft"], params.edgeOpen.left ? 1 : 0);
    gl.uniform1i(u["u_edgeOpenRight"], params.edgeOpen.right ? 1 : 0);
    gl.uniform1i(u["u_edgeOpenTop"], params.edgeOpen.top ? 1 : 0);
    gl.uniform1i(u["u_edgeOpenBottom"], params.edgeOpen.bottom ? 1 : 0);
    draw();

    fluidRead = writeToB ? TEX_FLUID_B : TEX_FLUID_A;
    pigmentRead = writeToB ? TEX_PIGMENT_B : TEX_PIGMENT_A;
    depositRead = writeToB ? TEX_DEPOSIT_B : TEX_DEPOSIT_A;
    bindAllTextures();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function debugApplyAdvectionOnly(params: GpuSimParams) {
    const shouldLogReadback =
      gpuSimDebugReadbackEnabled() &&
      pendingStamps.length > 0 &&
      debugReadbackPaintFrameCount < 8;
    debugApplyVelocityOnly(params);
    bindAllTextures();
    if (shouldLogReadback) logDebugReadback("after-velocity");

    const writeToB = pigmentRead === TEX_PIGMENT_A;
    if (gpuSimDebugLogs() && debugBrushPassLogCount < 12) {
      console.debug("[GPU-SIM] debugApplyAdvectionOnly draw", {
        writeTarget: writeToB ? "B" : "A",
        fluidRead,
        pigmentRead,
        depositRead,
      });
      debugBrushPassLogCount++;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, writeToB ? fboPigmentB : fboPigmentA);
    const u = useProgram(progAdvect);
    gl.uniform1i(u["u_fluid"], fluidRead);
    gl.uniform1i(u["u_pigment"], pigmentRead);
    gl.uniform1i(u["u_deposit"], depositRead);
    gl.uniform2f(u["u_texelSize"], texelSize[0], texelSize[1]);
    gl.uniform1f(u["u_adt"], params.DT * 0.7);
    gl.uniform1f(u["u_pigmentDiffusion"], params.pigmentDiffusion);
    gl.uniform1i(u["u_maskActive"], params.maskActive ? 1 : 0);
    gl.uniform1i(u["u_edgeOpenLeft"], params.edgeOpen.left ? 1 : 0);
    gl.uniform1i(u["u_edgeOpenRight"], params.edgeOpen.right ? 1 : 0);
    gl.uniform1i(u["u_edgeOpenTop"], params.edgeOpen.top ? 1 : 0);
    gl.uniform1i(u["u_edgeOpenBottom"], params.edgeOpen.bottom ? 1 : 0);
    draw();

    pigmentRead = writeToB ? TEX_PIGMENT_B : TEX_PIGMENT_A;
    bindAllTextures();
    if (shouldLogReadback) logDebugReadback("after-advection-before-align");

    if (pigmentRead === TEX_PIGMENT_B) {
      if (fluidRead !== TEX_FLUID_B) copyTexture(fluidRead, fboFluidB);
      if (depositRead !== TEX_DEPOSIT_B) copyTexture(depositRead, fboDepositB);
      fluidRead = TEX_FLUID_B;
      depositRead = TEX_DEPOSIT_B;
    } else {
      if (fluidRead !== TEX_FLUID_A) copyTexture(fluidRead, fboFluidA);
      if (depositRead !== TEX_DEPOSIT_A) copyTexture(depositRead, fboDepositA);
      fluidRead = TEX_FLUID_A;
      depositRead = TEX_DEPOSIT_A;
    }

    bindAllTextures();
    if (shouldLogReadback) {
      logDebugReadback("after-advection-aligned");
      debugReadbackPaintFrameCount++;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function uploadState(state: GpuStateArrays) {
    gl.activeTexture(gl.TEXTURE0 + TEX_FLUID_A);
    gl.bindTexture(gl.TEXTURE_2D, fluidA);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      GW,
      GH,
      gl.RGBA,
      gl.FLOAT,
      state.fluid,
    );

    gl.activeTexture(gl.TEXTURE0 + TEX_PIGMENT_A);
    gl.bindTexture(gl.TEXTURE_2D, pigmentA);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      GW,
      GH,
      gl.RGBA,
      gl.FLOAT,
      state.pigment,
    );

    gl.activeTexture(gl.TEXTURE0 + TEX_DEPOSIT_A);
    gl.bindTexture(gl.TEXTURE_2D, depositA);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      GW,
      GH,
      gl.RGBA,
      gl.FLOAT,
      state.deposit,
    );

    gl.activeTexture(gl.TEXTURE0 + TEX_PAPER);
    gl.bindTexture(gl.TEXTURE_2D, paper);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      GW,
      GH,
      gl.RGBA,
      gl.FLOAT,
      state.paper,
    );

    // Reset ping-pong state
    fluidRead = TEX_FLUID_A;
    pigmentRead = TEX_PIGMENT_A;
    depositRead = TEX_DEPOSIT_A;
  }

  function downloadState(state: GpuStateArrays) {
    // Read back from current-read textures
    const readFBO = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, readFBO);

    // Fluid
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      fluidA,
      0,
    );
    gl.readPixels(0, 0, GW, GH, gl.RGBA, gl.FLOAT, state.fluid);

    // Pigment
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      pigmentA,
      0,
    );
    gl.readPixels(0, 0, GW, GH, gl.RGBA, gl.FLOAT, state.pigment);

    // Deposit
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      depositRead === TEX_DEPOSIT_B ? depositB : depositA,
      0,
    );
    gl.readPixels(0, 0, GW, GH, gl.RGBA, gl.FLOAT, state.deposit);

    // Paper (static, always the same)
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      paper,
      0,
    );
    gl.readPixels(0, 0, GW, GH, gl.RGBA, gl.FLOAT, state.paper);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(readFBO);
  }

  function getFluidTexture(): WebGLTexture {
    return fluidRead === TEX_FLUID_B ? fluidB : fluidA;
  }

  function getPigmentTexture(): WebGLTexture {
    return pigmentRead === TEX_PIGMENT_B ? pigmentB : pigmentA;
  }

  function getDepositTexture(): WebGLTexture {
    return depositRead === TEX_DEPOSIT_B ? depositB : depositA;
  }

  function debugFillPigmentTexture() {
    const data = new Float32Array(GW * GH * 4);
    for (let y = 0; y < GH; y++) {
      for (let x = 0; x < GW; x++) {
        const i = (y * GW + x) * 4;
        data[i] = x / Math.max(1, GW - 1);
        data[i + 1] = y / Math.max(1, GH - 1);
        data[i + 2] = x % 24 < 12 === y % 24 < 12 ? 1 : 0.15;
        data[i + 3] = 1;
      }
    }
    gl.activeTexture(gl.TEXTURE0 + TEX_PIGMENT_A);
    gl.bindTexture(gl.TEXTURE_2D, pigmentA);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, GW, GH, gl.RGBA, gl.FLOAT, data);
    pigmentRead = TEX_PIGMENT_A;
  }

  function destroy() {
    for (const prog of programs) gl.deleteProgram(prog);
    for (const tex of textures) gl.deleteTexture(tex);
    gl.deleteVertexArray(vao);
    if (debugReadFbo) gl.deleteFramebuffer(debugReadFbo);
    gl.deleteFramebuffer(fboFluidA);
    gl.deleteFramebuffer(fboFluidB);
    gl.deleteFramebuffer(fboPigmentA);
    gl.deleteFramebuffer(fboPigmentB);
    gl.deleteFramebuffer(fboDepositA);
    gl.deleteFramebuffer(fboDepositB);
    gl.deleteFramebuffer(fboBinarize);
    gl.deleteFramebuffer(fboBlurTmp);
    gl.deleteFramebuffer(fboBlurTmp2);
    gl.deleteFramebuffer(fboTransferA);
    gl.deleteFramebuffer(fboTransferB);
    gl.deleteFramebuffer(fboBrushA);
    gl.deleteFramebuffer(fboBrushB);
  }

  return {
    step,
    stampBrush,
    uploadState,
    downloadState,
    getFluidTexture,
    getPigmentTexture,
    getDepositTexture,
    debugFillPigmentTexture,
    debugApplyBrushStampsOnly,
    debugApplyTransferOnly,
    debugApplyWetDiffusionOnly,
    debugApplyVelocityOnly,
    debugApplyAdvectionOnly,
    destroy,
  };
}
