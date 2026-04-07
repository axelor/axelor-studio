/**
 * Message template service.
 *
 * @module template-service
 */
import { ServiceInstance as Service } from "./Service";
import type { Template } from "../types";
import { isAxelorError } from "../types";

export async function getTemplates(criteria: Record<string, unknown>): Promise<Template[]> {
  const res = await Service.search<Template>("com.axelor.message.db.Template", {
    data: criteria,
  });
  if (isAxelorError(res)) return [];
  const data = res?.data ?? [];
  return data;
}
