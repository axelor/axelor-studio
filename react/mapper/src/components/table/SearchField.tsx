import React from "react";
import { fetchFields, ModelType } from "@studio/shared/services";

import { Selection } from "../form";
import type { BuilderField, MetaField } from "../../utils";

interface SearchFieldProps {
  value: { name: string; title?: string } | null | undefined;
  row: BuilderField;
  onChange: (value: unknown) => void;
}

function RenderSearchFieldWidget(props: SearchFieldProps) {
  const { value, row, onChange } = props;
  const { target, targetJsonModel, name } = row || {};

  const fetchData = async (): Promise<MetaField[]> => {
    const fields: MetaField[] = await fetchFields({
      ...row,
      fullName: target,
      modelType: targetJsonModel ? ModelType.CUSTOM : ModelType.META,
      name: targetJsonModel
        ? row && ((row as Record<string, unknown>)["targetJsonModel.name"] as string)
        : name,
    });
    return fields && fields.filter((f) => f.type.toLowerCase() === "string");
  };

  return (
    <Selection
      name="searchField"
      fetchAPI={fetchData}
      isMulti={false}
      onChange={(value: unknown) => onChange(value)}
      concatValue={true}
      optionLabelKey="title"
      optionValueKey="name"
      value={value}
    />
  );
}

export default RenderSearchFieldWidget;
