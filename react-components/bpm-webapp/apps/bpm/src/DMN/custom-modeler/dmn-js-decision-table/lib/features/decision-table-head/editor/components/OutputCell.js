import { Component } from "inferno";
import { mixin } from "table-js/lib/components";
import { ComponentWithSlots } from "dmn-js-shared/lib/components/mixins";
import { createVNode } from "inferno";
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

var OutputCell =
  /*#__PURE__*/
  (function (_Component) {
    _inherits(OutputCell, _Component);

    function OutputCell(props, context) {
      var _this;

      _classCallCheck(this, OutputCell);

      _this = _possibleConstructorReturn(
        this,
        _getPrototypeOf(OutputCell).call(this, props, context)
      );

      _defineProperty(
        _assertThisInitialized(_this),
        "onClick",
        function (event) {
          var output = _this.props.output;

          _this._eventBus.fire("output.edit", {
            event: event,
            output: output,
          });
        }
      );

      _defineProperty(
        _assertThisInitialized(_this),
        "onContextmenu",
        function (event) {
          var id = _this.props.output.id;

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

    _createClass(OutputCell, [
      {
        key: "componentWillMount",
        value: function componentWillMount() {
          var injector = this.context.injector;
          this._changeSupport = this.context.changeSupport;
          this._eventBus = injector.get("eventBus");
          this._elementRegistry = injector.get("elementRegistry");
          var output = this.props.output;

          this._changeSupport.onElementsChanged(
            output.id,
            this.onElementsChanged
          );
        },
      },
      {
        key: "componentWillUnmount",
        value: function componentWillUnmount() {
          var output = this.props.output;

          this._changeSupport.offElementsChanged(
            output.id,
            this.onElementsChanged
          );
        },
      },
      {
        key: "render",
        value: function render() {
          var _this$props = this.props,
            output = _this$props.output,
            index = _this$props.index,
            outputsLength = _this$props.outputsLength;
          var label = output.label,
            name = output.name,
            outputValues = output.outputValues,
            typeRef = output.typeRef;
          var width = output.width ? output.width + "px" : "192px";
          return createVNode(
            1,
            "th",
            "output-cell output-editor",
            [
              this.slotFills({
                type: "cell-inner",
                context: {
                  cellType: "output-cell",
                  col: this._elementRegistry.get(output.id),
                  index: index,
                  outputsLength: outputsLength,
                },
                col: output,
              }),
              createVNode(
                1,
                "div",
                "clause",
                index === 0 ? translate("Then") : translate("And"),
                0
              ),
              label
                ? createVNode(1, "div", "output-label", label, 0, {
                    title: translate("Output Label"),
                  })
                : createVNode(1, "div", "output-name", name, 0, {
                    title: translate("Output Name"),
                  }),
              createVNode(
                1,
                "div",
                "output-variable",
                (outputValues && outputValues.text) || typeRef,
                0,
                {
                  title:
                    outputValues && outputValues.text
                      ? translate("Output Values")
                      : translate("Output Type"),
                }
              ),
            ],
            0,
            {
              "data-col-id": output.id,
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

    return OutputCell;
  })(Component);

export { OutputCell as default };
