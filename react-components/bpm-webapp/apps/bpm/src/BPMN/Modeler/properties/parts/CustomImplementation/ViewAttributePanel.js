import React, { useState, useEffect, useCallback } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TableHead,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
} from "@material-ui/core";
import { Add, Close, ReportProblem } from "@material-ui/icons";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import Select from "../../../../../components/Select";
import {
  TextField,
  Checkbox,
} from "../../../../../components/properties/components";
import {
  getModels,
  getViews,
  getItems,
  getRoles,
  getMetaFields,
} from "../../../../../services/api";
import { translate, getBool, dashToUnderScore } from "../../../../../utils";
import {
  BOOL_ATTRIBUTES,
  STR_ATTRIBUTES,
  NUM_ATTRIBUTES,
  ALL_ATTRIBUTES,
} from "./constants";

const Ids = require("ids").default;

const valueObj = {
  model: null,
  view: null,
  roles: [],
  items: [],
};

const itemsObj = {
  itemName: null,
  attributeName: null,
  attributeValue: null,
};

function nextId() {
  let ids = new Ids([32, 32, 1]);
  return ids.nextPrefixed("viewAttributes_");
}

function createData(values = []) {
  return {
    id: nextId(),
    values: [...values],
  };
}

const useStyles = makeStyles({
  button: {
    textTransform: "none",
  },
  addButton: {
    borderRadius: 0,
    marginLeft: 5,
    padding: 0,
    height: 23,
    border: "1px solid #ccc",
    color: "#727272",
    width: "fit-content",
    "&:hover": {
      border: "1px solid #727272",
    },
  },
  grid: {
    padding: "0px 5px 0px 0px",
  },
  card: {
    margin: "5px 0px 10px 0px",
    boxShadow: "none",
    width: "100%",
    border: "1px solid #ccc",
    background: "#f8f8f8",
    borderRadius: 0,
  },
  cardContent: {
    padding: "10px !important",
  },
  cardContainer: {
    display: "flex",
    alignItems: "flex-start",
  },
  tableCell: {
    padding: "6px !important",
    width: "33%",
  },
  tableHead: {
    padding: "6px !important",
    fontWeight: "bolder",
    color: "#666",
    margin: "3px 0px",
  },
  attributes: {
    fontWeight: "bolder",
    color: "#666",
    margin: "3px 0px",
  },
  iconButton: {
    margin: "5px 0px 5px 5px",
    borderRadius: 0,
    border: "1px solid #ccc",
    padding: 2,
    width: "fit-content",
  },
  label: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    margin: "3px 0px",
  },
  typography: {
    display: "flex",
    alignItems: "center",
    color: "#CC3333",
    marginTop: 10,
  },
  icon: {
    marginRight: 10,
  },
  textFieldRoot: {
    marginTop: 0,
  },
  textFieldLabel: {
    marginBottom: 0,
  },
  icons: {
    display: "flex",
    flexDirection: "column",
  },
  checkbox: {
    marginTop: 0,
    justifyContent: "center",
  },
});

export default function ViewAttributePanel({
  handleAdd,
  element,
  bpmnModeler,
}) {
  const classes = useStyles();
  const [row, setRow] = useState(null);
  const [processModels, setProcessModels] = useState([]);

  const addModelView = () => {
    setRow({
      ...(row || {}),
      values: [...((row && (row.values || [])) || []), { ...valueObj }],
    });
  };

  const updateErrorValue = (index, name) => {
    const cloneRow = { ...row };
    let values = cloneRow.values;
    values[index] = {
      ...(values[index] || {}),
      [`${name}Error`]: true,
    };
    setRow({ ...cloneRow });
  };

  const updateValue = (value, name, label, index, valueLabel) => {
    const cloneRow = { ...row };
    let values = cloneRow.values;
    values[index] = {
      ...(values[index] || {}),
      [name]: (value && value[label]) || value,
      [`${name}Error`]: false,
      [`${name}Label`]: valueLabel,
    };
    setRow({ ...cloneRow });
    handlePropertyAdd();
  };

  const addItems = (index) => {
    const cloneRow = { ...row };
    let values = cloneRow.values;
    values[index] = {
      ...(values[index] || {}),
      items: [
        { id: `item_${cloneRow.id}_${index}`, ...itemsObj },
        ...(values[index].items || []),
      ],
    };
    setRow({ ...cloneRow });
    handlePropertyAdd();
  };

  const updateItemErrorValues = (index, itemIndex, name) => {
    const cloneRow = { ...row };
    let values = cloneRow.values;
    let items = cloneRow.values[index].items;
    items[itemIndex] = {
      ...(items[itemIndex] || []),
      [`${name}Error`]: true,
    };
    values[index] = {
      ...(values[index] || {}),
      items,
    };
    setRow({ ...cloneRow });
  };

  const handleItems = (value, name, label, index, itemIndex, valueLabel) => {
    const cloneRow = { ...row };
    let values = cloneRow.values;
    let items = cloneRow.values[index].items;
    items[itemIndex] = {
      ...(items[itemIndex] || []),
      [name]: value && (value[label] || value),
      [`${name}Error`]: false,
      [`${name}Label`]: valueLabel,
    };
    if (name === "attributeName") {
      if (BOOL_ATTRIBUTES.includes(value)) {
        if (!items[itemIndex].attributeValue) {
          items[itemIndex].attributeValue = "false";
        }
      } else {
        items[itemIndex].attributeValue = null;
      }
    }
    values[index] = {
      ...(values[index] || {}),
      items,
    };
    setRow({ ...cloneRow });
    handlePropertyAdd();
  };

  const removeItem = (valueIndex, itemIndex) => {
    const cloneRow = { ...row };
    let values = cloneRow.values;
    let items = cloneRow.values[valueIndex].items;
    items.splice(itemIndex, 1);
    values[valueIndex] = {
      ...(values[valueIndex] || {}),
      items,
    };
    setRow({ ...cloneRow });
    handlePropertyAdd();
  };

  const removeCard = (index) => {
    const cloneRow = { ...row };
    let values = cloneRow.values;
    values.splice(index, 1);
    setRow({ ...cloneRow });
    handlePropertyAdd();
  };

  const getBO = React.useCallback((element) => {
    if (
      element &&
      element.$parent &&
      element.$parent.$type !== "bpmn:Process"
    ) {
      return getBO(element.$parent);
    } else {
      return element.$parent;
    }
  }, []);

  function getProcessConfig() {
    const rootElements =
      bpmnModeler._definitions && bpmnModeler._definitions.rootElements;
    const processes =
      rootElements &&
      rootElements.filter((ele) => ele.$type === "bpmn:Process");
    const extensionElements = processes.map((p) => p.extensionElements);
    const noOptions = {
      criteria: [
        {
          fieldName: "name",
          operator: "IN",
          value: [""],
        },
      ],
    };
    if (!extensionElements || extensionElements.length <= 0) return noOptions;
    const processConfigurations = extensionElements.map((e) =>
      e?.values.find((e) => e.$type === "camunda:ProcessConfiguration")
    );
    const metaModels = [],
      metaJsonModels = [];
    if (!processConfigurations && !processConfigurations.length)
      return noOptions;
    processConfigurations.forEach((config) => {
      const { processConfigurationParameters } = config || {};
      processConfigurationParameters?.forEach((config) => {
        if (config.metaModel) {
          metaModels.push(config.metaModel);
        } else if (config.metaJsonModel) {
          metaJsonModels.push(config.metaJsonModel);
        }
      });
    });
    let value = [...metaModels, ...metaJsonModels];
    const data = {
      criteria: [
        {
          fieldName: "name",
          operator: "IN",
          value: value && value.length > 0 ? value : [""],
        },
      ],
      operator: "or",
    };
    return data;
  }

  const handlePropertyAdd = () => {
    const businessObject = getBusinessObject(element);
    const extensionElements =
      businessObject && businessObject.extensionElements;
    let values, camundaProperty;
    if (extensionElements && extensionElements.values) {
      camundaProperty = extensionElements.values.find(
        (e) => e.$type === "camunda:Properties"
      );
      values = camundaProperty && camundaProperty.values;
    }
    if (values) {
      let elements = values.filter(
        (val) =>
          ![
            "model",
            "modelName",
            "modelType",
            "modelLabel",
            "view",
            "viewLabel",
            "item",
            "roles",
            "itemLabel",
            "itemType",
            "permanent",
            "relatedField",
            "relatedFieldLabel",
            ...ALL_ATTRIBUTES,
          ].includes(val.name)
      );
      if (camundaProperty) {
        camundaProperty.values = [...elements];
      }
    }
    if (row.values && row.values.length > 0) {
      row.values &&
        row.values.forEach((value, index) => {
          const { model, items = [] } = value;
          if (!model) {
            updateErrorValue(index, "model");
          }
          if (items.length > 0) {
            items.forEach((item, itemIndex) => {
              let { itemName, attributeName, attributeValue } = item;
              if (!itemName) {
                updateItemErrorValues(index, itemIndex, "itemName");
              }
              if (!attributeName) {
                updateItemErrorValues(index, itemIndex, "attributeName");
              }
              if (!attributeValue) {
                if (
                  !["readonly", "hidden", "required"].includes(attributeName)
                ) {
                  updateItemErrorValues(index, itemIndex, "attributeValue");
                }
              }
            });
          }
        });
    }
    handleAdd(row);
  };

  function getKeyData(data, key) {
    return (
      data &&
      data.reduce((arrs, item) => {
        if (item.name === key) {
          arrs.push([]);
        }
        arrs[arrs.length - 1] && arrs[arrs.length - 1].push(item);
        return arrs;
      }, [])
    );
  }

  const getRelatedField = React.useCallback(
    async (val) => {
      const fields = await getMetaFields(val.model);

      return fields?.filter((f) => {
        let modelName;
        if (f.target && !f.jsonTarget) {
          modelName = f.target.split(".").pop();
        }
        return (
          ["MANY_TO_ONE", "many-to-one"].includes(f.type) &&
          processModels.includes(modelName || f.jsonTarget || f.target)
        );
      });
    },
    [processModels]
  );

  useEffect(() => {
    let bo = getBO(element && element.businessObject);
    const extensionElements = bo && bo.extensionElements;
    if (!extensionElements || !extensionElements?.values) return;
    const processConfigurations = extensionElements.values.find(
      (e) => e.$type === "camunda:ProcessConfiguration"
    );
    const metaModels = [],
      metaJsonModels = [];
    if (
      !processConfigurations &&
      !processConfigurations?.processConfigurationParameters
    )
      return;
    processConfigurations.processConfigurationParameters.forEach((config) => {
      if (config.metaModel) {
        metaModels.push(config.metaModel);
      } else if (config.metaJsonModel) {
        metaJsonModels.push(config.metaJsonModel);
      }
    });
    setProcessModels([...metaModels, ...metaJsonModels]);
  }, [element, getBO]);

  useEffect(() => {
    if (!element) return;
    const businessObject = getBusinessObject(element);
    const extensionElements =
      businessObject && businessObject.extensionElements;

    if (!extensionElements) {
      setRow(createData([]));
      return;
    }
    let extensionElementValues, camundaProperty;
    if (extensionElements && extensionElements.values) {
      camundaProperty = extensionElements.values.find(
        (e) => e.$type === "camunda:Properties"
      );
      extensionElementValues = camundaProperty && camundaProperty.values;
    }
    if (extensionElementValues && extensionElementValues.length < 1) return;
    let models = getKeyData(extensionElementValues, "model");
    let values = [];
    models &&
      models.forEach((modelArr) => {
        let value = { items: [] };
        let items = getKeyData(modelArr, "itemType");
        modelArr.forEach((ele) => {
          if (ele.name === "model") {
            value.model = { model: ele.value, fullName: ele.value };
          }
          if (ele.name === "modelName") {
            value.model = { ...value.model, name: ele.value };
          }
          if (ele.name === "modelType") {
            value.model = { ...value.model, type: ele.value };
          }
          if (ele.name === "modelLabel") {
            value.modelLabel = ele.value;
            value.model = { ...value.model, title: ele.value };
          }
          if (ele.name === "view") {
            value.view = { name: ele.value };
          }
          if (ele.name === "viewLabel") {
            value.viewLabel = ele.value;
            value.view = { ...value.view, title: ele.value };
          }
          if (ele.name === "relatedField") {
            value.relatedField = { name: ele.value };
          }
          if (ele.name === "relatedFieldLabel") {
            value.relatedFieldLabel = ele.value;
            value.relatedField = { ...value.relatedField, title: ele.value };
          }
          if (ele.name === "roles") {
            if (!ele.value) return;
            const roles = ele.value.split(",");
            let valueRoles = [];
            roles.forEach((role) => {
              valueRoles.push({ name: role });
            });
            value.roles = valueRoles;
          }
        });

        items &&
          items.forEach((item) => {
            const name = item.find((f) => f.name === "item");
            const label = item.find((f) => f.name === "itemLabel");
            const type = item.find((f) => f.name === "itemType");
            const attribute = item.find((f) => ALL_ATTRIBUTES.includes(f.name));
            const permanent = item.find((f) => f.name === "permanent");
            value.items.push({
              itemName: {
                name: name && name.value,
                label: label && label.value,
                type: type && type.value,
              },
              itemNameLabel: label && label.value,
              attributeName: attribute && attribute.name,
              attributeValue: attribute && attribute.value,
              permanent: permanent && permanent.value,
            });
          });
        values.push(value);
      });
    setRow(createData(values));
  }, [element]);

  const attributes = {
    panel: [
      "hidden",
      "hideIf",
      "readonly",
      "readonlyIf",
      "collapse",
      "collapseIf",
      "css",
      "icon",
      "title",
      "active",
    ],
    button: [
      "hidden",
      "hideIf",
      "readonly",
      "readonlyIf",
      "prompt",
      "css",
      "icon",
      "title",
    ],
    relational: [
      "hidden",
      "hideIf",
      "required",
      "requiredIf",
      "readonly",
      "readonlyIf",
      "css",
      "title",
      "domain",
      "url:set",
      "value:set",
      "value:add",
      "value:del",
    ],
    self: ["readonly", "readonlyIf"],
    others: [
      "hidden",
      "hideIf",
      "requiredIf",
      "readonly",
      "required",
      "readonlyIf",
      "precision",
      "scale",
      "prompt",
      "css",
      "icon",
      "selection-in",
      "title",
      "active",
      "domain",
      "refresh",
      "url",
      "value",
    ],
  };

  const relationalList = [
    "one_to_many",
    "onetomany",
    "many_to_many",
    "manytomany",
  ];

  const getAttributes = (itemName) => {
    const { type, name, title, label, relationship } = itemName;
    if (!name && !title && !label) return;
    if (name === "self") {
      return attributes["self"];
    } else if (
      relationalList.includes(dashToUnderScore(type || relationship))
    ) {
      return attributes["relational"];
    } else if (attributes[type]) {
      return attributes[type];
    } else {
      return attributes["others"];
    }
  };

  const fetchItems = useCallback(async (data, val) => {
    const options = await getItems(
      val.view && val.view.name,
      val.model,
      data?.criteria
    );
    return options.filter(
      (r) => r["title"] !== null || (r.type === "panel" && r["name"] !== null)
    );
  }, []);

  return (
    <div>
      {row && (
        <div>
          <div>
            {row.values &&
              row.values.map(
                (val, index) =>
                  val && (
                    <div
                      key={`card_${index}`}
                      className={classes.cardContainer}
                    >
                      <Card className={classes.card}>
                        <CardContent className={classes.cardContent}>
                          <Grid>
                            <Grid container>
                              <Grid item xs={6} className={classes.grid}>
                                <label className={classes.label}>
                                  {translate("Model")}
                                </label>
                                <Select
                                  fetchMethod={() =>
                                    getModels(getProcessConfig())
                                  }
                                  update={(value, label) => {
                                    updateValue(
                                      value,
                                      "model",
                                      undefined,
                                      index,
                                      label
                                    );
                                    updateValue(
                                      undefined,
                                      "view",
                                      undefined,
                                      index,
                                      label
                                    );
                                    updateValue(
                                      undefined,
                                      "relatedField",
                                      undefined,
                                      index,
                                      label
                                    );
                                    updateValue(
                                      undefined,
                                      "items",
                                      undefined,
                                      index,
                                      label
                                    );
                                  }}
                                  optionLabel="name"
                                  optionLabelSecondary="title"
                                  name="model"
                                  validate={(values) => {
                                    if (!values.model) {
                                      return {
                                        model: "Must provide a value",
                                      };
                                    }
                                  }}
                                  value={val.model}
                                  isLabel={false}
                                />
                              </Grid>
                              <Grid
                                item
                                xs={6}
                                style={{ justifyContent: "flex-end" }}
                                className={classes.grid}
                              >
                                {val.model && (
                                  <div>
                                    <label className={classes.label}>
                                      {translate("View")}
                                    </label>
                                    <Select
                                      fetchMethod={(data) => {
                                        return getViews(
                                          val.model,
                                          data?.criteria
                                        );
                                      }}
                                      update={(value, label) => {
                                        updateValue(
                                          value,
                                          "view",
                                          undefined,
                                          index,
                                          label
                                        );
                                      }}
                                      name="view"
                                      value={val.view || null}
                                      isLabel={false}
                                    />
                                  </div>
                                )}
                              </Grid>
                            </Grid>
                            {val?.model?.name &&
                              !processModels.includes(val?.model?.name) && (
                                <div>
                                  <label className={classes.label}>
                                    {translate("Related field")}
                                  </label>
                                  <Select
                                    isLabel={false}
                                    fetchMethod={() => getRelatedField(val)}
                                    update={(value, label) =>
                                      updateValue(
                                        value,
                                        "relatedField",
                                        undefined,
                                        index,
                                        label
                                      )
                                    }
                                    optionLabel="name"
                                    optionLabelSecondary="title"
                                    validate={(values) => {
                                      if (!values.relatedField) {
                                        return {
                                          relatedField: "Must provide a value",
                                        };
                                      }
                                    }}
                                    name="relatedField"
                                    value={val?.relatedField || null}
                                  />
                                </div>
                              )}
                            {(val.model || val.view) && (
                              <div>
                                <label className={classes.label}>
                                  {translate("Roles")}
                                </label>
                                <Select
                                  fetchMethod={(data) =>
                                    getRoles(data?.criteria)
                                  }
                                  update={(value) =>
                                    updateValue(
                                      value,
                                      "roles",
                                      undefined,
                                      index
                                    )
                                  }
                                  name="roles"
                                  value={val.roles || []}
                                  multiple={true}
                                  isLabel={false}
                                />
                              </div>
                            )}
                            {val.model &&
                              (!val.items || val.items.length === 0) && (
                                <Typography className={classes.typography}>
                                  <ReportProblem
                                    fontSize="small"
                                    className={classes.icon}
                                  />
                                  {translate("Must provide attributes")}
                                </Typography>
                              )}
                            <Grid container alignItems="center">
                              <Grid item xs={6}>
                                <Typography className={classes.attributes}>
                                  {translate("Attributes")}
                                </Typography>
                              </Grid>
                              <Grid item xs={6} style={{ textAlign: "right" }}>
                                <Button
                                  className={classes.button}
                                  onClick={() => addItems(index)}
                                  disabled={!val.model}
                                  startIcon={<Add />}
                                >
                                  {translate("New")}
                                </Button>
                              </Grid>
                            </Grid>
                            <Grid>
                              {val && val.items && val.items.length > 0 && (
                                <TableContainer>
                                  <Table
                                    size="small"
                                    aria-label="a dense table"
                                  >
                                    <TableHead>
                                      <TableRow>
                                        <TableCell
                                          className={classes.tableHead}
                                          align="center"
                                        >
                                          {translate("Item")}
                                        </TableCell>
                                        <TableCell
                                          className={classes.tableHead}
                                          align="center"
                                        >
                                          {translate("Name")}
                                        </TableCell>
                                        <TableCell
                                          className={classes.tableHead}
                                          align="center"
                                        >
                                          {translate("Value")}
                                        </TableCell>
                                        <TableCell
                                          className={classes.tableHead}
                                          align="center"
                                        >
                                          {translate("Permanent ?")}
                                        </TableCell>
                                        <TableCell
                                          className={classes.tableHead}
                                          align="center"
                                        ></TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {(val.model || val.view) &&
                                        val.items &&
                                        val.items.map((item, key) => (
                                          <TableRow
                                            key={`item_${val.id}_${key}`}
                                          >
                                            <TableCell
                                              component="th"
                                              scope="row"
                                              align="center"
                                              className={classes.tableCell}
                                            >
                                              <Select
                                                isLabel={false}
                                                skipFilter={true}
                                                fetchMethod={(data) =>
                                                  fetchItems(data, val)
                                                }
                                                update={(value, label) => {
                                                  handleItems(
                                                    value,
                                                    "itemName",
                                                    undefined,
                                                    index,
                                                    key,
                                                    label
                                                  );
                                                  handleItems(
                                                    null,
                                                    "attributeName",
                                                    undefined,
                                                    index,
                                                    key,
                                                    label
                                                  );
                                                }}
                                                validate={(values) => {
                                                  if (
                                                    !values.itemName ||
                                                    (!values.itemName.name &&
                                                      !values.itemName.label &&
                                                      !values.itemName.title)
                                                  ) {
                                                    return {
                                                      itemName: translate(
                                                        "Must provide a value"
                                                      ),
                                                    };
                                                  }
                                                }}
                                                name="itemName"
                                                value={
                                                  item?.itemName?.name ||
                                                  item?.itemName?.label ||
                                                  item?.itemName?.title
                                                    ? item?.itemName
                                                    : null
                                                }
                                                label="Item"
                                              />
                                            </TableCell>
                                            <TableCell
                                              align="center"
                                              className={classes.tableCell}
                                            >
                                              <Select
                                                isLabel={false}
                                                options={
                                                  item?.itemName &&
                                                  getAttributes(item.itemName)
                                                }
                                                update={(value) =>
                                                  handleItems(
                                                    value,
                                                    "attributeName",
                                                    undefined,
                                                    index,
                                                    key
                                                  )
                                                }
                                                name="attributeName"
                                                validate={(values) => {
                                                  if (!values.attributeName) {
                                                    return {
                                                      attributeName: translate(
                                                        "Must provide a value"
                                                      ),
                                                    };
                                                  }
                                                }}
                                                value={
                                                  item?.attributeName || null
                                                }
                                                label="Attribute"
                                              />
                                            </TableCell>
                                            <TableCell
                                              align="center"
                                              className={classes.tableCell}
                                            >
                                              {item.attributeName &&
                                                BOOL_ATTRIBUTES.includes(
                                                  item.attributeName
                                                ) && (
                                                  <Select
                                                    isLabel={false}
                                                    options={["true", "false"]}
                                                    disableClearable={true}
                                                    update={(value) => {
                                                      handleItems(
                                                        value,
                                                        "attributeValue",
                                                        undefined,
                                                        index,
                                                        key
                                                      );
                                                    }}
                                                    name="attributeValue"
                                                    value={
                                                      item.attributeValue ||
                                                      "false"
                                                    }
                                                    label="Attribute value"
                                                  />
                                                )}
                                              {item.attributeName &&
                                                [
                                                  ...STR_ATTRIBUTES,
                                                  ...NUM_ATTRIBUTES,
                                                ].includes(
                                                  item.attributeName
                                                ) && (
                                                  <TextField
                                                    element={element}
                                                    canRemove={true}
                                                    type={
                                                      NUM_ATTRIBUTES.includes(
                                                        item.attributeName
                                                      )
                                                        ? "number"
                                                        : undefined
                                                    }
                                                    rootClass={
                                                      classes.textFieldRoot
                                                    }
                                                    labelClass={
                                                      classes.textFieldLabel
                                                    }
                                                    entry={{
                                                      id: "attributeValue",
                                                      name: "attributeValue",
                                                      placeholder: `${item.attributeName} value`,
                                                      modelProperty:
                                                        "attributeValue",
                                                      get: function () {
                                                        return {
                                                          attributeValue:
                                                            item.attributeValue,
                                                        };
                                                      },
                                                      set: function (e, value) {
                                                        handleItems(
                                                          value[
                                                            "attributeValue"
                                                          ],
                                                          "attributeValue",
                                                          undefined,
                                                          index,
                                                          key
                                                        );
                                                      },
                                                      validate: function (
                                                        e,
                                                        values
                                                      ) {
                                                        if (
                                                          !values.attributeValue
                                                        ) {
                                                          return {
                                                            attributeValue:
                                                              translate(
                                                                "Must provide a value"
                                                              ),
                                                          };
                                                        }
                                                      },
                                                    }}
                                                  />
                                                )}
                                            </TableCell>
                                            <TableCell
                                              align="center"
                                              className={classes.tableCell}
                                            >
                                              <Checkbox
                                                className={classes.checkbox}
                                                entry={{
                                                  id: `permanent-model-${key}`,
                                                  modelProperty: "permanent",
                                                  get: function () {
                                                    return {
                                                      permanent: getBool(
                                                        item.permanent
                                                      ),
                                                    };
                                                  },
                                                  set: function (e, value) {
                                                    handleItems(
                                                      !value.permanent,
                                                      "permanent",
                                                      undefined,
                                                      index,
                                                      key
                                                    );
                                                  },
                                                }}
                                                element={element}
                                              />
                                            </TableCell>
                                            <TableCell
                                              align="center"
                                              className={classes.tableCell}
                                            >
                                              <IconButton
                                                className={classes.iconButton}
                                                onClick={() =>
                                                  removeItem(index, key)
                                                }
                                              >
                                                <Close fontSize="small" />
                                              </IconButton>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              )}
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                      <IconButton
                        className={classes.iconButton}
                        onClick={() => removeCard(index)}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </div>
                  )
              )}
          </div>
        </div>
      )}
      <div className={classes.icons}>
        <IconButton className={classes.iconButton} onClick={addModelView}>
          <Add fontSize="small" />
        </IconButton>
      </div>
    </div>
  );
}
