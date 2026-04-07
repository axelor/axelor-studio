import React from "react";
import classnames from "classnames";
import { BootstrapIcon } from "@axelor/ui/icons/bootstrap-icon";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter,
  Button,
  InputLabel,
  DialogTitle,
} from "@axelor/ui";
import { Tooltip } from "@studio/shared/components";
import { translate } from "@studio/shared/i18n";
import { useAppTheme } from "@studio/shared/theme";

import styles from "../dmn-modeler.module.css";

interface UploadedFile {
  id: number;
  fileName: string;
  [key: string]: unknown;
}

interface DmnUploadDialogProps {
  open: boolean;
  onClose: () => void;
  file: UploadedFile | null;
  onUploadExcel: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImportExcel: () => void;
}

/**
 * Excel upload dialog for DMN import.
 * Renders Dialog with file input, handles file selection and upload callback.
 */
function DmnUploadDialog({ open, onClose, file, onUploadExcel, onImportExcel }: DmnUploadDialogProps) {
  const { theme = "light" } = useAppTheme();

  const uploadExcelFile = () => {
    document.getElementById("inputExcelFile")?.click();
  };

  return (
    <Dialog open={open} centered backdrop className={styles.dialog}>
      <DialogHeader onCloseClick={onClose}>
        <DialogTitle>{translate("Upload")}</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <input
          id="inputExcelFile"
          type="file"
          name="file"
          onChange={onUploadExcel}
          style={{ display: "none" }}
        />
        <Tooltip
          title={translate("Import")}
          children={
            <Button
              variant={theme as "light" | "dark"}
              onClick={uploadExcelFile}
              className={classnames(styles.textButton, "property-button")}
            >
              <BootstrapIcon icon="upload" fontSize={18} />
            </Button>
          }
        />
        {file && (
          <InputLabel fontSize={5} style={{ margin: "0 4px" }}>
            {file.fileName}
          </InputLabel>
        )}
      </DialogContent>
      <DialogFooter>
        <Button className={styles.save} onClick={onImportExcel} variant="primary">
          {translate("Import")}
        </Button>
        <Button onClick={onClose} variant="primary" className={styles.save}>
          {translate("OK")}
        </Button>
        <Button onClick={onClose} variant="secondary" className={styles.save}>
          {translate("Cancel")}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export default DmnUploadDialog;
