import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import moment from 'moment';
import Paper from '@material-ui/core/Paper';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import CloseIcon from '@material-ui/icons/Close';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import { makeStyles } from '@material-ui/core/styles';
import { firstCharLowerCase } from 'xml2js/lib/processors';

import FieldEditor from './field-editor';
import {
  Timeline,
  Select,
  Button,
  Selection,
  DateTimePicker,
  NumberField,
  InputField,
} from '../components';
import {
  COMBINATOR,
  OPERATORS,
  OPERATORS_BY_TYPE,
  DATE_FORMAT,
  JOIN_OPERATOR,
  ALLOWED_TYPES,
  BUILT_IN_VARIABLES,
} from '../constants';
import {
  getCustomModelData,
  getNameField,
  getData,
  getMetaFields as getMetaFieldsAPI,
} from '../services/api';
import { isBPMQuery, lowerCaseFirstLetter } from '../utils';
import { useMetaModelSearch } from './utils';
import { translate } from '../utils';

const useStyles = makeStyles(theme => ({
  rulesGroupHeader: {
    display: 'flex',
  },
  paper: {
    margin: theme.spacing(1, 0),
    padding: theme.spacing(3, 2),
    overflow: 'auto',
  },
  rules: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginBottom: 15,
  },
  MuiAutocompleteRoot: {
    width: '250px',
    marginRight: '10px',
  },
  disabled: {
    pointerEvents: 'none',
    opacity: 0.5,
  },
  valueFrom: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.54)',
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  radio: {
    padding: '1px 9px',
    color: '#0275d8',
    '&.MuiRadio-colorSecondary.Mui-checked': {
      color: '#0275d8',
    },
  },
  operators: {
    minWidth: 75,
  },
  iconButton: {
    marginRight: 10,
  },
  combinator: {
    width: 'fit-content',
  },
  icon: {
    color: '#0275d8',
  },
}));

async function fetchField(metaModals, type) {
  const isQuery = isBPMQuery(type);
  const allFields = (await getMetaFieldsAPI(metaModals, isQuery)) || [];
  return allFields.filter(
    a =>
      ALLOWED_TYPES.includes((a.type || '').toLowerCase()) &&
      (isQuery ? !a.json : true)
  );
}

function RenderRelationalWidget(props) {
  const { operator, editor, internalProps, parentType } = props;
  const { onChange, value, ...rest } = internalProps;
  const classes = useStyles();
  const { field = {} } = rest;
  const { targetName, target, targetModel, jsonTarget } = field;
  const [nameField, setNameField] = useState(null);
  const fetchData = async () => {
    let data;
    if (jsonTarget) {
      data = await getCustomModelData(jsonTarget);
      let fieldData = await getNameField(jsonTarget);
      setNameField(fieldData && fieldData.name);
    } else {
      data = await getData(target || targetModel);
    }
    return data;
  };
  if (['like', 'notLike'].includes(operator)) {
    return (
      <InputField
        name="fieldValue"
        onChange={value => {
          let isNameField;
          if (typeof value !== 'string' && !isBPMQuery(parentType)) {
            isNameField =
              value && value.length > 0
                ? value && value.find(v => v && targetName && v[targetName])
                : value && value[targetName];
            onChange(
              { name: 'nameField', value: isNameField ? nameField : 'id' },
              editor
            );
          }
          onChange({ name: 'fieldValue', value: value }, editor);
        }}
        margin="none"
        style={{ marginTop: '15px', width: '250px !important' }}
        value={value}
        {...rest}
      />
    );
  } else if (
    ['contains', 'notContains', 'in', 'notIn', '=', '!='].includes(operator)
  ) {
    return (
      <Selection
        name="fieldValue"
        title="Value"
        placeholder="Value"
        fetchAPI={fetchData}
        isMulti={
          (isBPMQuery(parentType) &&
            ['contains', 'notContains'].includes(operator)) ||
          ['=', '!='].includes(operator)
            ? false
            : true
        }
        optionLabelKey={targetName}
        onChange={value => {
          let isNameField;
          if (typeof value !== 'string' && !isBPMQuery(parentType)) {
            isNameField = Array.isArray(value)
              ? value.find(v => v && v[targetName])
              : value && value[targetName];
            onChange(
              { name: 'nameField', value: isNameField ? nameField : 'id' },
              editor
            );
          }
          onChange({ name: 'fieldValue', value: value }, editor);
        }}
        value={value || []}
        classes={{ root: classes.MuiAutocompleteRoot }}
      />
    );
  } else {
    return null;
  }
}

function RenderSimpleWidget(props) {
  const { Component, operator, editor, internalProps } = props;
  const { onChange, value, value2, classes, style, targetName, ...rest } =
    internalProps;
  if (['=', '!=', '>', '>=', '<', '<=', 'like', 'notLike'].includes(operator)) {
    return (
      <Component
        name="fieldValue"
        onChange={value =>
          onChange({ name: 'fieldValue', value: value }, editor)
        }
        value={value}
        style={style}
        {...rest}
      />
    );
  } else if (['between', 'notBetween'].includes(operator)) {
    return (
      <React.Fragment>
        <Component
          name="fieldValue"
          style={{ marginRight: 8, ...style }}
          onChange={value => onChange({ name: 'fieldValue', value }, editor)}
          value={value}
          {...rest}
        />

        <Component
          name="fieldValue2"
          onChange={value =>
            onChange({ name: 'fieldValue2', value: value }, editor)
          }
          value={value2}
          style={style}
          {...rest}
        />
      </React.Fragment>
    );
  } else if (['in', 'notIn'].includes(operator)) {
    return (
      <Selection
        name="fieldValue"
        title="Value"
        placeholder="Value"
        isMulti
        optionLabelKey={targetName}
        onChange={val => {
          onChange({ name: 'fieldValue', value: val }, editor);
        }}
        value={value || []}
        classes={{ root: classes.MuiAutocompleteRoot }}
        optionValueKey="name"
        {...rest}
      />
    );
  } else {
    return null;
  }
}

function RenderWidget({
  type,
  operator,
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
          editor={editor}
          internalProps={{ ...props }}
          parentType={parentType}
        />
      );
    case 'date':
    case 'time':
    case 'datetime':
      const stringToDate = value =>
        value ? moment(value, DATE_FORMAT[type]) : null;
      return (
        <RenderSimpleWidget
          Component={DateTimePicker}
          operator={operator}
          editor={editor}
          internalProps={{
            type,
            value: stringToDate(value.fieldValue),
            value2: stringToDate(value.fieldValue2),
            onChange: ({ name, value }, index) =>
              onChange(
                { name, value: value && value.format(DATE_FORMAT[type]) },
                index
              ),
            ...rest,
            margin: 'none',
            classes,
            style: { marginTop: '15px', width: '250px !important' },
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
        editor,
        internalProps: {
          ...(options
            ? { options, classes, ...props }
            : {
                type,
                ...props,
                margin: 'none',
                classes,
                style: { marginTop: '15px', width: '250px !important' },
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
          editor={editor}
          internalProps={{
            options,
            classes,
            ...props,
          }}
        />
      );
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
            ? { options, classes, ...props }
            : {
                classes,
                ...props,
                margin: 'none',
                style: { marginTop: '15px', width: '250px !important' },
              }),
        },
      };
      return <RenderSimpleWidget {...widgetProps} />;
  }
}

const getValue = val => {
  if (val && typeof val === 'string') {
    let values = val.toString().split('.');
    if (values && values.length > 1) {
      return values.slice(1).join('.');
    } else {
      return val;
    }
  } else {
    return;
  }
};

const getBuiltInVariables = () => {
  return BUILT_IN_VARIABLES.map(v => {
    return { name: v.name, title: v.title };
  });
};

const Rule = React.memo(function Rule(props) {
  const {
    index,
    getMetaFields,
    editor,
    value,
    expression,
    parentType,
    parentMetaModal,
    element,
    isCondition,
    onChange: _onChange,
    onRemove,
    isParameterShow,
    fetchModels,
    isAllowButtons = false,
    isBPMN = false,
    isMapper = false,
  } = props;

  const {
    isField = 'none',
    fieldType = '',
    field,
    operator,
    fieldValue,
    fieldValue2 = '',
    relatedValueModal: metaModal,
    relatedElseValueModal: elseMetaModal,
    relatedValueFieldName,
    relatedElseValueFieldName,
    isShowElseMetaModelField,
    isShowMetaModelField,
  } = value;
  const classes = useStyles();
  const type = fieldType && fieldType.toLowerCase().replaceAll('-', '_');

  const [elseNameValue, setElseNameValue] = useState(null);
  const [nameValue, setNameValue] = useState(null);
  const [isParameter, setIsParameter] = useState(true);
  const fetchMetaModels = useMetaModelSearch(
    element,
    isMapper ? null : 'metaModel'
  );

  const isBuiltInVars = metaModal?.name === 'Built In Variables';

  const onChange = React.useCallback(
    (e, editor) => _onChange(e, editor, index),
    [index, _onChange]
  );

  const operatorsOptions = OPERATORS.filter(item => {
    let operatorType = type;
    if (operatorType === '' && value.fieldName && value.allField.length > 0) {
      let parentField = value.allField.find(f => f.name === value.fieldName);
      operatorType = ((parentField && parentField.type) || '').toLowerCase();
    }
    return (OPERATORS_BY_TYPE[operatorType] || []).includes(item.name);
  });

  const handleChange = React.useCallback(
    (name, value) => {
      onChange({ name, value }, editor);
    },
    [onChange, editor]
  );

  const fetchMetaModalField = React.useCallback(() => {
    return fetchField(metaModal, parentType);
  }, [metaModal, parentType]);

  const fetchElseMetaModalField = React.useCallback(() => {
    return fetchField(elseMetaModal, type);
  }, [elseMetaModal, type]);

  const fetchContextModels = React.useCallback(
    async ({ search }) => {
      let data = fetchModels
        ? await fetchModels()
        : await fetchMetaModels({ search });
      if (isBPMN && !isBPMQuery(parentType)) {
        const obj = {
          title: translate('Built In Variables'),
          name: 'Built In Variables',
        };
        data = [obj, ...(data || [])];
      }
      return data || [];
    },
    [fetchMetaModels, fetchModels, isBPMN, parentType]
  );

  useEffect(() => {
    setIsParameter(isParameterShow);
  }, [isParameterShow]);

  useEffect(() => {
    isBuiltInVars && handleChange('isShowMetaModelField', true);
  }, [isBuiltInVars, handleChange]);

  useEffect(() => {
    const {
      fieldValue,
      allField = [],
      fieldValue2 = '',
      isRelationalValue,
      relatedValueModal,
      relatedValueFieldName,
      relatedElseValueModal,
      relatedElseValueFieldName,
      isShowMetaModelField: showMetaModelField,
      isShowElseMetaModelField: showElseMetaModelField,
      isField: propIsField,
    } = value;
    setElseNameValue({
      allField: allField,
      field: relatedElseValueFieldName,
      fieldName:
        getValue(fieldValue2) ||
        (relatedElseValueFieldName && relatedElseValueFieldName.name),
      fieldType: relatedElseValueFieldName && relatedElseValueFieldName.type,
      fieldValue: null,
      fieldValue2: null,
      operator: null,
      isRelationalValue: isRelationalValue || 'none',
      relatedValueFieldName: relatedValueFieldName,
      relatedValueModal: relatedValueModal,
      relatedElseValueFieldName: relatedElseValueFieldName,
      relatedElseValueModal: relatedElseValueModal,
      isShow: showElseMetaModelField,
    });
    setNameValue({
      allField: allField,
      field: relatedValueFieldName,
      fieldName:
        getValue(fieldValue) ||
        (relatedValueFieldName && relatedValueFieldName.fieldName),
      fieldType: relatedValueFieldName && relatedValueFieldName.type,
      fieldValue: null,
      fieldValue2: null,
      operator: null,
      isRelationalValue: isRelationalValue || propIsField || 'none',
      relatedValueFieldName: relatedValueFieldName,
      relatedValueModal: relatedValueModal,
      isShow: showMetaModelField,
    });
  }, [value]);

  return (
    <div className={classes.rules}>
      <FieldEditor
        getMetaFields={getMetaFields}
        isField={isField}
        editor={editor}
        onChange={onChange}
        value={value}
        expression={expression}
        type={parentType}
        isParent
        isAllowButtons={isAllowButtons}
        setInitialField={() => {
          handleChange('isField', 'none');
        }}
      />
      <React.Fragment>
        <Select
          name="operator"
          title="Operator"
          options={
            field && field.selectionList
              ? OPERATORS.filter(o =>
                  (isField && !['none', 'param'].includes(isField)
                    ? ['=', '!=', 'isNull', 'isNotNull']
                    : ['=', '!=', 'isNull', 'isNotNull', 'in', 'notIn']
                  ).includes(o.name)
                )
              : isField && !['none', 'param'].includes(isField)
              ? operatorsOptions.filter(
                  o => o.name !== 'in' && o.name !== 'notIn'
                )
              : operatorsOptions
          }
          onChange={value => {
            onChange({ name: 'operator', value }, editor);
            handleChange('isField', null);
          }}
          value={operator}
          className={classes.operators}
        />
        {operator &&
          !['button', 'menu-item'].includes(field.type) &&
          ![
            'isNull',
            'isNotNull',
            ...(isBPMN ? ['isTrue', 'isFalse'] : []),
          ].includes(operator) && (
            <RadioGroup
              aria-label="radioType"
              name="radioType"
              value={isField || 'none'}
              onChange={e => {
                setNameValue({
                  fieldValue: null,
                });
                handleChange('fieldValue', null);
                setElseNameValue({
                  fieldValue2: null,
                });
                handleChange('fieldValue2', null);
                if (
                  e.target.value &&
                  (operator === 'in' || operator === 'notIn') &&
                  !['none', 'param'].includes(e.target.value)
                ) {
                  onChange({ name: 'operator', value: undefined }, editor);
                  handleChange('isField', null);
                  return;
                }

                if (e.target.value) {
                  handleChange('isField', e.target.value);
                  handleChange(
                    'isRelationalValue',
                    ['none', 'param'].includes(e.target.value)
                      ? null
                      : e.target.value
                  );
                  handleChange('fieldValue', null);
                  handleChange('fieldValue2', null);
                  if (e.target.value === 'self') {
                    handleChange('relatedValueModal', parentMetaModal);
                    handleChange('relatedElseValueModal', parentMetaModal);
                  } else {
                    handleChange('relatedValueModal', null);
                    handleChange('relatedElseValueModal', null);
                    handleChange('isShowMetaModelField', false);
                    handleChange('isShowElseMetaModelField', false);
                  }
                } else {
                  handleChange('relatedValueFieldName', null);
                  handleChange('relatedValueModal', null);
                  handleChange('relatedElseValueFieldName', null);
                  handleChange('relatedElseValueModal', null);
                }
              }}
            >
              <label className={classes.valueFrom}>Value from</label>
              {!['isTrue', 'isFalse'].includes(operator) && !isCondition && (
                <React.Fragment>
                  <FormControlLabel
                    value="self"
                    control={<Radio className={classes.radio} size="small" />}
                    label={translate('Self')}
                  />
                  <FormControlLabel
                    value="context"
                    control={<Radio className={classes.radio} size="small" />}
                    label={translate('Context')}
                  />
                </React.Fragment>
              )}
              {isParameter && isBPMQuery(parentType) && (
                <FormControlLabel
                  value="param"
                  control={<Radio className={classes.radio} size="small" />}
                  label={translate('Is parameter')}
                />
              )}
              <FormControlLabel
                value="none"
                control={<Radio className={classes.radio} size="small" />}
                label={translate('None')}
              />
            </RadioGroup>
          )}
      </React.Fragment>
      {isField &&
      !['none', 'param'].includes(isField) &&
      operator &&
      !['isNull', 'isNotNull', 'isTrue', 'isFalse'].includes(operator) ? (
        <React.Fragment>
          {isField === 'context' && (
            <React.Fragment>
              <Selection
                name="metaModal"
                title="Meta model"
                placeholder="meta model"
                fetchAPI={fetchContextModels}
                optionLabelKey="name"
                onChange={e => {
                  handleChange('relatedValueModal', e);
                  if (e && e.name !== 'Built In Variables') {
                    const fieldValue = `${firstCharLowerCase(
                      e?.name
                    )}?.getTarget()`;
                    setNameValue({
                      fieldValue,
                    });
                    handleChange('fieldValue', fieldValue);
                  } else {
                    setNameValue({
                      fieldValue: null,
                    });
                    handleChange('fieldValue', null);
                  }
                }}
                value={metaModal}
                classes={{ root: classes.MuiAutocompleteRoot }}
              />
              {isShowMetaModelField && isField === 'context' && (
                <IconButton
                  size="small"
                  onClick={() => {
                    handleChange('isShowMetaModelField', false);
                    if (!metaModal) return;
                    const model = metaModal.name;
                    const fieldValue = `${firstCharLowerCase(
                      model
                    )}?.getTarget()`;
                    setNameValue({
                      fieldValue,
                    });
                    handleChange('relatedValueModal', metaModal);
                    handleChange('fieldValue', fieldValue);
                  }}
                  className={classes.iconButton}
                >
                  <Tooltip title={translate('Remove sub field')}>
                    <CloseIcon color="primary" fontSize="small" />
                  </Tooltip>
                </IconButton>
              )}
            </React.Fragment>
          )}
          {(isShowMetaModelField || isField === 'self') && (
            <FieldEditor
              isParent
              isBPM
              getMetaFields={
                isField === 'context' && isBPMN
                  ? isBuiltInVars
                    ? getBuiltInVariables
                    : fetchMetaModalField
                  : getMetaFields
              }
              editor={editor}
              isField={isField}
              onChange={(
                { value, fieldNameValue, allField, isShow },
                editor
              ) => {
                setNameValue({
                  allField: allField,
                  field: value,
                  fieldName: fieldNameValue,
                  fieldType: value && value.type,
                  fieldValue: null,
                  fieldValue2: null,
                  operator: null,
                  isRelationalValue: isField === 'none' ? null : isField,
                  relatedValueFieldName: null,
                  relatedValueModal: null,
                  isShow,
                  isShowMetaModelField,
                });
                handleChange(
                  'isRelationalValue',
                  isField === 'none' ? null : isField
                );
                handleChange('relatedValueFieldName', value);
                handleChange('relatedValueModal', metaModal);
                const isBPM = isBPMQuery(parentType);
                const isRelational = [
                  'json-many-to-one',
                  'MANY_TO_ONE',
                  'many-to-one',
                ].includes(value?.type);
                const isContextValue = isField === 'context' && isBPM;
                handleChange(
                  'fieldValue',
                  fieldNameValue
                    ? isBPM && isField === 'self'
                      ? `self.${fieldNameValue}`
                      : isBuiltInVars
                      ? `${fieldNameValue}`
                      : `${lowerCaseFirstLetter(metaModal?.name)}${
                          isContextValue
                            ? '?.'
                            : JOIN_OPERATOR[isBPM ? 'BPM' : expression]
                        }${fieldNameValue}${
                          value &&
                          isRelational &&
                          (isField === 'context' || isField === 'self')
                            ? `${
                                isContextValue
                                  ? '?.'
                                  : JOIN_OPERATOR[expression]
                              }getTarget()`
                            : ''
                        }${
                          value?.typeName && !isBPM
                            ? `${
                                isContextValue
                                  ? '?.'
                                  : JOIN_OPERATOR[expression]
                              }toLocalDateTime()`
                            : ''
                        }`
                    : undefined
                );
              }}
              value={nameValue}
              expression={expression}
              type={parentType}
            />
          )}

          {!isShowMetaModelField && metaModal && isField === 'context' && (
            <IconButton
              size="small"
              onClick={() => handleChange('isShowMetaModelField', true)}
              className={classes.iconButton}
            >
              <Tooltip title={translate('Add sub field')}>
                <ArrowForwardIcon className={classes.icon} fontSize="small" />
              </Tooltip>
            </IconButton>
          )}

          {['between', 'notBetween'].includes(operator) && (
            <React.Fragment>
              {isField === 'context' && (
                <React.Fragment>
                  <Selection
                    name="metaModal"
                    title="Meta model else"
                    placeholder="meta model"
                    fetchAPI={fetchMetaModels}
                    optionLabelKey="name"
                    onChange={e => {
                      handleChange('relatedElseValueModal', e);
                      if (e) {
                        setElseNameValue({
                          fieldValue2: firstCharLowerCase(e.name),
                        });
                        handleChange('fieldValue2', firstCharLowerCase(e.name));
                      } else {
                        setElseNameValue({
                          fieldValue2: null,
                        });
                        handleChange('fieldValue2', null);
                      }
                    }}
                    value={elseMetaModal}
                    classes={{ root: classes.MuiAutocompleteRoot }}
                  />
                  {isShowElseMetaModelField && isField === 'context' && (
                    <IconButton
                      size="small"
                      onClick={() => {
                        handleChange('isShowElseMetaModelField', false);
                        if (!elseMetaModal) return;
                        const model = elseMetaModal.name;
                        setNameValue({
                          fieldValue: firstCharLowerCase(model),
                        });
                        handleChange('relatedElseValueModal', elseMetaModal);
                        handleChange('fieldValue2', firstCharLowerCase(model));
                      }}
                      className={classes.iconButton}
                    >
                      <Tooltip title={translate('Remove sub field')}>
                        <CloseIcon className={classes.icon} fontSize="small" />
                      </Tooltip>
                    </IconButton>
                  )}
                </React.Fragment>
              )}
              {(isShowElseMetaModelField || isField === 'self') && (
                <FieldEditor
                  getMetaFields={fetchElseMetaModalField}
                  editor={editor}
                  isField={isField}
                  onChange={(
                    { value, fieldNameValue, allField, isShow },
                    editor
                  ) => {
                    setElseNameValue({
                      allField: allField,
                      field: value,
                      fieldName: fieldNameValue,
                      fieldType: value && value.type,
                      fieldValue: null,
                      fieldValue2: null,
                      operator: null,
                      isRelationalValue: isField === 'none' ? null : isField,
                      relatedValueFieldName: relatedValueFieldName,
                      relatedValueModal: elseMetaModal,
                      relatedElseValueFieldName: relatedElseValueFieldName,
                      relatedElseValueModal: elseMetaModal,
                      isShow,
                      isShowMetaModelField,
                      isShowElseMetaModelField,
                    });
                    handleChange('relatedElseValueFieldName', value);
                    handleChange('relatedElseValueModal', elseMetaModal);
                    const isBPM = isBPMQuery(parentType);
                    const isContextValue = isField === 'context' && isBPM;
                    handleChange(
                      'fieldValue2',
                      fieldNameValue
                        ? isBPM && isField === 'self'
                          ? `self.${fieldNameValue}`
                          : `${lowerCaseFirstLetter(
                              elseMetaModal && elseMetaModal.name
                            )}${
                              isContextValue
                                ? '?.'
                                : JOIN_OPERATOR[isBPM ? 'BPM' : expression]
                            }${fieldNameValue}${
                              value &&
                              [
                                'json-many-to-one',
                                'MANY_TO_ONE',
                                'many-to-one',
                              ].includes(value.type) &&
                              isBPM &&
                              isField === 'context'
                                ? `${
                                    isContextValue
                                      ? '?.'
                                      : JOIN_OPERATOR[expression]
                                  }getTarget()`
                                : ''
                            }${
                              value && value.typeName && !isBPM
                                ? `${
                                    isContextValue
                                      ? '?.'
                                      : JOIN_OPERATOR[expression]
                                  }toLocalDateTime()`
                                : ''
                            }`
                        : undefined
                    );
                  }}
                  value={elseNameValue}
                  expression={expression}
                  type={parentType}
                  isParent
                  isBPM
                />
              )}
              {!isShowElseMetaModelField &&
                elseMetaModal &&
                isField === 'context' && (
                  <IconButton
                    size="small"
                    onClick={() =>
                      handleChange('isShowElseMetaModelField', true)
                    }
                    className={classes.iconButton}
                  >
                    <Tooltip title={translate('Add sub field')}>
                      <ArrowForwardIcon color="primary" fontSize="small" />
                    </Tooltip>
                  </IconButton>
                )}
            </React.Fragment>
          )}
        </React.Fragment>
      ) : !isCondition && isField === 'param' ? (
        <></>
      ) : (
        operator &&
        (['button', 'menu-item'].includes(field.type) ? (
          <Select
            name="fieldValue"
            onChange={value =>
              onChange({ name: 'fieldValue', value: value }, editor)
            }
            value={fieldValue}
            options={[
              { name: true, title: 'true' },
              { name: false, title: 'false' },
            ]}
            className={classes.operators}
          />
        ) : (
          <RenderWidget
            type={type}
            parentType={parentType}
            operator={operator}
            onChange={(e, editor) => {
              onChange(e, editor);
              handleChange('isField', isField);
              handleChange('isRelationalValue', null);
              handleChange('relatedValueFieldName', null);
              handleChange('relatedValueModal', null);
            }}
            value={{ fieldValue, fieldValue2 }}
            classes={classes}
            editor={editor}
            field={field}
          />
        ))
      )}
      <div>
        <IconButton size="small" onClick={e => onRemove(editor.id, index)}>
          <DeleteIcon />
        </IconButton>
      </div>
    </div>
  );
});

export default function Editor({
  onAddGroup,
  isRemoveGroup,
  onRemoveGroup,
  onAddRule,
  onRemoveRule,
  editor = {},
  getChildEditors,
  onChange,
  getMetaFields,
  isDisable,
  expression,
  type,
  parentMetaModal,
  element,
  isCondition,
  isParameterShow,
  fetchModels,
  isAllowButtons = false,
  isBPMN = false,
  isMapper,
}) {
  const classes = useStyles();
  const [isBPM, setBPM] = useState(false);
  const { id, rules = [] } = editor;
  const childEditors = getChildEditors(editor.id);

  useEffect(() => {
    const isBPM = isBPMQuery(type);
    setBPM(isBPM);
  }, [type]);

  return (
    <Paper
      variant="outlined"
      className={classNames(classes.paper, isDisable && classes.disabled)}
    >
      <div className={classNames(classes.rulesGroupHeader)}>
        <Timeline
          align="alternate"
          title={
            <Select
              name="combinator"
              className={classes.combinator}
              disableUnderline
              options={COMBINATOR}
              value={editor.combinator}
              onChange={value =>
                onChange({ name: 'combinator', value }, editor)
              }
            />
          }
        >
          <Button
            title="Add group"
            Icon={AddIcon}
            onClick={() => onAddGroup(id)}
          />
          {isRemoveGroup && (
            <IconButton
              title={translate('Remove group')}
              size="small"
              onClick={() => onRemoveGroup(id)}
            >
              <DeleteIcon />
            </IconButton>
          )}
          {rules.map((rule, i) => (
            <Rule
              key={i}
              index={i}
              value={rule}
              editor={editor}
              element={element}
              expression={expression}
              isBPM={isBPM}
              isBPMN={isBPMN}
              isCondition={isCondition}
              parentType={type}
              parentMetaModal={parentMetaModal}
              getMetaFields={getMetaFields}
              onChange={onChange}
              onRemove={onRemoveRule}
              isParameterShow={isParameterShow}
              fetchModels={fetchModels}
              isAllowButtons={isAllowButtons}
              isMapper={isMapper}
            />
          ))}
          <Button
            title="Add rule"
            Icon={AddIcon}
            onClick={() => onAddRule(id)}
          />
          {childEditors.map((editor, i) => (
            <React.Fragment key={editor.id}>
              <Editor
                isRemoveGroup
                onAddGroup={onAddGroup}
                onRemoveGroup={onRemoveGroup}
                onAddRule={onAddRule}
                onRemoveRule={onRemoveRule}
                getChildEditors={getChildEditors}
                getMetaFields={getMetaFields}
                onChange={(e, editor, i) => onChange(e, editor, i)}
                editor={editor}
                type={type}
                element={element}
                expression={expression}
                isCondition={isCondition}
                parentMetaModal={parentMetaModal}
                isParameterShow={isParameterShow}
                fetchModels={fetchModels}
                isMapper={isMapper}
                isBPMN={isBPMN}
              />
            </React.Fragment>
          ))}
        </Timeline>
      </div>
    </Paper>
  );
}
