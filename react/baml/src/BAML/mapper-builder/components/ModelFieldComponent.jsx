import React from "react";
import { RelationalFieldList } from "../constant";
import FieldPopover from "./FieldPopover";
import { Box } from "@axelor/ui";

import { translate } from "../../../utils";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
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
    <Box w={100} d="flex" pos="relative" color="body">
      <Box direction="column" style={{ width: "unset" }}>
        <Box>{item["title"] || item["autoTitle"] || item["name"]} </Box>
      </Box>
      <div>
        {fields && showSubField && (
          <FieldPopover
            data={fields}
            iconButton={true}
            onSubmit={(data) => handleAdd(data)}
            icon={
              <MaterialIcon
                icon="add"
                color="body"
                fontSize={20}
                className="pointer"
              />
            }
            buttonTitle={translate("Add fields")}
          />
        )}
      </div>
    </Box>
  );
}

const ModelField = React.memo(ModelFieldComponent);
export default ModelField;
