import React from 'react';
import get from 'lodash/get';
import moment from 'moment';

import DateTimePicker from '../form/DateTimePicker';
import {
  Selection,
  MultiSelection,
  Select,
  NumberInput as NumberField,
  TextInput as InputField,
  Input,
} from '../form';
import {
  fetchFields,
  getData,
  getCustomModelByDomain,
  getNameFieldByDomain,
  getCustomModelData,
} from '../../services/api';
import { isRelationalField } from './ModelField';
import ExpressionField from './ExpressionField';
import { translate, VALUE_FROM, DATE_FORMAT } from '../../utils';
import { getType } from '../../DataTable.utils';
import { MaterialIcon } from '@axelor/ui/icons/material-icon';

const getSelfValue = (row) => {
  const { selected } = row.value || {};
  if (selected && typeof selected.value === 'object') {
    return selected.value;
  }
  return { name: selected && selected.value };
};

const getExpressionValue = (row) => {
  const { selected } = row.value || {};
  if (!selected) {
    return undefined;
  }
  if (isRelationalField(row)) {
    return { [selected.targetName]: selected.value };
  }
  return selected.value;
};

const getParentValueTarget = (row, defaultFrom) => {
  const { contextModel } = row;
  const from = get(row, 'value.from', defaultFrom);
  if (contextModel && from === 'context') {
    return { fullName: contextModel.target };
  }
  if ([VALUE_FROM.SELF, VALUE_FROM.SOURCE, VALUE_FROM.PARENT].includes(from)) {
    const record = getSelfValue(row);
    return { fullName: record.target };
  }
  return {};
};

const parameters = {
  type: 'bpmQuery',
  withParam: true,
  isParameterShow: false,
};

const getValue = (row, key) => {
  return row[key];
};

function RenderRelationalWidget(props) {
  const { internalProps } = props;
  const { onChange, value, ...rest } = internalProps;
  const { field = {}, error = false } = rest;
  const { targetName, target, targetModel } = field;
  const [nameField, setNameField] = React.useState(null);
  const fetchData = async () => {
    let data = [];
    if (target === 'com.axelor.meta.db.MetaJsonRecord' && field['domain']) {
      data = await getCustomModelByDomain(field['domain']);
      let fieldData = await getNameFieldByDomain(field['jsonTarget']);
      setNameField(fieldData && fieldData.name);
    } else if (field.targetJsonModel) {
      data = await getCustomModelData(field['targetJsonModel.name']);
    } else {
      data = await getData(target || targetModel);
    }
    return data;
  };
  const _value =
    value && value._selectId ? { ...value, id: value._selectId } : value;
  return (
    <Selection
      name="fieldValue"
      placeholder="Value"
      fetchAPI={fetchData}
      isMulti={false}
      error={error}
      optionValueKey={targetName}
      optionLabelKey={targetName}
      onChange={(value) => {
        onChange({ name: 'fieldValue', value: value, nameField });
      }}
      value={_value || null}
    />
  );
}

function RenderSimpleWidget(props) {
  const { Component, internalProps } = props;
  const {
    onChange,
    value,
    value2,
    classes,
    style,
    targetName,
    ...rest
  } = internalProps;
  const { error = false } = rest;
  const showError =
    !value || (typeof value === 'string' && value.trim() === '');
  return (
    <Component
      name="fieldValue"
      onChange={(value) => onChange({ name: 'fieldValue', value: value })}
      value={value}
      style={style}
      error={error && showError}
      {...rest}
    />
  );
}

const RenderWidget = React.memo(function RenderWidgetMemo({
  type,
  operator = '=',
  onChange,
  value,
  classes,
  parentType,
  ...rest
}) {
  const props = {
    value: value.fieldValue,
    value2: value.fieldValue2,
    onChange,
    ...rest,
  };
  const { error = false } = rest;

  let options = [],
    widgetProps = {};
  switch (type) {
    case 'one_to_one':
    case 'many_to_one':
    case 'many_to_many':
    case 'one_to_many':
    case 'json_one_to_one':
    case 'json_many_to_one':
    case 'json_many_to_many':
    case 'json_one_to_many':
      return (
        <RenderRelationalWidget
          operator={operator}
          internalProps={{ ...props, value: value.fieldValue }}
          parentType={parentType}
        />
      );
    case 'date':
    case 'time':
    case 'datetime':
      const stringToDate = (value) =>
        value ? moment(value, DATE_FORMAT[type]) : null;
      return (
        <RenderSimpleWidget
          Component={DateTimePicker}
          operator={operator}
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
            margin: 'none',
            classes,
            style: { width: '250px !important' },
          }}
        />
      );
    case 'integer':
    case 'long':
    case 'decimal':
      options =
        rest.field.selectionList &&
        rest.field.selectionList.map(({ title, value, data }) => ({
          name: (data && data.value) || value,
          title: title,
        }));

      widgetProps = {
        Component: options ? Select : NumberField,
        operator,
        internalProps: {
          ...(options
            ? { options, classes, ...props }
            : {
                type,
                ...props,
                margin: 'none',
                classes,
                style: { width: '250px !important' },
              }),
        },
      };
      return <RenderSimpleWidget {...widgetProps} />;
    case 'enum':
      options = rest.field.selectionList.map(({ title, value, data }) => ({
        name: (data && data.value) || value,
        title: title,
      }));
      return (
        <RenderSimpleWidget
          Component={Select}
          operator={operator}
          internalProps={{
            options,
            classes,
            ...props,
          }}
        />
      );
    case 'boolean': {
      const booleanOptions = [
        { title: translate('Yes'), value: true },
        { title: translate('No'), value: false },
      ];
      return (
        <Selection
          optionLabelKey="title"
          optionValueKey="value"
          error={error}
          options={booleanOptions}
          value={booleanOptions.find((b) => b.value === value.fieldValue)}
          onChange={(e) => onChange({ value: e?.value })}
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
                margin: 'none',
                style: { width: '100%' },
              }),
        },
      };
      return <RenderSimpleWidget {...widgetProps} />;
  }
});

function getRequiredField(builderFields, row) {
  if (!row?.required) {
    return;
  }
  const key = builderFields.find((f) => f.name === row.name)?.key;
  return builderFields.find((f) => f.name === row.name && row.key === key)
    ?.required;
}

export default function ValueField({
  classes,
  values,
  row,
  isBPMN,
  metaFields,
  builderFields,
  parentRow,
  targetModel,
  sourceModel,
  getOnChange,
  getProcesses,
  getProcessElement,
  getDMNValues,
}) {
  const { from, selected, query, subFields = [] } = values;
  const defaultFrom = sourceModel ? VALUE_FROM.SOURCE : VALUE_FROM.NONE;
  const isRequiredField = getRequiredField(builderFields, row);
  const currentTarget = row?.jsonTarget || row?.targetModel || row?.target;
  const multiSelectProps = {
    optionValueKey: 'name',
    optionLabelKey: 'title',
    concatValue: true,
    value: subFields,
    onChange: getOnChange('subFields'),
    error: isRequiredField,
    type: row?.type,
    isBPMN: isBPMN,
  };
  switch (from) {
    case VALUE_FROM.SELF:
      return (
        <MultiSelection
          {...multiSelectProps}
          parentRow={parentRow}
          targetModel={targetModel}
        />
      );
    case VALUE_FROM.SOURCE:
      return <MultiSelection {...multiSelectProps} sourceModel={sourceModel} />;
    case VALUE_FROM.PARENT:
      return (
        <Selection
          {...multiSelectProps}
          options={metaFields}
          fetchAPI={() =>
            fetchFields(getParentValueTarget(parentRow, defaultFrom))
          }
          value={getSelfValue(row)}
          onChange={getOnChange('selected')}
        />
      );
    case VALUE_FROM.CONTEXT:
      return <MultiSelection {...multiSelectProps} isContext={true} />;
    case VALUE_FROM.QUERY:
      return (
        <ExpressionField
          parameters={parameters}
          target={!selected?.value && currentTarget}
          error={isRequiredField}
          selected={selected?.value || ''}
          onSelectedChange={getOnChange('selected')}
          expression={query}
          onExpressionChange={getOnChange('query')}
        />
      );
    case VALUE_FROM.NONE:
      return (
        <RenderWidget
          row={row}
          type={getType(row)}
          error={isRequiredField}
          onChange={getOnChange('selected', (e) => e)}
          value={{
            fieldValue: getExpressionValue(row),
            fieldValue2: '',
          }}
          classes={classes}
          field={row.subFieldName || row}
        />
      );
    case VALUE_FROM.EXPRESSION:
      return (
        <Input
          value={selected?.value || ''}
          onChange={getOnChange('selected', (e) => ({ value: e.target.value }))}
          error={isRequiredField}
        />
      );
    case VALUE_FROM.PROCESS:
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Selection
            {...multiSelectProps}
            options={getProcesses && getProcesses()}
            isProcessContext={true}
            value={getValue(row, 'processId')}
            onChange={getOnChange('processId')}
          />
          {getValue(row, 'processId') && (
            <React.Fragment>
              <MaterialIcon icon="arrow_forward" fontSize={20} />
              <MultiSelection
                {...multiSelectProps}
                isProcessContext={true}
                element={getProcessElement(getValue(row, 'processId'))}
              />
            </React.Fragment>
          )}
        </div>
      );
    case VALUE_FROM.DMN:
      return (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Selection
            optionValueKey="resultVariable"
            optionLabelKey="name"
            concatValue={true}
            error={isRequiredField}
            isProcessContext={true}
            fetchAPI={() => getDMNValues()}
            value={getValue(row, 'dmn')}
            onChange={getOnChange('dmn')}
          />
          {getValue(row, 'dmn') && (
            <React.Fragment>
              <MaterialIcon icon="arrow_forward" fontSize={20} />
              <Selection
                {...multiSelectProps}
                isProcessContext={true}
                options={
                  getValue(row, 'dmn') &&
                  getValue(row, 'dmn').outputDmnFieldList
                }
                value={
                  (getSelfValue(row) &&
                    getSelfValue(row).name &&
                    getSelfValue(row).name.split('.')[1]) ||
                  (getSelfValue(row) && getSelfValue(row).name)
                }
                onChange={getOnChange('selected')}
              />
            </React.Fragment>
          )}
        </div>
      );
    default:
      return null;
  }
}
