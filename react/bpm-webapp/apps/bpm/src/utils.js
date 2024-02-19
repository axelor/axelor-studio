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

export function filesToItems(files, maxFiluitlses) {
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

export {
  download,
  translate,
  pascalToKebabCase,
  getBool,
  sortBy,
  getItemsByType,
  getLowerCase,
  getAxelorScope,
  lowerCaseFirstLetter,
  splitWithComma,
  dashToUnderScore,
  convertSVGtoBase64,
  lightenColor,
};
