import { createVNode } from "inferno";
import { Component } from "inferno";
import { mixin } from "table-js/lib/components";
import { ComponentWithSlots } from "dmn-js-shared/lib/components/mixins";

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

function _getPrototypeOf(o) {
  return o.__proto__ || Object.getPrototypeOf(o);
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

var InputCell =
  /*#__PURE__*/
  (function (_Component) {
    _inherits(InputCell, _Component);

    function InputCell(props, context) {
      var _this;

      _classCallCheck(this, InputCell);

      _this = _possibleConstructorReturn(
        this,
        _getPrototypeOf(InputCell).call(this, props, context)
      );

      _defineProperty(
        _assertThisInitialized(_this),
        "onClick",
        function (event) {
          var input = _this.props.input;

          _this._eventBus.fire("input.edit", {
            event: event,
            input: input,
          });
        }
      );

      _defineProperty(
        _assertThisInitialized(_this),
        "onContextmenu",
        function (event) {
          var id = _this.props.input.id;

          _this._eventBus.fire("cell.contextmenu", {
            event: event,
            id: id,
          });
        }
      );

      _defineProperty(
        _assertThisInitialized(_this),
        "onElementsChanged",
        function () {
          _this.forceUpdate();
        }
      );

      mixin(_assertThisInitialized(_this), ComponentWithSlots);
      _this._translate = context.injector.get("translate");
      return _this;
    }

    _createClass(InputCell, [
      {
        key: "componentWillMount",
        value: function componentWillMount() {
          var injector = this.context.injector;
          this._changeSupport = this.context.changeSupport;
          this._sheet = injector.get("sheet");
          this._eventBus = injector.get("eventBus");
          this._elementRegistry = injector.get("elementRegistry");

          var root = this._sheet.getRoot();

          var input = this.props.input;

          this._changeSupport.onElementsChanged(
            root.id,
            this.onElementsChanged
          );

          this._changeSupport.onElementsChanged(
            input.id,
            this.onElementsChanged
          );
        },
      },
      {
        key: "componentWillUnmount",
        value: function componentWillUnmount() {
          var root = this._sheet.getRoot();

          var input = this.props.input;

          this._changeSupport.offElementsChanged(
            root.id,
            this.onElementsChanged
          );

          this._changeSupport.offElementsChanged(
            input.id,
            this.onElementsChanged
          );
        },
      },
      {
        key: "render",
        value: function render() {
          var _this$props = this.props,
            input = _this$props.input,
            index = _this$props.index,
            inputsLength = _this$props.inputsLength;
          var inputExpression = input.inputExpression,
            inputValues = input.inputValues;
          var label = input.get("label");
          var width = input.width ? input.width + "px" : "192px";
          return createVNode(
            1,
            "th",
            "input-cell input-editor",
            [
              this.slotFills({
                type: "cell-inner",
                context: {
                  cellType: "input-cell",
                  col: this._elementRegistry.get(input.id),
                  index: index,
                  inputsLength: inputsLength,
                },
                col: input,
              }),
              createVNode(
                1,
                "div",
                "clause",
                index === 0 ? translate("When") : translate("And"),
                0
              ),
              label
                ? createVNode(1, "div", "input-label", label, 0, {
                    title: translate("Input Label"),
                  })
                : createVNode(
                    1,
                    "div",
                    "input-expression",
                    inputExpression.text,
                    0,
                    {
                      title: translate("Input Expression"),
                    }
                  ),
              createVNode(
                1,
                "div",
                "input-variable",
                (inputValues && inputValues.text) || inputExpression.typeRef,
                0,
                {
                  title:
                    inputValues && inputValues.text
                      ? translate("Input Values")
                      : translate("Input Type"),
                }
              ),
            ],
            0,
            {
              "data-col-id": input.id,
              onClick: this.onClick,
              onContextmenu: this.onContextmenu,
              style: {
                width: width,
              },
            }
          );
        },
      },
    ]);

    return InputCell;
  })(Component);

export { InputCell as default };
