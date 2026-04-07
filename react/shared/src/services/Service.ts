/**
 * Unified Service class for Axelor REST API communication.
 * Provides HTTP methods (get, post, request), entity operations (search, add, delete, fetchId, fetchRecord),
 * metadata operations (view, fields, fetchFields), and file operations (upload, download).
 *
 * @module Service
 */

import type { AxelorResponse, AxelorActionResponse, AxelorViewResponse } from "../types/axelor-api";

let lastCookieString: string | undefined;
let lastCookies: Record<string, string> = {};

function readCookie(name: string): string | undefined {
  const cookieString = document.cookie || "";
  if (cookieString !== lastCookieString) {
    lastCookieString = cookieString;
    lastCookies = cookieString.split("; ").reduce((obj: Record<string, string>, value) => {
      const parts = value.split("=");
      obj[parts[0]] = parts[1];
      return obj;
    }, {});
  }
  return lastCookies[name];
}

interface FileDescriptor {
  file: File;
  id?: string;
}

/**
 * Build upload headers for a file object.
 */
export function getHeaders(
  file: FileDescriptor,
  offset: number,
): Record<string, string | number> | undefined {
  const attachment = file.file;
  if (!attachment) {
    return;
  }
  const headers: Record<string, string | number> = {
    "X-File-Name": attachment.name,
    "X-File-Offset": offset,
    "X-File-Size": attachment.size,
    "X-File-Type": attachment.type,
    "X-CSRF-Token": readCookie("CSRF-TOKEN") ?? "",
  };
  if (file.id) {
    headers["X-File-Id"] = file.id;
  }
  return headers;
}

const joinPath = (baseURL = "", subURL = ""): string => {
  const sep = `${baseURL}`.lastIndexOf("/") === baseURL.length - 1 ? "" : "/";
  return `${baseURL}${sep}${subURL}`;
};

interface RequestConfig {
  method?: string;
  [key: string]: unknown;
}

interface UploadInfo {
  abort?: () => Promise<unknown>;
  progress?: string;
  transfer?: string;
  loaded?: boolean;
  [key: string]: unknown;
}

export class Service {
  baseURL: string;
  headers: Headers;

  constructor() {
    const headers = new Headers();
    headers.append("Accept", "application/json");
    headers.append("Content-Type", "application/json");
    headers.append("X-Requested-With", "XMLHttpRequest");
    headers.append("X-CSRF-Token", readCookie("CSRF-TOKEN") ?? "");

    /**
     * Set the dynamic relative path for production server
     * Set it based on nested directory level
     */
    this.baseURL = import.meta.env.PROD ? ".." : (import.meta.env.VITE_PROXY_CONTEXT);
    this.headers = headers;
  }

  fetch(url: string, method: string, options: RequestInit): Promise<unknown> {
    return fetch(url, options)
      .then((data) => {
        if (["head"].indexOf(method.toLowerCase()) !== -1) return data;
        const isJSON = data.headers.get("content-type")?.includes("application/json");
        return isJSON ? data.json() : data;
      })
      .catch((err) => {
        throw err;
      });
  }

  request(url: string, config: RequestConfig = {}, data: unknown = {}): Promise<unknown> {
    const options: Record<string, unknown> = Object.assign(
      {
        method: "POST",
        credentials: "include",
        headers: this.headers,
        mode: "cors",
        ...(config.method !== "HEAD" ? { body: JSON.stringify(data) } : {}),
      },
      config,
    );
    if (config.method === "GET") {
      delete options.body;
    }
    return this.fetch(
      `${this.baseURL}${
        url.indexOf("/") === 0 || this.baseURL.indexOf("/") === 0 ? url : `/${url}`
      }`,
      config.method ?? "POST",
      options as RequestInit,
    );
  }

  get(url: string): Promise<unknown> {
    const config = {
      method: "GET",
    };
    return this.request(url, config);
  }

  post(url: string, data?: unknown): Promise<unknown> {
    const config = {
      method: "POST",
    };
    return this.request(url, config, data);
  }

  view(data: unknown): Promise<AxelorViewResponse> {
    const url = "/ws/meta/view";
    return this.post(url, data) as Promise<AxelorViewResponse>;
  }

  search<T = Record<string, unknown>>(entity: string, options: Record<string, unknown> = {}): Promise<AxelorResponse<T>> {
    const data = {
      offset: 0,
      ...options,
    };
    const url = `ws/rest/${entity}/search`;
    return this.post(url, data) as Promise<AxelorResponse<T>>;
  }

  fields(data: unknown): Promise<AxelorViewResponse> {
    const url = "/ws/meta/view/fields";
    return this.post(url, data) as Promise<AxelorViewResponse>;
  }

  fetchRecord<T = Record<string, unknown>>(entity: string, id: number | string, data: unknown = {}): Promise<AxelorResponse<T>> {
    const url = `ws/rest/${entity}/${id}/fetch`;
    return this.post(url, data) as Promise<AxelorResponse<T>>;
  }

  /**
   * Fetch a single record by entity and ID.
   */
  fetchId<T = Record<string, unknown>>(entity: string, id: number | string, data: unknown = {}): Promise<AxelorResponse<T>> {
    const url = `ws/rest/${entity}/${id}/fetch`;
    return this.post(url, data) as Promise<AxelorResponse<T>>;
  }

  /**
   * Delete a record by entity and ID.
   */
  delete(entity: string, id: number | string): Promise<AxelorResponse<unknown>> {
    const config = {
      method: "DELETE",
    };
    const url = `ws/rest/${entity}/${id}`;
    return this.request(url, config) as Promise<AxelorResponse<unknown>>;
  }

  add<T = Record<string, unknown>>(entity: string, record: unknown): Promise<AxelorResponse<T>> {
    const data = {
      data: record,
    };
    const url = `ws/rest/${entity}`;
    return this.post(url, data) as Promise<AxelorResponse<T>>;
  }

  action(data: unknown): Promise<AxelorActionResponse>;
  action(actionName: string, data: unknown): Promise<AxelorActionResponse>;
  action(actionNameOrData: string | unknown, data?: unknown): Promise<AxelorActionResponse> {
    if (typeof actionNameOrData === "string" && arguments.length > 1) {
      const url = `ws/action/${actionNameOrData}`;
      return this.post(url, data) as Promise<AxelorActionResponse>;
    }
    const url = `ws/action`;
    return this.post(url, actionNameOrData) as Promise<AxelorActionResponse>;
  }

  /**
   * Fetch metadata fields for an entity.
   */
  fetchFields(entity: string): Promise<AxelorViewResponse> {
    const url = `/ws/meta/fields/${entity}`;
    return this.get(url) as Promise<AxelorViewResponse>;
  }

  info(): Promise<AxelorResponse<unknown>> {
    const url = "ws/public/app/info";
    return this.get(url) as Promise<AxelorResponse<unknown>>;
  }

  /**
   * Upload a file via multipart XHR.
   */
  upload(
    data: Blob | null = null,
    headers: Record<string, string | number> = {},
    callback: (percent: number, info?: UploadInfo) => unknown = () => true,
    info: UploadInfo = {},
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const baseURL = this.baseURL;
      const xhr = new XMLHttpRequest(),
        method = "POST",
        url = joinPath(this.baseURL, "ws/files/upload");

      void method; // used only in xhr.open below

      const doClean = (): Promise<unknown> =>
        headers["X-File-Id"]
          ? Promise.resolve(true) // cleanup attempt (simplified from legacy)
          : Promise.resolve(true);

      const formatSize = (done: number, total: number | string): string => {
        const totalNum = typeof total === "string" ? parseFloat(total) : total;
        const format = (size: number): string => {
          if (size > 1000000000) return parseFloat(String(size / 1000000000)).toFixed(2) + " GB";
          if (size > 1000000) return parseFloat(String(size / 1000000)).toFixed(2) + " MB";
          if (size >= 1000) return parseFloat(String(size / 1000)).toFixed(2) + " KB";
          return size + " B";
        };
        return format(done || 0) + "/" + format(totalNum);
      };

      xhr.open("POST", url, true);

      Object.keys(headers).forEach((k) => {
        xhr.setRequestHeader(k, String(headers[k]));
      });

      xhr.withCredentials = true;
      xhr.overrideMimeType("application/octet-stream");
      xhr.setRequestHeader("Content-Type", "application/octet-stream");
      xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

      xhr.onload = () => {
        callback(100);
      };

      info.abort = () => {
        xhr.abort();
        return doClean();
      };

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          switch (xhr.status) {
            case 401:
              throw new Error("Unauthorized");
            case 200:
              try {
                const result = JSON.parse(xhr.responseText);
                resolve({
                  result,
                  url: `${baseURL}ws/rest/com.axelor.meta.db.MetaFile/${result.id}/content/download?v=0`,
                });
              } catch {
                resolve(xhr.responseText);
              }
              break;
            default:
              doClean();
              reject({ status: xhr.status });
              break;
          }
        }
      };

      xhr.upload.onprogress = (e) => {
        const fileSize = Number(headers["X-File-Size"]);
        const total = Number(headers["X-File-Offset"]) + e.loaded;
        const done = Math.round((total / fileSize) * 100);

        info.progress = done > 95 ? "95%" : done + "%";
        info.transfer = formatSize(total, fileSize);
        info.loaded = total === fileSize;

        if (e.lengthComputable) {
          callback((e.loaded / e.total) * 100, info);
        }
      };

      xhr.send(data);
    });
  }

  /**
   * Download a file as blob and trigger browser download.
   */
  download(fileURL: string, fileName: string): Promise<void> {
    const url = `${this.baseURL}/${fileURL}`;
    return new Promise(function (resolve) {
      const req = new XMLHttpRequest();
      req.open("GET", url, true);
      req.responseType = "blob";
      req.onload = function () {
        const blob = req.response;
        const blobURL = URL.createObjectURL(new Blob([blob]));
        const a = document.createElement("a");
        a.href = blobURL;
        a.download = `${fileName}.xlsx`;
        a.click();
        a.remove();
        URL.revokeObjectURL(blobURL);
        resolve();
      };
      req.send();
    });
  }
}

export const ServiceInstance = new Service();
export default ServiceInstance;
