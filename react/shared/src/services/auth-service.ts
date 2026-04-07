/**
 * Authentication and role lookup service.
 *
 * @module auth-service
 */
import { ServiceInstance as Service } from "./Service";
import type { Role } from "../types";

export async function getRoles(criteria: Record<string, unknown>[]): Promise<Role[]> {
  const res = await Service.search<Role>(`com.axelor.auth.db.Role`, {
    fields: ["name"],
    data: {
      criteria: [...criteria],
      operator: "and",
    },
  });
  const data = res?.data ?? [];
  return data;
}
