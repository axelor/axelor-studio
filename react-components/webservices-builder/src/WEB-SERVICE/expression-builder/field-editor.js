import React, { useEffect, useState } from "react";
import classnames from "classnames";
import { IconButton, Tooltip } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import CloseIcon from '@material-ui/icons/Close';
import { Selection } from "./components";
import { getSubMetaField } from "./services/api";
import { isBPMQuery } from "./extra/util";
import { translate } from "../../utils";
import { JOIN_OPERATOR } from "./constants";

const useStyles = makeStyles(() => ({
  MuiAutocompleteRoot: {
    width: '250px',
    marginRight: '10px',
  },
  iconButton: {
    marginRight: 10,
  },
  icon: {
    color: '#0275d8',
  },
}));

export default function FieldEditor({
  initValue = '',
  getMetaFields,
  editor,
  onChange,
  value,
  classNames,
  expression: parentExpression = 'GROOVY',
  type,
  isParent = false,
  isBPM,
  isField,
  setInitialField = () => {},
  isAllowButtons = false,
}) {
  const { fieldName = '', allField = [] } = value || {};
  const [fields, setFields] = useState([]);
  const classes = useStyles();
  const isContextValue = isField === 'context' && isBPMQuery(type) && isBPM;
  const expression = isBPMQuery(type) ? 'BPM' : parentExpression;
  const [isShow, setShow] = useState(null);

  const values = React.useMemo(() => {
    return (
      fieldName &&
      JOIN_OPERATOR[expression] &&
      fieldName.split(isContextValue ? '?.' : JOIN_OPERATOR[expression])
    );
  }, [isContextValue, fieldName, expression]);

  const [startValue] = values || [];
  const hasManyValues =
    fieldName && isParent && fields && fields.some(x => x.name === startValue);
  const relationModel =
    hasManyValues && (fields.find(x => x.name === startValue) || {}).target;
  const relationJsonModel =
    hasManyValues && (fields.find(x => x.name === startValue) || {}).jsonTarget;
  const fieldType = ((fields && fields.find(x => x.name === startValue)) || {})
    .type;
  const isM2MField =
    allField &&
    allField.length > 0 &&
    allField.find(f =>
      ['many_to_many', 'json_many_to_many'].includes(
        (f && (f.type || '')).toLowerCase().replaceAll('-', '_')
      )
    );
  const isM2OField =
    allField &&
    allField.length > 0 &&
    allField.find(f =>
      ['many_to_one', 'json_many_to_one'].includes(
        (f && (f.type || '')).toLowerCase().replaceAll('-', '_')
      )
    );
  const isOneToOne = ['one_to_one', 'json_one_to_one'].includes(
    (fieldType || '').toLowerCase().replaceAll('-', '_')
  );

  const getUpdatedValue = () => {
    let spiltedValues = initValue && initValue.split(JOIN_OPERATOR[expression]);
    return (
      spiltedValues &&
      spiltedValues.length > 0 &&
      (spiltedValues.filter(Boolean) || []).join(JOIN_OPERATOR[expression])
    );
  };

  function handleChange(value) {
    const isRelationalField =
      value && fields.some(x => x.name === value.name && x.target);
    if (isBPM) {
      let allFields;
      let newFieldName = isParent
        ? value && value.name
          ? `${initValue}${value.name}`
          : `${getUpdatedValue()}`
        : value && value.name
        ? `${
            isRelationalField
              ? isContextValue
                ? '?.'
                : JOIN_OPERATOR[expression]
              : ''
          }${initValue}${value.name}`
        : '';
      if (value && allField.findIndex(f => f.name === value.name) <= -1) {
        let fieldNames =
          (newFieldName || '').split(
            isContextValue ? '?.' : JOIN_OPERATOR[expression]
          ) || [];
        let filterFields =
          (allField && allField.filter(f => fieldNames.includes(f.name))) || [];
        allFields = [...filterFields, value];
      } else {
        let fields = [...(allField || [])];
        let fieldNames = (fieldName || '').split(
          isContextValue ? '?.' : JOIN_OPERATOR[expression]
        );
        fieldNames &&
          fieldNames.length > 0 &&
          fieldNames.forEach(fName => {
            let index = fields.findIndex(f => f.name === fName);
            if (index > -1) {
              fields.splice(index, 1);
            }
          });
        allFields = fields;
      }
      onChange(
        {
          name: 'fieldName',
          value,
          fieldNameValue: newFieldName ? newFieldName : undefined,
          allField: allFields,
          isShow,
        },
        editor
      );
      return;
    }
    let newFieldName = isParent
      ? `${initValue}${value ? value.name : ''}`
      : value
      ? value.name
      : ''
      ? `${isRelationalField ? JOIN_OPERATOR[expression] : ''}${initValue}${
          value ? value.name : ''
        }`
      : '';
    newFieldName = isBPMQuery(type)
      ? value && value.name
        ? newFieldName
        : newFieldName.slice(0, -1)
      : newFieldName;
    onChange(
      {
        name: 'fieldName',
        value: newFieldName,
      },
      editor
    );
    onChange({ name: 'fieldType', value: (value && value.type) || '' }, editor);
    onChange({ name: 'field', value }, editor);
    onChange({ name: 'isShow', value: isShow }, editor);
    if (value && allField.findIndex(f => f.name === value.name) <= -1) {
      let fieldNames =
        (newFieldName || '').split(JOIN_OPERATOR[expression]) || [];
      let allFields =
        (allField && allField.filter(f => fieldNames.includes(f.name))) || [];
      onChange({ name: 'allField', value: [...allFields, value] }, editor);
    } else {
      let fields = [...(allField || [])];
      let fieldNames = (fieldName || '').split(JOIN_OPERATOR[expression]);
      let initValues =
        `${initValue}${JOIN_OPERATOR[expression]}${startValue}`.split(
          JOIN_OPERATOR[expression]
        );
      fieldNames &&
        fieldNames.length > 0 &&
        fieldNames.forEach(fName => {
          let index = fields.findIndex(f => f.name === fName);
          if (index > -1 && !(initValues || []).includes(fName)) {
            fields.splice(index, 1);
          }
        });
      if (fieldNames && fieldNames.length === 1) {
        fields = fields && fields.filter(f => f.name !== fieldNames[0]);
      }
      onChange({ name: 'allField', value: fields }, editor);
      onChange({ name: 'fieldValue', value: null }, editor);
      if (fields && fields.length === 1) {
        const val = fields[0];
        onChange({ name: 'fieldType', value: (val && val.type) || '' }, editor);
        onChange({ name: 'field', value: val }, editor);
        setInitialField();
      } else {
        const val = fields[fields.length - 1];
        onChange({ name: 'fieldType', value: (val && val.type) || '' }, editor);
        onChange({ name: 'field', value: val }, editor);
        setInitialField();
      }
    }
  }
  const transformValue =
    (fields && fields.find(f => f.name === startValue)) ||
    (allField && allField.find(f => f.name === startValue));

  const isM2MFields = !isBPMQuery(type)
    ? isM2MField &&
      values &&
      values.length > 0 &&
      values.includes(isM2MField.name) &&
      values[0] !== isM2MField.name
    : true;

  const fetchSubFields = React.useCallback(() => {
    return getSubMetaField(
      relationModel,
      isM2MFields,
      isBPMQuery(type),
      relationJsonModel,
      isM2OField,
      isBPM,
      isAllowButtons
    );
  }, [
    relationModel,
    isM2MFields,
    type,
    relationJsonModel,
    isM2OField,
    isBPM,
    isAllowButtons,
  ]);

  useEffect(() => {
    const isName =
      values &&
      values.slice(1) &&
      values.slice(1).join(isContextValue ? '?.' : JOIN_OPERATOR[expression]);
    setShow(
      isName && !['toLocalDateTime()', 'getTarget()'].includes(isName)
        ? true
        : false
    );
  }, [values, isContextValue, expression]);

  useEffect(() => {
    (async () => {
      const data = await getMetaFields();
      setFields(data);
    })();
  }, [getMetaFields]);

  return (
    <React.Fragment>
      <Selection
        name="fieldName"
        title="Field Name"
        placeholder="field name"
        options={fields}
        optionLabelKey="name"
        onChange={handleChange}
        value={transformValue}
        classes={{
          root: classnames(
            classes.MuiAutocompleteRoot,
            classNames && classNames.root
          ),
        }}
      />
      {hasManyValues && relationModel && (
        <React.Fragment>
          {isShow && !isOneToOne && (
            <IconButton
              size="small"
              onClick={() => {
                setShow(isShow => !isShow);
                if (allField && allField.length > 0 && startValue) {
                  const previousField = allField.find(
                    f => f.name === startValue
                  );
                  handleChange({
                    ...(previousField || {}),
                  });
                }
              }}
              className={classes.iconButton}
            >
              <Tooltip title={translate('Remove sub field')}>
                <CloseIcon className={classes.icon} fontSize="small" />
              </Tooltip>
            </IconButton>
          )}
          {(isShow || isOneToOne) && (
            <FieldEditor
              getMetaFields={fetchSubFields}
              editor={editor}
              initValue={`${initValue}${startValue}${
                isContextValue ? '?.' : JOIN_OPERATOR[expression]
              }`}
              value={{
                fieldName: values
                  .slice(1)
                  .join(isContextValue ? '?.' : JOIN_OPERATOR[expression]),
                allField,
              }}
              onChange={onChange}
              classNames={classNames}
              expression={expression}
              type={type}
              isParent={relationModel ? true : false}
              isBPM={isBPM}
              setInitialField={setInitialField}
              isField={isField}
              isAllowButtons={isAllowButtons}
            />
          )}
          {!isShow && !isOneToOne && (
            <IconButton
              size="small"
              onClick={() => setShow(isShow => !isShow)}
              className={classes.iconButton}
            >
              <Tooltip title={translate('Add sub field')}>
                <ArrowForwardIcon className={classes.icon} fontSize="small" />
              </Tooltip>
            </IconButton>
          )}
        </React.Fragment>
      )}
    </React.Fragment>
  );
}

