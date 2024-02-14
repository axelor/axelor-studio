import React from "react";
import { Box } from "@axelor/ui";
import { get } from "lodash";
import Selection from "./Selection";
import { fetchFields } from "../services/api";
import { VALUE_FROM } from "../constant";
import { isRelationalField } from "../utils";

const getSubFieldModel = (row, defaultFrom) => {
  const from = get(row, "value.from", defaultFrom);
  if (from === VALUE_FROM.CONTEXT) {
    return row["contextModel"];
  }
  if (from === VALUE_FROM.SOURCE) {
    return { fullName: row["sourceField"].target };
  }
  if (from === VALUE_FROM.SELF) {
    return { fullName: row["selfField"].target };
  }
  if ([VALUE_FROM.PARENT].includes(from)) {
    const model = get(row, "value.selected.value", {});
    return { fullName: model.target };
  }
  return {};
};

const isLastRelationalField = (record) => {
  if (!record || isRelationalField(record.type)) {
    return true;
  }
  return false;
};

function SubFieldView({ onChange, row, data, defaultFrom }) {
  const handleChange = React.useCallback(
    (e, index) => {
      const newData = data ? [...data] : [];
      if (e === null) {
        newData.splice(index, newData.length - 1);
      } else {
        if (newData[index].name) {
          newData.splice(index, 1, e);
        } else {
          newData.splice(newData.length - 1, 0, e);
        }
      }
      onChange([...newData]);
    },
    [data, onChange]
  );

  const getListedFieldModel = React.useCallback(
    (index) => {
      const record = data[index - 1];
      if (record) {
        return { fullName: record.target };
      } else {
        return getSubFieldModel(row, defaultFrom);
      }
    },
    [data, row, defaultFrom]
  );

  return (
    <Box d="flex">
      {data &&
        data.map((field, i) =>
          isLastRelationalField(data[i - 1]) ? (
            <Selection
              key={i}
              name="metaModalField"
              placeholder="Model field"
              optionValueKey="name"
              optionLabelKey="title"
              concatValue={true}
              fetchAPI={() => fetchFields(getListedFieldModel(i), true)}
              value={field}
              disableClearable={i === data.length - 1 ? true : false}
              onChange={(e) => handleChange(e, i)}
            />
          ) : null
        )}
    </Box>
  );
}

const SubFieldComponent = React.memo(SubFieldView);

export default SubFieldComponent;
