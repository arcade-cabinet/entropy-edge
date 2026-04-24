import { Preferences } from '@capacitor/preferences';

/**
 * storage — Capacitor Preferences-backed key/value storage. Works on web
 * (IndexedDB under the hood), Android, and iOS. Biome lint blocks direct
 * localStorage / sessionStorage use project-wide; this module is the
 * approved escape hatch.
 */

export async function setItem(key: string, value: string): Promise<void> {
  await Preferences.set({ key, value });
}

export async function getItem(key: string): Promise<string | null> {
  const result = await Preferences.get({ key });
  return result.value ?? null;
}

export async function removeItem(key: string): Promise<void> {
  await Preferences.remove({ key });
}
