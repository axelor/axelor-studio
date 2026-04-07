/**
 * Axelor menu system service.
 * Fetches parent menus, sub-menus, and individual menu items.
 *
 * @module menu-service
 */
import { uniqBy } from "lodash";

import { ServiceInstance as Service } from "./Service";
import type { MetaMenu } from "../types";
import { isAxelorError } from "../types";

export async function getParentMenus(options?: Record<string, unknown>): Promise<MetaMenu[]> {
  const res = await Service.search<MetaMenu>("com.axelor.meta.db.MetaMenu", {
    data: {
      _domain: `self.action is null`,
      ...options,
    },
    limit: 40,
  });
  if (isAxelorError(res)) return [];
  const data = res?.data ?? [];
  const output = Object.values(
    data.reduce((a: Record<string, MetaMenu>, item) => {
      if (item.name) a[item.name] = item;
      return a;
    }, {}),
  );
  return output;
}

export async function getSubMenus(parentMenu: string): Promise<MetaMenu[] | undefined> {
  if (!parentMenu) return;
  const res = await Service.search<MetaMenu>("com.axelor.meta.db.MetaMenu", {
    data: {
      criteria: [{ fieldName: "parent.name", operator: "=", value: parentMenu }],
      operator: "and",
    },
  });
  if (isAxelorError(res)) return [];
  const data = res?.data ?? [];
  return uniqBy(data, "name") || [];
}

export async function getMenu(options?: Record<string, unknown>): Promise<MetaMenu | Record<string, unknown>> {
  const res = await Service.search<MetaMenu>("com.axelor.meta.db.MetaMenu", {
    ...options,
    limit: 1,
  });
  return res?.data?.[0] ?? {};
}
