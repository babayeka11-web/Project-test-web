'use client';
// The hero picture: a still line illustration (TypeArt "wall") that is always in the box, so nothing shifts, and a 3D wall
// unit that is loaded lazily on top of it — only after the page has painted and gone idle, only when the box is (nearly) on
// screen, and never on Save-Data connections. If WebGL is missing or the GPU drops the context the still picture stays.
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/components/ui/cn';
import { TypeArt } from '@/components/shared/TypeArt';

const Hero3D = dynamic(() => import('@/components/hero3d/Hero3D'), { ssr: false });

const STILL_VARS = { '--type-art-fill': 'var(--color-surface)', '--type-art-air': 'var(--color-sky)' } as CSSProperties;

type SaveDataNavigator = Navigator & { connection?: { saveData?: boolean } };

export function HeroVisual({ className }: { className?: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const box = boxRef.current;
    if ((navigator as SaveDataNavigator).connection?.saveData || !box) return;
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
      { rootMargin: '240px' },
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

  const showStill = !ready || failed;

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
          <TypeArt type="wall" className="h-auto w-[92%] text-brand drop-shadow-[0_18px_28px_rgba(0,60,153,0.12)]" style={STILL_VARS} />
        </div>
        {active && !failed && <Hero3D onReady={onReady} onFail={onFail} />}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <Badge tone="outline" icon="info">
          ภาพประกอบ
        </Badge>
        {ready && !failed && (
          <span aria-hidden className="text-meta text-ink-3">
            ลากเพื่อหมุนดู
          </span>
        )}
      </div>
    </div>
  );
}
