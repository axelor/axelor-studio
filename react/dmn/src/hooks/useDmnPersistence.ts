import { useCallback } from "react";
import {
  ServiceInstance as Service,
  getDMNModels,
  fetchDMNModel,
} from "@studio/shared/services";
import type { WkfDmnModel, AxelorResponse } from "@studio/shared/types";
import { isAxelorError } from "@studio/shared/types";
import type { DmnModeler } from "dmn-js/lib/Modeler";

export interface UseDmnPersistenceDeps {
  dmnModelerRef: React.MutableRefObject<DmnModeler | null>;
  diagramXmlRef: React.MutableRefObject<string | null>;
  handleSnackbarClick: (messageType: string, message: string) => void;
  wkfModel: WkfDmnModel | null;
  setWkfModel: (model: WkfDmnModel) => void;
  openDialog: (opts: { title: string; message: string; onSave: () => void }) => void;
  fetchDiagram: (fetchIdParam: string | number | undefined, setWkf: (model: WkfDmnModel) => void) => Promise<void>;
}

interface DmnPersistenceReturn {
  onSave: () => void;
  deployDiagram: () => Promise<void>;
  checkUniqueDecision: () => Promise<boolean | undefined>;
}

export function useDmnPersistence(deps: UseDmnPersistenceDeps): DmnPersistenceReturn {
  const {
    dmnModelerRef,
    diagramXmlRef,
    handleSnackbarClick,
    wkfModel,
    setWkfModel,
    fetchDiagram,
  } = deps;

  const onSave = useCallback(() => {
    const dmnModeler = dmnModelerRef.current;
    if (!dmnModeler) return;
    dmnModeler.saveXML({ format: true }, async function (_err: Error | null, xml: string) {
      diagramXmlRef.current = xml;
      Service.add<WkfDmnModel>("com.axelor.studio.db.WkfDmnModel", {
        ...wkfModel,
        diagramXml: xml,
      }).then((res: AxelorResponse<WkfDmnModel>) => {
        if (res?.data?.[0] && !isAxelorError(res)) {
          setWkfModel({ ...res.data[0] });
          handleSnackbarClick("success", "Saved Successfully");
        } else {
          const errObj = (res?.data?.[0] as Record<string, unknown> | undefined)?.error as Record<string, unknown> | undefined;
          handleSnackbarClick(
            "danger",
            String(
              res?.message ||
                res?.title ||
                errObj?.message ||
                "Error",
            ),
          );
        }
      });
    });
  }, [dmnModelerRef, diagramXmlRef, wkfModel, handleSnackbarClick, setWkfModel]);

  const checkUniqueDecision = useCallback(async (): Promise<boolean | undefined> => {
    const dmnModeler = dmnModelerRef.current;
    const elements = dmnModeler?.getDefinitions()?.drgElement as Array<Record<string, unknown>> | undefined;
    const decisions = elements?.filter((ele) => ele.$type === "dmn:Decision");
    const decisionIds = decisions?.map((process) => process.id as string);
    if (decisionIds && decisionIds.length > 0) {
      const isValidId = await getDMNModels([
        {
          fieldName: "decisionId",
          operator: "IN",
          value: decisionIds,
        },
      ]);
      const wkfProcess = isValidId && (isValidId as Record<string, unknown>[])[0];
      if (wkfModel?.id == null) return;
      const process = await fetchDMNModel(wkfModel.id, {
        fields: ["name"],
        related: {
          dmnTableList: ["name", "decisionId"],
        },
      });
      const dmnList =
        (process as Record<string, unknown> | undefined)?.dmnTableList as
          | Array<{ decisionId?: string }>
          | undefined;
      const dmnIds = dmnList?.map((f) => f.decisionId) || [];
      if (wkfProcess && !(dmnIds && dmnIds.some((item) => decisionIds?.includes(item ?? "")))) {
        handleSnackbarClick("danger", "Please provide unique process id");
        return;
      } else {
        return true;
      }
    }
  }, [dmnModelerRef, wkfModel, handleSnackbarClick]);

  const deployDiagram = useCallback(async () => {
    const dmnModeler = dmnModelerRef.current;
    if (!dmnModeler) return;
    dmnModeler.saveXML({ format: true }, async function (_err: Error | null, xml: string) {
      diagramXmlRef.current = xml;
      const res = await Service.add<WkfDmnModel>("com.axelor.studio.db.WkfDmnModel", {
        ...wkfModel,
        diagramXml: xml,
      });
      if (res?.data?.[0] && !isAxelorError(res)) {
        setWkfModel({ ...res.data[0] });
        if (!(await checkUniqueDecision())) return;
        const actionRes = await Service.action({
          model: "com.axelor.studio.db.WkfDmnModel",
          action: "action-wkf-dmn-model-method-deploy",
          data: {
            context: {
              _model: "com.axelor.studio.db.WkfDmnModel",
              ...res.data[0],
            },
          },
        });
        if (actionRes?.data?.[0]?.reload) {
          handleSnackbarClick("success", "Deployed Successfully");
          fetchDiagram(wkfModel?.id, setWkfModel);
        } else {
          const errObj = actionRes?.data?.[0]?.error as Record<string, unknown> | undefined;
          handleSnackbarClick(
            "danger",
            String(
              actionRes?.message ||
                actionRes?.title ||
                errObj?.message ||
                "Error",
            ),
          );
        }
      } else {
        handleSnackbarClick(
          "danger",
          String(res?.message || res?.title || "Error"),
        );
      }
    });
  }, [dmnModelerRef, diagramXmlRef, wkfModel, checkUniqueDecision, fetchDiagram, handleSnackbarClick, setWkfModel]);

  return {
    onSave,
    deployDiagram,
    checkUniqueDecision,
  };
}
