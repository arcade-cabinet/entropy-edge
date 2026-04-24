import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { StatusBar, Style as StatusBarStyle } from '@capacitor/status-bar';

/**
 * capacitor — one-shot bootstrap for native-side configuration. Called
 * once from main.tsx. No-ops on web.
 *
 * - Locks the screen to portrait.
 * - Sets the status bar style to dark.
 */

export async function configureCapacitor(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await ScreenOrientation.lock({ orientation: 'portrait' });
  } catch {
    // older WebView may not support orientation lock
  }
  try {
    await StatusBar.setStyle({ style: StatusBarStyle.Dark });
  } catch {
    // ignore
  }
}
