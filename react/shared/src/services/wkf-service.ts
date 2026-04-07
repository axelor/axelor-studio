import Service from "./Service";
import type { WkfDmnModel } from "../types";

export const getWkfDMNModels = async (options: Record<string, unknown> = {}): Promise<WkfDmnModel[]> => {
  const res = await Service.search<WkfDmnModel>("com.axelor.studio.db.WkfDmnModel", {
    ...options,
    limit: 40,
  });
  const wkf = res?.data ?? [];
  return wkf;
};
