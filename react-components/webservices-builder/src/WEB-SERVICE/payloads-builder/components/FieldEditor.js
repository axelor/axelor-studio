import React, { useEffect, useState } from "react";
import classnames from "classnames";
import { IconButton, Tooltip } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import CloseIcon from '@material-ui/icons/Close';
import { isBPMQuery, translate } from "../../../utils";
import { SelectionField } from "../../components";
import { JOIN_OPERATOR } from "../../expression-builder/constants";
import { getSubMetaField } from "../../expression-builder/services/api";

const useStyles = makeStyles(() => ({
  MuiAutocompleteRoot: {
    width: '300px',
   // marginRight: '10px',
  },
  iconButton: {
    width:"40px"
  },
  icon: {
    color: '#0275d8',
  },
}));

export default function FieldEditor({
  getMetaFields,
  onChange,
  value,
  classNames,
  expression: parentExpression = 'GROOVY',
  type,
  isBPM,
  isField,
  setInitialField = () => {},
  isAllowButtons = false,
}) {
  const [fields, setFields] = useState([]);
  const classes = useStyles();
  const [isShow, setShow] = useState(null);
  const isOneToOne = ['one_to_one', 'json_one_to_one'].includes(
    (value?.type || '').toLowerCase().replaceAll('-', '_')
  );
  const relationModel = value?.target;
  const isM2OField =
   
      ['many_to_one', 'json_many_to_one'].includes(
        (value?.type || '').toLowerCase().replaceAll('-', '_')
    );
    const isM2MField =
      ['many_to_many', 'json_many_to_many'].includes(
        (value?.type || '').toLowerCase().replaceAll('-', '_')
      );
  const relationJsonModel = value?.jsonTarget;


  function handleChange(value) {

    onChange(value)
   
  }

  const fetchSubFields = React.useCallback(() => {
   return getSubMetaField(
      relationModel,
      isM2MField,
      isBPMQuery(type),
      relationJsonModel,
      isM2OField,
      isBPM,
      isAllowButtons
    );
  }, [isAllowButtons, isBPM, isM2MField, isM2OField, relationJsonModel, relationModel, type]);

  const changeSubField = (e) => {
    onChange({...value,subField:e});
  }


  useEffect(() => {
    (async () => {
    const data = await getMetaFields();
    setFields(data);
    })();
  }, [getMetaFields]);

  return (
    <React.Fragment>
      <SelectionField
        name="fieldName"
        title="Field Name"
        placeholder="field name"
        options={fields}
        optionLabelKey="name"
        onChange={handleChange}
        value={value}
        classes={{
          root: classnames(
            classes.MuiAutocompleteRoot,
            classNames && classNames.root
          ),
        }}
      />
      {relationModel && (
        <React.Fragment>
          {isShow && !isOneToOne && (
            <IconButton
              size="small"
              onClick={() => {
                onChange({...value,subField:null})
                setShow(isShow => !isShow);
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
              onChange={changeSubField}
              value={value?.subField}
              classNames={classNames}
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

