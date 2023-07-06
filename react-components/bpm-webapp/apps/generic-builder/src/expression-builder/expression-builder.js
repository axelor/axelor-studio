import React from 'react';
import classNames from 'classnames';
import Paper from '@material-ui/core/Paper';
import { makeStyles } from '@material-ui/core/styles';

import Editor from './editor';
import { Selection } from '../components';
import { getButtons, getMetaFields, getPackageFields } from '../services/api';
import { useMetaModelSearch } from './utils';
import { isBPMQuery } from '../utils';
import { ALLOWED_TYPES } from '../constants';

const useStyles = makeStyles(theme => ({
  container: {
    width: '100%',
  },
  flex: {
    display: 'flex',
  },
  paper: {
    margin: theme.spacing(1),
    padding: theme.spacing(3, 2),
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  hide: {
    display: 'none',
  },
  MuiAutocompleteRoot: {
    width: '50%',
    marginRight: '10px',
  },
}));

let id = 1;

const defaultRules = {
  id,
  parentId: -1,
  combinator: 'and',
  rules: [{}],
};

const defaultState = {
  rules: [defaultRules],
};

function ExpressionBuilder(props) {
  const {
    index,
    value,
    onChange,
    element,
    type,
    queryModel,
    isCondition,
    isPackage = false,
    isParameterShow,
    defaultModel,
    fetchModels,
    isAllowButtons = false,
    isBPMN,
    isMapper,
  } = props;
  const { metaModals, rules } = value || defaultState;
  const expression = 'GROOVY';
  const classes = useStyles();

  const update = React.useCallback(
    updater => {
      onChange(updater, index);
    },
    [onChange, index]
  );

  const setMetaModal = metaModals => {
    update(draft => {
      draft.metaModals = metaModals;
      draft.rules = [defaultRules];
    });
  };

  const setRules = React.useCallback(
    cb => update(draft => cb(draft.rules)),
    [update]
  );

  const handleGroupAdd = React.useCallback(
    function handleGroupAdd(parentId) {
      setRules(rules => {
        rules.push({
          id: (id = (rules ? rules.length : id) + 1),
          parentId,
          combinator: 'and',
          rules: [{ ...(defaultRules || {}), id, parentId }],
        });
      });
    },
    [setRules]
  );

  const handleGroupRemove = React.useCallback(
    function handleGroupRemove(id) {
      setRules(rules => {
        const index = rules.findIndex(r => r.id === id);
        rules.splice(index, 1);
      });
    },
    [setRules]
  );

  const handleRuleAdd = React.useCallback(
    function handleRuleAdd(editorId, rule = {}) {
      setRules(draft => {
        const editorIndex = draft.findIndex(i => i.id === editorId);
        draft[editorIndex].rules.push(rule);
      });
    },
    [setRules]
  );

  const handleRuleRemove = React.useCallback(
    function handleRuleRemove(editorId, index) {
      setRules(draft => {
        const editorIndex = draft.findIndex(i => i.id === editorId);
        draft[editorIndex].rules.splice(index, 1);
      });
    },
    [setRules]
  );

  const handleEditorChange = React.useCallback(
    function handleEditorChange({ name, value, values }, editor, index) {
      setRules(draft => {
        const editorIndex = draft.findIndex(i => i.id === editor.id);
        if (draft[editorIndex] && draft[editorIndex].rules[index]) {
          const apply = values => {
            Object.keys(values).forEach(key => {
              draft[editorIndex].rules[index][key] = values[key];
            });
          };
          apply({
            ...(values ? values : {}),
            ...(name ? { [name]: value } : {}),
            ...(['fieldName', 'operator'].includes(name)
              ? {
                  ...(name === 'fieldName' ? { operator: '' } : {}),
                  fieldValue: null,
                  fieldValue2: null,
                  isRelationalValue: null,
                  relatedValueFieldName: null,
                  relatedValueModal: null,
                }
              : {}),
          });
        } else {
          draft[editorIndex][name] = value;
        }
      });
    },
    [setRules]
  );

  const fetchMetaModels = useMetaModelSearch(
    element,
    isBPMQuery(type) || isMapper ? null : 'metaModel'
  );

  const fetchField = React.useCallback(async () => {
    const isQuery = isBPMQuery(type);
    if (isPackage && isQuery && queryModel) {
      const { fields } = (await getPackageFields(queryModel)) || {};
      return (
        fields &&
        fields.filter(a => {
          return (
            ALLOWED_TYPES.includes((a.type || '').toLowerCase()) &&
            (isQuery ? !a.json : true)
          );
        })
      );
    }
    let allFields = (await getMetaFields(metaModals, isQuery)) || [];
    if (metaModals && isAllowButtons) {
      const buttons = await getButtons([
        {
          model: metaModals.name,
          type: metaModals.type,
          modelFullName: `${metaModals.packageName}.${metaModals.name}`,
        },
      ]);
      allFields = [...(allFields || []), ...(buttons || [])];
    }

    return allFields.filter(a => {
      return (
        (isAllowButtons
          ? [...ALLOWED_TYPES, 'button', 'menu-item']
          : ALLOWED_TYPES
        ).includes((a.type || '').toLowerCase()) &&
        (isQuery ? !a.json : true) &&
        a.name
      );
    });
  }, [type, isPackage, queryModel, metaModals, isAllowButtons]);

  React.useEffect(() => {
    update(draft => {
      if ((draft.rules || []).length === 0) {
        draft.rules = [defaultRules];
      }
    });
  }, [update]);

  React.useEffect(() => {
    if (!defaultModel) return;
    update(draft => {
      draft.metaModals = defaultModel;
    });
  }, [defaultModel, update]);

  const getChildEditors = parentId =>
    rules && rules.filter(editor => editor.parentId === parentId);

  return (
    <div className={classes.container}>
      <Paper variant="outlined" className={classes.paper}>
        <div className={classes.content}>
          <div className={classes.flex}>
            {(isBPMQuery(type) ? (index === 0 ? true : false) : true) && (
              <Selection
                name="metaModal"
                title="Meta model"
                placeholder="meta model"
                fetchAPI={
                  fetchModels && !isBPMQuery(type)
                    ? fetchModels
                    : fetchMetaModels
                }
                className={classNames({
                  [classes.hide]:
                    (isCondition && isBPMQuery(type)) || isPackage,
                })}
                optionLabelKey="name"
                onChange={setMetaModal}
                value={metaModals}
                classes={{ root: classes.MuiAutocompleteRoot }}
                readOnly={
                  (queryModel && isBPMQuery(type)) || (isBPMN && defaultModel)
                    ? true
                    : false
                }
              />
            )}
          </div>
        </div>

        {((rules && rules.filter(e => e.parentId === -1)) || []).map(editor => (
          <Editor
            key={editor.id}
            type={type}
            element={element}
            expression={expression}
            editor={editor}
            isBPMN={isBPMN}
            isMapper={isMapper}
            onChange={handleEditorChange}
            getChildEditors={getChildEditors}
            getMetaFields={fetchField}
            isDisable={!Boolean(metaModals) && !isPackage}
            isCondition={isCondition}
            parentMetaModal={metaModals}
            onAddGroup={handleGroupAdd}
            onRemoveGroup={handleGroupRemove}
            onAddRule={handleRuleAdd}
            onRemoveRule={handleRuleRemove}
            isParameterShow={isParameterShow}
            fetchModels={fetchModels}
            isAllowButtons={isAllowButtons}
          />
        ))}
      </Paper>
    </div>
  );
}

export default React.memo(ExpressionBuilder);
