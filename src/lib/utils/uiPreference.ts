export type UiTheme = 'classic' | 'neob';

export const UI_PREFERENCE_KEY = 'kazi_preferred_ui';

export function getStoredUiPreference(): UiTheme | null {
  if (typeof window === 'undefined') return null;
  try {
    const val = localStorage.getItem(UI_PREFERENCE_KEY);
    if (val === 'classic' || val === 'neob') return val;
  } catch {}
  return null;
}

export function setStoredUiPreference(theme: UiTheme) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(UI_PREFERENCE_KEY, theme);
    document.cookie = `${UI_PREFERENCE_KEY}=${theme}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {}
}

export function switchUi(theme: UiTheme, targetPath?: string) {
  setStoredUiPreference(theme);
  const path = targetPath || `/${theme}/dashboard`;
  window.location.href = path;
}
