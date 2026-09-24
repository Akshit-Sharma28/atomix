export const THEME_STORAGE_KEY = "atomix:theme";
export const THEME_PREFERENCE_EVENT = "atomix:theme-preference-changed";

export type AtomixTheme = "dark" | "light";

export function readThemePreference(): AtomixTheme {
  return window.localStorage.getItem(THEME_STORAGE_KEY) === "light"
    ? "light"
    : "dark";
}

export function applyThemePreference(theme: AtomixTheme) {
  const root = document.documentElement;
  root.classList.toggle("light", theme === "light");
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function saveThemePreference(theme: AtomixTheme) {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyThemePreference(theme);
  window.dispatchEvent(
    new CustomEvent(THEME_PREFERENCE_EVENT, { detail: { theme } }),
  );
}

export function subscribeToThemePreference(onChange: () => void) {
  const handleChange = () => {
    applyThemePreference(readThemePreference());
    onChange();
  };

  window.addEventListener(THEME_PREFERENCE_EVENT, handleChange);
  window.addEventListener("storage", handleChange);

  return () => {
    window.removeEventListener(THEME_PREFERENCE_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}

export function getServerThemePreference(): AtomixTheme {
  return "dark";
}
