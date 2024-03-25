import { Component } from "inferno";
import InputEditor from "./InputEditor";
import { inject } from "table-js/lib/components";
import { createComponentVNode } from "inferno";

function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    return typeof obj;
  } else {
    return obj &&
      typeof Symbol === "function" &&
      obj.constructor === Symbol &&
      obj !== Symbol.prototype
      ? "symbol"
      : typeof obj;
  }
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly)
      symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
    keys.push.apply(keys, symbols);
  }
  return keys;
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    let source = arguments[i] != null ? arguments[i] : {};
    if (i % 2) {
      ownKeys(source, true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(source).forEach(function (key) {
        Object.defineProperty(
          target,
          key,
          Object.getOwnPropertyDescriptor(source, key)
        );
      });
    }
  }
  return target;
}

function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};
  var target = _objectWithoutPropertiesLoose(source, excluded);
  var key, i;
  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }
  return target;
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;
  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }
  return target;
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  }
  return _assertThisInitialized(self);
}

function _getPrototypeOf(o) {
  return Object.setPrototypeOf
    ? Object.getPrototypeOf(o)
    : o.__proto__ || Object.getPrototypeOf(o);
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError(
      "this hasn't been initialised - super() hasn't been called"
    );
  }
  return self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: { value: subClass, writable: true, configurable: true },
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _setPrototypeOf(o, p) {
  return Object.setPrototypeOf(o, p) || (o.__proto__ = p);
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  } else {
    obj[key] = value;
  }
  return obj;
}

var InputCellContextMenu =
  /*#__PURE__*/
  (function (_Component) {
    _inherits(InputCellContextMenu, _Component);

    function InputCellContextMenu(props, context) {
      var _this;

      _classCallCheck(this, InputCellContextMenu);

      _this = _possibleConstructorReturn(
        this,
        _getPrototypeOf(InputCellContextMenu).call(this, props, context)
      );

      _defineProperty(
        _assertThisInitialized(_this),
        "persistChanges",
        function () {
          var input = _this.props.context.input;
          var unsaved = _this.state.unsaved;

          if (!unsaved) {
            return;
          }

          var inputVariable = unsaved.inputVariable,
            label = unsaved.label,
            inputExpressionProperties = _objectWithoutProperties(unsaved, [
              "inputVariable",
              "label",
            ]);

          var changes = {};

          if ("inputVariable" in unsaved) {
            changes.inputVariable = inputVariable;
          }

          if ("label" in unsaved) {
            changes.label = label;
          }

          if (hasKeys(inputExpressionProperties)) {
            changes.inputExpression = inputExpressionProperties;
          }

          _this.modeling.updateProperties(input, changes);

          _this.setState({
            unsaved: false,
          });
        }
      );

      _defineProperty(
        _assertThisInitialized(_this),
        "handleChange",
        function (changes) {
          _this.setState(
            {
              unsaved: _objectSpread({}, _this.state.unsaved, {}, changes),
            },
            _this.persistChanges
          );
        }
      );

      _this.state = {};
      inject(_assertThisInitialized(_this));
      _this.persistChanges = _this.debounceInput(_this.persistChanges);
      _this._expressionLanguages = context.injector.get("expressionLanguages");
      return _this;
    }

    _createClass(InputCellContextMenu, [
      {
        key: "getValue",
        value: function getValue(attr) {
          var input = this.props.context.input;
          var unsaved = this.state.unsaved;
          var target = input; // input variable stored in parent

          if (attr === "expressionLanguage" || attr === "text") {
            target = target.inputExpression;
          }

          return unsaved && attr in unsaved ? unsaved[attr] : target.get(attr);
        },
      },
      {
        key: "render",
        value: function render() {
          var defaultLanguage = this._expressionLanguages.getDefault(
              "inputHeadCell"
            ),
            expressionLanguages = this._expressionLanguages.getAll();

          return createComponentVNode(2, InputEditor, {
            expressionLanguage:
              this.getValue("expressionLanguage") || defaultLanguage.value,
            expressionLanguages: expressionLanguages,
            defaultExpressionLanguage: defaultLanguage,
            inputVariable: this.getValue("inputVariable"),
            label: this.getValue("label"),
            text: this.getValue("text"),
            onChange: this.handleChange,
          });
        },
      },
    ]);

    return InputCellContextMenu;
  })(Component);

export { InputCellContextMenu as default };
InputCellContextMenu.$inject = ["debounceInput", "modeling", "injector"]; // helpers //////////////////////

function hasKeys(obj) {
  return Object.keys(obj).length;
}
