import Service from "@studio/shared/services/Service";
import type { WkfModel, AxelorResponse } from "@studio/shared/types";

import { fetchWkf } from "../shared/services";

const MODEL = "com.axelor.studio.db.WkfModel";

interface WkfResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export async function saveWkfModel(wkfData: unknown): Promise<WkfResult> {
  const res = await Service.add<WkfModel>(MODEL, wkfData) as AxelorResponse<WkfModel> | null;
  if (res?.data?.[0]) {
    return { success: true, data: res.data[0] };
  }
  // Axelor error responses return data as an object {message, title} instead of an array
  const errorInfo = res as { data?: { message?: string; title?: string } } | null;
  return {
    success: false,
    error: errorInfo?.data?.message || errorInfo?.data?.title || "Save failed",
  };
}

export async function deployWkfModel(context: unknown): Promise<WkfResult> {
  const res = await Service.action({
    model: MODEL,
    action: "action-wkf-model-method-deploy",
    data: { context },
  });
  if (res?.data?.[0]?.reload) {
    return { success: true, data: res.data[0] };
  }
  return {
    success: false,
    error:
      res?.data?.[0]?.error?.message ||
      res?.errors?.title ||
      "Deploy failed",
  };
}

export async function startWkfModel(wkfData: Record<string, unknown>): Promise<WkfResult> {
  const res = await Service.action({
    model: MODEL,
    action: "action-wkf-model-method-start",
    data: {
      context: { _model: MODEL, ...wkfData },
    },
  });
  if (res?.data?.[0]?.reload) {
    return { success: true, data: res.data[0] };
  }
  // Axelor error responses return data as an object {message, title} instead of an array
  const errorInfo = res as { data?: { message?: string; title?: string } } | null;
  return {
    success: false,
    error: errorInfo?.data?.message || errorInfo?.data?.title || "Start failed",
  };
}

export async function fetchWkfModel(id: number | string): Promise<WkfResult> {
  const wkf = await fetchWkf(id);
  if (wkf && Object.keys(wkf).length > 0) {
    return { success: true, data: wkf };
  }
  return { success: false, error: "WkfModel not found" };
}

export async function createNewVersion(wkf: Record<string, unknown>): Promise<WkfResult> {
  const res = await Service.action({
    model: MODEL,
    action: "action-wkf-model-method-create-new-version",
    data: {
      context: {
        _model: MODEL,
        ...wkf,
        _signal: "newVersionBtn",
        _source: "newVersionBtn",
        _viewName: "wkf-model-form",
        _viewType: "form",
        __check_version: true,
        _views: [
          { type: "grid", name: "wkf-model-grid" },
          { type: "form", name: "wkf-model-form" },
        ],
      },
    },
  });
  const newVersionId = (res?.data?.[0]?.values as { newVersionId?: number } | undefined)
    ?.newVersionId;
  if (newVersionId) {
    return {
      success: true,
      data: { newVersionId },
    };
  }
  return { success: false, error: "Failed to create new version" };
}
