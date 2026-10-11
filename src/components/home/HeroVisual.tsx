'use client';
// The hero picture: a still line illustration (TypeArt "wall") that is always in the box, so nothing shifts, and a 3D wall
// unit that is loaded on top of it. It loads by itself only on a large screen with a fine pointer and a capable device,
// once the page has gone idle and half the box is on screen, and never on Save-Data connections; everywhere else the
// visitor taps "หมุนดูแบบ 3 มิติ". If the chunk cannot load, WebGL is missing, the scene throws or the GPU drops the
// context, the still picture simply stays — the page never breaks because of the 3D view.
import dynamic from 'next/dynamic';
import { Component, useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Hero3DProps } from '@/components/hero3d/Hero3D';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/components/ui/cn';
import { TypeArt } from '@/components/shared/TypeArt';

/** Stand-in for the 3D chunk when it cannot be fetched: reports the failure, renders nothing. Lives here, not in the
 *  chunk that failed. */
function Hero3DUnavailable({ onFail }: Hero3DProps) {
  useEffect(() => {
    onFail?.();
  }, [onFail]);
  return null;
}

const Hero3D = dynamic(
  () => import('@/components/hero3d/Hero3D').catch(() => ({ default: Hero3DUnavailable })),
  { ssr: false },
);

/** Catches a runtime error inside the 3D view (scene.ts) so it never reaches the page; the still picture stays. */
class Hero3DBoundary extends Component<{ onFail?: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFail?.();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const STILL_VARS = { '--type-art-fill': 'var(--color-surface)', '--type-art-air': 'var(--color-sky)' } as CSSProperties;

/** The visitor's choice from the pause button, kept in this browser only. */
const MOTION_KEY = 'sbp-motion';

type DeviceNavigator = Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };

/** Large screen, mouse or trackpad, more than 4 cores and at least 4 GB: the only devices that load three.js unasked. */
function canAutoLoad(): boolean {
  const nav = navigator as DeviceNavigator;
  if (nav.connection?.saveData) return false;
  return (
    window.matchMedia('(min-width: 64rem) and (pointer: fine)').matches &&
    (nav.hardwareConcurrency ?? 8) > 4 &&
    (nav.deviceMemory ?? 8) >= 4
  );
}

export function HeroVisual({ className }: { className?: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  // null until mounted: the server does not know the device, so neither control is in the static HTML
  const [auto, setAuto] = useState<boolean | null>(null);
  const [paused, setPaused] = useState(false);
  const [tapped, setTapped] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(MOTION_KEY) === 'paused') setPaused(true);
    } catch {
      /* storage blocked: start playing */
    }
  }, []);

  useEffect(() => {
    const box = boxRef.current;
    const ok = canAutoLoad();
    setAuto(ok);
    if (!ok || !box) return;
    let idle = false;
    let seen = false;
    const go = () => {
      if (idle && seen) setActive(true);
    };
    const onIdle = () => {
      idle = true;
      go();
    };
    let idleId = 0;
    let timer = 0;
    if (typeof window.requestIdleCallback === 'function') idleId = window.requestIdleCallback(onIdle, { timeout: 2000 });
    else timer = window.setTimeout(onIdle, 900);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        seen = true;
        io.disconnect();
        go();
      },
      { rootMargin: '0px', threshold: 0.5 },
    );
    io.observe(box);
    return () => {
      io.disconnect();
      if (idleId) window.cancelIdleCallback(idleId);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const onReady = useCallback(() => setReady(true), []);
  const onFail = useCallback(() => {
    setFailed(true);
    setReady(false);
  }, []);

  const togglePaused = () => {
    const next = !paused;
    setPaused(next);
    try {
      localStorage.setItem(MOTION_KEY, next ? 'paused' : 'play');
    } catch {
      /* storage blocked: the choice lasts for this visit */
    }
  };

  const showStill = !ready || failed;
  // what the button under the box is right now (nothing on the server, and nothing while a capable desktop auto-loads)
  const control: 'open' | 'loading' | 'live' | 'failed' | null =
    ready && !failed
      ? 'live'
      : failed
        ? tapped
          ? 'failed'
          : null
        : active
          ? tapped
            ? 'loading'
            : null
          : auto === false
            ? 'open'
            : null;

  return (
    <div className={cn('relative mx-auto w-full max-w-[40rem]', className)}>
      <div ref={boxRef} className="relative aspect-[4/3] w-full">
        {/* soft glow behind the unit */}
        <div
          aria-hidden
          className="absolute inset-[6%] -z-10 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-sky)_22%,transparent),transparent)]"
        />
        <div
          className={cn(
            'absolute inset-0 grid place-items-center transition-opacity duration-400 ease-air',
            showStill ? 'opacity-100' : 'opacity-0',
          )}
        >
          <TypeArt
            type="wall"
            animate={!paused}
            className="h-auto w-[92%] text-brand drop-shadow-[0_18px_28px_rgba(0,60,153,0.12)]"
            style={STILL_VARS}
          />
        </div>
        {active && !failed && (
          <Hero3DBoundary onFail={onFail}>
            <Hero3D onReady={onReady} onFail={onFail} paused={paused} />
          </Hero3DBoundary>
        )}
      </div>
      {/* fixed 44px row: the control appears after hydration without moving anything below */}
      <div className="mt-3 flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <Badge tone="outline" icon="info">
          ภาพประกอบ
        </Badge>
        {control && (
          <span className="flex items-center gap-2">
            {control === 'live' && (
              <span aria-hidden className="text-meta text-ink-3 max-sm:hidden">
                ลากเพื่อหมุนดู
              </span>
            )}
            {/* one button that changes role (open → loading → pause), so keyboard focus stays on it throughout */}
            {control === 'live' ? (
              // a toggle: the name stays the same and aria-pressed carries the state (WCAG 2.2.2 pause control)
              <Button
                key="ctl"
                variant="quiet"
                size="sm"
                aria-pressed={paused}
                icon={paused ? 'play' : 'pause'}
                onClick={togglePaused}
                className="aria-pressed:bg-surface-2 aria-pressed:text-ink"
              >
                หยุดภาพเคลื่อนไหว
              </Button>
            ) : control === 'failed' ? (
              <Button key="ctl" variant="ghost" size="sm" icon="info" aria-disabled>
                เปิดภาพ 3 มิติในเครื่องนี้ไม่ได้
              </Button>
            ) : (
              <Button
                key="ctl"
                variant="ghost"
                size="sm"
                icon="ac"
                loading={control === 'loading'}
                onClick={() => {
                  setTapped(true);
                  setActive(true);
                }}
              >
                {control === 'loading' ? 'กำลังโหลดภาพ 3 มิติ…' : 'หมุนดูแบบ 3 มิติ'}
              </Button>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
