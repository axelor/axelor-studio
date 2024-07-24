import React, { useState, useEffect } from 'react';
import IconButton from '@material-ui/core/IconButton';

import produce from 'immer';
import moment from 'moment';
import { flattenDeep, isEmpty } from 'lodash';

import ExpressionComponent from './expression-builder';
import { Timeline, Button, Select } from '../components';
import {
  COMBINATOR as COMBINATORS,
  MAP_OPERATOR,
  JOIN_OPERATOR,
  DATE_FORMAT,
  MAP_COMBINATOR,
  MAP_BPM_COMBINATOR,
  POSITIVE_OPERATORS,
  MANY_TO_ONE_TYPES,
  RELATIONAL_TYPES,
} from '../constants';
import {
  isBPMQuery,
  lowerCaseFirstLetter,
  jsStringEscape,
  upperCaseFirstLetter,
  translate,
} from '../utils';
import { getRecord, getModels, saveRecord } from '../services/api';
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter,
  Box,
  Input,
  InputLabel,
  ThemeProvider,
} from '@axelor/ui';
import { MaterialIcon } from '@axelor/ui/icons/material-icon';
import styles from './index.module.css';
import { useAppTheme } from '../theme/hooks/useAopTheme';

let paramCount = 0;
let count = 0;

function ExpressionBuilder({
  parameters,
  onSave,
  exprVal,
  dialogActionButton,
  isBPMN = false,
  setProperty,
  getExpression,
  close,
  defaultModel,
  fetchModels,
  isAllowButtons = false,
  isMapper,
  isBamlQuery
}) {
  const {
    type: parentType = 'expressionBuilder',
    id,
    model,
    resultField,
    resultMetaField,
    modelFilter,
    queryModel,
    withParam,
    isCondition,
    isPackage,
    isParameterShow = true,
  } = parameters || {};
  const expression = isBPMQuery(parentType) ? 'BPM' : 'GROOVY';
  const [combinator, setCombinator] = useState('and');
  const [record, setRecord] = useState(null);
  const [openAlert, setAlert] = useState(false);
  const [defaultExpressionValue, setDefaultExpressionValue] = useState(null);
  const [expressionComponents, setExpressionComponents] = useState([{}]);
  const [singleResult, setSingleResult] = useState(false);
  const [generateWithId, setGenerateWithId] = useState(false);

  function onAddExpressionEditor() {
    setExpressionComponents(
      produce(draft => {
        draft.push({
          value: isBPMQuery(parentType)
            ? queryModel && defaultExpressionValue
              ? defaultExpressionValue
              : {
                metaModals:
                  expressionComponents &&
                  expressionComponents[0] &&
                  expressionComponents[0].value &&
                  expressionComponents[0].value.metaModals,
                rules: [
                  {
                    id: 0,
                    parentId: -1,
                    combinator: 'and',
                    rules: [{}],
                  },
                ],
              }
            : undefined,
        });
      })
    );
  }

  function onRemoveExpressionEditor(index) {
    setExpressionComponents(
      produce(draft => {
        draft.splice(index, 1);
      })
    );
  }

  function getRelationalCondition(
    rule,
    initValue = '',
    isParent = false,
    prefix
  ) {
    const map_operators =
      MAP_OPERATOR[isBPMQuery(parentType) ? 'BPM' : expression];
    const { fieldName: propFieldName, operator, allField } = rule;
    let {
      fieldValue,
      fieldValue2,
      isRelationalValue,
      relatedValueFieldName,
      relatedValueModal,
      relatedElseValueFieldName,
      relatedElseValueModal,
      parent,
      nameField,
    } = rule;
    let fieldName = propFieldName;
    const values =
      fieldName &&
      fieldName
        .split(JOIN_OPERATOR[isBPMQuery(parentType) ? 'BPM' : expression])
        .filter(f => f !== '');

    const fName = values[0];
    const field = allField.find(f => f.name === fName);
    const { targetName, selectionList, nameField: nameColumn } = field || {};
    const type =
      field && field.type && field.type.toLowerCase().replaceAll('-', '_');
    const typeName = field && field.typeName;
    const nestedFields = (values && values.splice(1)) || [];
    if (
      [
        'many_to_many',
        'one_to_many',
        'json_many_to_many',
        'json_one_to_many',
      ].includes(type)
    ) {
      const findRelational = initValue.match(/\$\$/g);
      if (findRelational && findRelational.length > 0) {
        const str =
          nestedFields.length >= 1
            ? `${fName}.find{it->it.$$$$}${POSITIVE_OPERATORS.includes(operator) ? ' != null' : ' == null'
            }`
            : `${fName}.${nestedFields.length > 0 ? 'find' : 'collect'
            }{it->it$$$$}${nestedFields.length > 0
              ? POSITIVE_OPERATORS.includes(operator)
                ? ' != null'
                : ' == null'
              : ''
            }`;
        initValue = initValue.replace(/\$\$/g, str);
      } else {
        const str =
          nestedFields.length >= 1
            ? `${fName}.find{it->it.$$}${POSITIVE_OPERATORS.includes(operator) ? ' != null' : ' == null'
            }`
            : `${fName}.${nestedFields.length > 0 ? 'find' : 'collect'
            }{it->it$$}${nestedFields.length > 0
              ? POSITIVE_OPERATORS.includes(operator)
                ? ' != null'
                : ' == null'
              : ''
            }`;
        initValue += str;
      }
      const nestedFieldName = nestedFields.join(JOIN_OPERATOR[expression]);
      return getRelationalCondition(
        {
          fieldName: nestedFieldName,
          operator,
          allField,
          fieldValue,
          fieldValue2,
          isRelationalValue,
          relatedValueFieldName,
          relatedValueModal,
          relatedElseValueFieldName,
          relatedElseValueModal,
          parent: values && values[0],
          nameField: nameColumn || nameField,
        },
        initValue,
        nestedFields.length > 1,
        prefix
      );
    } else if (
      [
        'json_many_to_one',
        'json_one_to_one',
        'many_to_one',
        'one_to_one',
      ].includes(type)
    ) {
      const nestedFieldName = nestedFields.join(JOIN_OPERATOR[expression]);
      const findRelational = initValue.match(/\$\$/g);
      const str =
        nestedFields.length >= 1
          ? `${fName}${JOIN_OPERATOR[expression]}`
          : fName;
      if (findRelational && findRelational.length > 0) {
        initValue = initValue.replace(/\$\$/g, `${str}$$$$`);
      } else {
        initValue += `${str}$$`;
      }
      return getRelationalCondition(
        {
          fieldName: nestedFieldName,
          operator,
          allField,
          fieldValue,
          fieldValue2,
          isRelationalValue,
          relatedValueFieldName,
          relatedValueModal,
          relatedElseValueFieldName,
          relatedElseValueModal,
          nameField: nameColumn || nameField,
          parent: values && values[0],
        },
        initValue,
        nestedFields.length > 1,
        prefix
      );
    } else {
      const isNumber = [
        'integer',
        'decimal',
        'boolean',
        'long',
        'double',
        'button',
        'menu-item',
      ].includes(type);
      const isDateTime = ['date', 'time', 'datetime'].includes(type);

      if (isNumber) {
        if (
          !fieldValue &&
          fieldValue !== false &&
          !selectionList &&
          !isRelationalValue
        ) {
          fieldValue = 0;
        }
        if (['between', 'notBetween'].includes(operator) && !fieldValue2) {
          fieldValue2 = 0;
        }
      }

      if (!isRelationalValue && !isNumber && typeof fieldValue !== 'object') {
        fieldValue = `'${jsStringEscape(fieldValue, withParam)}'`;
        fieldValue2 = `'${jsStringEscape(fieldValue2, withParam)}'`;
      }

      if (isDateTime) {
        if (!isRelationalValue) {
          fieldValue = getDateTimeValue(type, fieldValue);
          fieldValue2 = getDateTimeValue(type, fieldValue2);
        }
        fieldName = typeName ? `${fieldName}?.toLocalDateTime()` : fieldName;
      }
      const isObjectValue = fieldValue && typeof fieldValue === 'object';
      if (['in', 'notIn'].includes(operator)) {
        const isManyToManyField = initValue && initValue.includes('{it->it$$}');
        const field = allField.find(f => f.name === parent) || {};
        const value =
          typeof rule?.fieldValue === 'string'
            ? rule.fieldValue
            : (rule?.fieldValue || [])
              .map(f => {
                const targetFields =
                  f['nameField'] ||
                  f['targetName'] ||
                  f['fullName'] ||
                  f[`name`];
                return targetFields
                  ? isNumber
                    ? targetFields
                    : `'${targetFields}'`
                  : f['id'];
              })
              .join(',');
        const name =
          isParent || nestedFields.length >= 1
            ? ''
            : `${fieldName}${selectionList
              ? ''
              : `${JOIN_OPERATOR[expression]}${nameField ||
              (field && field.targetName) ||
              targetName ||
              'fullName'
              }`
            }`;
        const str = `${operator === 'notIn' ? '!' : ''}${`[${value}]`}${JOIN_OPERATOR[expression]
          }${map_operators[operator]}${isManyToManyField ? 'All' : ''}(${prefix}${JOIN_OPERATOR[expression]
          }${initValue.replace(/\$\$/g, name)})`;
        return str;
      } else if (['contains', 'notContains'].includes(operator)) {
        const isManyToManyField = initValue && initValue.includes('{it->it$$}');
        const field = allField.find(f => f.name === parent) || {};
        const value =
          typeof rule?.fieldValue === 'string'
            ? rule.fieldValue
            : (rule?.fieldValue || [])
              .map(f => {
                const targetFields =
                  f['nameField'] ||
                  f['targetName'] ||
                  f['fullName'] ||
                  f[`name`];
                return targetFields
                  ? isNumber
                    ? targetFields
                    : `'${targetFields}'`
                  : f['id'];
              })
              .join(',');
        const name =
          isParent || nestedFields.length >= 1
            ? ''
            : `${fieldName}${selectionList
              ? ''
              : `${JOIN_OPERATOR[expression]}${nameField ||
              (field && field.targetName) ||
              targetName ||
              'fullName'
              }`
            }`;
        const str = `${operator === 'notContains' ? '!' : ''}(${prefix}${JOIN_OPERATOR[expression]
          }${initValue.replace(/\$\$/g, name)})${JOIN_OPERATOR[expression]}${map_operators[operator]
          }${isManyToManyField ? 'All' : ''}(${value})`;
        return str;
      } else if (['between', 'notBetween'].includes(operator)) {
        const temp = initValue.match(/it.\$\$/g);
        if (temp && temp.length) {
          const str = `(it.${prefix}${JOIN_OPERATOR[expression]}${fieldName} >= ${fieldValue} && it.${prefix}${JOIN_OPERATOR[expression]}${fieldName} <= ${fieldValue2})`;
          if ('notBetween' === operator) {
            return `${initValue.replace(/it.\$\$/g, `!${str}`)}`;
          }
          return initValue.replace(/it.\$\$/g, str);
        } else {
          const replace = p1 => {
            const field = (p1 && p1.replace(/\$\$/g, fieldName)) || fieldName;
            if ('notBetween' === operator) {
              return `!(${prefix}${JOIN_OPERATOR[expression]}${field} >= ${fieldValue} && ${prefix}${JOIN_OPERATOR[expression]}${field} <= ${fieldValue2})`;
            }
            return `(${prefix}${JOIN_OPERATOR[expression]}${field} >= ${fieldValue} && ${prefix}${JOIN_OPERATOR[expression]}${field} <= ${fieldValue2})`;
          };
          return replace(initValue);
        }
      } else if (['isNotNull', 'isNull'].includes(operator)) {
        const str = `${fieldName} ${map_operators[operator]}`;
        const field = allField.find(f => f.name === parent) || {};
        const isManyToManyField = initValue && initValue.includes('{it->it$$}');
        if (isManyToManyField) {
          const name =
            isParent || nestedFields.length >= 1
              ? ''
              : `${fieldName}${selectionList
                ? ''
                : `${JOIN_OPERATOR[expression]}${(field && field.targetName) || targetName || 'fullName'
                }`
              }`;
          return `${prefix}${JOIN_OPERATOR[expression]}${initValue.replace(
            /\$\$/g,
            `${name} ${str}`
          )}`;
        }
        return `${prefix}${JOIN_OPERATOR[expression]}${initValue.replace(
          /\$\$/g,
          str
        )}`;
      } else if (['isTrue', 'isFalse'].includes(operator)) {
        const value = operator === 'isTrue' ? true : false;
        const str = `${fieldName} ${map_operators[operator]} ${value}`;
        return `${prefix}${JOIN_OPERATOR[expression]}${initValue.replace(
          /\$\$/g,
          str
        )}`;
      } else if (['like', 'notLike'].includes(operator)) {
        const str = `${fieldName}${JOIN_OPERATOR[expression]}${map_operators[operator]}(${fieldValue})`;
        return `${operator === 'notLike' ? '!' : ''}${prefix}${JOIN_OPERATOR[expression]
          }${initValue.replace(/\$\$/g, str)}`;
      } else {
        const fieldNew = field || allField.find(f => f.name === parent) || {};
        const targetFields =
          isObjectValue &&
          (fieldValue[nameField] ||
            fieldValue[targetName] ||
            fieldValue['fullName'] ||
            fieldValue['name']);

        const isRelational =
          isRelationalValue &&
          ['json-many-to-one', 'MANY_TO_ONE', 'many-to-one'].includes(
            fieldNew.type
          );

        const value = isObjectValue
          ? targetFields
            ? `'${jsStringEscape(targetFields, withParam)}'`
            : fieldValue['id']
          : fieldValue;
        const str = `${isObjectValue
            ? `${fieldName}${JOIN_OPERATOR[expression]}${nameField || fieldNew.targetName || 'fullName'
            }`
            : `${fieldName}${isRelational ? `?.getTarget()` : ''}`
          } ${map_operators[operator]} ${value}`;
        return ['button', 'menu-item'].includes(type)
          ? `${initValue.replace(/\$\$/g, str)}`
          : `${prefix}${JOIN_OPERATOR[expression]}${initValue.replace(
            /\$\$/g,
            str
          )}`;
      }
    }
  }

  function getDateTimeValue(type, fieldValue, isJsonField = false) {
    const isQuery = isBPMQuery(parentType);
    if (type === 'date') {
      let date = `'${moment(fieldValue, DATE_FORMAT['date']).format(
        'YYYY-MM-DD'
      )}'`;
      if (isJsonField || isQuery) {
        return date;
      }
      return `LocalDate.parse(${date})`;
    } else if (type === 'datetime') {
      if (isJsonField || isQuery) {
        return `'${moment(fieldValue, DATE_FORMAT['datetime']).toISOString()}'`;
      }
      return `LocalDateTime.of(${moment(fieldValue, DATE_FORMAT['datetime'])
        .format('YYYY-M-D-H-m-s')
        .split('-')})`;
    } else {
      let time = `'${moment(fieldValue, DATE_FORMAT['time']).format(
        'HH:mm:ss'
      )}'`;
      if (isJsonField || isQuery) {
        return time;
      }
      return `LocalTime.parse(${time})`;
    }
  }

  function getCondition(rules, modalName) {
    const isBPM = isBPMQuery(parentType);
    const prefix = isBPM
      ? 'self'
      : isBPMN && generateWithId
        ? `__ctx__.find('${upperCaseFirstLetter(modalName)}', ${modalName}Id)`
        : modalName;
    const map_operators = MAP_OPERATOR[isBPM ? 'BPM' : expression];
    const returnValues = [];
    for (let i = 0; i < (rules && rules.length); i++) {
      const rule = rules[i];
      const { fieldName: propFieldName, field = {}, operator, allField } = rule;
      const { targetName, selectionList } = field || {};
      const type = field && field.type && field.type.toLowerCase();
      const typeName = field && field.typeName;
      const isNumber = [
        'long',
        'integer',
        'decimal',
        'boolean',
        'button',
        'menu-item',
        'double',
      ].includes(type);
      const isDateTime = ['date', 'time', 'datetime'].includes(type);
      let { fieldValue, fieldValue2, isRelationalValue } = rule;
      let fieldName = propFieldName;
      if (isNumber && !selectionList && !isRelationalValue) {
        if (!fieldValue && fieldValue !== false) {
          fieldValue = 0;
        }
        if (['between', 'notBetween'].includes(operator) && !fieldValue2) {
          fieldValue2 = 0;
        }
        if (!fieldName || fieldName === '') {
          setAlert(true);
          returnValues.push(null);
          return;
        }
      }

      //check relational field
      const name = fieldName && fieldName.split(JOIN_OPERATOR[expression])[0];
      const f = allField && allField.find(f => f.name === name);
      const isRelational = [
        'many_to_many',
        'one_to_many',
        'many_to_one',
        'one_to_one',
        'json_many_to_many',
        'json_one_to_many',
        'json_many_to_one',
        'json_one_to_one',
      ].includes(
        f &&
        f.type &&
        f.type.toLowerCase() &&
        f.type.toLowerCase().replaceAll('-', '_')
      );
      if (isRelational) {
        returnValues.push(
          getRelationalCondition(rule, undefined, false, prefix)
        );
      } else {
        if (!isRelationalValue && !isNumber && typeof fieldValue !== 'object') {
          fieldValue = `'${jsStringEscape(fieldValue, withParam)}'`;
          fieldValue2 = `'${jsStringEscape(fieldValue2, withParam)}'`;
        }
        if (isDateTime) {
          if (!isRelationalValue) {
            fieldValue = getDateTimeValue(type, fieldValue);
            fieldValue2 = getDateTimeValue(type, fieldValue2);
          }
          fieldName = typeName ? `${fieldName}?.toLocalDateTime()` : fieldName;
        }
        const map_type = isBPM ? MAP_BPM_COMBINATOR : MAP_COMBINATOR;
        const isObjectValue = fieldValue && typeof fieldValue === 'object';
        if (['in', 'notIn'].includes(operator)) {
          const value = (rule?.fieldValue || [])
            .map(f => {
              const targetFields =
                f['targetName'] || f['fullName'] || f['name'];
              return targetFields
                ? isNumber
                  ? targetFields
                  : `'${targetFields}'`
                : f['id'];
            })
            .filter(f => f !== '')
            .join(',');
          returnValues.push(
            `${operator === 'notIn' ? '!' : ''}${`[${value}]`}${JOIN_OPERATOR[expression]
            }${map_operators[operator]}(${prefix}${JOIN_OPERATOR[expression]
            }${fieldName}${selectionList
              ? ''
              : `${JOIN_OPERATOR[expression]} ${targetName || 'fullName'}`
            })`
          );
        } else if (['between', 'notBetween'].includes(operator)) {
          if (operator === 'notBetween') {
            returnValues.push(
              `!(${prefix}${JOIN_OPERATOR[expression]}${fieldName} >= ${fieldValue} ${map_type['and']} ${prefix}${JOIN_OPERATOR[expression]}${fieldName} <= ${fieldValue2})`
            );
          }
          returnValues.push(
            `(${prefix}${JOIN_OPERATOR[expression]}${fieldName} >= ${fieldValue} ${map_type['and']} ${prefix}${JOIN_OPERATOR[expression]}${fieldName} <= ${fieldValue2})`
          );
        } else if (['isNotNull', 'isNull'].includes(operator)) {
          returnValues.push(
            `${prefix}${JOIN_OPERATOR[expression]}${fieldName} ${map_operators[operator]}`
          );
        } else if (['isTrue', 'isFalse'].includes(operator)) {
          const value = operator === 'isTrue' ? true : false;
          returnValues.push(
            `${prefix}${JOIN_OPERATOR[expression]}${fieldName} ${map_operators[operator]} ${value}`
          );
        } else if (['like', 'notLike'].includes(operator)) {
          returnValues.push(
            `${operator === 'notLike' ? '!' : ''}${prefix}${JOIN_OPERATOR[expression]
            }${fieldName}${JOIN_OPERATOR[expression]}${map_operators[operator]
            }(${fieldValue})`
          );
        } else {
          const targetFields =
            isObjectValue &&
            (fieldValue[targetName] ||
              fieldValue['fullName'] ||
              fieldValue['name']);
          const value = isObjectValue
            ? targetFields
              ? `'${jsStringEscape(targetFields, withParam)}'`
              : fieldValue['id']
            : fieldValue;
          returnValues.push(
            ['button', 'menu-item'].includes(type)
              ? `${fieldName} ${map_operators[operator]} ${value}`
              : `${prefix}${JOIN_OPERATOR[expression]}${type === 'many_to_one' || type === 'json_many_to_one'
                ? `${fieldName}${JOIN_OPERATOR[expression]}${field.targetName || 'fullName'
                }`
                : fieldName
              } ${map_operators[operator]} ${value}`
          );
        }
      }
    }
    return returnValues;
  }

  const isRelationalCustomField = (field, parentFieldName) => {
    if (
      isBPMQuery(parentType) &&
      parentFieldName &&
      field &&
      field.allField &&
      field.allField.find(
        f =>
          f.name === parentFieldName &&
          RELATIONAL_TYPES.includes(f.type) &&
          (f.modelField ||
            f.model === 'com.axelor.meta.db.MetaJsonRecord' ||
            f.target === 'com.axelor.meta.db.MetaJsonRecord')
      )
    ) {
      return true;
    }
  };

  /**
   * isField = param (For parameter fieldValue will be disable and :param will be values)
   */
  function getBPMCondition(rules, modalName) {
    const isBPM = isBPMQuery(parentType);
    const prefix = isBPM ? 'self' : modalName;
    const map_operators = MAP_OPERATOR[isBPM ? 'BPM' : expression];
    const returnValues = [];
    for (let i = 0; i < (rules && rules.length); i++) {
      const rule = rules[i];
      const { fieldName, field = {}, operator, allField, isField } = rule;
      const isParam = isField === 'param';
      const { targetName, selectionList, model, target, jsonField } =
        field || {};
      const type = field?.type?.toLowerCase()?.replaceAll('-', '_');
      const isNumber = [
        'long',
        'integer',
        'decimal',
        'boolean',
        'double',
        'button',
        'menu-item',
      ].includes(type);
      const isDateTime = ['date', 'time', 'datetime'].includes(type);
      const isRelational = [
        'many_to_one',
        'json_many_to_one',
        'one_to_one',
        'json_one_to_one',
      ].includes(type);
      let isJsonField =
        model === 'com.axelor.meta.db.MetaJsonRecord' ||
        target === 'com.axelor.meta.db.MetaJsonRecord' ||
        jsonField;
      let parentCustomField;
      const values = fieldName && fieldName.split(JOIN_OPERATOR[expression]);
      if (values && values.length > 1) {
        let customField =
          allField &&
          allField.find(field => {
            let value =
              values &&
              values.find(
                name =>
                  field.name === name &&
                  (field.model === 'com.axelor.meta.db.MetaJsonRecord' ||
                    field.target === 'com.axelor.meta.db.MetaJsonRecord' ||
                    field.jsonField)
              );
            return value;
          });
        if (customField) {
          isJsonField = true;
          parentCustomField = customField;
        }
      }
      const jsonFieldName = parentCustomField
        ? {
          ...parentCustomField,
          targetName: field?.targetName,
        }
        : field;
      let {
        fieldValue,
        fieldValue2,
        isRelationalValue,
        relatedValueModal = {},
        relatedElseValueModal = {},
      } = rule || {};
      if (isNumber && !selectionList && !isRelationalValue) {
        if (!fieldValue) {
          fieldValue = 0;
        }
        if (['between', 'notBetween'].includes(operator) && !fieldValue2) {
          fieldValue2 = 0;
        }
        if (!fieldName || fieldName === '') {
          setAlert(true);
          returnValues.push(null);
          return;
        }
      }
      const relatedValueModalName = lowerCaseFirstLetter(
        relatedValueModal?.name
      );
      const relatedElseValueModalName = lowerCaseFirstLetter(
        relatedElseValueModal?.name
      );
      const isRelatedModalSame =
        (relatedValueModalName === modalName && isField === 'self') ||
        !withParam;
      const isRelatedElseModalSame =
        (relatedElseValueModalName === modalName && isField === 'self') ||
        !withParam;
      if (!['isNotNull', 'isNull'].includes(operator) && !isRelatedModalSame) {
        ++count;
      }
      if (isParam) {
        ++paramCount;
      }

      if (!isRelationalValue && !isNumber && typeof fieldValue !== 'object') {
        fieldValue = `'${jsStringEscape(fieldValue, withParam)}'`;
        fieldValue2 = `'${jsStringEscape(fieldValue2, withParam)}'`;
      }

      if (isDateTime) {
        if (!isRelationalValue) {
          fieldValue = getDateTimeValue(type, fieldValue, isJsonField);
          fieldValue2 = getDateTimeValue(type, fieldValue2, isJsonField);
        }
      }

      const map_type = isBPM ? MAP_BPM_COMBINATOR : MAP_COMBINATOR;
      const isObjectValue = fieldValue && typeof fieldValue === 'object';
      if (['in', 'notIn'].includes(operator)) {
        let value = (rule?.fieldValue || [])
          ?.map(f => {
            const targetFields = f['targetName'] || f['fullName'] || f['name'];
            return targetFields
              ? isNumber
                ? targetFields
                : `'${targetFields}'`
              : f['id'];
          })
          .filter(f => f !== '');

        value = isParam ? (isCondition ? `?` : `:param${paramCount}`) : value;

        const nameField = selectionList ? '' : `.${targetName || 'id'}`;
        returnValues.push({
          condition: `${isJsonField
              ? `${prefix}.${jsonFieldName.modelField}.${fieldName}${nameField}`
              : `${prefix}.${fieldName}${nameField}`
            } ${map_operators[operator]} ${isRelatedModalSame
              ? withParam
                ? isJsonField
                  ? value
                  : fieldValue
                : `(${value})`
              : `(?${count})`
            }`,
          values: isRelatedModalSame
            ? undefined
            : [[isParam ? (isCondition ? `?` : `:param${paramCount}`) : value]],
        });
      } else if (['between', 'notBetween'].includes(operator)) {
        let values =
          isRelatedModalSame && isRelatedElseModalSame
            ? undefined
            : isRelatedModalSame
              ? [
                isParam
                  ? isCondition
                    ? `?`
                    : `:param${paramCount}`
                  : fieldValue2,
              ]
              : isRelatedElseModalSame
                ? [
                  isParam
                    ? isCondition
                      ? `?`
                      : `:param${paramCount}`
                    : fieldValue,
                ]
                : [
                  isParam
                    ? isCondition
                      ? `?`
                      : `:param${paramCount}`
                    : fieldValue,
                  isParam
                    ? isCondition
                      ? `?`
                      : `:param${++paramCount}`
                    : fieldValue2,
                ];
        if (isDateTime && isBPM) {
          returnValues.push({
            condition: `${isJsonField
                ? `${prefix}.${jsonFieldName.modelField}.${fieldName}`
                : `${prefix}.${fieldName}`
              } ${operator === 'notBetween' ? 'NOT BETWEEN' : 'BETWEEN'} ${isRelatedModalSame
                ? isParam
                  ? isCondition
                    ? `?`
                    : `:param${paramCount}`
                  : fieldValue
                : `?${count}`
              } ${map_type['and']} ${isRelatedElseModalSame
                ? isParam
                  ? isCondition
                    ? `?`
                    : `:param${++paramCount}`
                  : fieldValue2
                : `?${++count}`
              }`,
            values,
          });
        } else {
          returnValues.push({
            condition: `${operator === 'notBetween' ? 'NOT ' : ''}${isJsonField
                ? `${prefix}.${jsonFieldName.modelField}.${fieldName}`
                : `${prefix}.${fieldName}`
              } >= ${isRelatedModalSame
                ? isParam
                  ? isCondition
                    ? `?`
                    : `:param${paramCount}`
                  : fieldValue
                : `?${count}`
              } ${map_type['and']} ${isJsonField
                ? `${prefix}.${jsonFieldName.modelField}.${fieldName}`
                : `${prefix}.${fieldName}`
              } <= ${isRelatedElseModalSame
                ? isParam
                  ? isCondition
                    ? `?`
                    : `:param${++paramCount}`
                  : fieldValue2
                : `?${++count}`
              }`,
            values,
          });
        }
      } else if (['isNotNull', 'isNull'].includes(operator)) {
        returnValues.push({
          condition: `${isJsonField
              ? `${prefix}.${jsonFieldName.modelField}.${fieldName}`
              : `${prefix}.${fieldName}`
            } ${map_operators[operator]}`,
        });
      } else if (['isTrue', 'isFalse'].includes(operator)) {
        let value = operator === 'isTrue' ? true : false;

        value = isParam
          ? isCondition
            ? `?`
            : `:param${paramCount}`
          : `${value}`;

        returnValues.push({
          condition: `${isJsonField
              ? `${prefix}.${jsonFieldName.modelField}.${fieldName}`
              : `${prefix}.${fieldName}`
            } ${map_operators[operator]} ${isRelatedModalSame
              ? withParam
                ? isParam
                  ? isCondition
                    ? `?`
                    : `:param${paramCount}`
                  : fieldValue
                : value
              : `?${count}`
            }`,
          values: isRelatedModalSame
            ? undefined
            : [isParam ? (isCondition ? `?` : `:param${paramCount}`) : value],
        });
      } else if (['contains', 'notContains'].includes(operator)) {
        const value = isObjectValue
          ? fieldValue[field.targetName]
            ? `'${jsStringEscape(fieldValue[field.targetName], withParam)}'`
            : `'${jsStringEscape(fieldValue['name'] || '', withParam)}'`
          : fieldValue;
        returnValues.push({
          condition: `${isRelatedModalSame
              ? withParam
                ? isParam
                  ? isCondition
                    ? `?`
                    : `:param${paramCount}`
                  : fieldValue
                : value
              : `?${count}`
            } ${map_operators[operator]} ${isJsonField
              ? `${prefix}.${jsonFieldName.modelField}.${fieldName}`
              : `${prefix}.${fieldName}`
            }`,
          values: isRelatedModalSame
            ? undefined
            : [isParam ? (isCondition ? `?` : `:param${paramCount}`) : value],
        });
      } else {
        const targetFields =
          isObjectValue && (fieldValue[field.targetName] || fieldValue['name']);

        let value = isObjectValue
          ? targetFields
            ? `'${jsStringEscape(targetFields, withParam)}'`
            : fieldValue['id']
          : fieldValue;

        value = isParam
          ? isCondition
            ? `?`
            : `:param${paramCount}`
          : `${value}`;

        /**
         * For custom field equals and not equals operator
         * should be IN and NOT IN
         * as subquery can return multiple records with equal operator
         */
        const isRelationalCustom = isRelationalCustomField(
          rule,
          values && values[0]
        );

        const nameField =
          isRelational && !isRelationalValue ? `.${targetName || 'id'}` : '';

        returnValues.push({
          condition: `${isJsonField
              ? `${prefix}.${jsonFieldName.modelField}.${fieldName}${nameField}`
              : `${prefix}.${fieldName}${nameField}`
            } ${map_operators[operator]} ${isRelatedModalSame
              ? ['like', 'notLike'].includes(operator) &&
                (!isJsonField || (isJsonField && !isRelationalCustom))
                ? `CONCAT('%',${isParam
                  ? isCondition
                    ? `?`
                    : `:param${paramCount}`
                  : fieldValue
                },'%')`
                : withParam
                  ? isJsonField
                    ? value
                    : isParam
                      ? isCondition
                        ? `?`
                        : `:param${paramCount}`
                      : fieldValue
                  : value
              : ['like', 'notLike'].includes(operator) &&
                (!isJsonField ||
                  (isJsonField && !MANY_TO_ONE_TYPES.includes(operator)))
                ? `CONCAT('%',?${count},'%')`
                : `?${count}`
            }`,
          values: isRelatedModalSame
            ? undefined
            : [isParam ? (isCondition ? `?` : `:param${paramCount}`) : value],
        });
      }
    }
    return returnValues;
  }

  function getBPMCriteria(rule, modalName, isChildren) {
    const { rules, combinator = 'and', children } = (rule && rule[0]) || {};
    const bpmConditions = getBPMCondition(rules, modalName);
    const condition = (bpmConditions && bpmConditions.filter(f => f)) || [];
    const childrenConditions = [];
    children &&
      children.length > 0 &&
      children.forEach(child => {
        const { condition: conditions, values } =
          getBPMCriteria([child], modalName, true) || {};
        const newValues = [].concat.apply([], values);
        childrenConditions.push({
          condition: conditions,
          values: newValues && newValues.length > 0 ? newValues : undefined,
        });
      });
    const map_type = isBPMQuery(parentType)
      ? MAP_BPM_COMBINATOR
      : MAP_COMBINATOR;
    const c = condition && condition.map(co => co && co.condition);
    const childConditions =
      childrenConditions &&
      (childrenConditions.map(co => co && co.condition) || []).filter(f => f);
    const childValues =
      childrenConditions && childrenConditions.filter(val => val !== null);

    if (children.length > 0) {
      let isChild = childConditions && childConditions.length > 0;
      return {
        condition: `${isChild ? '(' : ''}${c ? c.join(' ' + map_type[combinator] + ' ') : ''
          } ${isChild
            ? `${map_type[combinator]} ${childConditions.join(
              ' ' + map_type[combinator] + ' '
            )}`
            : ''
          }${isChild ? ')' : ''}`,
        values: [
          ...((condition &&
            condition.map(co => co && co.values).filter(f => f)) ||
            []),
          ...((childValues &&
            childValues.map(co => co && co.values).filter(f => f)) ||
            []),
        ],
      };
    } else if (isChildren && condition && c && c.length !== 0) {
      return {
        condition: `(${c.join(' ' + map_type[combinator] + ' ')})`,
        values:
          condition && condition.map(co => co && co.values).filter(f => f),
      };
    } else {
      return {
        condition: c.join(' ' + map_type[combinator] + ' '),
        values:
          condition && condition.map(co => co && co.values).filter(f => f),
      };
    }
  }

  function getCriteria(rule, modalName, isChildren) {
    const { rules, combinator = 'and', children } = rule[0];
    const condition = (getCondition(rules, modalName) || []).filter(
      f => f !== ''
    );
    const childrenConditions = [];
    children &&
      children.length > 0 &&
      children.forEach(child => {
        const conditions = getCriteria([child], modalName, true);
        if (conditions) {
          childrenConditions.push(conditions);
        }
      });
    const map_type = isBPMQuery(parentType)
      ? MAP_BPM_COMBINATOR
      : MAP_COMBINATOR;

    if (children.length > 0 && condition && condition.length > 0) {
      let isChild = childrenConditions && childrenConditions.length !== 0;
      return `${isChild ? '(' : ''}${condition ? condition.join(' ' + map_type[combinator] + ' ') : ''
        } ${isChild
          ? ` ${map_type[combinator]} ${childrenConditions.join(
            ' ' + map_type[combinator] + ' '
          )}`
          : ''
        }${isChild ? ')' : ''}`;
    } else if (isChildren && condition && condition.length > 0) {
      return '(' + condition.join(' ' + map_type[combinator] + ' ') + ')';
    } else if (condition && condition.length > 0) {
      return condition.join(' ' + map_type[combinator] + ' ');
    }
  }

  function getListOfTree(list) {
    var map = {},
      node,
      roots = [];
    const rules =
      list &&
      list.map((item, index) => {
        map[item.id] = index;
        return { ...item, children: [] };
      });
    for (let i = 0; i < rules.length; i += 1) {
      node = rules[i];
      if (node.parentId >= 0) {
        rules[map[node.parentId]] &&
          rules[map[node.parentId]].children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }

  const onChange = React.useCallback(function onChange(value, index) {
    setExpressionComponents(
      produce(draft => {
        if (typeof value === 'function') {
          !draft[index].value && (draft[index].value = {});
          value(draft[index].value);
        } else {
          draft[index].value = value;
        }
      })
    );
  }, []);

  const save = async (expr, expressionValues) => {
    if (onSave) {
      onSave(expr, expressionValues);
    }
    if (!model) return;
    await saveRecord(model, {
      ...(record || {}),
      [resultField]: expr && expr.trim(),
      [resultMetaField]: expressionValues
        ? JSON.stringify(expressionValues)
        : expressionValues,
    });
    const closeElementArray =
      window.top &&
      window.top.document &&
      window.top.document.getElementsByClassName('button-close');
    const closeElement =
      closeElementArray && closeElementArray[closeElementArray.length - 1];
    closeElement && closeElement.click && closeElement.click();
  };

  const checkValidation = () => {
    let isValid = true;
    const nodes = [];
    for (
      let i = 0;
      i < (expressionComponents && expressionComponents.length);
      i++
    ) {
      const component = expressionComponents[i];
      const { value } = component;
      const { rules, metaModals } = value || {};
      if (!metaModals && !isPackage) {
        return isValid;
      }
      nodes.push(rules);
    }
    const parentNodes = flattenDeep(nodes || []);
    const rules = parentNodes && parentNodes.map(n => n.rules);
    const allRules = flattenDeep(rules || []);
    for (let i = 0; i < (allRules && allRules.length); i++) {
      const rule = allRules && allRules[i];
      const { fieldName: propFieldName, field = {}, operator } = rule || {};
      const { selectionList } = field || {};
      const type = field && field.type && field.type.toLowerCase();
      const isNumber = [
        'long',
        'integer',
        'decimal',
        'boolean',
        'button',
        'menu-item',
        'double',
      ].includes(type);
      let { fieldValue, fieldValue2, isRelationalValue, isField } = rule;
      let fieldName = propFieldName;
      if (isNumber && !selectionList && !isRelationalValue) {
        if (!fieldValue && fieldValue !== false) {
          fieldValue = 0;
        }
        if (['between', 'notBetween'].includes(operator) && !fieldValue2) {
          fieldValue2 = 0;
        }
      }
      const fValue = isNaN(fieldValue) ? fieldValue : `${fieldValue}`;
      if (!fieldName) {
        isValid = false;
        break;
      }
      if (isEmpty(fValue)) {
        if (!['isNull', 'isNotNull', 'isTrue', 'isFalse'].includes(operator)) {
          isValid = false;
          break;
        }
      }
      if (
        operator === '' ||
        (selectionList &&
          !fieldValue &&
          !['isNull', 'isNotNull', 'isTrue', 'isFalse'].includes(operator)) ||
        (isNumber && isRelationalValue && !fieldValue) ||
        (((!isNumber && !fieldValue) ||
          (fieldValue && Array.isArray(fieldValue) && fieldValue.length <= 0) ||
          (((!isNumber && !fieldValue2) ||
            (fieldValue2 &&
              Array.isArray(fieldValue2) &&
              fieldValue2.length <= 0)) &&
            ['between', 'notBetween'].includes(operator))) &&
          !['isNull', 'isNotNull', 'isTrue', 'isFalse'].includes(operator))
      ) {
        if (!isCondition && isField === 'param') {
          isValid = true;
        } else {
          isValid = false;
          break;
        }
      }
    }
    return isValid;
  };

  function generateExpression(combinator, type) {
    const expressionValues = [];
    let model;
    let vals = [];
    const expressions = [];
    const isValid = checkValidation();
    if (!isValid) {
      setAlert(true);
      return;
    }
    for (let i = 0; i < expressionComponents.length; i++) {
      const component = expressionComponents[i];
      const { value } = component;
      const { rules, metaModals } = value || {};
      const modalName =
        metaModals && metaModals.type === 'dmnModel'
          ? metaModals.resultVariable
          : metaModals && metaModals.name;
      const { fullName, type: modelType } = metaModals || {};
      //modalName is used for model in BPMN case.
      model = isBPMN
        ? modalName
        : isBPMQuery(type)
          ? modelType === 'metaJsonModel'
            ? modalName
            : fullName
          : modalName;
      let str = '';
      const listOfTree = getListOfTree(rules);
      const criteria = isBPMQuery(type)
        ? getBPMCriteria(listOfTree, lowerCaseFirstLetter(modalName), undefined)
        : getCriteria(listOfTree, lowerCaseFirstLetter(modalName), undefined);
      vals.push(
        ...((criteria &&
          ((criteria.values || []).filter(f => Array.isArray(f)) || [])) ||
          [])
      );
      if (metaModals || isPackage) {
        str += isBPMQuery(type) ? criteria && criteria.condition : criteria;
      } else {
        break;
      }
      let expressionValue = {
        metaModalName: modalName,
        metaModalType: metaModals && metaModals.type,
        rules,
      };
      expressionValues.push(expressionValue);
      expressions.push(`${str}`);
    }

    const map_type = isBPMQuery(parentType)
      ? MAP_BPM_COMBINATOR
      : MAP_COMBINATOR;

    const str = (expressions.filter(e => e !== '') || [])
      .map(e => (expressions.length > 1 ? `(${e})` : e))
      .join(' ' + map_type[combinator] + ' ');

    let expr = str;
    if (isBPMQuery(type)) {
      const {
        value: {
          metaModals: { type },
        },
      } = expressionComponents[0] || [];
      let valueParameters = '';
      vals &&
        vals.forEach(v => {
          if (v && Array.isArray(v[0]) && v[0]) {
            valueParameters =
              valueParameters +
              `, ${type === 'metaModel' ? `[${v[0]}]` : `(${v[0]})`}`;
          } else {
            if (v && Array.isArray(v) && v.length > 0) {
              v = v.join(', ');
            }
            valueParameters = valueParameters + ', ' + v;
          }
        });

      const showBracket = !queryModel || withParam;
      const exp = str
        ? `${showBracket ? '(' : ''}${!queryModel ? `${withParam ? `"${model}"` : `${model}`}, ` : ''
        }${withParam ? `"${str}"` : `${str}`}${vals && vals.length > 0 ? `${valueParameters}` : ``
        }${showBracket ? ')' : ''}`
        : null;
      const expBPMN = str
        ? isBamlQuery
          ? `"${str}"${vals && vals.length > 0 ? `${valueParameters}` : ``}`
          : `return __ctx__.createObject(__ctx__.${singleResult ? 'filterOne' : 'filter'
          }("${model}","${str}"${vals && vals.length > 0 ? `${valueParameters}` : ``
          }))`
        : undefined;
      expr = isBPMN ? expBPMN : exp;
    }
    paramCount = 0;
    count = 0;
    save(
      expr,
      expr
        ? {
          values: expressionValues,
          combinator,
        }
        : null
    );
    let checked =
      !expr || expr === 'undefined' || expressionValues?.length === 0
        ? null
        : isBPMQuery(type)
          ? singleResult
          : generateWithId;
    setProperty &&
      setProperty({
        expression: expr,
        value:
          expressionValues && expressionValues.length > 0
            ? JSON.stringify(expressionValues)
            : undefined,
        checked: checked,

        combinator: combinator,
      });
    close && close();
  }

  const setQueryModel = React.useCallback(async () => {
    if (!queryModel || !isBPMQuery(parentType)) return;
    const expressionComponents = [];
    const modelName = queryModel.split('.') || [];
    const length = modelName.length;
    const criteria = {
      criteria: [
        {
          fieldName: 'name',
          operator: '=',
          value: length > 1 ? modelName[length - 1] : queryModel,
        },
      ],
      operator: 'and',
    };
    const metaModels = await getModels(
      criteria,
      length > 1 ? 'metaModel' : 'metaJsonModel'
    );
    if (!metaModels) return;
    const value = {
      metaModals: metaModels && metaModels[0],
      rules: [
        {
          id: 0,
          parentId: -1,
          combinator: 'and',
          rules: [{}],
        },
      ],
    };
    expressionComponents.push({
      Component: ExpressionComponent,
      value,
    });
    setDefaultExpressionValue(value);
    setExpressionComponents(expressionComponents);
  }, [queryModel, parentType]);

  const setData = React.useCallback(
    async resultMetaFieldValues => {
      const { values, combinator } = resultMetaFieldValues || {};
      const expressionComponents = [];
      if (!values || values.length === 0) {
        await setQueryModel();
        return;
      }
      for (let i = 0; i < values.length; i++) {
        const element = values[i];
        const { metaModalName, metaModalType } = element;
        if (!metaModalName && !isPackage) return;
        const criteria = {
          criteria: [
            {
              fieldName: 'name',
              operator: '=',
              value: metaModalName,
            },
          ],
          operator: 'and',
        };
        const metaModels = await getModels(criteria, metaModalType);
        if (!metaModels && !isPackage) return;
        const value = {
          metaModals: metaModels && metaModels[0],
          rules: element.rules,
        };
        expressionComponents.push({
          Component: ExpressionComponent,
          value,
        });
      }
      setExpressionComponents(expressionComponents);
      setCombinator(combinator || 'and');
    },
    [isPackage, setQueryModel, setExpressionComponents, setCombinator]
  );

  useEffect(() => {
    if (exprVal) {
      setData(exprVal);
    }
    if (getExpression) {
      const { checked, ...restObj } = getExpression();
      setData(restObj);
      if (isBPMQuery(parentType)) {
        setSingleResult(checked);
      } else {
        setGenerateWithId(checked);
      }
    }
  }, [exprVal, setData, getExpression, parentType]);

  useEffect(() => {
    async function fetchValue() {
      if (!model || !id) {
        await setQueryModel();
        return;
      }
      const record = await getRecord(model, id);
      setRecord(record);
      if (!record) {
        await setQueryModel();
        return;
      }
      const resultMetaFieldValues = record && record[resultMetaField];
      setData(JSON.parse(resultMetaFieldValues || '{}'));
    }
    fetchValue();
  }, [resultMetaField, id, model, setQueryModel, setData]);

  const renderCheckbox = (label, checked, onChange) => (
    <Box d="flex" alignItems="center" gap={8} style={{ padding: 9 }}>
      <Input
        type="checkbox"
        checked={checked}
        id={label}
        style={{ fontSize: 16 }}
        onChange={e => onChange(e.target.checked)}
      />
      <InputLabel style={{ margin: 0 }} htmlFor={label}>
        {translate(label)}
      </InputLabel>
    </Box>
  );

  function UI() {
    return (
      <div>
        {
          !isBamlQuery && <Button
            title={isBPMQuery(parentType) ? 'Add group' : 'Add expression'}
            icon="add"
            onClick={() => onAddExpressionEditor()}
            disabled={
              isBPMQuery(parentType)
                ? expressionComponents &&
                  ((expressionComponents[0] &&
                    expressionComponents[0].value &&
                    expressionComponents[0].value.metaModals) ||
                    expressionComponents.length === 0)
                  ? false
                  : true
                : false
            }
          />
        }
        {expressionComponents &&
          expressionComponents.map(({ value }, index) => {
            return (
              <Box d="flex" alignItems="center" key={index}>
                <ExpressionComponent
                  value={value}
                  index={index}
                  onChange={onChange}
                  element={record && modelFilter && record[modelFilter]}
                  type={parentType}
                  queryModel={queryModel}
                  isCondition={isCondition}
                  isPackage={isPackage}
                  isParameterShow={isParameterShow}
                  defaultModel={defaultModel}
                  fetchModels={fetchModels}
                  isAllowButtons={isAllowButtons}
                  isBPMN={isBPMN}
                  isMapper={isMapper}
                  isBamlQuery={isBamlQuery}
                />

                {
                  !isBamlQuery && <IconButton
                    size="small"
                    color="inherit"
                    onClick={() => onRemoveExpressionEditor(index)}
                  > <div>

                    </div>
                    <MaterialIcon
                      icon="delete"
                      fontSize={18}
                      color="body"
                    />
                  </IconButton>
                }
              </Box>
            );
          })}
      </div>
    )
  }

  return (
    <Box d="flex" flexDirection="column" overflow="hidden" flex="1">
      <Box d="flex" flexDirection="column" color="body" className={styles.root}>
        <Box rounded={2} border={!isBamlQuery} className={styles.paper}>
          <Box maxH={100} maxW={100}>
            {isBPMN &&
              !isBPMQuery(parentType) &&
              renderCheckbox(
                'Generate with saved record',
                generateWithId,
                setGenerateWithId
              )}
            {isBPMN && !isBamlQuery &&
              isBPMQuery(parentType) &&
              renderCheckbox('Single result', singleResult, setSingleResult)}
            {
              isBamlQuery ? <div>{UI()}</div> :
                <Timeline
                  isBPMN={isBPMN}
                  title={
                    <Select
                      className={styles.combinator}
                      name="expression"
                      value={combinator}
                      options={COMBINATORS}
                      onChange={value => setCombinator(value)}
                      disableUnderline={true}
                    />
                  }
                >
                  {UI()}
                </Timeline>
            }
          </Box>
        </Box>
      </Box>

      <Box className={styles.dialogFooter}  >
        <Button
          variant="primary"
          title="OK"
          className={styles.save}
          onClick={() => generateExpression(combinator, parentType)}
        />
        {dialogActionButton && (
          <React.Fragment>{dialogActionButton}</React.Fragment>
        )}
      </Box>

      <Dialog centered open={openAlert} className={styles.dialog}>
        <DialogHeader onCloseClick={() => setAlert(false)}>
          <h3>{translate('Error')}</h3>
        </DialogHeader>
        <DialogContent className={styles.dialogContent}>
          {translate('Add all values')}
        </DialogContent>
        <DialogFooter>
          <Button
            variant="primary"
            title="OK"
            onClick={() => setAlert(false)}
          />
        </DialogFooter>
      </Dialog>
    </Box>
  );
}



export default function ExpressionBuilderApp(props) {
  const { theme, options } = useAppTheme();
  return (
    <ThemeProvider theme={theme} options={options}>
      <ExpressionBuilder {...props} />
    </ThemeProvider>
  );
};


