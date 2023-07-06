import React from 'react';
import Chip from '@material-ui/core/Chip';
import { makeStyles } from '@material-ui/core/styles';
import RightIcon from '@material-ui/icons/ArrowForward';

import Selection from './Selection';
import { fetchFields, getModels } from '../../services/api';
import { excludedFields, translate, dashToUnderScore } from '../../utils';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    listStyle: 'none',
    padding: theme.spacing(0.5),
    margin: 0,
  },
  chip: {
    margin: theme.spacing(0.5),
  },
  rightIcon: {
    width: '0.8em',
    height: '0.8em',
  },
  selectContainer: {
    width: '30%',
  },
}));

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

const builtInVars = [
  '__date__',
  '__time__',
  '__datetime__',
  '__user__',
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
      if (reason === 'remove-option') {
        const index = getIndex(value, newValue);
        if (index >= 0) {
          newValue.splice(index);
        }
      }
      onChange(newValue);
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
  return (
    <div className={containerClassName}>
      <Selection
        title={translate(props.title)}
        isMulti={true}
        fetchAPI={async (e) => {
          if (sourceModel && value && value[0]) {
            if (value[0].title === 'SOURCE') {
              return [];
            }
          }
          if (isContext && value && value[0] && value.length === 1 && type) {
            if (value[0].title === 'Built In Variables') {
              return (
                isBPMN ? ['__date__', '__datetime__', '__user__'] : builtInVars
              ).map((ele) => {
                return { name: ele };
              });
            }
          }
          let data =
            isProcessContext && !hasValue()
              ? await getProcessModelOptions()
              : isContext && !hasValue()
              ? await getModels(e, undefined, [], true)
              : await fetchFields(getModel());
          if (sourceModel && (!value || value.length < 1)) {
            const object = Object.assign({}, sourceModel, {
              title: `SOURCE`,
            });
            data = [object, ...data];
          }
          if (isContext && (!value || value.length < 1) && type) {
            const object = {
              title: `Built In Variables`,
            };
            data = [object, ...data];
          }
          if (isM2o && value && value.length > 0) {
            data = data.filter(
              (item) =>
                ['many_to_one', 'one_to_one'].includes(
                  item.type.toLowerCase()
                ) && !excludedFields.includes(item.name)
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
        }}
        value={value}
        onChange={handleChange}
        renderTags={(tags, getTagProps) => {
          return tags.map((tag, i) => (
            <React.Fragment key={i}>
              <Chip
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
