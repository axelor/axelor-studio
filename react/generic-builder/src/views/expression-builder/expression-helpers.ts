/**
 * Pure utility functions extracted from expression-generation.ts.
 *
 * - getDateTimeValue: formats date/time values for BPM/Groovy expressions
 * - getListOfTree: flattens a parentId-based list into a tree structure
 */
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

import { DATE_FORMAT } from "../../common/constants";
import { isBPMQuery } from "../../common/utils";

export function getDateTimeValue(
  type: string,
  fieldValue: unknown,
  isJsonField: boolean | unknown,
  parentType: string,
): string {
  const isQuery = isBPMQuery(parentType);
  if (type === "date") {
    const date = `'${dayjs(fieldValue as string, DATE_FORMAT["date"]).format("YYYY-MM-DD")}'`;
    if (isJsonField || isQuery) {
      return date;
    }
    return `LocalDate.parse(${date})`;
  } else if (type === "datetime") {
    if (isJsonField || isQuery) {
      return `'${dayjs(fieldValue as string, DATE_FORMAT["datetime"]).toISOString()}'`;
    }
    return `LocalDateTime.of(${dayjs(fieldValue as string, DATE_FORMAT["datetime"])
      .format("YYYY-M-D-H-m-s")
      .split("-")})`;
  } else {
    const time = `'${dayjs(fieldValue as string, DATE_FORMAT["time"]).format("HH:mm:ss")}'`;
    if (isJsonField || isQuery) {
      return time;
    }
    return `LocalTime.parse(${time})`;
  }
}

export function getListOfTree(list: Record<string, unknown>[]): Record<string, unknown>[] {
  const map: Record<string, number> = {};
  let node: Record<string, unknown>;
  const roots: Record<string, unknown>[] = [];
  const rules =
    list &&
    list.map((item: Record<string, unknown>, index: number) => {
      map[item.id as string] = index;
      return { ...item, children: [] as Record<string, unknown>[] };
    });
  for (let i = 0; i < rules.length; i += 1) {
    node = rules[i];
    if ((node.parentId as number) >= 0) {
      rules[map[node.parentId as string]] &&
        (rules[map[node.parentId as string]].children).push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}
