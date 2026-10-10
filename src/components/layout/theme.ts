// Theme preference: 'system' (follow the OS) · 'light' · 'dark'. Stored per visitor in localStorage and applied as
// html[data-theme] by THEME_SCRIPT before the first paint (no flash of the wrong theme).
export type ThemePref = 'system' | 'light' | 'dark';
export const THEME_KEY = 'sbp-theme';

/** Inline <head> script. Keep it tiny and dependency-free. */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}})();`;
