'use client';
// ตามเครื่อง · สว่าง · มืด — the visitor's own choice, remembered in this browser only.
import { useSyncExternalStore } from 'react';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { THEME_KEY, type ThemePref } from './theme';

const subs = new Set<() => void>();
function read(): ThemePref {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === 'light' || t === 'dark' ? t : 'system';
  } catch {
    return 'system';
  }
}
function subscribe(f: () => void) {
  subs.add(f);
  window.addEventListener('storage', f);
  return () => {
    subs.delete(f);
    window.removeEventListener('storage', f);
  };
}
function write(pref: ThemePref) {
  try {
    if (pref === 'system') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, pref);
  } catch {
    /* storage blocked — the choice still applies to this page view */
  }
  const html = document.documentElement;
  if (pref === 'system') html.removeAttribute('data-theme');
  else html.setAttribute('data-theme', pref);
  subs.forEach((f) => f());
}

export function ThemeSwitch({ className }: { className?: string }) {
  const pref = useSyncExternalStore(subscribe, read, () => 'system' as ThemePref);
  return (
    <SegmentedControl<ThemePref>
      label="ธีมสีของเว็บไซต์"
      size="sm"
      value={pref}
      onChange={write}
      className={className}
      options={[
        { value: 'system', label: 'ตามเครื่อง', icon: 'monitor' },
        { value: 'light', label: 'สว่าง', icon: 'sun' },
        { value: 'dark', label: 'มืด', icon: 'moon' },
      ]}
    />
  );
}
