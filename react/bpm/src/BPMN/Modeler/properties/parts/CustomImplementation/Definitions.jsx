import React, { useEffect, useState } from "react";
import classnames from "classnames";
import IconButton from "../../../../../components/IconButton";
import Select from "../../../../../components/Select";
import StaticSelect from "../../../../../components/StaticSelect";
import {
  Checkbox,
  TextField,
  Textbox,
} from "../../../../../components/properties/components";
import Tooltip from "../../../../../components/Tooltip";
import { getBool, translate } from "../../../../../utils";
import { getStudioApp, fetchWkf } from "../../../../../services/api";
import Service from "../../../../../services/Service";
import { WKF_COLORS, STATUS } from "../../../constants";
import { openTabView, openWebApp } from "./utils";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  Collapse,
  DialogTitle,
} from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import Stepper from "./Stepper";
import styles from "./definition.module.css";

function getSteps() {
  return [STATUS[1], STATUS[2], STATUS[3]];
}

export default function Definition({
  element,
  wkf = {},
  reloadView,
  handleSnackbarClick,
  enableStudioApp = false,
  addNewVersion = () => {},
  showError,
  bpmnModeler,
  setDummyProperty = () => {},
}) {
  const [studioApp, setStudioApp] = useState(null);
  const [wkfStatusColor, setWkfStatusColor] = useState([]);
  const [wkfModelList, setWkfModelList] = useState(null);
  const [open, setOpen] = useState(false);
  const [process, setProcess] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const { statusSelect = 1, isActive } = wkf || {};
  const steps = getSteps();

  const handleClose = () => {
    setOpen(false);
    setProcess(null);
  };

  const showDashboard = async () => {
    let actionRes = await Service.action({
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
    if (
      actionRes &&
      actionRes.data &&
      actionRes.data[0] &&
      actionRes.data[0].view
    ) {
      const view = actionRes.data[0].view;
      openTabView(view);
      handleClose();
    }
  };

  const backToDraft = async () => {
    let actionRes = await Service.action({
      model: "com.axelor.studio.db.WkfModel",
      action: "action-wkf-model-method-back-to-draft",
      data: {
        context: {
          _model: "com.axelor.studio.db.WkfModel",
          ...wkf,
        },
      },
    });
    if (
      actionRes &&
      actionRes.data &&
      actionRes.data[0] &&
      actionRes.data[0].reload
    ) {
      handleSnackbarClick("success", "Successfully drafted");
      reloadView();
    }
  };

  const terminate = async () => {
    let actionRes = await Service.action({
      model: "com.axelor.studio.db.WkfModel",
      action: "action-wkf-model-method-terminate",
      data: {
        context: {
          _model: "com.axelor.studio.db.WkfModel",
          ...wkf,
        },
      },
    });
    if (
      actionRes &&
      actionRes.data &&
      actionRes.data[0] &&
      actionRes.data[0].reload
    ) {
      handleSnackbarClick("success", "Terminated");
      reloadView();
    }
  };

  const openBPMState = async () => {
    let actionRes = await Service.action({
      model: "com.axelor.studio.db.WkfModel",
      action: "action-wkf-model-display-wkf-state",
      data: {
        context: {
          _model: "com.axelor.studio.db.WkfModel",
          ...wkf,
        },
      },
    });
    if (actionRes && actionRes.status === 0) {
      const { data } = actionRes || {};
      const url =
        data &&
        data[0] &&
        data[0].view &&
        data[0].view.context &&
        data[0].view.context.$imageUrl;
      if (url) {
        openWebApp(url, translate("BPM State"));
      }
    }
  };

  const getProperty = React.useCallback(
    (name) => {
      let propertyName = `camunda:${name}`;
      return (element && element.$attrs && element.$attrs[propertyName]) || "";
    },
    [element]
  );

  const setProperty = React.useCallback(
    (name, value) => {
      setDummyProperty({
        bpmnModeler,
        element: element?.rootElements && element?.rootElements[0],
        value,
      });
      let propertyName = `camunda:${name}`;
      if (!element) return;
      if (element.$attrs) {
        element.$attrs[propertyName] = value;
      } else {
        element.$attrs = { [propertyName]: value };
      }
      if (value === undefined) {
        delete element.$attrs[propertyName];
      }
    },
    [element, bpmnModeler]
  );

  const getVersionList = React.useCallback(async () => {
    const wkfModelList = [];
    const { previousVersion } = wkf || {};
    const getWkfModelList = async (previousVersion) => {
      if (previousVersion) {
        const { id: previousVersionId } = previousVersion || {};
        const previousVersionWkf = (await fetchWkf(previousVersionId)) || {};
        const { previousVersion: newPreviousVersion } =
          previousVersionWkf || {};
        wkfModelList.push(previousVersionWkf);
        if (previousVersionWkf && previousVersionWkf.previousVersion) {
          await getWkfModelList(newPreviousVersion);
        }
      }
    };
    await getWkfModelList(previousVersion);
    setWkfModelList(wkfModelList);
  }, [wkf]);

  useEffect(() => {
    const color =
      element && element.$attrs && element.$attrs["camunda:wkfStatusColor"];
    const wkfStatusColor = WKF_COLORS.find((c) => c.name === color);
    setWkfStatusColor([
      wkfStatusColor || { name: "blue", title: "Blue", color: "#2196f3" },
    ]);
  }, [element]);

  useEffect(() => {
    if (!enableStudioApp) return;
    const studioApp = getProperty("studioApp");
    async function getStudioAppValue() {
      const res = await getStudioApp({
        data: {
          criteria: [{ fieldName: "code", operator: "=", value: studioApp }],
          operator: "and",
        },
      });
      setStudioApp(res && res[0]);
    }
    if (studioApp) {
      if (typeof studioApp === "object") {
        setStudioApp(studioApp);
      } else {
        getStudioAppValue();
      }
    }
  }, [getProperty, enableStudioApp]);

  useEffect(() => {
    getVersionList();
  }, [getVersionList]);

  return (
    <React.Fragment>
      <Stepper active={statusSelect - 1} items={steps} />
      <TextField
        element={element}
        canRemove={true}
        showError={showError}
        isDefinition={true}
        entry={{
          id: "code",
          label: translate("Code"),
          modelProperty: "code",
          shouldValidate: true,
          required: true,
          get: function () {
            return { code: getProperty("code") };
          },
          set: function (e, value) {
            setProperty("code", value?.code?.toUpperCase());
          },
          validate: function (e, values) {
            if (!values.code) {
              return { code: translate("Must provide a value") };
            }
          },
        }}
      />
      <TextField
        element={element}
        canRemove={true}
        showError={showError}
        isDefinition={true}
        entry={{
          id: "diagramName",
          label: translate("Name"),
          modelProperty: "diagramName",
          shouldValidate: true,
          required: true,
          get: function () {
            return { diagramName: getProperty("diagramName") };
          },
          set: function (e, value) {
            setProperty("diagramName", value?.diagramName);
          },
          validate: function (e, values) {
            if (!values.diagramName) {
              return { diagramName: translate("Must provide a value") };
            }
          },
        }}
      />
      {enableStudioApp && (
        <React.Fragment>
          <InputLabel color="body" className={styles.label}>
            {translate("App")}
          </InputLabel>
          <Select
            className={styles.select}
            update={(value, label) => {
              setStudioApp(value);
              setProperty("studioApp", value?.code);
            }}
            name="studioApp"
            value={studioApp}
            isLabel={false}
            fetchMethod={() => getStudioApp()}
            optionLabel={"name"}
          />
        </React.Fragment>
      )}
      <TextField
        element={element}
        canRemove={true}
        readOnly={true}
        entry={{
          id: "versionTag",
          label: translate("Version tag"),
          modelProperty: "versionTag",
          get: function () {
            return { versionTag: getProperty("versionTag") };
          },
          set: function (e, value) {
            setProperty("versionTag", value?.versionTag);
          },
        }}
      />
      <Checkbox
        element={element}
        entry={{
          id: "newVersionOnDeploy",
          label: translate("New version on deploy"),
          modelProperty: "newVersionOnDeploy",
          widget: "checkbox",
          get: function () {
            return {
              newVersionOnDeploy: getBool(getProperty("newVersionOnDeploy")),
            };
          },
          set: function (e, value) {
            setProperty("newVersionOnDeploy", !value?.newVersionOnDeploy);
          },
        }}
      />
      <InputLabel color="body" className={styles.label}>
        {translate("Wkf status color")}
      </InputLabel>
      <br />
      <StaticSelect
        name="wkfStatusColor"
        onChange={(value) => {
          setWkfStatusColor([value]);
          setProperty("wkfStatusColor", value?.name);
        }}
        value={wkfStatusColor}
        options={WKF_COLORS}
      />
      <Textbox
        element={element}
        canRemove={true}
        rows={8}
        entry={{
          id: "description",
          label: translate("Description"),
          modelProperty: "description",
          get: function () {
            return { description: getProperty("description") };
          },
          set: function (e, value) {
            setProperty("description", value?.description);
          },
        }}
      />

      {wkfModelList && wkfModelList.length > 0 && (
        <React.Fragment>
          <Box d="flex" alignItems="center" justifyContent="space-between">
            <InputLabel className={styles.label} style={{ marginTop: 10 }}>
              {translate("Previous versions")}
            </InputLabel>
            <Box color="body" d={"flex"} alignItems={"center"}>
              <IconButton conClick={getVersionList} aria-label="Refresh">
                <Tooltip
                  title={translate("Refresh")}
                  children={<MaterialIcon icon="refresh" fontSize={16} />}
                />
              </IconButton>
              <IconButton
                className={classnames(styles.expand, {
                  [styles.expandOpen]: expanded,
                })}
                onClick={() => {
                  setExpanded((expanded) => !expanded);
                }}
                aria-expanded={expanded}
                aria-label="show more"
              >
                <MaterialIcon icon="expand_more" fontSize={16} />
              </IconButton>
            </Box>
          </Box>
          <Collapse in={expanded} timeout={300} unmountOnExit>
            <Box
              color="body"
              rounded={2}
              bgColor="body"
              shadow
              style={{ marginTop: 10 }}
            >
              <Table size="sm" aria-label="a dense table">
                <colgroup>
                  <col width="5%" />
                  <col width="23%" />
                  <col width="22%" />
                  <col width="15%" />
                  <col width="15%" />
                  <col width="5%" />
                </colgroup>
                <TableHead>
                  <TableRow>
                    <TableCell className={styles.tableHead}></TableCell>
                    <TableCell className={styles.tableHead}>
                      {translate("Code")}
                    </TableCell>
                    <TableCell className={styles.tableHead}>
                      {translate("Name")}
                    </TableCell>
                    <TableCell className={styles.tableHead}>
                      {translate("Version tag")}
                    </TableCell>
                    <TableCell className={styles.tableHead}>
                      {translate("Status")}
                    </TableCell>
                    <TableCell className={styles.tableHead}>
                      {translate("App")}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {wkfModelList.map((model, key) => (
                    <TableRow key={key}>
                      <TableCell textAlign="center">
                        <MaterialIcon
                          icon="open_in_new"
                          fontSize={16}
                          className={styles.linkIcon}
                          onClick={() => {
                            openWebApp(
                              `bpm/?id=${model?.id || ""}`,
                              translate("BPM editor")
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell textAlign="center">{model.code}</TableCell>
                      <TableCell textAlign="center">{model.name}</TableCell>
                      <TableCell textAlign="center">
                        {model.versionTag}
                      </TableCell>
                      <TableCell textAlign="center">
                        {translate(STATUS[model.statusSelect])}
                      </TableCell>
                      <TableCell textAlign="center">
                        {model.studioApp && model.studioApp.name}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </React.Fragment>
      )}
      <Box d="flex" flexDirection="column" alignItems="center">
        {statusSelect === 2 && isActive && (
          <Button variant="primary" className={styles.save} onClick={terminate}>
            {translate("wkf.terminate.btn")}
          </Button>
        )}
        {statusSelect === 3 && isActive && (
          <Button
            variant="primary"
            className={styles.save}
            onClick={backToDraft}
          >
            {translate("Back to draft")}
          </Button>
        )}
        <Button
          variant="primary"
          className={styles.save}
          onClick={openBPMState}
        >
          {translate("BPM State")}
        </Button>
        {statusSelect === 2 && (
          <Button
            variant="primary"
            className={styles.save}
            onClick={() => addNewVersion(wkf)}
          >
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
              update={(value) => {
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
              <Button
                variant="primary"
                className={styles.save}
                onClick={showDashboard}
              >
                {translate("Show")}
              </Button>
            )}
            <Button
              variant="primary"
              className={styles.save}
              onClick={handleClose}
            >
              {translate("Close")}
            </Button>
          </Box>
        </Dialog>
      )}
    </React.Fragment>
  );
}
