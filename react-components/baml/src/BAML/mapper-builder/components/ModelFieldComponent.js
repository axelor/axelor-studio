import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import classNames from "classnames";
import { Typography, Grid } from "@material-ui/core";
import { RelationalFieldList } from "../constant";
import FieldPopover from "./FieldPopover";
import AddIcon from "@material-ui/icons/AddCircleOutline";

import { translate } from "../../../utils";

const useStyles = makeStyles({
  container: {
    display: "flex",
  },
  input: {
    width: "100%",
    display: "flex",
    position: "relative",
    "& > div:before": {
      border: 0,
    },
  },
  parentField: {
    marginRight: 5,
    color: "#3f51b5",
  },
  clickableView: {
    cursor: "pointer",
    "& input": {
      cursor: "pointer",
    },
    // '&:hover': {
    //   '& $addFieldView': {
    //     visibility: 'visible',
    //   },
    // }
  },
  fieldName: {
    fontSize: 12,
  },
  fieldNameColumn: {
    width: "unset",
  },
  // addFieldView: {
  //   visibility: 'hidden',
  // },
  addFieldButton: {
    padding: 0,
    marginLeft: 5,
  },
});

const isRelationalField = (row) => {
  const type = row.type.replace(/-/g, "_").toLowerCase();
  return RelationalFieldList.indexOf(type) !== -1;
};

const getFields = (item) => {
  if (isRelationalField(item)) {
    const { value } = item;
    return value?.fields || null;
  }
  return null;
};

function ModelFieldComponent(props) {
  const classes = useStyles();
  const { item, handleAdd } = props;
  const [showSubField, setShowSubField] = React.useState(false);
  const fields = getFields(item);

  React.useEffect(() => {
    if (item && isRelationalField(item) && item["subFieldName"]) {
      setShowSubField(true);
    }
  }, [item]);

  if (!item) {
    return null;
  }
  return (
    <div className={classNames(classes.input)}>
      <Grid container direction="column" className={classes.fieldNameColumn}>
        <Typography title={item["name"]}>
          {item["title"] || item["autoTitle"] || item["name"]}
        </Typography>
      </Grid>
      <div>
        {fields && showSubField && (
          <FieldPopover
            data={fields}
            iconButton={true}
            onSubmit={(data) => handleAdd(data)}
            icon={<AddIcon />}
            buttonTitle={translate("Add fields")}
            iconButtonClassName={classes.addFieldButton}
          />
        )}
      </div>
    </div>
  );
}

const ModelField = React.memo(ModelFieldComponent);
export default ModelField;
