/**
 * WkfModel repository layer.
 *
 * All non-deploy save mutations go through this module.
 * - saveCurrentWkf: saves and syncs the Zustand store (main WKF editing)
 * - createSatelliteWkf: saves WITHOUT store sync (CallActivity sub-processes)
 *
 * Error classification provides structured error kinds for UI handling.
 */
import useWkfStore from "../BPMN/Modeler/stores/useWkfStore";
import type { WkfModel } from "../BPMN/Modeler/stores/useWkfStore";

import {
  saveWkfModel,
  fetchWkfModel,
  deployWkfModel,
  startWkfModel as apiStartWkfModel,
  createNewVersion as apiCreateNewVersion,
} from "./wkf-api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WkfError =
  | { kind: "network"; message: string }
  | { kind: "validation"; message: string; field?: string }
  | { kind: "optimistic_lock"; message: string; serverVersion: number }
  | { kind: "unknown"; message: string; raw?: unknown };

type WkfResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: WkfError };

// ---------------------------------------------------------------------------
// Error classification
// ---------------------------------------------------------------------------

function classifyError(errorMessage: string): WkfError {
  const msg = errorMessage.toLowerCase();

  if (
    msg.includes("updated or deleted by another transaction") ||
    msg.includes("has been updated")
  ) {
    return { kind: "optimistic_lock", message: errorMessage, serverVersion: -1 };
  }

  if (
    msg.includes("unique constraint") ||
    msg.includes("cannot be null") ||
    msg.includes("is required")
  ) {
    return { kind: "validation", message: errorMessage };
  }

  return { kind: "unknown", message: errorMessage };
}

// ---------------------------------------------------------------------------
// Repository functions
// ---------------------------------------------------------------------------

/**
 * Save the current WkfModel and sync the Zustand store on success.
 * Used for main WKF editing (save profile, addImage, addOldNodes, etc.)
 */
export async function saveCurrentWkf(
  wkfData: Record<string, unknown>,
): Promise<WkfResult<WkfModel>> {
  try {
    const result = await saveWkfModel(wkfData);
    if (result.success && result.data) {
      const saved = result.data as WkfModel;
      useWkfStore.getState().setWkf(saved);
      return { ok: true, data: saved };
    }
    return { ok: false, error: classifyError(result.error ?? "Save failed") };
  } catch (err) {
    return {
      ok: false,
      error: { kind: "network", message: (err as Error).message },
    };
  }
}

/**
 * Save a satellite WkfModel WITHOUT syncing the store.
 * Used for CallActivity sub-process creation.
 */
export async function createSatelliteWkf(
  wkfData: Record<string, unknown>,
): Promise<WkfResult<WkfModel>> {
  try {
    const result = await saveWkfModel(wkfData);
    if (result.success && result.data) {
      return { ok: true, data: result.data as WkfModel };
    }
    return { ok: false, error: classifyError(result.error ?? "Save failed") };
  } catch (err) {
    return {
      ok: false,
      error: { kind: "network", message: (err as Error).message },
    };
  }
}

/**
 * Re-fetch the WkfModel from the server and update the Zustand store.
 * Best-effort: if fetch fails, store stays unchanged (graceful degradation).
 * Used after deploy failure to prevent stale version in the store (PERSIST-03).
 */
export async function resyncWkf(wkfId: number | string): Promise<void> {
  try {
    const result = await fetchWkfModel(wkfId);
    if (result.success && result.data) {
      useWkfStore.getState().setWkf(result.data as WkfModel);
    }
  } catch {
    // Graceful degradation: swallow error
  }
}

/**
 * Deploy the current WkfModel via Camunda.
 * On failure, automatically resyncs the store from the server to prevent
 * stale version issues (OptimisticLockException on next save).
 */
export async function deployCurrentWkf(
  context: Record<string, unknown>,
  wkfId: number | string,
): Promise<WkfResult<Record<string, unknown>>> {
  try {
    const result = await deployWkfModel(context);
    if (result.success && result.data) {
      return { ok: true, data: result.data as Record<string, unknown> };
    }
    // Deploy failed -- resync store from server to prevent stale version
    await resyncWkf(wkfId);
    return { ok: false, error: classifyError(result.error ?? "Deploy failed") };
  } catch (err) {
    await resyncWkf(wkfId);
    return {
      ok: false,
      error: { kind: "network", message: (err as Error).message },
    };
  }
}

/**
 * Start (activate) the current WkfModel via Camunda.
 */
export async function startCurrentWkf(
  wkfData: Record<string, unknown>,
): Promise<WkfResult<Record<string, unknown>>> {
  try {
    const result = await apiStartWkfModel(wkfData);
    if (result.success && result.data) {
      return { ok: true, data: result.data as Record<string, unknown> };
    }
    return { ok: false, error: classifyError(result.error ?? "Start failed") };
  } catch (err) {
    return {
      ok: false,
      error: { kind: "network", message: (err as Error).message },
    };
  }
}

/**
 * Create a new version of the WkfModel.
 */
export async function addNewWkfVersion(
  wkf: Record<string, unknown>,
): Promise<WkfResult<{ newVersionId?: number }>> {
  try {
    const result = await apiCreateNewVersion(wkf);
    if (result.success && result.data) {
      return { ok: true, data: result.data as { newVersionId?: number } };
    }
    return { ok: false, error: classifyError(result.error ?? "Failed to create new version") };
  } catch (err) {
    return {
      ok: false,
      error: { kind: "network", message: (err as Error).message },
    };
  }
}
