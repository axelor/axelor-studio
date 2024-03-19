import React from 'react';
import { Selection } from '../form';
import { fetchFields, ModelType } from '../../services/api';

function RenderSearchFieldWidget(props) {
  const { value, row, onChange } = props;
  const { target, targetJsonModel, name } = row || {};

  const fetchData = async () => {
    const fields = await fetchFields({
      ...row,
      fullName: target,
      modelType: targetJsonModel ? ModelType.CUSTOM : ModelType.META,
      name: targetJsonModel ? row && row['targetJsonModel.name'] : name,
    });
    return fields && fields.filter((f) => f.type.toLowerCase() === 'string');
  };

  return (
    <Selection
      name="searchField"
      fetchAPI={fetchData}
      isMulti={false}
      onChange={(value) => onChange(value)}
      concatValue={true}
      optionLabelKey="title"
      optionValueKey="name"
      value={value}
    />
  );
}

export default RenderSearchFieldWidget;
