import React from 'react';
import { Badge, Box } from '@axelor/ui';
import { MaterialIcon } from '@axelor/ui/icons/material-icon';

import Selection from './Selection';
import { fetchFields, getModels } from '../../services/api';
import { excludedFields, translate, dashToUnderScore } from '../../utils';

const getProcessConfig = (element) => {
  const extensionElements = element && element.extensionElements;
  const noOptions = [
    {
      fieldName: 'name',
      operator: 'IN',
      value: [''],
    },
  ];
  if (!extensionElements || !extensionElements.values) {
    return { metaModels: noOptions, metaJsonModels: noOptions };
  }

  const processConfigurations = extensionElements.values.find(
    (e) => e.$type === 'camunda:ProcessConfiguration'
  );
  const metaModels = [],
    metaJsonModels = [];

  if (
    !processConfigurations ||
    !processConfigurations.processConfigurationParameters
  ) {
    return { metaModels: noOptions, metaJsonModels: noOptions };
  }
  processConfigurations.processConfigurationParameters.forEach((config) => {
    if (config.metaModel) {
      metaModels.push(config.metaModel);
    } else if (config.metaJsonModel) {
      metaJsonModels.push(config.metaJsonModel);
    }
  });
  return {
    metaModels: [
      {
        fieldName: 'name',
        operator: 'IN',
        value: metaModels && metaModels.length > 0 ? metaModels : [''],
      },
    ],
    metaJsonModels: [
      {
        fieldName: 'name',
        operator: 'IN',
        value:
          metaJsonModels && metaJsonModels.length > 0 ? metaJsonModels : [''],
      },
    ],
  };
};

const getKey = (key) => (key === '_selectId' ? 'id' : key);

const builtInVars = [
  '__date__',
  '__time__',
  '__datetime__',
  '__studiouser__',
  '__this__',
  '__self__',
  '__parent__',
  '__id__',
];

const allowedTypes = {
  decimal: ['decimal', 'integer'],
  text: ['text', 'string'],
};

function MultiSelector(props) {
  const {
    sourceModel,
    value,
    onChange,
    parentRow,
    targetModel,
    isContext = false,
    isM2o = false,
    containerClassName,
    isBPMN,
    element,
    isProcessContext = false,
    type,
    handleRemove = () => {},
    ...rest
  } = props;

  const getModel = () => {
    if (Array.isArray(value) && value.length) {
      const list = value.filter((e) => e.name);
      const record = list[list.length - 1];
      if ((isContext || isProcessContext) && list.length - 1 === 0) {
        return record;
      }
      if (
        record.model === 'com.axelor.meta.db.MetaJsonRecord' &&
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
      let changeValue = newValue;
      if (reason === 'remove-option') {
        const index = value?.findIndex(
          (val) => val.trackKey === newValue.trackKey
        );
        if (index >= 0) {
          changeValue = [...(value || [])].splice(0, index);
        }
      }
      onChange(changeValue);
    },
    [value, onChange]
  );

  const hasValue = () => Array.isArray(value) && value.length;
  const checkValue = (option) => {
    const { optionLabelKey, optionValueKey, concatValue, name } = rest;
    return (option && option.type) === 'metaJsonModel'
      ? `${
          option && option[getKey(optionLabelKey)]
            ? option[getKey(optionLabelKey)]
            : ''
        } (${translate('Custom model')})` || ''
      : name === 'fieldName'
      ? `${translate(option && option['title'] ? option['title'] : '')} (${
          option && option[getKey(optionLabelKey)]
        })`
      : option
      ? option[getKey(optionLabelKey)] &&
        concatValue &&
        option[getKey(optionValueKey)]
        ? `${option[getKey(optionLabelKey)] || option[getKey(optionValueKey)]}`
        : option[getKey(optionLabelKey)]
        ? option[getKey(optionLabelKey)]
        : option['name']
        ? option['name']
        : option['id']
        ? option['id'].toString()
        : ''
      : '';
  };

  const getProcessModelOptions = async () => {
    const processConfig = getProcessConfig(element);
    if (!processConfig) return [];
    const metaModels = await getModels(
      processConfig.metaModels,
      'metaModel',
      processConfig.metaModels
    );
    const metaJsonModels = await getModels(
      processConfig.metaJsonModels,
      'metaJsonModel',
      processConfig.metaJsonModels
    );

    return [...(metaModels || []), ...(metaJsonModels || [])];
  };

  const fetchAPI = React.useCallback(
    async (e) => {
      if (sourceModel && value?.length === 1 && value[0]?.title === 'SOURCE') {
        return [];
      } else if (
        isContext &&
        value?.length === 1 &&
        value[0]?.title === 'Built In Variables' &&
        type
      ) {
        return (isBPMN
          ? ['__date__', '__datetime__', '__studiouser__']
          : builtInVars
        ).map((ele) => ({ name: ele }));
      } else {
        let data;

        if (isProcessContext && !hasValue()) {
          data = await getProcessModelOptions();
        } else if (isContext && !hasValue()) {
          data = await getModels(e, undefined, [], true);
        } else {
          data = await fetchFields(getModel());
        }

        if (sourceModel && (!value || value.length < 1)) {
          const object = { ...sourceModel, title: 'SOURCE' };
          data = [object, ...data];
        }

        if (isContext && (!value || value.length < 1) && type) {
          const object = { title: 'Built In Variables' };
          data = [object, ...data];
        }

        if (isM2o && value && value.length > 0) {
          data = data.filter(
            (item) =>
              ['many_to_one', 'one_to_one'].includes(item.type.toLowerCase()) &&
              !excludedFields.includes(item.name)
          );
        }

        if (hasValue() || targetModel || sourceModel) {
          data = data.filter(
            (d) =>
              d.title === 'SOURCE' ||
              allowedTypes[dashToUnderScore(type)]?.includes(
                dashToUnderScore(d.type)
              ) ||
              dashToUnderScore(d.type) === dashToUnderScore(type) ||
              ['many_to_one', 'one_to_one'].includes(dashToUnderScore(d.type))
          );
        }
        return data;
      }
    },
    [
      sourceModel,
      value,
      type,
      isBPMN,
      builtInVars,
      isProcessContext,
      hasValue,
      getProcessModelOptions,
      getModels,
      fetchFields,
      getModel,
    ]
  );

  return (
    <div className={containerClassName}>
      <Selection
        title={translate(props.title)}
        isMulti={true}
        fetchAPI={fetchAPI}
        value={value}
        onChange={handleChange}
        renderValue={({ option = {} }) => {
          const lastIndex = value?.length - 1;
          const showArrow = lastIndex >= 0 && option?.trackKey !== lastIndex;
          return (
            <>
              <Badge bg="primary">
                <Box d="flex" alignItems="center" g={1}>
                  <Box as="span">{checkValue(option)}</Box>
                  <Box as="span" style={{ cursor: 'pointer' }}>
                    <MaterialIcon
                      icon="close"
                      fontSize="1rem"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChange(option, 'remove-option');
                      }}
                    />
                  </Box>
                </Box>
              </Badge>
              {showArrow && (
                <MaterialIcon icon="arrow_right_alt" fontSize={20} />
              )}
            </>
          );
        }}
        {...rest}
      />
    </div>
  );
}

export default MultiSelector;
