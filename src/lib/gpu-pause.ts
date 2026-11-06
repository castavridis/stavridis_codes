import { useSyncExternalStore } from "react";

// Global "GPU pause" — a manual off-switch for every watercolor sim on the
// site (landing wash, Care Team orbit wash, wash highlights). Meant for video
// calls: a browser can't tell when you're on one, so this is a switch you
// flip yourself, and it stays flipped until you flip it back.
//
//   - Toggle:   Shift+Alt+P (Shift+Option+P on macOS) anywhere on the site,
//               or the "GPU paused" pill that shows while it's on.
//   - URL:      ?gpu=off pauses, ?gpu=on resumes (handy as a bookmark).
//   - Persists: localStorage, so a reload / new tab stays paused; other open
//               tabs follow along via the `storage` event.
//
// Framework-agnostic on purpose: CareTeamOrbit (class component) and
// wash-highlight.js (plain JS) subscribe directly; React code uses
// `useGpuPaused()`.

const KEY = "gpu-paused";
const listeners = new Set<(paused: boolean) => void>();

function readStored(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function readUrl(): boolean | null {
  if (typeof location === "undefined") return null;
  const v = new URLSearchParams(location.search).get("gpu");
  if (v === "off" || v === "pause" || v === "paused") return true;
  if (v === "on" || v === "resume") return false;
  return null;
}

let paused = typeof window === "undefined" ? false : (readUrl() ?? readStored());

function emit() {
  for (const fn of listeners) fn(paused);
}

export function isGpuPaused(): boolean {
  return paused;
}

export function setGpuPaused(next: boolean): void {
  if (next === paused) return;
  paused = next;
  try {
    if (next) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
  } catch {
    /* storage blocked — the switch still works for this tab */
  }
  emit();
}

export function toggleGpuPaused(): void {
  setGpuPaused(!paused);
}

export function subscribeGpuPause(fn: (paused: boolean) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Resolves immediately when running; otherwise on the next resume. Lets
// one-shot effects (wash highlights) defer spinning up a GL context.
export function whenGpuResumed(): Promise<void> {
  if (!paused) return Promise.resolve();
  return new Promise((resolve) => {
    const off = subscribeGpuPause((p) => {
      if (p) return;
      off();
      resolve();
    });
  });
}

export function useGpuPaused(): boolean {
  return useSyncExternalStore(subscribeGpuPause, isGpuPaused, () => false);
}

if (typeof window !== "undefined") {
  // A URL override is an explicit choice — persist it like a toggle would.
  const fromUrl = readUrl();
  if (fromUrl !== null) {
    try {
      if (fromUrl) localStorage.setItem(KEY, "1");
      else localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }

  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    const next = e.newValue === "1";
    if (next === paused) return;
    paused = next;
    emit();
  });

  window.addEventListener("keydown", (e) => {
    if (!(e.shiftKey && e.altKey) || e.metaKey || e.ctrlKey) return;
    if (e.code !== "KeyP") return;
    const t = e.target as HTMLElement | null;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    e.preventDefault();
    toggleGpuPaused();
  });
}
