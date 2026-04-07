import Service from "@studio/shared/services/Service";
import type { WkfProcess } from "@studio/shared/types";

export async function getBPMNModels(options: Record<string, unknown> = {}): Promise<WkfProcess[]> {
  const res = await Service.search<WkfProcess>("com.axelor.studio.db.WkfProcess", {
    ...options,
    limit: 40,
    fields: ["name", "wkfModel"],
  });
  return res?.data ?? [];
}
