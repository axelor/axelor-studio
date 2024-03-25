import React, { useState } from "react";
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
import {
  Box,
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import Tooltip from "../components/tooltip/tooltip";

const getType = (row) => {
  const { type } = row;
  return type?.replace(/-/g, "_").toLowerCase();
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
      inline={true}
      placeholder="Value"
      fetchAPI={fetchData}
      isMulti={false}
      optionValueKey={targetName}
      optionLabelKey={targetName}
      onChange={(value) => {
        onChange({ name: "fieldValue", value: value, nameField }, editor);
      }}
      value={_value || []}
    />
  );
}

function RenderSimpleWidget(props) {
  const { Component, editor, internalProps } = props;
  const { onChange, value, value2, style, targetName, ...rest } = internalProps;

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
      return (
        <RenderSimpleWidget
          Component={DateTimePicker}
          operator={operator}
          editor={editor}
          internalProps={{
            type,
            value: value.fieldValue,
            onChange: ({ name, value }, index) => {
              return onChange({ name, value: value }, index);
            },
            ...rest,
            margin: "none",
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
            ? { options, ...props }
            : {
                type,
                ...props,
                margin: "none",
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
                ...props,
                value: value.fieldValue,
              }
            : {
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
              style={{ width: "100%" }}
              w={100}
            >
              <TableCell
                align="left"
                ref={ref}
                style={{ cursor: "move", width: "3%" }}
              >
                <Box mt={2}>
                  <MaterialIcon icon="reorder" color="primary" />
                </Box>
              </TableCell>
              <TableCell
                style={{
                  ...getCustomStyle(row),
                  width: "25%",
                  maxWidth: "200px",
                }}
              >
                <ModelFieldComponent
                  name="name"
                  item={row}
                  onChange={(e) => handleChange(e, "name", index)}
                  onSubFieldAdd={onSubFieldAdd}
                  handleAdd={handleAdd}
                  onSubFieldChange={(e) => {
                    handleChange(e, "subFieldName", index);
                  }}
                />
              </TableCell>
              <TableCell style={{ width: "15px" }}>=</TableCell>

              <TableCell style={{ width: "400px" }}>
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
                    field={row.subFieldName || row}
                  />
                )}
              </TableCell>
              <TableCell
                style={{
                  ...getCustomStyle(row),
                  maxWidth: "150px",
                }}
                size="small"
              >
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
                <Box onClick={() => handleRemove(row)} className="pointer">
                  <Tooltip title={translate("Remove field")}>
                    <MaterialIcon icon="delete" color="danger" fontSize={22} />
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          )}
        </Card>
      );
    },
    [
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
    <Box rounded border overflow="scroll">
      <Box
        d="flex"
        bg="body-tertiary"
        alignItems="center"
        justifyContent="space-between"
        p={1}
      >
        <Button
          mx={2}
          d="flex"
          alignItems="center"
          bg="body"
          border
          gap={1}
          outline={false}
          onClick={manageFieldClick}
          title={translate("Add fields")}
        >
          {translate("Add Fields")}
          <MaterialIcon icon="add" color="primary" className="pointer" />
        </Button>
        <Input
          w={25}
          placeholder={translate("Search fields")}
          onChange={(e) => handleFieldSearch(e)}
        />
      </Box>
      <Table
        aria-label="simple table"
        stickyHeader={true}
        verticalAlign="middle"
      >
        <TableHead>
          <TableRow>
            <TableCell align="left">&nbsp;</TableCell>
            <TableCell>{translate("Field name")}</TableCell>
            <TableCell textAlign="center"></TableCell>
            <TableCell textAlign="center">{translate("Value")}</TableCell>
            <TableCell textAlign="center">{translate("Value from")}</TableCell>
            <TableCell textAlign="center"></TableCell>
          </TableRow>
        </TableHead>
        <TableBody
          overflow="auto"
          style={{
            maxHeight: "50vh",
            display: "table-caption",
          }}
        >
          {data.map((row, index) => renderRow(row, index))}
        </TableBody>
      </Table>
    </Box>
  );
}

export default DataTable;
