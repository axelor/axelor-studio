import React, { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  InputLabel,
  DialogTitle,
} from "@axelor/ui";
import Service from "@studio/shared/services/Service";
import { translate } from "@studio/shared/i18n";

import Select from "../../../../../../components/Select";
import { openTabView, openWebApp } from "../utils";
import type { PropertiesPanelComponentProps } from "../../../property-types";

import styles from "./definition.module.css";

interface DefinitionActionsSectionProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wkf?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reloadView?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleSnackbarClick?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addNewVersion?: any;
}

export default function DefinitionActionsSection({
  wkf = {},
  reloadView,
  handleSnackbarClick,
  addNewVersion,
}: DefinitionActionsSectionProps) {
  const [open, setOpen] = useState(false);
  const [process, setProcess] = useState<any>(null);
  const { statusSelect = 1, isActive } = wkf || {};

  const handleClose = () => {
    setOpen(false);
    setProcess(null);
  };

  const showDashboard = async () => {
    const actionRes = await Service.action({
      model: "com.axelor.utils.db.Wizard",
      action: "action-wkf-model-view-dashboard",
      data: {
        context: {
          process: process?.name,
          _model: "com.axelor.utils.db.Wizard",
          _signal: "showDashboardBtn",
          _source: "showDashboardBtn",
          _viewName: "wfk-model-select-process-wizard-form",
          _viewType: "form",
          _wkf: { ...wkf },
          _views: {
            name: "wfk-model-select-process-wizard-form",
            type: "form",
          },
        },
      },
    });
    const view = actionRes?.data?.[0]?.view;
    if (view) {
      openTabView(view);
      handleClose();
    }
  };

  const backToDraft = async () => {
    const actionRes = await Service.action({
      model: "com.axelor.studio.db.WkfModel",
      action: "action-wkf-model-method-back-to-draft",
      data: {
        context: {
          _model: "com.axelor.studio.db.WkfModel",
          ...wkf,
        },
      },
    });
    if (actionRes?.data?.[0]?.reload) {
      handleSnackbarClick("success", "Successfully drafted");
      reloadView();
    }
  };

  const terminate = async () => {
    const actionRes = await Service.action({
      model: "com.axelor.studio.db.WkfModel",
      action: "action-wkf-model-method-terminate",
      data: {
        context: {
          _model: "com.axelor.studio.db.WkfModel",
          ...wkf,
        },
      },
    });
    if (actionRes?.data?.[0]?.reload) {
      handleSnackbarClick("success", "Terminated");
      reloadView();
    }
  };

  const openBPMState = async () => {
    const actionRes = await Service.action({
      model: "com.axelor.studio.db.WkfModel",
      action: "action-wkf-model-display-wkf-state",
      data: {
        context: {
          _model: "com.axelor.studio.db.WkfModel",
          ...wkf,
        },
      },
    });
    if (actionRes?.status === 0) {
      const url = (actionRes.data?.[0]?.view as Record<string, Record<string, string>> | undefined)
        ?.context?.$imageUrl;
      if (url) {
        openWebApp(url, translate("BPM State"));
      }
    }
  };

  return (
    <>
      <Box d="flex" flexDirection="column" alignItems="center">
        {statusSelect === 2 && isActive && (
          <Button variant="primary" className={styles.save} onClick={terminate}>
            {translate("wkf.terminate.btn")}
          </Button>
        )}
        {statusSelect === 3 && isActive && (
          <Button variant="primary" className={styles.save} onClick={backToDraft}>
            {translate("Back to draft")}
          </Button>
        )}
        <Button variant="primary" className={styles.save} onClick={openBPMState}>
          {translate("BPM State")}
        </Button>
        {statusSelect === 2 && (
          <Button variant="primary" className={styles.save} onClick={() => addNewVersion(wkf)}>
            {translate("New version")}
          </Button>
        )}
        <Button
          variant="primary"
          className={styles.save}
          onClick={() => {
            if (wkf && wkf.wkfProcessList) {
              setOpen(true);
            }
          }}
        >
          {translate("Dashboard")}
        </Button>
      </Box>

      {open && (
        <Dialog backdrop centered open={open}>
          <DialogHeader onCloseClick={() => setOpen(false)}>
            <DialogTitle>{translate("Select process")}</DialogTitle>
          </DialogHeader>
          <DialogContent className={styles.cardContent}>
            <InputLabel color="body" className={styles.label}>
              {translate("Process")}
            </InputLabel>
            <Select
              className={styles.select}
              options={wkf && wkf.wkfProcessList}
              update={(value: any) => {
                setProcess(value);
              }}
              name="wkfProcessList"
              value={process}
              isLabel={false}
              optionLabel={"name"}
            />
          </DialogContent>
          <Box d="flex" justifyContent="flex-end">
            {process && (
              <Button variant="primary" className={styles.save} onClick={showDashboard}>
                {translate("Show")}
              </Button>
            )}
            <Button variant="primary" className={styles.save} onClick={handleClose}>
              {translate("Close")}
            </Button>
          </Box>
        </Dialog>
      )}
    </>
  );
}
