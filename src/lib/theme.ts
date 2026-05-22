export type AppTheme = 'dark' | 'light'

export const THEME_ATTRIBUTE = 'data-theme'
export const THEME_STORAGE_KEY = 'oip-theme'

export const THEME_BOOTSTRAP_SCRIPT = `(() => {
  try {
    const root = document.documentElement;
    const savedTheme = window.localStorage.getItem('${THEME_STORAGE_KEY}');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const theme = savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : systemTheme;
    root.setAttribute('${THEME_ATTRIBUTE}', theme);
    root.style.colorScheme = theme;
  } catch {}
})();`
