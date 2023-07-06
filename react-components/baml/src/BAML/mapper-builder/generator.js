import { VALUE_FROM, ModelType } from "./constant";
import { lowerCaseFirstLetter } from "./utils";

const getTarget = (element) => {
  if (element.target) {
    return element.target.split(".").pop();
  }
  if (element.targetModel) {
    return element.targetModel.split(".").pop();
  }
  return null;
};

const getModelFieldValue = (fields) => {
  let modelFieldText = "";
  if (fields) {
    fields.forEach((field) => {
      if (field.name) {
        const fieldName = lowerCaseFirstLetter(field.name);
        if (modelFieldText) {
          modelFieldText = `${modelFieldText}?.${fieldName}`;
        } else {
          modelFieldText = `${fieldName}`;
        }
      }
    });
  }
  return modelFieldText;
};

const getModelSubField = (subFields = []) => {
  return subFields.map((subField) => {
    return JSON.parse(
      JSON.stringify({
        name: subField.name,
        version: subField.version,
        type: subField.type,
        fullName: subField.fullName,
        modelType: subField.modelType,
        title: subField.title,
        targetJsonModel: subField.targetJsonModel,
        jsonModel: subField.jsonModel,
        targetModel: subField.targetModel,
        id: subField.id,
        target: subField.target,
      })
    );
  });
};

export function generateJson(data, currentJson, defaultFrom, sourceModel) {
  const jsonData = [];
  const getValue = (element) => {
    const { value, modelSubField } = element;
    const from = value ? value.from || defaultFrom : defaultFrom;
    let newValue = value?.selected;
    const modelFieldValue = getModelFieldValue(modelSubField);
    if (from === VALUE_FROM.CONTEXT) {
      if (modelFieldValue) {
        newValue = { value: modelFieldValue };
      } else {
        newValue = null;
      }
    }
    if (from === VALUE_FROM.SOURCE) {
      if (modelFieldValue) {
        const firstField = modelSubField[0];
        let sourceModelName = sourceModel?.fullName;
        let fieldName = firstField?.fullName;
        if (sourceModel.modelType === ModelType.CUSTOM) {
          sourceModelName = sourceModel?.name;
        }

        if (firstField.modelType === ModelType.CUSTOM) {
          fieldName = firstField?.name;
        }
        if (fieldName && sourceModelName && fieldName === sourceModelName) {
          newValue = { value: "SOURCE" };
        } else {
          newValue = { value: modelFieldValue };
        }
      } else {
        newValue = null;
      }
    }
    if (from === VALUE_FROM.SELF) {
      if (modelFieldValue) {
        const firstField = modelSubField[0];
        if (firstField && sourceModel?.fullName === firstField?.fullName) {
          newValue = { value: "SOURCE" };
        } else {
          newValue = { value: modelFieldValue };
        }
      } else {
        newValue = null;
      }
    }
    if (
      [VALUE_FROM.PARENT].includes(from) &&
      newValue?.value &&
      typeof newValue?.value === "object"
    ) {
      const contextKey = lowerCaseFirstLetter(newValue.value.name);
      if (!modelFieldValue) {
        newValue = { value: contextKey };
      } else {
        newValue = { value: `${contextKey}?.${modelFieldValue}` };
      }
    }
    return newValue || null;
  };
  data.forEach((element) => {
    let { value, dataPath, type } = element;
    let newValue = { ...value };
    const { fields } = newValue || {};
    const modelTarget = getTarget(element);
    const jsonTarget = element.jsonTarget;
    const jsonModel = element.jsonModel?.name;
    if (typeof fields === "object" && fields) {
      newValue.fields = generateJson(value.fields, currentJson);
    }

    newValue.selected = getValue(element);

    if (newValue && !newValue.from) {
      newValue.from = defaultFrom;
    }
    if (
      !element.isRemoved &&
      newValue.selected &&
      ![undefined, null].includes(newValue.selected.value)
    ) {
      const record = {
        dataPath,
        type,
        target: modelTarget || undefined,
        value: newValue,
        name: element.name,
        modelSubField: getModelSubField(element.modelSubField) || undefined,
        sourceField: element.sourceField || undefined,
        selfField: element.selfField || undefined,
      };
      if (type.toLowerCase() === "many-to-one") {
        record["jsonModel"] = jsonModel || undefined;
        if (!jsonModel && jsonTarget) {
          record["jsonModel"] = jsonTarget || undefined;
        }
      }
      if (type.toLowerCase() === "json-many-to-one") {
        record["target"] = element["targetJsonModel.name"];
      }
      jsonData.push(JSON.parse(JSON.stringify(record)));
    }
  });
  return jsonData;
}

export function getAssignmentJson(jsonData = []) {
  let object = {};
  jsonData.forEach((item) => {
    const { other, ...rest } = item;
    object = { ...object, ...rest };
  });
  return object;
}
