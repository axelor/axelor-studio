import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TableHead,
  Card,
  Button,
  Grid,
  Stepper,
  Step,
  StepButton,
  CardActions,
  Dialog,
  DialogContent,
  DialogTitle,
  Collapse,
  IconButton,
  Tooltip,
} from "@material-ui/core";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import RefreshIcon from "@material-ui/icons/Refresh";
import classnames from "classnames";
import { makeStyles } from "@material-ui/core/styles";

import Select from "../../../../../components/Select";
import StaticSelect from "../../../../../components/StaticSelect";
import {
  TextField,
  Textbox,
} from "../../../../../components/properties/components";
import { translate } from "../../../../../utils";
import { getStudioApp, fetchWkf } from "../../../../../services/api";
import Service from "../../../../../services/Service";
import { WKF_COLORS, STATUS } from "../../../constants";
import { openTabView, openWebApp } from "./utils";

const useStyles = makeStyles((theme) => ({
  label: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    margin: "3px 0px",
  },
  select: {
    margin: 0,
  },
  wkfStatusColor: {
    padding: 5,
    background: "white",
  },
  tableCell: {
    padding: "3px !important",
  },
  tableHead: {
    padding: "3px !important",
    fontWeight: "bolder",
    color: "#666",
    margin: "3px 0px",
  },
  tableData: {
    color: "black",
  },
  linkIcon: {
    color: "#0275d8",
    marginLeft: 5,
    cursor: "pointer",
  },
  save: {
    margin: theme.spacing(1),
    backgroundColor: "#0275d8",
    borderColor: "#0267bf",
    color: "white",
    textTransform: "none",
    width: "100%",
    "&:hover": {
      backgroundColor: "#025aa5",
      borderColor: "#014682",
      color: "white",
    },
  },
  cardContent: {
    overflow: "auto",
    maxHeight: "80%",
    minWidth: 250,
  },
  cardActionView: {
    justifyContent: "flex-end",
  },
  buttons: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  previousVersions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  expand: {
    transform: "rotate(0deg)",
    marginLeft: "auto",
    transition: theme.transitions.create("transform", {
      duration: theme.transitions.duration.shortest,
    }),
  },
  expandOpen: {
    transform: "rotate(180deg)",
  },
}));

function getSteps() {
  return [STATUS[1], STATUS[2], STATUS[3]];
}

export default function Definition({
  element,
  wkf = {},
  reloadView,
  handleSnackbarClick,
  enableStudioApp = false,
  fetchDiagram,
  showError,
  bpmnFactory,
}) {
  const [studioApp, setStudioApp] = useState(null);
  const [wkfStatusColor, setWkfStatusColor] = useState(null);
  const [wkfModelList, setWkfModelList] = useState(null);
  const [open, setOpen] = useState(false);
  const [process, setProcess] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const { statusSelect = 1, isActive } = wkf || {};
  const steps = getSteps();
  const classes = useStyles();

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
          _model: "om.axelor.apps.base.db.Wizard",
          _wkf: { ...wkf },
          process: process && process.name,
          _signal: "showDashboardBtn",
          _source: "showDashboardBtn",
          _viewName: "wfk-model-select-process-wizard-form",
          _viewType: "form",
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
      handleSnackbarClick("success", "Sucessfully drafted");
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

  const addNewVersion = async () => {
    let actionRes = await Service.action({
      model: "com.axelor.studio.db.WkfModel",
      action: " action-wkf-model-method-create-new-version",
      data: {
        context: {
          _model: "com.axelor.studio.db.WkfModel",
          ...wkf,
          _signal: "newVersionBtn",
          _source: "newVersionBtn",
          _viewName: "wkf-model-form",
          _viewType: "form",
          __check_version: true,
          _views: [
            { type: "grid", name: "wkf-model-grid" },
            { type: "form", name: "wkf-model-form" },
          ],
        },
      },
    });
    if (
      actionRes &&
      actionRes.data &&
      actionRes.data[0] &&
      actionRes.data[0].values &&
      actionRes.data[0].values.newVersionId
    ) {
      const id = actionRes.data[0].values.newVersionId;
      if (!id) return;
      fetchDiagram(id);
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
    [element]
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
    setWkfStatusColor(
      wkfStatusColor || { name: "blue", title: "Blue", color: "#2196f3" }
    );
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
      <Stepper nonLinear activeStep={statusSelect - 1}>
        {steps.map((label) => (
          <Step key={label}>
            <StepButton onClick={() => {}}>{translate(label)}</StepButton>
          </Step>
        ))}
      </Stepper>
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
          <label className={classes.label}>{translate("App")}</label>
          <Select
            className={classes.select}
            update={(value, label) => {
              setStudioApp(value);
              setProperty("studioApp", value?.code);
            }}
            name="studioApp"
            value={studioApp}
            isLabel={false}
            fetchMethod={() => getStudioApp()}
          />
        </React.Fragment>
      )}
      <TextField
        element={element}
        canRemove={true}
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

      <label className={classes.label}>{translate("Wkf status color")}</label>
      <br />
      <StaticSelect
        name="wkfStatusColor"
        onChange={(value) => {
          setWkfStatusColor(value);
          setProperty("wkfStatusColor", value?.name);
        }}
        value={wkfStatusColor}
        options={WKF_COLORS}
        selectClassName={classes.wkfStatusColor}
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
          <div className={classes.previousVersions}>
            <label className={classes.label} style={{ marginTop: 10 }}>
              {translate("Previous versions")}
            </label>
            <div>
              <Tooltip
                title={translate("Refresh")}
                children={
                  <IconButton onClick={getVersionList} aria-label="Refresh">
                    <RefreshIcon />
                  </IconButton>
                }
              />
              <IconButton
                className={classnames(classes.expand, {
                  [classes.expandOpen]: expanded,
                })}
                onClick={() => {
                  setExpanded((expanded) => !expanded);
                }}
                aria-expanded={expanded}
                aria-label="show more"
              >
                <ExpandMoreIcon />
              </IconButton>
            </div>
          </div>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Card style={{ marginTop: 10 }}>
              <TableContainer>
                <Table size="small" aria-label="a dense table">
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
                      <TableCell
                        className={classes.tableHead}
                        align="center"
                      ></TableCell>
                      <TableCell className={classes.tableHead} align="center">
                        {translate("Code")}
                      </TableCell>
                      <TableCell className={classes.tableHead} align="center">
                        {translate("Name")}
                      </TableCell>
                      <TableCell className={classes.tableHead} align="center">
                        {translate("Version tag")}
                      </TableCell>
                      <TableCell className={classes.tableHead} align="center">
                        {translate("Status")}
                      </TableCell>
                      <TableCell className={classes.tableHead} align="center">
                        {translate("App")}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {wkfModelList.map((model, key) => (
                      <TableRow key={key}>
                        <TableCell className={classes.tableData} align="center">
                          <OpenInNewIcon
                            className={classes.linkIcon}
                            onClick={() => {
                              openWebApp(
                                `wkf-editor/?id=${model?.id || ""}`,
                                translate("BPM editor")
                              );
                            }}
                          />
                        </TableCell>
                        <TableCell className={classes.tableData} align="center">
                          {model.code}
                        </TableCell>
                        <TableCell className={classes.tableData} align="center">
                          {model.name}
                        </TableCell>
                        <TableCell className={classes.tableData} align="center">
                          {model.versionTag}
                        </TableCell>
                        <TableCell className={classes.tableData} align="center">
                          {translate(STATUS[model.statusSelect])}
                        </TableCell>
                        <TableCell className={classes.tableData} align="center">
                          {model.studioApp && model.studioApp.name}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Collapse>
        </React.Fragment>
      )}
      <Grid className={classes.buttons}>
        {statusSelect === 2 && isActive && (
          <Button
            variant="contained"
            className={classes.save}
            color="primary"
            onClick={terminate}
          >
            {translate("wkf.terminate.btn")}
          </Button>
        )}
        {statusSelect === 3 && isActive && (
          <Button
            variant="contained"
            className={classes.save}
            color="primary"
            onClick={backToDraft}
          >
            {translate("Back to draft")}
          </Button>
        )}
        <Button
          variant="contained"
          className={classes.save}
          color="primary"
          onClick={openBPMState}
        >
          {translate("BPM state")}
        </Button>
        {statusSelect === 2 && (
          <Button
            variant="contained"
            className={classes.save}
            color="primary"
            onClick={addNewVersion}
          >
            {translate("New version")}
          </Button>
        )}
        <Button
          variant="contained"
          className={classes.save}
          color="primary"
          onClick={() => {
            if (wkf && wkf.wkfProcessList) {
              setOpen(true);
            }
          }}
        >
          {translate("Dashboard")}
        </Button>
      </Grid>
      {open && (
        <Dialog
          fullWidth={true}
          scroll="paper"
          open={open}
          onClose={(event, reason) => {
            if (reason !== "backdropClick") {
              handleClose();
            }
          }}
          aria-labelledby="scroll-dialog-title"
        >
          <DialogTitle id="scroll-dialog-title">
            {translate("Select process")}
          </DialogTitle>
          <DialogContent
            dividers={true}
            classes={{ root: classes.cardContent }}
          >
            <label className={classes.label}>{translate("Process")}</label>
            <Select
              className={classes.select}
              options={wkf && wkf.wkfProcessList}
              update={(value) => {
                setProcess(value);
              }}
              name="wkfProcessList"
              value={process}
              isLabel={false}
            />
          </DialogContent>
          <CardActions className={classes.cardActionView}>
            {process && (
              <Button
                variant="contained"
                className={classes.save}
                color="primary"
                onClick={showDashboard}
              >
                {translate("Show")}
              </Button>
            )}
            <Button
              variant="contained"
              className={classes.save}
              color="primary"
              onClick={handleClose}
            >
              {translate("Close")}
            </Button>
          </CardActions>
        </Dialog>
      )}
    </React.Fragment>
  );
}
