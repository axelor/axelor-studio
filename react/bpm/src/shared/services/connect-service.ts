import Service from "@studio/shared/services/Service";

export async function checkConnectAndStudioInstalled(): Promise<boolean | undefined> {
  const res = await Service.action({
    action: "com.axelor.studio.web.ConnectController:isConnectAndStudioInstalled",
  });
  return (res?.data?.[0]?.values as { isConnectAndStudioInstalled?: boolean })
    ?.isConnectAndStudioInstalled;
}

export async function getOrganization(): Promise<unknown[]> {
  const res = await Service.action({
    action: "com.axelor.studio.pro.web.StudioAppConnectController:getOrganizations",
  });
  const organizations = (res?.data?.[0]?.values as { organizations?: unknown[] })?.organizations;
  return organizations || [];
}

export async function getScenarios(organizationId: string | number): Promise<unknown[]> {
  if (!organizationId) return [];
  const res = await Service.action({
    action: "com.axelor.studio.pro.web.StudioAppConnectController:getScenarios",
    data: {
      organizationId: Number(organizationId),
    },
  });
  return (res?.data?.[0]?.values as { scenarios?: unknown[] })?.scenarios || [];
}
