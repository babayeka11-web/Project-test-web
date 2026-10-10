'use client';
// Mounts the procedural wall-unit scene (scene.ts, three.js) into a div that fills its parent. This module is the lazy
// chunk: the home hero imports it with next/dynamic after first paint, so three.js is never part of the initial JS.
// If WebGL is missing or the GPU drops the context, `onFail` tells the hero to keep showing the still illustration.
import { useEffect, useRef } from 'react';
import { createWallUnitScene, type WallUnitScene } from './scene';

export type Hero3DProps = {
  /** Called once the first 3D frame is on screen (the hero then fades the still illustration out). */
  onReady?: () => void;
  /** Called when WebGL cannot start or the context is lost (the hero keeps the still illustration). */
  onFail?: () => void;
};

/** The sky colour of the current theme (--color-sky), used for the air wisps. */
const readSky = () => getComputedStyle(document.documentElement).getPropertyValue('--color-sky').trim() || '#0b74b5';

/** Whether the page is dark right now: html[data-theme] wins, otherwise the OS setting. */
const isDark = () => {
  const forced = document.documentElement.dataset.theme;
  return forced ? forced === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
};
const airGain = () => (isDark() ? 1.7 : 1);

/** True when a WebGL context can be created here (checked first so a missing GPU does not spam the console). */
function hasWebGL(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2') ?? document.createElement('canvas').getContext('webgl');
    if (!gl) return false;
    (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export default function Hero3D({ onReady, onFail }: Hero3DProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const cb = useRef({ onReady, onFail });
  cb.current = { onReady, onFail };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (!hasWebGL()) {
      cb.current.onFail?.();
      return;
    }
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const dark = window.matchMedia('(prefers-color-scheme: dark)');

    let scene: WallUnitScene;
    try {
      scene = createWallUnitScene(host, {
        reducedMotion: motion.matches,
        airColor: readSky(),
        airGain: airGain(),
        onFirstFrame: () => cb.current.onReady?.(),
        onContextLost: () => cb.current.onFail?.(),
      });
    } catch {
      cb.current.onFail?.();
      return;
    }

    const onMotion = () => scene.setReducedMotion(motion.matches);
    const onTheme = () => scene.setAirColor(readSky(), airGain());
    motion.addEventListener('change', onMotion);
    dark.addEventListener('change', onTheme);
    // The footer's theme switch sets html[data-theme]; the CSS variables change with it.
    const mo = new MutationObserver(onTheme);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      motion.removeEventListener('change', onMotion);
      dark.removeEventListener('change', onTheme);
      mo.disconnect();
      scene.dispose();
    };
  }, []);

  return <div ref={hostRef} className="absolute inset-0 cursor-grab touch-pan-y select-none active:cursor-grabbing" />;
}
