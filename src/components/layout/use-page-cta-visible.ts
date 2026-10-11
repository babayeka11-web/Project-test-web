'use client';
// "One orange action per view": tells the header whether the page is already showing its own orange action, so the
// header's "จองล้างแอร์" can step back to a quiet variant instead of competing with it.
//
// Contract (docs/dev/UI.md §2):
//   • a page's in-flow primary (orange, .bg-cta) action — or a wrapper around it — carries `data-page-cta`;
//   • a fixed action dock sets `data-dock-open` on <html> while it is shown (and `--dock-h` for scroll padding).
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const DOCK_ATTR = 'data-dock-open';

/** True while a `[data-page-cta]` that is or holds a `.bg-cta` intersects the viewport, or `html[data-dock-open]` is set. */
export function usePageCtaVisible(): boolean {
  const pathname = usePathname();
  const [inView, setInView] = useState(false);
  const [dock, setDock] = useState(false);

  // (a) the page's own orange action is on screen
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const visible = new Set<Element>();
    let watched: Element[] = [];
    // counts only while it is (or still holds) an orange button — its content can change after it is observed
    const update = () => setInView([...visible].some((el) => el.matches('.bg-cta') || el.querySelector('.bg-cta')));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target);
          else visible.delete(e.target);
        }
        update();
      },
      { threshold: 0 },
    );
    const scan = () => {
      const next = Array.from(document.querySelectorAll('[data-page-cta]'));
      if (next.length !== watched.length || next.some((el, i) => el !== watched[i])) {
        io.disconnect();
        visible.clear();
        watched = next;
        next.forEach((el) => io.observe(el)); // each observe() reports its first state on its own
      }
      update();
    };
    scan();
    // client components mount, change and unmount after the route renders: re-scan once per frame at most
    let frame = 0;
    const mo = new MutationObserver(() => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        scan();
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  // (b) a fixed action dock is open
  useEffect(() => {
    const html = document.documentElement;
    const read = () => setDock(html.hasAttribute(DOCK_ATTR));
    read();
    const mo = new MutationObserver(read);
    mo.observe(html, { attributes: true, attributeFilter: [DOCK_ATTR] });
    return () => mo.disconnect();
  }, []);

  return inView || dock;
}
