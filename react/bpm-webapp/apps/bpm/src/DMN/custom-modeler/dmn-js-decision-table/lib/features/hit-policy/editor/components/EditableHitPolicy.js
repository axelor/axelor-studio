import { Component } from "inferno";
import { inject } from "table-js/lib/components";

import { createVNode, createTextVNode } from "inferno";
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

var EditableHitPolicy =
  /*#__PURE__*/
  (function (_Component) {
    _inherits(EditableHitPolicy, _Component);

    function EditableHitPolicy(props, context) {
      var _this;

      _classCallCheck(this, EditableHitPolicy);

      _this = _possibleConstructorReturn(
        this,
        _getPrototypeOf(EditableHitPolicy).call(this, props, context)
      );

      _defineProperty(
        _assertThisInitialized(_this),
        "onChange",
        function (_ref) {
          _this.modeling.editHitPolicy("FIRST", undefined);
        }
      );

      _defineProperty(
        _assertThisInitialized(_this),
        "onElementsChanged",
        function () {
          _this.forceUpdate();
        }
      );

      inject(_assertThisInitialized(_this));
      return _this;
    }

    _createClass(EditableHitPolicy, [
      {
        key: "componentDidMount",
        value: function componentDidMount() {
          this.onChange();
          this.changeSupport.onElementsChanged(
            this.getRoot().id,
            this.onElementsChanged
          );
        },
      },
      {
        key: "componentWillUnmount",
        value: function componentWillUnmount() {
          this.changeSupport.offElementsChanged(
            this.getRoot().id,
            this.onElementsChanged
          );
        },
      },
      {
        key: "getRoot",
        value: function getRoot() {
          return this.sheet.getRoot();
        },
      },
      {
        key: "render",
        value: function render() {
          return createVNode(
            1,
            "div",
            "hit-policy",
            [
              createVNode(
                1,
                "label",
                "dms-label",
                createTextVNode("Hit Policy:"),
                2
              ),
              createVNode(
                1,
                "label",
                "dms-label",
                createTextVNode(translate("First")),
                2
              ),
            ],
            4,
            {
              title: translate(
                "Rules may overlap. The first matching rule will be chosen"
              ),
            }
          );
        },
      },
    ]);

    return EditableHitPolicy;
  })(Component);

export { EditableHitPolicy as default };
EditableHitPolicy.$inject = ["changeSupport", "sheet", "modeling"];
