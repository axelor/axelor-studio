import { ServiceInstance as services } from "@studio/shared/services";

export async function fetchUserPreferences() {
  const userInfo = await services.info();
  return userInfo;
}
