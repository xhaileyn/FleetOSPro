'use client';

import { useAuthStore } from '@/store/authStore';
import { useConfigStore, DEFAULT_TENANT_CONFIG } from '@/store/configStore';
import en from './en';
import ar from './ar';
import ur from './ur';

const LOCALES: Record<string, Record<string, string>> = { en, ar, ur };

/** Languages that use right-to-left script. */
export const RTL_LANGS = new Set(['ar', 'ur']);

/** Returns the active language code for the current user's tenant. */
export function useLanguage(): string {
  const user          = useAuthStore(s => s.user);
  const tenantConfigs = useConfigStore(s => s.tenantConfigs);
  const tenantId      = user?.tenantId ?? 'default';
  return tenantConfigs[tenantId]?.language ?? DEFAULT_TENANT_CONFIG.language ?? 'en';
}

/**
 * Returns a translation function `t(key)` scoped to the current language.
 * Falls back to English when a key is missing from the active locale.
 * Falls back to the bare key string when missing from English too.
 */
export function useT(): (key: string) => string {
  const lang = useLanguage();
  const dict = LOCALES[lang] ?? LOCALES.en;

  return function t(key: string): string {
    return dict[key] ?? LOCALES.en[key] ?? key;
  };
}
