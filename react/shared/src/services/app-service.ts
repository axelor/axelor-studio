/**
 * Application configuration and info service.
 * Fetches StudioApp, AppStudio, AppBpm configs, and public app info/theme.
 *
 * @module app-service
 */
import { ServiceInstance as Service } from "./Service";
import type { StudioApp, AppStudio, AppBpm } from "../types";
import { isAxelorError } from "../types";

export async function getStudioApp(options?: Record<string, unknown>): Promise<StudioApp[]> {
  const res = await Service.search<StudioApp>("com.axelor.studio.db.StudioApp", options);
  if (isAxelorError(res)) return [];
  const data = res?.data ?? [];
  return data;
}

export const getAppStudioConfig = async (id: number | string): Promise<AppStudio | Record<string, unknown>> => {
  const res = await Service.fetchId<AppStudio>("com.axelor.studio.db.AppStudio", id);
  const appConfig = res?.data?.[0] ?? {};
  return appConfig;
};

export const getAppBPMConfig = async (id: number | string): Promise<AppBpm | Record<string, unknown>> => {
  const res = await Service.fetchId<AppBpm>("com.axelor.studio.db.AppBpm", id);
  const appConfig = res?.data?.[0] ?? {};
  return appConfig;
};

export const getApp = async (options?: Record<string, unknown>): Promise<StudioApp | undefined> => {
  const res = await Service.search<StudioApp>("com.axelor.studio.db.App", options);
  return res?.data?.[0];
};

/**
 * Promise-deduplication cache for getInfo().
 * Session-level data that doesn't change — fetched once, shared by all consumers.
 * Multiple concurrent calls (useAppTheme + StoreProvider + Viewer translations)
 * all resolve from the same network request.
 */
/** Shape of the /ws/public/app/info response. */
interface AppInfo {
  user?: { name?: string; lang?: string; theme?: string; [key: string]: unknown };
  application?: { theme?: string; [key: string]: unknown };
  [key: string]: unknown;
}

let _infoPromise: Promise<AppInfo> | null = null;

export function getInfo(): Promise<AppInfo> {
  if (!_infoPromise) {
    _infoPromise = Service.get("ws/public/app/info") as Promise<AppInfo>;
  }
  return _infoPromise;
}

export async function loadTheme(
  theme: string,
): Promise<{ options: Record<string, unknown>; theme: string } | undefined> {
  if (!theme) return;
  // AOP 8.1+: use global axelor app data if available (listener pattern)
  if (window.axelor?.getAppData) {
    try {
      const appData = await window.axelor.getAppData();
      return { options: appData.options, theme: appData.theme };
    } catch {
      // fall through to API call
    }
  }
  // AOP 8.1 endpoint: ws/public/app/theme?name=
  // Returns 204 No Content when no custom theme configured (normal behavior)
  try {
    const res = await fetch(
      `${Service.baseURL}/ws/public/app/theme?name=${encodeURIComponent(theme)}`,
      { method: "GET", credentials: "include", headers: { Accept: "application/json" } },
    );
    if (res.ok && res.status !== 204) {
      const options = await res.json();
      return { options, theme };
    }
    // 204 No Content = no custom theme, use @axelor/ui defaults
    return { options: {}, theme };
  } catch {
    // No theme endpoint available, return empty options
    return { options: {}, theme };
  }
}
