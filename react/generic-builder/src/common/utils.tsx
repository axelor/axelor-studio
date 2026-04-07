export { translate } from "@studio/shared/i18n";

interface ViewItem {
  items?: ViewItem[];
  jsonFields?: ViewItem[];
  toolbar?: ViewItem[];
  menubar?: ViewItem[];
  type?: string;
  [key: string]: unknown;
}

function isBPMQuery(type: string | undefined | null): boolean {
  return type === "bpmQuery" ? true : false;
}

function lowerCaseFirstLetter(str: string | undefined | null): string | undefined {
  if (!str) return undefined;
  return str.charAt(0).toLowerCase() + str.slice(1);
}
function sortBy<T extends Record<string, unknown>>(array: T[] = [], key: string): T[] {
  return array.sort(function (a, b) {
    const x = a[key];
    const y = b[key];
    return (x as string) < (y as string) ? -1 : (x as string) > (y as string) ? 1 : 0;
  });
}

function jsStringEscape(string: unknown, withParam?: boolean): string {
  return ("" + string).replace(/["'\\\n\r\u2028\u2029]/g, function (character) {
    switch (character) {
      case '"':
      case "\\":
        return "\\" + character;
      case "'":
        if (withParam) {
          return "\\" + character;
        }
        return "\u0022";
      case "\n":
        return "\\n";
      case "\r":
        return "\\r";
      case "\u2028":
        return "\\u2028";
      case "\u2029":
        return "\\u2029";
      default:
        return "" + string;
    }
  });
}

function getItemsByType(view: ViewItem, type: string): ViewItem[] {
  function collectItems(item: ViewItem): ViewItem[] {
    const { items = [], jsonFields = [], toolbar = [], menubar = [] } = item;
    const allItems = [...items, ...jsonFields, ...toolbar, ...menubar];
    return allItems.reduce<ViewItem[]>(
      (all, item) => [...all, ...collectItems(item)],
      item.type === type ? [item] : [],
    );
  }
  return collectItems(view);
}

export {
  sortBy,
  isBPMQuery,
  lowerCaseFirstLetter,
  jsStringEscape,
  getItemsByType,
};
