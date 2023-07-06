import { Component } from "inferno";
import ContentEditable from "dmn-js-shared/lib/components/ContentEditable";
import { createVNode, createComponentVNode } from "inferno";
import { translate } from "../../../../../../../../utils";

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

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError(
      "this hasn't been initialised - super() hasn't been called"
    );
  }
  return self;
}

function _getPrototypeOf(o) {
  return o.__proto__ || Object.getPrototypeOf(o);
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

var InputEditor =
  /*#__PURE__*/
  (function (_Component) {
    _inherits(InputEditor, _Component);

    function InputEditor(props, context) {
      var _this;

      _classCallCheck(this, InputEditor);

      _this = _possibleConstructorReturn(
        this,
        _getPrototypeOf(InputEditor).call(this, props, context)
      );
      _this.translate = context.injector
        ? context.injector.get("translate")
        : noopTranslate;
      var defaultExpressionLanguage = props.defaultExpressionLanguage.value;

      _this.setExpressionLanguage = function (expressionLanguage) {
        _this.handleChange({
          expressionLanguage: expressionLanguage,
        });
      };

      _this.handleValue = function (text) {
        var expressionLanguage = _this.props.expressionLanguage;
        var change = {
          text: text,
        };

        if (isMultiLine(text) && !expressionLanguage) {
          change.expressionLanguage = defaultExpressionLanguage;
        }

        if (
          !isMultiLine(text) &&
          expressionLanguage === defaultExpressionLanguage
        ) {
          change.expressionLanguage = undefined;
        }

        _this.handleChange(change);
      };

      _this.handleLanguageChange = function (language) {
        _this.setExpressionLanguage(language);
      };

      _this.handleLabelChange = function (value) {
        // default to <undefined> for empty string
        var label = value || undefined;

        _this.handleChange({
          label: label,
        });
      };

      _this.handleInputVariableChange = function (value) {
        // default to <undefined> for empty string
        var inputVariable = value || undefined;

        _this.handleChange({
          inputVariable: inputVariable,
        });
      };

      return _this;
    }

    _createClass(InputEditor, [
      {
        key: "handleChange",
        value: function handleChange(changes) {
          var onChange = this.props.onChange;

          if (typeof onChange === "function") {
            onChange(changes);
          }
        },
      },
      {
        key: "render",
        value: function render() {
          var _this$props = this.props,
            label = _this$props.label;
          return createVNode(
            1,
            "div",
            "context-menu-container ref-input-editor input-edit custom-context-edit",
            [
              createVNode(
                1,
                "div",
                "dms-form-control",
                createComponentVNode(2, ContentEditable, {
                  className: "dms-input-label",
                  value: label || "",
                  placeholder: translate("Input"),
                  singleLine: true,
                  onInput: this.handleLabelChange,
                }),
                2
              ),
            ],
            4
          );
        },
      },
    ]);

    return InputEditor;
  })(Component);

export { InputEditor as default };

function isMultiLine(text) {
  return text && text.split(/\n/).length > 1;
}

function noopTranslate(str) {
  return str;
}
