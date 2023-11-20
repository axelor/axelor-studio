import React from "react";
import Chip from "@material-ui/core/Chip";
import { makeStyles } from "@material-ui/core/styles";
import RightIcon from "@material-ui/icons/ArrowForward";

import Selection from "./Selection";
import { fetchFields, getModels } from "../services/api";
import { translate } from "../utils";
import { excludedFields } from "../constant";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    listStyle: "none",
    padding: theme.spacing(0.5),
    margin: 0,
  },
  chip: {
    margin: theme.spacing(0.5),
  },
  rightIcon: {
    width: "0.8em",
    height: "0.8em",
  },
}));

const getKey = (key) => (key === "_selectId" ? "id" : key);

const getIndex = (value, newValue) => {
  let index;
  for (let i = 0; i < value.length; i++) {
    const element = value[i];
    const elemIndex = newValue.findIndex((val) => val.name === element.name);
    if (elemIndex === -1) {
      index = i;
      break;
    }
  }
  return index;
};

function MultiSelector(props) {
  const {
    sourceModel,
    value,
    onChange,
    parentRow,
    targetModel,
    isContext = false,
    isProcessContext = false,
    element,
    isM2o = false,
    containerClassName = "",
    ...rest
  } = props;
  const classes = useStyles();

  const getModel = () => {
    if (Array.isArray(value) && value.length) {
      const list = value.filter((e) => e.name);
      const record = list[list.length - 1];
      if ((isContext || isProcessContext) && list.length - 1 === 0) {
        return record;
      }
      if (
        record.model === "com.axelor.meta.db.MetaJsonRecord" &&
        record.targetModel
      ) {
        return { fullName: record.targetModel };
      }
      if (!record.target) {
        return { fullName: record.model };
      }
      return { fullName: record.target };
    } else {
      if (sourceModel) {
        return sourceModel;
      } else if (parentRow) {
        return { fullName: parentRow.target };
      } else if (targetModel) {
        return targetModel;
      }
    }
  };

  const handleChange = React.useCallback(
    (newValue, reason) => {
      if (reason === "remove-option") {
        const index = getIndex(value, newValue);
        if (index) {
          newValue.splice(index, newValue.length - 1);
        }
      }
      onChange(newValue);
    },
    [value, onChange]
  );

  const hasValue = () => Array.isArray(value) && value.length;
  const checkValue = (option) => {
    const { optionLabelKey, optionValueKey, concatValue, name } = rest;
    return (option && option.type) === "metaJsonModel"
      ? `${
          option && option[getKey(optionLabelKey)]
            ? option[getKey(optionLabelKey)]
            : ""
        } (Custom model)` || ""
      : name === "fieldName"
      ? `${translate(option && option["title"] ? option["title"] : "")} (${
          option && option[getKey(optionLabelKey)]
        })`
      : option
      ? option[getKey(optionLabelKey)] &&
        concatValue &&
        option[getKey(optionValueKey)]
        ? `${option[getKey(optionLabelKey)] || option[getKey(optionValueKey)]}`
        : option[getKey(optionLabelKey)]
        ? option[getKey(optionLabelKey)]
        : option["name"]
        ? option["name"]
        : option["id"]
        ? option["id"].toString()
        : ""
      : "";
  };
  return (
    <div className={containerClassName}>
      <Selection
        title={props.title}
        isMulti={true}
        fetchAPI={async () => {
          if (sourceModel && value && value[0]) {
            if (value[0].title === "SOURCE") {
              return [];
            }
          }
          let data =
            isProcessContext && !hasValue()
              ? await getModels()
              : isContext && !hasValue()
              ? await getModels()
              : await fetchFields(getModel());
          if (sourceModel && (!value || value.length < 1)) {
            const object = Object.assign({}, sourceModel, {
              title: `SOURCE`,
            });
            data.splice(0, 0, { ...object });
          }
          if (isM2o && value && value.length > 0) {
            data = data.filter(
              (item) =>
                ["many_to_one", "one_to_one"].includes(
                  item.type.toLowerCase()
                ) && !excludedFields.includes(item.name)
            );
          }
          return data;
        }}
        value={value}
        onChange={handleChange}
        renderTags={(tags, getTagProps) => {
          return tags.map((tag, i) => (
            <React.Fragment key={i}>
              <Chip
                key={i}
                title={tag[getKey(rest.optionValueKey)]}
                label={checkValue(tag)}
                className={classes.chip}
                {...getTagProps({ index: i })}
              />
              {i < tags.length - 1 && (
                <RightIcon className={classes.rightIcon} />
              )}
            </React.Fragment>
          ));
        }}
        {...rest}
      />
    </div>
  );
}

export default MultiSelector;
