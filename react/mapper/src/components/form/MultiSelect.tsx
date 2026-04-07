import React from "react";
import { Badge, Box } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { Selection } from "@studio/shared/components";
import { fetchFields, getModels } from "@studio/shared/services";

import { getCustomVariables } from "../../services/mapper-service";
import { excludedFields, translate, dashToUnderScore } from "../../utils";
import type {  ModelRecord } from "../../utils";
import { VAR_OPTIONS, VAR_TYPES } from "../../constants";

interface ProcessConfigResult {
  metaModels: Array<Record<string, unknown>>;
  metaJsonModels: Array<Record<string, unknown>>;
}

const getProcessConfig = (
  element: Record<string, unknown> | undefined,
): ProcessConfigResult | null => {
  const extensionElements = element && (element.extensionElements as Record<string, unknown>);
  const noOptions = [
    {
      fieldName: "name",
      operator: "IN",
      value: [""],
    },
  ];
  if (!extensionElements || !extensionElements.values) {
    return { metaModels: noOptions, metaJsonModels: noOptions };
  }

  const processConfigurations = (extensionElements.values as Array<Record<string, unknown>>).find(
    (e) => e.$type === "camunda:ProcessConfiguration",
  );
  const metaModels: string[] = [];
  const metaJsonModels: string[] = [];

  if (
    !processConfigurations ||
    !processConfigurations.processConfigurationParameters
  ) {
    return { metaModels: noOptions, metaJsonModels: noOptions };
  }
  (processConfigurations.processConfigurationParameters as Array<Record<string, unknown>>).forEach(
    (config) => {
      if (config.metaModel) {
        metaModels.push(config.metaModel as string);
      } else if (config.metaJsonModel) {
        metaJsonModels.push(config.metaJsonModel as string);
      }
    },
  );
  return {
    metaModels: [
      {
        fieldName: "name",
        operator: "IN",
        value: metaModels && metaModels.length > 0 ? metaModels : [""],
      },
    ],
    metaJsonModels: [
      {
        fieldName: "name",
        operator: "IN",
        value: metaJsonModels && metaJsonModels.length > 0 ? metaJsonModels : [""],
      },
    ],
  };
};

const getKey = (key: string): string => (key === "_selectId" ? "id" : key);

const builtInVars = [
  "__date__",
  "__time__",
  "__datetime__",
  "__studiouser__",
  "__this__",
  "__self__",
  "__parent__",
  "__id__",
];

const allowedTypes: Record<string, string[]> = {
  decimal: ["decimal", "integer"],
  text: ["text", "string"],
};

interface MultiSelectorProps {
  sourceModel?: ModelRecord | null;
  value?: unknown[];
  onChange: (value: unknown) => void;
  parentRow?: Record<string, unknown>;
  targetModel?: ModelRecord | null;
  isContext?: boolean;
  isM2o?: boolean;
  containerClassName?: string;
  isBPMN?: boolean;
  element?: Record<string, unknown>;
  isProcessContext?: boolean;
  type?: string;
  handleRemove?: (option: unknown) => void;
  title?: string;
  optionValueKey?: string;
  optionLabelKey?: string;
  concatValue?: boolean;
  name?: string;
  error?: unknown;
  [key: string]: unknown;
}

function MultiSelector(props: MultiSelectorProps) {
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
    _handleRemove = () => {},
    error,
    ...rest
  } = props;

  const getModel = (): Record<string, unknown> | undefined => {
    if (Array.isArray(value) && value.length) {
      const list = (value as Record<string, unknown>[]).filter((e) => e.name);
      const record = list[list.length - 1];
      if ((isContext || isProcessContext) && list.length - 1 === 0) {
        return record;
      }
      if (record.model === "com.axelor.meta.db.MetaJsonRecord" && record.targetModel) {
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
    (newValue: unknown, reason?: string) => {
      let changeValue = newValue;
      if (reason === "remove-option") {
        const index = (value as Record<string, unknown>[])?.findIndex(
          (val) => val.trackKey === (newValue as Record<string, unknown>).trackKey,
        );
        if (index >= 0) {
          changeValue = [...((value as Record<string, unknown>[]) || [])].splice(0, index);
        }
      }
      onChange(changeValue);
    },
    [value, onChange],
  );

  const hasValue = () => Array.isArray(value) && value.length;
  const checkValue = (option: Record<string, unknown>): string => {
    const { optionLabelKey, optionValueKey, concatValue, name } = rest;
    return (option && option.type) === "metaJsonModel"
      ? `${
          option && option[getKey(optionLabelKey as string)]
            ? option[getKey(optionLabelKey as string)]
            : ""
        } (${translate("Custom model")})` || ""
      : name === "fieldName"
        ? `${translate(option && option["title"] ? (option["title"] as string) : "")} (${
            option && option[getKey(optionLabelKey as string)]
          })`
        : option
          ? option[getKey(optionLabelKey as string)] &&
            concatValue &&
            option[getKey(optionValueKey as string)]
            ? `${option[getKey(optionLabelKey as string)] || option[getKey(optionValueKey as string)]}`
            : option[getKey(optionLabelKey as string)]
              ? (option[getKey(optionLabelKey as string)] as string)
              : option["name"]
                ? (option["name"] as string)
                : option["id"]
                  ? (option["id"] as { toString(): string }).toString()
                  : ""
          : "";
  };

  const getProcessModelOptions = async () => {
    const processConfig = getProcessConfig(element);
    if (!processConfig) return [];
    const metaModels = await getModels(
      processConfig.metaModels[0] ?? {},
      "metaModel",
      processConfig.metaModels,
    );
    const metaJsonModels = await getModels(
      processConfig.metaJsonModels[0] ?? {},
      "metaJsonModel",
      processConfig.metaJsonModels,
    );

    return [...(metaModels || []), ...(metaJsonModels || [])];
  };

  const fetchAPI = React.useCallback(
    async (e?: unknown): Promise<Record<string, unknown>[]> => {
      if (
        sourceModel &&
        (value as Record<string, unknown>[])?.length === 1 &&
        (value as Record<string, unknown>[])[0]?.title === "SOURCE"
      ) {
        return [];
      } else if (isContext && (value as Record<string, unknown>[])?.length === 1 && type) {
        if ((value as Record<string, unknown>[])[0]?.type === VAR_TYPES.BUILT_IN) {
          return (isBPMN ? ["__date__", "__datetime__", "__studiouser__"] : builtInVars).map(
            (ele) => ({ name: ele }),
          );
        } else if ((value as Record<string, unknown>[])[0]?.type === VAR_TYPES.CUSTOM) {
          return await getCustomVariables();
        }
        return [];
      } else {
        let data: Record<string, unknown>[];

        if (isProcessContext && !hasValue()) {
          data = await getProcessModelOptions();
        } else if (isContext && !hasValue()) {
          data = await getModels(e as Record<string, unknown> | undefined, undefined, [], true);
        } else {
          data = await fetchFields(getModel() as Record<string, unknown>);
        }

        if (sourceModel && (!value || (value).length < 1)) {
          const object = { ...sourceModel, title: "SOURCE" };
          data = [object, ...data];
        }

        if (isContext && (!value || (value).length < 1) && type) {
          data = [...VAR_OPTIONS, ...data];
        }

        if (isM2o && value && (value).length > 0) {
          data = data.filter(
            (item) =>
              ["many_to_one", "one_to_one"].includes((item.type as string).toLowerCase()) &&
              !excludedFields.includes(item.name as string),
          );
        }

        if (hasValue() || targetModel || sourceModel) {
          data = data.filter(
            (d) =>
              d.title === "SOURCE" ||
              allowedTypes[dashToUnderScore(type)]?.includes(dashToUnderScore(d.type as string)) ||
              dashToUnderScore(d.type as string) === dashToUnderScore(type) ||
              ["many_to_one", "one_to_one"].includes(dashToUnderScore(d.type as string)),
          );
        }
        return data;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sourceModel, value, type, isBPMN, isProcessContext, isContext, isM2o, targetModel, element],
  );

  return (
    <div className={containerClassName}>
      <Selection
        title={translate(props.title || "")}
        isMulti={true}
        fetchAPI={fetchAPI}
        value={value}
        onChange={handleChange}
        renderValue={({ option = {} }: { option?: Record<string, unknown> }) => {
          const lastIndex = (value as Record<string, unknown>[])?.length - 1;
          const showArrow = lastIndex >= 0 && option?.trackKey !== lastIndex;
          return (
            <>
              <Badge bg="primary">
                <Box d="flex" alignItems="center" g={1}>
                  <Box as="span">{checkValue(option)}</Box>
                  <Box as="span" style={{ cursor: "pointer" }}>
                    <MaterialIcon
                      icon="close"
                      fontSize="1rem"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleChange(option, "remove-option");
                      }}
                    />
                  </Box>
                </Box>
              </Badge>
              {showArrow && <MaterialIcon icon="arrow_right_alt" fontSize={20} />}
            </>
          );
        }}
        error={!!error}
        {...rest}
      />
    </div>
  );
}

export default MultiSelector;
