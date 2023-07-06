import React, {useEffect, useState} from 'react';
import Ids from 'ids';
import {makeStyles} from '@material-ui/core/styles';
import {getBusinessObject, is} from '../ModelUtil';

import {translate} from '../../utils';
import {ExtensionElementTable, TextField} from '../components';

const useStyles = makeStyles({
  groupLabel: {
    fontWeight: 'bolder',
    display: 'inline-block',
    verticalAlign: 'middle',
    color: '#666',
    fontSize: '120%',
    margin: '10px 0px',
    transition: 'margin 0.218s linear',
    fontStyle: 'italic',
  },
  divider: {
    marginTop: 15,
    borderTop: '1px dotted #ccc',
  },
});

const PARAMETER_ELEMENT = 'bpmn:Parameter';

const createElement = (elementType, properties, parent, factory) => {
  const element = factory.create(elementType, properties);
  element.$parent = parent;
  return element;
};

const fetchParameterElements = (bo) => {
  return bo.get('values');
};

const getParameters = (bo, type) => {
  const parameters = fetchParameterElements(bo);
  if (typeof parameters !== 'undefined') {
    const elements = parameters.filter(function(value) {
      return is(value, type);
    });
    if (elements.length) {
      return elements;
    }
  }
};

function getParameterElements(bo, type) {
  return (bo && getParameters(bo, type)) || [];
}

export default function ParameterProps({element, index, label, bpmnFactory}) {
  const [parameterEntity, setParameterEntity] = useState(null);
  const [parameterOptions, setParameterOptions] = useState(null);

  const classes = useStyles();

  const newElement = (element, type) => {
    return function(e, extensionEle, value) {
      const RENDERER_IDS = new Ids();
      const rendererId = RENDERER_IDS.next();
      const id = `parameter_${rendererId}`;
      const props = {
        id,
      };

      const newElem = createElement(type, props, extensionEle, bpmnFactory);

      const bo = getBusinessObject(element);
      if (bo.values) {
        element.businessObject.values.push(newElem);
      } else {
        element.businessObject.values = [newElem];
      }
      return newElem;
    };
  };

  const removeElement = (type) => {
    return function(index) {
      const bo = getBusinessObject(element);
      const parameters = bo && bo.values;
      let count;
      parameters &&
        parameters.forEach((element, ind) => {
          if (element.$type === type) {
            if (count > -1) {
              count++;
            } else {
              count = 0;
            }
          }
          if (count === Number(index)) {
            bo.values.splice(ind, 1);
            return;
          }
        });
      addOptions(element);
      if (parameters && !parameters.find((e) => e.$type === type)) {
        if (type === PARAMETER_ELEMENT) {
          setParameterEntity(null);
        }
      } else {
        setParameterEntity(null);
      }
    };
  };

  const getBO = React.useCallback(() => {
    let bo = getBusinessObject(element);
    if (is(element, 'bpmn:Participant')) {
      bo = bo.get('processRef');
    }
    return bo;
  }, [element]);

  const getParameterElement = React.useCallback(() => {
    const type = PARAMETER_ELEMENT;
    const bo = getBO();
    const parameters = getParameterElements(bo, type);
    const parameterElement = parameters[parameterEntity];
    return parameterElement || (parameters && parameters[0]);
  }, [getBO, parameterEntity]);

  const showParameter = () => {
    if (
      is(element, 'bpmn:FlowElement') ||
      is(element, 'bpmn:Process') ||
      is(element, 'bpmn:Participant')
    ) {
      const bo = getBO();
      if (bo) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  };

  const setOptionLabelValue = (type) => {
    const bo = getBO();
    return function(index) {
      const parameters = getParameterElements(bo, type);
      const parameterElement = parameters[index];
      if (!parameterElement) return '';
      const label = parameterElement.id;
      return label;
    };
  };

  const addOptions = (element, isInitial = false) => {
    const bo = getBusinessObject(element);
    const parameters = getParameterElements(bo, PARAMETER_ELEMENT);

    const parameterOptions =
      parameters &&
      parameters.map(function(l, index) {
        return {
          id: index,
          text: l.id,
        };
      });
    setParameterOptions(parameterOptions);
    if (isInitial) {
      if (parameterOptions.length > 0) {
        setParameterEntity(parameterOptions[0]);
      }
    }
  };

  useEffect(() => {
    addOptions(element, true);
  }, [element]);

  return (
    <div>
      <React.Fragment>
        {index > 0 && <div className={classes.divider} />}
      </React.Fragment>
      <div className={classes.groupLabel}>{label}</div>
      {showParameter() && (
        <ExtensionElementTable
          element={element}
          options={parameterOptions}
          entry={{
            id: 'parameter',
            label: translate('Parameter'),
            modelProperty: 'name',
            idGeneration: 'false',
            reference: 'processRef',
            createExtensionElement: newElement(element, PARAMETER_ELEMENT),
            removeExtensionElement: removeElement(PARAMETER_ELEMENT),
            onSelectionChange: function(value) {
              setParameterEntity(value);
            },
            setOptionLabelValue: setOptionLabelValue(PARAMETER_ELEMENT),
          }}
        />
      )}
      {(parameterEntity || parameterEntity === 0) && (
        <React.Fragment>
          <TextField
            element={element}
            canRemove={true}
            entry={{
              id: 'target',
              label: translate('Target'),
              modelProperty: 'target',
              get: function() {
                const parameterElement = getParameterElement();
                if (!parameterElement) return;
                return {target: parameterElement.target};
              },
              set: function(e, values) {
                const parameterElement = getParameterElement();
                if (!parameterElement) return;
                parameterElement['target'] = values.target;
              },
            }}
          />
          <TextField
            element={element}
            canRemove={true}
            entry={{
              id: 'expression',
              label: translate('Expression'),
              modelProperty: 'expression',
              get: function() {
                const parameterElement = getParameterElement();
                if (!parameterElement) return;
                return {expression: parameterElement.expression};
              },
              set: function(e, values) {
                const parameterElement = getParameterElement();
                if (!parameterElement) return;
                parameterElement['expression'] = values.expression;
              },
            }}
          />
        </React.Fragment>
      )}
    </div>
  );
}
