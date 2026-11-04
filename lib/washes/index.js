// ============================================================
// Washes — entry point barrel.
//
// Re-exports the watercolor library's full public API from one
// place so consumers can do:
//
//   import { Washes, Watercolor } from 'washes';
//   import Washes from 'washes';
//
// Since the v2 engine (API 2.0), the GPU sim backend is folded
// into washes.js and auto-activates when WebGL2 is available —
// the old separate 'washes/gpu-sim' entry point is gone.
// ============================================================

export { Washes, Watercolor } from './washes.js';
export { default } from './washes.js';
