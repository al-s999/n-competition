"use client";

/**
 * Passthrough i18n hook for the mock environment.
 * Returns keys as-is (the fallback strings in `t(key) || "Fallback"` pattern
 * will always be used since we return the key itself).
 */
export function useTranslation() {
  const t = (key: string): string => key;
  return { t };
}
