import { useCallback } from "react";
import { ServiceInstance as Service, getHeaders, uploadFileAPI } from "@studio/shared/services";
import type { WkfDmnModel } from "@studio/shared/types";
import {
  download,
  filesToItems,
  getAttachmentBlob,
} from "@studio/shared/utils";
import type { DmnModeler } from "dmn-js/lib/Modeler";

interface UploadedFile {
  id?: number;
  fileId?: string;
  fileName?: string;
  [key: string]: unknown;
}

export interface UseDmnIODeps {
  dmnModelerRef: React.MutableRefObject<DmnModeler | null>;
  handleSnackbarClick: (messageType: string, message: string) => void;
  wkfModel: WkfDmnModel | null;
  id: string | number | null | undefined;
  setWkfModel: (model: WkfDmnModel) => void;
  openDiagram: (dmnXML: string) => Promise<void>;
}

interface DmnIOReturn {
  exportDiagram: () => void;
  importExcel: (file: UploadedFile) => Promise<boolean>;
  exportExcel: () => Promise<void>;
  uploadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadChunk: (file: Record<string, unknown>, offset?: number) => Promise<UploadedFile | null>;
  uploadExcel: (e: React.ChangeEvent<HTMLInputElement>) => Promise<UploadedFile | null>;
}

export function useDmnIO(deps: UseDmnIODeps): DmnIOReturn {
  const {
    dmnModelerRef,
    handleSnackbarClick,
    wkfModel,
    setWkfModel,
    openDiagram,
  } = deps;

  const exportDiagram = useCallback(() => {
    const dmnModeler = dmnModelerRef.current;
    if (!dmnModeler) return;
    dmnModeler.saveXML({ format: true }, function (_err: Error | null, xml: string) {
      if (_err) {
        console.error("[DmnModeler] could not save DMN 1.1 diagram", _err);
        return;
      }
      const { name: definitionName } = dmnModeler?.getDefinitions() || {};
      const { name } = wkfModel || {};
      download(xml, `${name || definitionName || "diagram"}.dmn`);
    });
  }, [dmnModelerRef, wkfModel]);

  const importExcel = useCallback(
    async (file: UploadedFile): Promise<boolean> => {
      const actionResponse = await Service.action({
        model: "com.axelor.studio.db.WkfDmnModel",
        action: "action-dmn-model-method-import-dmn-table",
        data: {
          context: {
            dataFile: file,
            _dmnModelId: wkfModel?.id,
          },
        },
      });
      if (!actionResponse) {
        handleSnackbarClick("danger", "Import failed");
        return false;
      }
      handleSnackbarClick("success", "Imported successfully");
      const res = await Service.search<WkfDmnModel>("com.axelor.studio.db.WkfDmnModel", {
        data: {
          _domain: `self.id = ${wkfModel?.id}`,
        },
      });
      if (res?.data?.[0]) {
        const model = res.data[0];
        if (!model) return false;
        setWkfModel({ ...model });
        openDiagram(model.diagramXml ?? "");
      }
      return true;
    },
    [wkfModel, openDiagram, handleSnackbarClick, setWkfModel],
  );

  const exportExcel = useCallback(async () => {
    const actionResponse = await Service.action({
      model: "com.axelor.studio.db.WkfDmnModel",
      action: "action-dmn-model-method-export-dmn-table",
      data: {
        context: {
          ...(wkfModel || {}),
        },
      },
    });
    if (!actionResponse) {
      return;
    }
    const actionData = actionResponse.data?.[0];
    const viewObj = actionData?.view as { views?: Array<{ name?: string }> } | undefined;
    const file = viewObj?.views?.[0]?.name;
    if (file) {
      await Service.download(file, wkfModel?.name || "DMN");
    } else if ((actionData?.error as Record<string, unknown> | undefined)?.message) {
      handleSnackbarClick("danger", String((actionData?.error as Record<string, unknown>).message));
    }
  }, [wkfModel, handleSnackbarClick]);

  const uploadFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      const reader = new FileReader();
      if (files && files[0] && files[0].name && !files[0].name.includes(".dmn")) {
        handleSnackbarClick("danger", "Upload dmn files only");
        return;
      }
      if (!files?.[0]) return;
      reader.readAsText(files[0]);
      reader.onload = (ev) => {
        openDiagram(ev.target?.result as string);
      };
    },
    [openDiagram, handleSnackbarClick],
  );

  const uploadChunk = useCallback(
    async (file: Record<string, unknown>, offset = 0): Promise<UploadedFile | null> => {
      const attachment = getAttachmentBlob(file as { file: File | Blob });
      const chunkSize = 100000;
      const attachmentSize = attachment?.size ?? 0;
      const end = offset + chunkSize < attachmentSize ? offset + chunkSize : attachmentSize;
      const blob = attachment?.slice(offset, end);
      const headers = getHeaders(file as { file: File; id?: string }, offset);
      if (!headers) return null;
      const result = await uploadFileAPI(blob, headers);
      if (result && (result as Record<string, unknown>).id) {
        return result as UploadedFile;
      } else {
        if (offset < attachmentSize) {
          const uploadResult = result as Record<string, unknown>;
          if (uploadResult?.fileId) {
            file.id = uploadResult.fileId;
          }
          return uploadChunk(file, chunkSize + offset);
        }
      }
      return null;
    },
    [],
  );

  const uploadExcel = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>): Promise<UploadedFile | null> => {
      const files = e.target.files;
      if (!files) return null;
      const items = filesToItems(files, files.length);
      if (!items.length) return null;
      const result = await uploadChunk(items[0] as unknown as Record<string, unknown>); // safety: Axelor file upload API returns dynamic Record
      return result;
    },
    [uploadChunk],
  );

  return {
    exportDiagram,
    importExcel,
    exportExcel,
    uploadFile,
    uploadChunk,
    uploadExcel,
  };
}
