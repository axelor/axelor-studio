import Ids from "ids";
import { translate } from "@studio/shared/i18n";

import { capitalizeFirst, dashToUnderScore } from "../../../../../../utils";
import { FIELD_ATTRS } from "../constants";

export const valueObj = {
  model: null,
  view: null,
  roles: [],
  items: [],
};

export const itemsObj = {
  itemName: null,
  attributeName: null,
  attributeValue: null,
};

export function nextId() {
  const ids = new Ids([32, 32, 1]);
  return ids.nextPrefixed("viewAttributes_");
}

export function createData(values = []) {
  return {
    id: nextId(),
    values: [...values],
  };
}

export const attributes = Object.fromEntries(
  Object.entries(FIELD_ATTRS).map(([key, value]: [string, any]) => [
    key,
    value.map((name = "") => ({
      name,
      title: translate(capitalizeFirst(name) ?? ""),
    })),
  ]),
);

export const getAttributes = (itemName: any) => {
  const { type, name, title, label, relationship } = itemName;
  if (!name && !title && !label) return;
  if (name === "self") {
    return attributes["self"];
  } else if (
    ["one_to_many", "onetomany", "many_to_many", "manytomany"].includes(
      dashToUnderScore((type || relationship) as string) ?? "",
    )
  ) {
    return attributes["relational"];
  } else if (attributes[type]) {
    return attributes[type];
  } else {
    return attributes["others"];
  }
};

export function getKeyData(data: any, key: any) {
  return (
    data &&
    data.reduce((arrs: any, item: any) => {
      if (item.name === key) {
        arrs.push([]);
      }
      arrs[arrs.length - 1] && arrs[arrs.length - 1].push(item);
      return arrs;
    }, [])
  );
}

export const getSelectedAttribute = (item: any) => {
  const { attributeName: name = "" } = item || {};
  return {
    name,
    title: translate(capitalizeFirst(name) ?? ""),
  };
};
