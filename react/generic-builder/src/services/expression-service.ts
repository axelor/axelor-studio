import { ServiceInstance as services } from "@studio/shared/services";

export async function generateGroovyExpression(jsonQuery: Record<string, unknown>) {
  const res = await services.action("action-wkf-model-method-generate-expression", {
    data: jsonQuery,
  });
  return res?.data;
}

export async function getCustomVariables() {
  const res = await services.action(
    "com.axelor.studio.bpm.web.AppBpmController:getCustomVariables",
    {},
  );
  if (res && res.status === -1) return [];
  return (res && res.data) || [];
}
