// Shared orbit motion: the opening figure's (Nurse Day) algorithm, used by every orbit figure.
// Each dot rides a circular orbit on a tilted plane; it pulses in and out along its radius and lifts off the plane on two slow beats.
(function () {
  const OM = {
    radial: (wb, t, ph) => wb * 0.07 * Math.sin(t * 1.3 + ph),       // fraction of the radius
    lift: (wb, t, ph) => wb * 0.14 * Math.sin(t * 0.9 + ph * 1.7),    // off the orbital plane, scene units (radius about 2)
    bob: (t, b, amp) => (amp ?? 0.03) * Math.sin(t * 0.5 + b),        // slow drift, scene units
    SCENE_R: 2
  };
  globalThis.OrbitMotion = OM;
})();
export const OrbitMotion = globalThis.OrbitMotion;
