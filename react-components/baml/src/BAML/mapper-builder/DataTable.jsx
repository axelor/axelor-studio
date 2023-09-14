import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Table, IconButton, Tooltip, TextField, Grid } from "@material-ui/core";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";

import ReorderIcon from "@material-ui/icons/Reorder";
import { Close, AddRounded } from "@material-ui/icons";

import moment from "moment";
import { get } from "lodash";

import Selection from "./components/Selection";
import ModelFieldComponent from "./components/ModelFieldComponent";
import NumberField from "./components/NumberInput";
import DateTimePicker from "./components/DateTimePicker";
import Select from "./components/Select";
import InputField from "./components/TextInput";
import Card from "./components/DndView";
import {
  fetchFields,
  getData,
  getCustomModelByDomain,
  getNameFieldByDomain,
  getCustomModelData,
} from "./services/api";
import { VALUE_FROM, DATE_FORMAT } from "./constant";
import { isRelationalField } from "./utils";
import MultiSelector from "./components/MultiSelector";
import { translate } from "../../utils";

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    overflowX: "auto",
    height: "calc(100% - 120px)",
    overflowY: "auto",
  },
  table: {
    minWidth: 650,
    "& td": {
      padding: "0px 16px !important",
    },
  },
  tableRowRoot: {
    "&:nth-of-type(odd)": {
      backgroundColor: theme.palette.action.hover,
    },
    "& .MuiInput-underline:before": {
      borderBottom: 0,
    },
  },
  input: {
    width: "100%",
  },
  error: {
    fontSize: "0.7em",
    position: "absolute",
    paddingTop: 1,
    color: "red",
    fontWeight: "bold",
  },
  valueInputContainer: {
    position: "relative",
  },
  radioInput: {
    padding: 4,
  },
  iconButton: {
    // border: '1px solid #0267bf',
    padding: "8px",
    marginTop: 7,
  },
  deleteIcon: {
    color: "#0275d8",
  },
  headerTitle: {
    paddingLeft: 0,
    textAlign: "center",
  },
  rightIcon: {
    width: "0.8em",
    height: "0.8em",
  },
  addFieldButton: {
    left: 10,
    top: 7,
    textTransform: "capitalize",
  },
  searchField: {
    marginLeft: 20,
    "&>div": {
      marginTop: 10,
    },
  },
}));

const getType = (row) => {
  const { type } = row;
  return type.replace(/-/g, "_").toLowerCase();
};

const getOptions = (isRoot, parentRow, defaultFrom) => {
  const options = [
    { title: "Self", id: VALUE_FROM.SELF },
    { title: "Context", id: VALUE_FROM.CONTEXT },
    { title: "Expression", id: VALUE_FROM.NONE },
    { title: "Source", id: VALUE_FROM.SOURCE },
  ];
  const from = get(parentRow, "value.from", defaultFrom);
  if (
    parentRow &&
    [VALUE_FROM.CONTEXT, VALUE_FROM.SELF, VALUE_FROM.SOURCE].includes(from)
  ) {
    options.push({ title: "Parent", id: VALUE_FROM.PARENT });
  }
  return options;
};

const getSelfValue = (row) => {
  const { selected } = row.value || {};
  let value;
  if (selected && typeof selected.value === "object") {
    return selected.value;
  }
  if (selected) {
    value = selected.value;
  }
  return { name: value };
};

const getExpressionValue = (row) => {
  const { selected = {} } = row.value || {};
  if (!selected) {
    return undefined;
  }
  if (isRelationalField(row.type)) {
    return { [selected.targetName]: selected.value };
  }
  return selected.value;
};

const getCustomStyle = (row) => {
  const { subField } = row;
  const object = {};
  if (subField) {
    object["borderBottom"] = "0px";
  }
  return object;
};

const getOptionDisabled = (option, parentRow, sourceModel) => {
  if (option.id === VALUE_FROM.PARENT) {
    return !parentRow?.value?.selected;
  }
  if (option.id === VALUE_FROM.SOURCE && !sourceModel) {
    return true;
  }
  return false;
};

const getParentValueTarget = (row, defaultFrom) => {
  const { contextModel } = row;
  const from = get(row, "value.from", defaultFrom);
  if (contextModel && from === "context") {
    return { fullName: contextModel.target };
  }
  if ([VALUE_FROM.SELF, VALUE_FROM.SOURCE, VALUE_FROM.PARENT].includes(from)) {
    const record = getSelfValue(row);
    return { fullName: record.target };
  }
  return {};
};

/**
 *
 * @param {*} row
 * @param {*} value
 * @param {*} nameField
 *
 * If targetName is available
 * use targetName
 * If nameField is available
 * use nameField
 * If name property is available in value
 * use name as targetName
 * Else use id property as targetName
 */
const getTargetName = (row, value, nameField) => {
  let targetName;
  if (value && value[row.targetName]) {
    targetName = row.targetName;
  }
  if (!targetName && nameField && value && value[nameField]) {
    targetName = nameField;
  }
  if (!targetName) {
    const nameValue = value ? value["name"] : null;
    if (nameValue) {
      targetName = "name";
    } else {
      targetName = "_selectId";
    }
  }
  return targetName;
};

function RenderRelationalWidget(props) {
  const { editor, internalProps } = props;
  const { onChange, value, ...rest } = internalProps;
  const classes = useStyles();
  const { field = {} } = rest;
  const { targetName, target, targetModel } = field;
  const [nameField, setNameField] = useState(null);
  const fetchData = async () => {
    let data = [];
    if (target === "com.axelor.meta.db.MetaJsonRecord" && field["domain"]) {
      data = await getCustomModelByDomain(field["domain"]);
      let fieldData = await getNameFieldByDomain(field["jsonTarget"]);
      setNameField(fieldData && fieldData.name);
    } else if (field.targetJsonModel) {
      data = await getCustomModelData(field["targetJsonModel.name"]);
    } else {
      data = await getData(target || targetModel);
    }
    return data;
  };
  const _value = value._selectId ? { ...value, id: value._selectId } : value;
  return (
    <Selection
      name="fieldValue"
      title="Value"
      placeholder="Value"
      fetchAPI={fetchData}
      isMulti={false}
      optionValueKey={targetName}
      optionLabelKey={targetName}
      onChange={(value) => {
        onChange({ name: "fieldValue", value: value, nameField }, editor);
      }}
      value={_value || []}
      classes={{ root: classes.MuiAutocompleteRoot }}
    />
  );
}

function RenderSimpleWidget(props) {
  const { Component, editor, internalProps } = props;
  const { onChange, value, value2, classes, style, targetName, ...rest } =
    internalProps;
  return (
    <Component
      name="fieldValue"
      onChange={(value) =>
        onChange({ name: "fieldValue", value: value }, editor)
      }
      value={value}
      style={style}
      {...rest}
    />
  );
}

const RenderWidget = React.memo(function RenderWidgetMemo({
  type,
  operator = "=",
  onChange,
  value,
  classes,
  parentType,
  editor,
  ...rest
}) {
  const props = {
    value: value.fieldValue,
    value2: value.fieldValue2,
    onChange,
    ...rest,
  };

  let options = [],
    widgetProps = {};
  switch (type) {
    case "one_to_one":
    case "many_to_one":
    case "many_to_many":
    case "one_to_many":
    case "json_one_to_one":
    case "json_many_to_one":
    case "json_many_to_many":
    case "json_one_to_many":
      return (
        <RenderRelationalWidget
          operator={operator}
          editor={editor}
          internalProps={{ ...props, value: value.fieldValue }}
          parentType={parentType}
        />
      );
    case "date":
    case "time":
    case "datetime":
      const stringToDate = (value) =>
        value ? moment(value, DATE_FORMAT[type]) : null;
      return (
        <RenderSimpleWidget
          Component={DateTimePicker}
          operator={operator}
          editor={editor}
          internalProps={{
            type,
            value: stringToDate(value.fieldValue),
            onChange: ({ name, value }, index) => {
              return onChange(
                { name, value: value && value.format(DATE_FORMAT[type]) },
                index
              );
            },
            ...rest,
            margin: "none",
            classes,
            style: { width: "250px !important" },
          }}
        />
      );
    case "integer":
    case "long":
    case "decimal":
      options =
        rest.field.selectionList &&
        rest.field.selectionList.map(({ title, value, data }) => ({
          name: (data && data.value) || value,
          title: title,
        }));

      widgetProps = {
        Component: options ? Select : NumberField,
        operator,
        editor,
        internalProps: {
          ...(options
            ? { options, classes, ...props }
            : {
                type,
                ...props,
                margin: "none",
                classes,
                style: { width: "250px !important" },
              }),
        },
      };
      return <RenderSimpleWidget {...widgetProps} />;
    case "enum":
      options = rest.field.selectionList.map(({ title, value, data }) => ({
        name: (data && data.value) || value,
        title: title,
      }));
      return (
        <RenderSimpleWidget
          Component={Select}
          operator={operator}
          editor={editor}
          internalProps={{
            options,
            classes,
            ...props,
          }}
        />
      );
    case "boolean": {
      const booleanOptions = [
        { title: "Yes", value: true },
        { title: "No", value: false },
      ];
      return (
        <Selection
          optionLabelKey="title"
          optionValueKey="value"
          options={booleanOptions}
          value={booleanOptions.find((b) => b.value === value.fieldValue)}
          onChange={(e) => onChange({ value: e.value })}
        />
      );
    }
    default:
      options =
        rest.field &&
        rest.field.selectionList &&
        rest.field.selectionList.map(({ title, value, data }) => ({
          name: (data && data.value) || value,
          title: title,
        }));
      widgetProps = {
        Component: options ? Select : InputField,
        operator,
        editor,
        internalProps: {
          ...(options
            ? {
                options,
                classes,
                ...props,
                value: value.fieldValue,
                className: classes.input,
              }
            : {
                classes,
                ...props,
                onBlur: (e) => props.onChange(e.target),
                margin: "none",
                style: { width: "100%" },
              }),
        },
      };
      return <RenderSimpleWidget {...widgetProps} />;
  }
});

function DataTable(props) {
  const classes = useStyles();
  const {
    onRowChange,
    data = [],
    metaFields = [],
    onRemove,
    errors,
    onClearError,
    onSubFieldAdd,
    handleAdd,
    sourceModel,
    targetModel,
    manageFieldClick,
    handleFieldSearch,
    onReorder,
  } = props;

  const getDefaultFrom = React.useCallback(() => {
    return sourceModel ? VALUE_FROM.SOURCE : VALUE_FROM.NONE;
  }, [sourceModel]);

  const handleChange = React.useCallback(
    async (e, key, rowIndex, row) => {
      const value = e.target.value;
      const nameField = e.target.nameField;
      if (errors && errors[row.dataPath] && value) {
        onClearError(row.dataPath);
      }
      let path = key;
      let selectedValue = value;
      const from = get(row, "value.from", getDefaultFrom());
      if (key === "value") {
        path = `${key}.selected`;
        let _value = value;
        let targetName = value
          ? getTargetName(row, value, nameField)
          : get(row, "value.selected.targetName");
        if (
          isRelationalField(row.type) &&
          (!from || from === VALUE_FROM.NONE) &&
          typeof _value === "object"
        ) {
          if (targetName === "_selectId") {
            _value = value["id"];
          } else {
            _value = value[targetName];
          }
        }
        // if (row.from === 'self' && typeof _value === 'object') {
        //   _value = value['name'];
        // }
        selectedValue = {
          value: _value,
        };

        if (from === VALUE_FROM.NONE && isRelationalField(row.type)) {
          selectedValue.targetName = targetName;
        }
      }
      if (
        ["contextModel", "sourceField", "selfField"].includes(key) ||
        ([VALUE_FROM.SELF, VALUE_FROM.SOURCE, VALUE_FROM.PARENT].includes(
          from
        ) &&
          key === "value")
      ) {
        onRowChange && onRowChange(row, rowIndex, "modelSubField", []);
      }
      onRowChange && onRowChange(row, rowIndex, path, selectedValue);
    },
    [onRowChange, errors, onClearError, getDefaultFrom]
  );

  const handleRemove = React.useCallback(
    (row) => {
      onRemove && onRemove(row);
    },
    [onRemove]
  );

  const renderRow = React.useCallback(
    (row, index, level = 0, parentRow) => {
      if (row.isRemoved || row.isHidden) {
        return null;
      }
      const from = get(row, "value.from", getDefaultFrom());
      return (
        <Card index={index} key={row.name} id={row.name} moveCard={onReorder}>
          {({ ref, style, handlerId, preview }) => (
            <TableRow
              data-handler-id={handlerId}
              ref={preview}
              style={{ ...style }}
              classes={{ root: classes.tableRowRoot }}
            >
              <TableCell align="left" ref={ref} style={{ cursor: "move" }}>
                <div>
                  <ReorderIcon />
                </div>
              </TableCell>
              <TableCell
                style={{
                  ...getCustomStyle(row),
                }}
              >
                <ModelFieldComponent
                  name="name"
                  className={classes.input}
                  item={row}
                  onChange={(e) => handleChange(e, "name", index)}
                  onSubFieldAdd={onSubFieldAdd}
                  handleAdd={handleAdd}
                  onSubFieldChange={(e) => {
                    handleChange(e, "subFieldName", index);
                  }}
                />
              </TableCell>
              <TableCell>=</TableCell>

              <TableCell
                style={{ ...getCustomStyle(row) }}
                className={classes.valueInputContainer}
              >
                {from === VALUE_FROM.SELF ? (
                  <MultiSelector
                    optionValueKey="name"
                    optionLabelKey="title"
                    concatValue={true}
                    parentRow={parentRow}
                    targetModel={targetModel}
                    value={row.modelSubField}
                    onChange={(e) =>
                      handleChange(
                        { target: { value: e } },
                        "modelSubField",
                        index,
                        row
                      )
                    }
                  />
                ) : from === VALUE_FROM.SOURCE ? (
                  <MultiSelector
                    optionValueKey="name"
                    optionLabelKey="title"
                    concatValue={true}
                    sourceModel={sourceModel}
                    value={row.modelSubField}
                    onChange={(e) =>
                      handleChange(
                        { target: { value: e } },
                        "modelSubField",
                        index,
                        row
                      )
                    }
                  />
                ) : from === VALUE_FROM.PARENT ? (
                  <Selection
                    optionValueKey="name"
                    optionLabelKey="title"
                    concatValue={true}
                    options={metaFields}
                    fetchAPI={() =>
                      fetchFields(
                        getParentValueTarget(parentRow, getDefaultFrom())
                      )
                    }
                    value={getSelfValue(row)}
                    onChange={(e) =>
                      handleChange(
                        { target: { value: e } },
                        "value",
                        index,
                        row
                      )
                    }
                  />
                ) : from === VALUE_FROM.CONTEXT ? (
                  <MultiSelector
                    optionValueKey="name"
                    optionLabelKey="title"
                    concatValue={true}
                    isContext={true}
                    value={row.modelSubField}
                    onChange={(e) =>
                      handleChange(
                        { target: { value: e } },
                        "modelSubField",
                        index,
                        row
                      )
                    }
                  />
                ) : (
                  <RenderWidget
                    row={row}
                    type={getType(row)}
                    onChange={(e, editor) => {
                      handleChange({ target: e }, "value", index, row);
                    }}
                    value={{
                      fieldValue: getExpressionValue(row),
                      fieldValue2: "",
                    }}
                    classes={classes}
                    field={row.subFieldName || row}
                  />
                )}
              </TableCell>
              <TableCell style={{ ...getCustomStyle(row) }} size="small">
                <Selection
                  disableClearable
                  options={getOptions(level === 0, parentRow, getDefaultFrom())}
                  value={from || getDefaultFrom()}
                  getOptionDisabled={(option) =>
                    getOptionDisabled(option, parentRow, sourceModel)
                  }
                  onChange={(e) =>
                    handleChange(
                      { target: { value: e } },
                      "value.from",
                      index,
                      row
                    )
                  }
                />
              </TableCell>
              <TableCell
                style={
                  row.level !== undefined
                    ? { borderBottom: "0px", ...getCustomStyle(row) }
                    : { ...getCustomStyle(row) }
                }
              >
                <IconButton
                  size="medium"
                  onClick={() => handleRemove(row)}
                  className={classes.iconButton}
                >
                  <Tooltip title={translate("Remove field")}>
                    <Close fontSize="small" className={classes.deleteIcon} />
                  </Tooltip>
                </IconButton>
              </TableCell>
            </TableRow>
          )}
        </Card>
      );
    },
    [
      classes,
      handleRemove,
      handleChange,
      metaFields,
      onSubFieldAdd,
      handleAdd,
      sourceModel,
      getDefaultFrom,
      targetModel,
      onReorder,
    ]
  );
  return (
    <Paper className={classes.root}>
      <Grid container style={{ backgroundColor: "#FAFAFA" }}>
        <IconButton
          variant="contained"
          color="primary"
          className={classes.addFieldButton}
          onClick={manageFieldClick}
          title={translate("Manage fields")}
        >
          <AddRounded />
        </IconButton>
        <TextField
          classes={{ root: classes.searchField }}
          placeholder={translate("Search fields")}
          onChange={(e) => handleFieldSearch(e)}
        />
      </Grid>
      <Table
        className={classes.table}
        aria-label="simple table"
        stickyHeader={true}
      >
        <colgroup>
          <col style={{ width: "3%" }} />
          <col style={{ width: "27%", minWidth: 300 }} />
          <col style={{ width: "15px" }} />
          <col style={{ width: "50%", minWidth: 200 }} />
          <col style={{ width: "210px", minWidth: 230 }} />
          <col style={{ width: "5%" }} />
        </colgroup>
        <TableHead>
          <TableRow>
            <TableCell align="left">&nbsp;</TableCell>
            <TableCell className={classes.headerTitle}>
              {translate("Field name")}
            </TableCell>
            <TableCell className={classes.headerTitle}></TableCell>
            <TableCell className={classes.headerTitle}>
              {translate("Value")}
            </TableCell>
            <TableCell className={classes.headerTitle}>
              {translate("Value from")}
            </TableCell>
            <TableCell className={classes.headerTitle}></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>{data.map((row, index) => renderRow(row, index))}</TableBody>
      </Table>
    </Paper>
  );
}

export default DataTable;
