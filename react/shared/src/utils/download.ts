/**
 * Triggers a browser download of the given content as a file.
 */
export function download(entity: string, name: string, isXml = true): void {
  const encodedData = encodeURIComponent(entity);
  const dl = document.createElement("a");
  document.body.appendChild(dl);
  dl.setAttribute(
    "href",
    (isXml ? "data:Application/octet-stream," : "data:image/svg+xml;utf-8,") + encodedData,
  );
  dl.setAttribute("download", name);
  dl.click();
}
