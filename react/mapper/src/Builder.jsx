import React from 'react';
import update from 'immutability-helper';
import IconButton from '@material-ui/core/IconButton';

import DataTable from './DataTable';
import { Selection, MultiSelection } from './components/form';
import { useMutableState } from './components/utils';
import {
  getModels,
  fetchFields,
  saveRecord,
  fetchRecord,
  fetchModelByName,
  generateScriptString,
  ModelType,
} from './services/api';
import {
  VALUE_FROM,
  excludeFields,
  translate,
  dashToUnderScore,
} from './utils';
import {
  getDefaultFrom,
  getSourceModelString,
  getBuilderField,
  getJSON,
  generateJson,
} from './Builder.utils';
import Loader from './components/Loader';
import DialogBox from './components/Dialog';
import { Box, InputLabel, Switch } from '@axelor/ui';
import { MaterialIcon } from '@axelor/ui/icons/material-icon';
import styles from './builder.module.css';

function isFieldInvalid(field) {
  const { from, selected, subFields } = field.value || {};
  if (
    [VALUE_FROM.NONE, VALUE_FROM.EXPRESSION, VALUE_FROM.QUERY].includes(from)
  ) {
    return (
      !selected ||
      !selected?.value ||
      (typeof selected?.value === 'string' && selected?.value?.trim() === '')
    );
  }
  if (
    [VALUE_FROM.CONTEXT, VALUE_FROM.SELF, VALUE_FROM.SOURCE].includes(
      field.value.from
    )
  ) {
    return (subFields || []).length === 0;
  }
}

function checkRequiredFields(builderFields, metaFields, newRecord) {
  if (!newRecord) {
    return;
  }
  const $builderFields = builderFields
    .filter((item) => item.required)
    .map((item) => item.name);

  return metaFields
    .filter((item) => item.required && !$builderFields.includes(item.name))
    .map((x) => x.title || x.name)
    .join(',');
}

function checkInvalidFields(builderFields) {
  const requiredFields = builderFields.filter((item) => item.required);
  if (requiredFields.length === 0) {
    return;
  }
  const arr = requiredFields.filter((metaItem) => {
    const validItem = builderFields.find(
      (f) => f.name === metaItem.name && !isFieldInvalid(f)
    );
    return !validItem;
  });
  let uniqueNames = [];
  arr.filter((ele) => {
    if (!uniqueNames.includes(ele.name || ele.title)) {
      uniqueNames.push(ele.name || ele.title);
    }
    return uniqueNames;
  });
  return uniqueNames.map((x) => x).join(',');
}

function checkInvalidSubfields(builderFields) {
  return builderFields
    .filter((field) => {
      const { subFields = [] } = field.value;
      const data = subFields && subFields[subFields.length - 1];
      const { target, fullName, name, type, jsonTarget, targetModel } =
        data || {};

      // ignore variables
      if (
        subFields &&
        (subFields.length === 0 ||
          Object.values(VAR_TYPES)?.includes(subFields[0]?.type))
      ) {
        return false;
      }
      // relational fields type validation
      else if (
        type &&
        dashToUnderScore(field.type) !== dashToUnderScore(type) &&
        !['metaJsonModel', 'metaModel'].includes(type)
      ) {
        return true;
      }
      // custom model relational fields
      else if (field?.jsonTarget) {
        if (jsonTarget) {
          return field.jsonTarget !== jsonTarget;
        }
        if (data['targetJsonModel.name']) {
          return field.jsonTarget !== data['targetJsonModel.name'];
        }
        return field.jsonTarget !== name;
      }
      // metaJson model relational fields
      else if (field['targetJsonModel.name'] || field?.targetModel) {
        if (field['targetJsonModel.name']) {
          return (
            field['targetJsonModel.name'] !==
            (data['targetJsonModel.name'] || jsonTarget || name)
          );
        }
        return field.targetModel !== (targetModel || target || fullName);
      }
      // meta model relational fields
      else if (field?.target) {
        if (jsonTarget) {
          return field.name !== (jsonTarget || name);
        }
        return field.target !== (target || fullName || targetModel);
      }
      // simple widget type validation
      else return dashToUnderScore(field.type) !== dashToUnderScore(type);
    })
    .map((f) => f.title || f.name)
    .join(', ');
}
const alert = (msg) => {
  const dialogs = window.axelor?.dialogs || window.top.axelor?.dialogs;
  if (dialogs) {
    const showMsg = dialogs.error({ content: msg });
    return showMsg();
  }
  return window.alert(msg);
};

const alertUser = (event) => {
  event.preventDefault();
  event.returnValue = translate('Are you sure you want to close the tab?');
};

function Builder({
  params,
  isBPMN,
  open,
  handleClose,
  isDialog,
  onSave,
  getProcesses,
  getProcessElement,
  isDMNAllow,
  getDMNValues,
  isBAML
}) {
  const [loading, setLoading] = React.useState(false);
  const [builderRecord, setBuilderRecord] = React.useState({});

  const [model, setModel] = React.useState(null);
  const [metaFields, setMetaFields] = React.useState([]); // model fields
  const [builderFields, setBuilderFields] = useMutableState([]);
  const [sourceModel, setSourceModel] = React.useState(null);
  const [sourceModelList, setSourceModelList] = React.useState([]);

  const [newRecord, setNewRecord] = React.useState(false);
  const [savedRecord, setSavedRecord] = React.useState(false);
  const [save, setSave] = React.useState(true);

  const [createVariable, setCreateVariable] = React.useState(false);
  const [modelFrom, setModelFrom] = React.useState({
    title: translate('Context'),
    id: VALUE_FROM.CONTEXT,
  });
  const [processId, setProcessId] = React.useState(null);

  // add rows
  const handleAdd = React.useCallback(
    (fields = []) => {
      setBuilderFields((list) => {
        return [
          ...list,
          ...fields.map((field) => getBuilderField(field, sourceModel)),
        ];
      });
    },
    [setBuilderFields, sourceModel]
  );

  // remove row
  const handleRemove = React.useCallback(
    (row, index) => {
      setBuilderFields((fields) => {
        fields.splice(index, 1);
      });
    },
    [setBuilderFields]
  );

  // update editor values
  const handleChange = React.useCallback(
    (e, key, value, rowIndex) => {
      setBuilderFields((fields) => {
        if (!fields?.length) return;
        function set(key, value) {
          [
            'condition',
            'conditionMeta',
            'dmn',
            'processId',
            'searchField',
          ].includes(key)
            ? (fields[rowIndex][key] = value)
            : (fields[rowIndex].value[key] = value);
        }

        set(key, value);
        if (key === 'from') {
          set('subFields', []);
          set('selected', null);
          set('query', null);
          set('searchField', null);
          set('dmn', null);
          set('processId', null);
        }
        if (['dmn', 'processId'].includes(key)) {
          set('selected', null);
          set('subFields', []);
          set('searchField', null);
        }
      });
    },
    [setBuilderFields]
  );

  const handleReorder = React.useCallback(
    (dragIndex, hoverIndex) => {
      setBuilderFields((items) => {
        const dragItem = items[dragIndex];
        return update(items, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragItem],
          ],
        });
      });
    },
    [setBuilderFields]
  );

  const getJSONQuery = React.useCallback(() => {
    const { resultMetaField } = params;
    const currentJson = getJSON(builderRecord, resultMetaField);

    const jsonFields = generateJson(
      builderFields,
      currentJson,
      getDefaultFrom(sourceModel),
      sourceModel
    );
    const json = {
      fields: jsonFields,
      targetModel: model?.name,
      sourceModel: getSourceModelString(sourceModelList),
      sourceModelList,
      newRecord,
      savedRecord,
      save,
      isJson: model?.modelType === ModelType.CUSTOM,
      createVariable,
      processId: processId?.name,
      modelFrom,
    };
    return JSON.stringify({ ...json });
  }, [
    builderFields,
    builderRecord,
    createVariable,
    newRecord,
    savedRecord,
    save,
    modelFrom,
    params,
    model,
    processId,
    sourceModel,
    sourceModelList,
  ]);

  // save
  const handleSave = React.useCallback(async () => {
    const requiredItems = checkRequiredFields(
      builderFields,
      metaFields,
      newRecord
    );

    if (requiredItems) {
      return alert(
        translate(`Please select required field {0}`, requiredItems)
      );
    }

    const invalidItems = checkInvalidFields(builderFields);

    if (invalidItems) {
      return alert(
        translate(`Please provide required field {0}`, invalidItems)
      );
    }

    const invalidTypes = checkInvalidSubfields(builderFields);

    if (invalidTypes) {
      return alert(translate(`Invalid subfields for {0}`, invalidTypes));
    }

    // check when source model is empty and source type is selected in fields
    const invalidSourceField =
      !sourceModel &&
      builderFields.some((field) => field?.value.from === VALUE_FROM.SOURCE);

    if (invalidSourceField) {
      return alert(translate('Source model is required'));
    }

    setLoading(true);

    try {
      const jsonQuery = getJSONQuery();
      let _model = params.model;
      if (!_model) {
        if (model?.modelType === ModelType.CUSTOM) {
          _model = 'com.axelor.meta.db.MetaJsonRecord';
        } else {
          _model = model?.fullName;
        }
      }
      const scriptString = await generateScriptString(jsonQuery, _model);
      const expressionQuery = scriptString || '';
      const record = {
        ...builderRecord,
        [params.resultMetaField]: jsonQuery,
        [params.resultField]: expressionQuery,
        [params.targetField]: model?.name,
        [params.sourceField]: getSourceModelString(sourceModelList),
      };
      onSave &&
        onSave({ resultField: scriptString, resultMetaField: jsonQuery ,sourceField:record[params.sourceField],targetField:model?.name});
      if (!params?.model) return;
      const result = await saveRecord(params, record);
      if (result) {
        setBuilderRecord({ ...result });
      } else {
        console.error('Failed to save builder data');
      }
    } finally {
      setLoading(false);
    }
  }, [
    builderFields,
    params,
    model,
    builderRecord,
    sourceModel,
    newRecord,
    sourceModelList,
    metaFields,
    onSave,
    getJSONQuery,
  ]);

  const handleSourceModelChange = (e) => {
    const list = (e || []).map((item) => {
      if (!item.fullName && item.target) {
        return { ...item, fullName: item.target };
      }
      return item;
    });
    const sourceModel = list[list.length - 1];
    setSourceModelList([...list]);
    setSourceModel(sourceModel);

    // update fields on sourceModel change
    setBuilderFields((fields) => {
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        const { from, selected, subFields } = field?.value || {};
        if (!sourceModel && from === VALUE_FROM.SOURCE) {
          field.value.from = VALUE_FROM.NONE;
        }
        if (from === VALUE_FROM.SOURCE) {
          field.value.subFields = [];
          field.value.selected = null;
        }
        if (
          sourceModel &&
          (([VALUE_FROM.NONE, VALUE_FROM.EXPRESSION, VALUE_FROM.QUERY].includes(
            from
          ) &&
            !selected?.value) ||
            ([VALUE_FROM.CONTEXT, VALUE_FROM.SELF].includes(from) &&
              (subFields || []).length === 0))
        ) {
          field.value.from = VALUE_FROM.SOURCE;
        }
      }
    });
  };

  // clear
  const handleModalForm = () => {
    setSourceModelList([]);
    setSourceModel(null);
    setBuilderFields((fields) => {
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        const { from } = field?.value || {};
        if (from === VALUE_FROM.SOURCE) {
          field.value.from = VALUE_FROM.NONE;
          field.value.selected = null;
          field.value.subFields = [];
        }
      }
    });
  };

  // fetch fields on model change
  React.useEffect(() => {
    if (model) {
      (async () => {
        const data = await fetchFields(model);
        setMetaFields(data);
      })();
    }
  }, [model, setBuilderFields]);

  React.useEffect(() => {
    (async () => {
      if (params) {
        try {
          setLoading(true);
          const result = isBPMN || isBAML
              ? true
              : await fetchRecord(params.model, params.id);
          if (result) {
            !isBPMN && setBuilderRecord(result);
            const jsonData = isBPMN || isBAML
                ? getJSON(params, 'resultMetaField')
                : getJSON(result, params.resultMetaField);
            if (jsonData) {
              const {
                fields = [],
                newRecord = false,
                savedRecord = false,
                createVariable = false,
                save = true,
                targetModel,
                processId,
                modelFrom,
                sourceModelList = [],
              } = jsonData;

              const lastSourceModel =
                sourceModelList.length > 0
                  ? sourceModelList[sourceModelList.length - 1] || {}
                  : {};
              const sourceModelName = lastSourceModel.target
                ? lastSourceModel.target.split('.').pop()
                : lastSourceModel.name;

              const modelResult = await fetchModelByName(targetModel);
              const sourceModelResult = await fetchModelByName(sourceModelName);
              const metaFields = await fetchFields(modelResult);

              setSourceModelList([...sourceModelList]);
              setModel(modelResult);
              setSourceModel(sourceModelResult);
              setNewRecord(newRecord);
              setSavedRecord(savedRecord);
              setSave(save);
              setCreateVariable(createVariable);
              if (processId) {
                setProcessId({ name: processId });
              } else {
                setProcessId(null);
              }
              setModelFrom(
                modelFrom || {
                  title: translate('Context'),
                  id: VALUE_FROM.CONTEXT,
                }
              );
              setBuilderFields(
                fields.map((field) => {
                  const metaField = metaFields.find(
                    (f) => f.name === field.name
                  );
                  let result = {
                    ...getBuilderField(field),
                    ...field,
                    ...metaField,
                  };
                  if (field?.processId) {
                    result['processId'] = { name: field?.processId };
                  }
                  return result;
                })
              );
            }
          } else {
            console.error('Record is not available');
          }
        } finally {
          setLoading(false);
        }
      }
    })();
  }, [params, setBuilderFields, isBPMN]);

  React.useEffect(() => {
    window.top && window.top.addEventListener('beforeunload', alertUser);
    return () => {
      window.top && window.top.removeEventListener('beforeunload', alertUser);
    };
  });

  React.useEffect(() => {
    const scope =
      window.top &&
      window.top.angular &&
      window.top.angular
        .element(
          window.top.document.querySelector(
            '[ng-repeat="tab in navTabs"][class="ng-scope active"] [ng-click="closeTab(tab)"]'
          )
        )
        .scope();
    if (!scope) return;
    scope.tab.$viewScope.confirmDirty = async function (
      callback,
      cancelCallback
    ) {
      try {
        const jsonQuery = getJSONQuery();
        const { scriptMeta } = builderRecord;
        const isDirty = jsonQuery !== scriptMeta;
        if (!isDirty) {
          return callback && callback();
        } else {
          window.top.axelor.dialogs.confirm(
            window.top._t(
              'Current changes will be lost. Do you really want to proceed?'
            ),
            function (confirmed) {
              if (!confirmed) {
                return cancelCallback && cancelCallback();
              }
              return callback && callback();
            }
          );
        }
      } catch (error) {
        console.error(error);
      }
    };
  }, [builderRecord, getJSONQuery]);

  const SwitchBox = ({ label, checked, onChange }) => (
    <Box d="flex" alignItems="center" gap={5}>
      <Switch
        size="lg"
        fontSize={5}
        checked={checked}
        color="primary"
        onChange={onChange}
        id={label}
      />
      <InputLabel color="body" htmlFor={label} className={styles.switchText}>
        {translate(label)}
      </InputLabel>
    </Box>
  );

  const handleRemoveTag = (option) => {
    const optionIndex = sourceModelList?.findIndex(
      (s) => s.name === option?.name
    );
    setSourceModelList((sourceModelList) =>
      sourceModelList.splice(0, optionIndex)
    );
  };

  function UI() {
    return (
      <Box w={100} h={100} overflow="hidden">
        <Box className={styles.topView}>
          <Box style={{ marginBottom: 10 }}>
            <Box d="flex" flexWrap="wrap" alignItems="center">
              {!isBPMN &&  !isBAML && (
                <IconButton
                  classes={{ colorPrimary: styles.saveIcon }}
                  color="primary"
                  onClick={handleSave}
                  className={classNames(styles.iconButtonClassName)}
                  disabled={!model}
                >
                  <MaterialIcon icon="save" fontSize={20} />
                </IconButton>
              )}
              <Selection
                className={styles.input}
                name="metaModal"
                title="Target model"
                placeholder="Target model"
                fetchAPI={(e) => getModels(e)}
                optionValueKey="name"
                onChange={(model) => {
                  setModel(model);
                  setBuilderFields([]);
                }}
                value={model}
                inputRootClass={styles.targetModelInputRoot}
              />
              {!isBPMN && (
                <MultiSelection
                  containerClassName={styles.selectContainer}
                  title="Source model"
                  optionValueKey="name"
                  optionLabelKey="title"
                  concatValue={true}
                  isM2o={true}
                  isContext={true}
                  value={sourceModelList}
                  onChange={handleSourceModelChange}
                  handleRemove={(option) => handleRemoveTag(option)}
                />
              )}
              <Box
                d="flex"
                alignItems="center"
                justifyContent="space-between"
                flexWrap="wrap"
              >
                <SwitchBox
                  label={translate('New record')}
                  checked={newRecord}
                  onChange={(e) => {
                    const newRecord = e.target.checked;
                    setNewRecord(newRecord);
                    if (newRecord) {
                      setSave(true);
                      setSavedRecord(false);
                    } else {
                      if (!savedRecord) {
                        setSave(false);
                      }
                    }
                  }}
                />
                <SwitchBox
                  label={translate('Update saved record')}
                  checked={savedRecord}
                  onChange={(e) => {
                    const savedRecord = e.target.checked;
                    setSavedRecord(savedRecord);
                    if (savedRecord) {
                      setSave(true);
                      setNewRecord(false);
                    } else {
                      if (!newRecord) {
                        setSave(false);
                      }
                    }
                  }}
                />
                <SwitchBox
                  label={translate('Save')}
                  checked={save}
                  onChange={(e) => {
                    const save = e.target.checked;
                    if (!save && (savedRecord || newRecord)) {
                      return;
                    }
                    setSave(save);
                  }}
                />
                {isBPMN && (
                  <SwitchBox
                    label={translate('Create variable')}
                    checked={createVariable}
                    onChange={(e) => setCreateVariable(e.target.checked)}
                  />
                )}
              </Box>
            </Box>
            {isBPMN && (
              <Box
                d="flex"
                w={100}
                style={{ marginTop: 10, alignItems: 'flex-end' }}
              >
                <Selection
                  disableClearable
                  className={styles.input}
                  options={[
                    { title: translate('Context'), id: VALUE_FROM.CONTEXT },
                    { title: translate('Process'), id: VALUE_FROM.PROCESS },
                  ]}
                  value={modelFrom || {}}
                  title="Model from"
                  onChange={(e) => {
                    setProcessId(null);
                    setModelFrom(e);
                    handleModalForm();
                  }}
                />
                {modelFrom?.id === VALUE_FROM.CONTEXT ? (
                  <MultiSelection
                    containerClassName={styles.selectContainerBPMN}
                    title="Source model"
                    optionValueKey="name"
                    optionLabelKey="title"
                    concatValue={true}
                    isM2o={true}
                    isContext={true}
                    isBPMN={true}
                    value={sourceModelList}
                    onChange={handleSourceModelChange}
                    handleRemove={(option) => handleRemoveTag(option)}
                  />
                ) : (
                  <Box d="flex" alignItems="center">
                    <Selection
                      optionValueKey="name"
                      optionLabelKey="title"
                      concatValue={true}
                      title="Process id"
                      className={styles.process}
                      options={getProcesses()}
                      value={processId}
                      isProcessContext={true}
                      onChange={(e) => {
                        setProcessId(e);
                        handleModalForm();
                      }}
                    />

                    {processId && (
                      <React.Fragment>
                        <MultiSelection
                          optionValueKey="name"
                          optionLabelKey="title"
                          concatValue={true}
                          isProcessContext={true}
                          value={sourceModelList}
                          element={getProcessElement(processId)}
                          onChange={handleSourceModelChange}
                          handleRemove={(option) => handleRemoveTag(option)}
                        />
                      </React.Fragment>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>
        <DataTable
          data={builderFields}
          metaFields={metaFields}
          sourceModel={sourceModel}
          targetModel={model}
          newRecord={newRecord}
          onRowAdd={handleAdd}
          onRowChange={handleChange}
          onRemove={handleRemove}
          onReorder={handleReorder}
          isBPMN={isBPMN}
          getProcesses={getProcesses}
          getProcessElement={getProcessElement}
          isDMNAllow={isDMNAllow}
          getDMNValues={getDMNValues}
        />
      </Box>
    );
  }
  return (
    <>
      {isDialog ? (
        <DialogBox
          open={open}
          handleSave={handleSave}
          handleClose={handleClose}
        >
          {UI()}
        </DialogBox>
      ) : (
        UI()
      )}
      {loading && <Loader />}
    </>
  );
}

export default Builder;
