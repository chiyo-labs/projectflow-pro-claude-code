'use client';

import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { APP_SETTINGS_KEY, getDefaultSettings } from '@/lib/storage';
import type { AppSettings } from '@/types/project';

export function useAppSettings() {
  const [appSettings, setAppSettings] = useLocalStorage<AppSettings>(
    APP_SETTINGS_KEY,
    getDefaultSettings(),
  );

  const updateAppSettings = useCallback(
    (v: Partial<AppSettings>) => setAppSettings(p => ({ ...p, ...v })),
    [setAppSettings],
  );

  return { appSettings, updateAppSettings };
}
