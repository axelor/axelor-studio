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
  if (window && window.top && window.top._t && typeof str === "string") {
    return window.top._t(str);
  }
  return str;
}

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

export function filesToItems(files, maxFiles) {
  const CHUNK_SIZE = 512 * 1024;
  return Array.prototype.slice
    .call(files)
    .slice(0, maxFiles)
    .map((f, i) => ({
      file: f,
      index: i,
      progress: 0,
      cancelled: false,
      completed: false,
      chunkProgress: new Array(Math.floor(f.size / CHUNK_SIZE) + 1).fill(0),
      error: false,
      totalUploaded: 0,
    }));
}

export function getAttachmentBlob(file) {
  return file.file;
}

function getItemsByType(view, type) {
  function collectItems(item) {
    const { items = [], jsonFields = [], toolbar = [], menubar = [] } = item;
    const allItems = [...items, ...jsonFields, ...toolbar, ...menubar];
    return allItems.reduce(
      (all, item) => [...all, ...collectItems(item)],
      item.type === type ? [item] : []
    );
  }
  return collectItems(view);
}

function getLowerCase(str) {
  if (!str) return;
  return str.trim().toLowerCase();
}

function getFormName(str) {
  if (!str) return;
  const formString = str.match(/[A-Z][a-z]+/g);
  if (!formString) return;
  if (formString.join("").trim().length !== str.length) {
    return "fetchAPI";
  }
  const form = formString && formString.join("-");
  return `${form.toLowerCase()}-form`;
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

export {
  download,
  translate,
  pascalToKebabCase,
  getBool,
  sortBy,
  getItemsByType,
  getFormName,
  getLowerCase,
  getAxelorScope,
  lowerCaseFirstLetter,
  splitWithComma,
  dashToUnderScore,
};
