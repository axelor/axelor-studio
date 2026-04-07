/**
 * File upload wrapper service.
 *
 * @module upload-service
 */
import { ServiceInstance as Service } from "./Service";

export async function uploadFileAPI(blob: Blob | null, headers: Record<string, string | number>) {
  const res = (await Service.upload(blob, headers)) as { result?: unknown } | undefined;
  if (res && res.result) {
    return res.result;
  }
}
