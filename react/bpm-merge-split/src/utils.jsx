import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { getInfo, getTranslations } from "./services/api";

const info = (() => {
  let infoPromise = null;
  return async () => {
    if (!infoPromise) {
      infoPromise = getInfo();
    }
    return infoPromise;
  };
})();

const download = (entity, name, isXml = true) => {
  let encodedData = encodeURIComponent(entity);
  let dl = document.createElement("a");
  document.body.appendChild(dl);
  dl.setAttribute(
    "href",
    (isXml ? "data:Application/octet-stream," : "data:image/svg+xml;utf-8,") +
      encodedData
  );
  dl.setAttribute("download", name);
  dl.click();
};

function translate(str) {
  if (window?.top?.axelor?.i18n.get && typeof str === "string") {
    return window?.top?.axelor?.i18n.get(str);
  }
  return str;
}

export const capitalizeFirst = (str = "") => {
  if (!str || typeof str !== "string") return;
  const string = str.replace(/([A-Z])/g, " $1");
  const result =
    string && string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  return result;
};

function getAxelorScope() {
  return window.top?.axelor;
}

function pascalToKebabCase(string) {
  return (
    string &&
    string
      .match(
        /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g
      )
      .map((x) => x.toLowerCase())
      .join("-")
  );
}

function getBool(val) {
  if (!val || !["false", "true", true, false].includes(val)) return false;
  return !!JSON.parse(String(val).toLowerCase());
}

function sortBy(array = [], key) {
  return array.sort(function (a, b) {
    let x = a[key];
    let y = b[key];
    return x < y ? -1 : x > y ? 1 : 0;
  });
}

function getLowerCase(str) {
  if (!str) return;
  return str.trim().toLowerCase();
}

function lowerCaseFirstLetter(str) {
  if (!str) return;
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function splitWithComma(str) {
  if (!str) return;
  if (typeof str !== "string") return str;
  return str.split(",");
}
function dashToUnderScore(str) {
  if (!str) return;
  return str.replace("json-", "").replaceAll("-", "_").toLowerCase();
}

function convertSVGtoBase64(svgXml) {
  return new Promise((resolve, reject) => {
    var img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = function () {
      var canvas = document.createElement("CANVAS");
      var ctx = canvas.getContext("2d");
      var dataURL;
      canvas.height = this.naturalHeight;
      canvas.width = this.naturalWidth;
      ctx.drawImage(this, 0, 0);
      dataURL = canvas.toDataURL("image/png", 1);
      resolve(dataURL);
    };

    img.onerror = function () {
      resolve(null);
    };

    img.src =
      "data:image/svg+xml;base64," +
      window.btoa(unescape(encodeURIComponent(svgXml)));
  });
}

function lightenColor(color, percent) {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const lightenR = Math.round((255 - r) * percent) + r;
  const lightenG = Math.round((255 - g) * percent) + g;
  const lightenB = Math.round((255 - b) * percent) + b;
  const lightenHex = `#${lightenR.toString(16)}${lightenG.toString(
    16
  )}${lightenB.toString(16)}`;

  return lightenHex;
}
const getParams = () => {
  const params = new URL(document.location).searchParams;
  return {
    isSplit: params.get("type") === "split",
    isMerge: params.get("type") === "merge",
    id: params.get("id"),
  };
};

const setParam = (param, value = "") => {
  const url = new URL(document.location);
  url.searchParams.set(param, value);
  window.history.replaceState({}, "", url.toString());
};

export function getNameProperty(element) {
  return element?.type === "bpmn:TextAnnotation"
    ? "text"
    : element?.type === "bpmn:Group"
    ? "categoryValue"
    : "name";
}

export const updateTranslations = async (element, bpmnModeler) => {
  if (!element) return;
  const bo = getBusinessObject(element);
  if (!bo) return;
  if (!getBool(bo?.$attrs?.["camunda:isTranslations"])) return;
  if (!bo?.$attrs?.["camunda:key"]) return;
  const translations = await getTranslations(bo?.$attrs?.["camunda:key"]);
  if (translations?.length <= 0) return;
  const modelProperty = getNameProperty(element);
  const userInfo = await info();
  const language = userInfo?.user?.lang;
  if (!language) return;
  const selectedTranslation = translations?.find(
    (t) => t.language === language
  );
  const diagramValue =
    selectedTranslation?.message || bo?.$attrs["camunda:key"];
  if (!diagramValue) return;
  let elementRegistry = bpmnModeler.get("elementRegistry");
  let modeling = bpmnModeler.get("modeling");
  let shape = elementRegistry.get(element.id);
  modeling?.updateProperties(shape, {
    [modelProperty]: diagramValue,
  });
};

export {
  download,
  translate,
  pascalToKebabCase,
  getBool,
  sortBy,
  getLowerCase,
  getAxelorScope,
  lowerCaseFirstLetter,
  splitWithComma,
  dashToUnderScore,
  convertSVGtoBase64,
  lightenColor,
  getParams,
  setParam,
};
