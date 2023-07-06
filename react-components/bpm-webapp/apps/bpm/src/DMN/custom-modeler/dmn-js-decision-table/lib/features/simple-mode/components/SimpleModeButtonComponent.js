import { createVNode } from "inferno";
import { Component } from "inferno";
import { assign } from "min-dash";
import { closest as domClosest } from "min-dom";
import { getNodeById } from "dmn-js-decision-table/lib/features/cell-selection/CellSelectionUtil";
import { isInput, isOutput } from "dmn-js-shared/lib/util/ModelUtil";
import { translate } from "../../../../../../../utils";

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

var OFFSET = 4;

var SimpleModeButtonComponent =
  /*#__PURE__*/
  (function (_Component) {
    _inherits(SimpleModeButtonComponent, _Component);

    function SimpleModeButtonComponent(props, context) {
      var _this;

      _classCallCheck(this, SimpleModeButtonComponent);

      _this = _possibleConstructorReturn(
        this,
        _getPrototypeOf(SimpleModeButtonComponent).call(this, props, context)
      );
      _this.state = {
        top: 0,
        left: 0,
        isVisible: false,
        isDisabled: true,
      };
      var injector = context.injector;
      var eventBus = (_this._eventBus = injector.get("eventBus")),
        simpleMode = injector.get("simpleMode"),
        elementRegistry = context.injector.get("elementRegistry"),
        expressionLanguages = context.injector.get("expressionLanguages");
      _this._renderer = injector.get("renderer");
      _this._selection = context.injector.get("selection");
      _this.updatePosition = _this.updatePosition.bind(
        _assertThisInitialized(_this)
      );
      eventBus.on("cellSelection.changed", function (_ref) {
        var elementId = _ref.elementId;
        var selection = elementRegistry.get(elementId);

        if (!selection || !simpleMode.canSimpleEdit(selection)) {
          _this.setState({
            isVisible: false,
          });

          return;
        }

        _this.setState(
          {
            isVisible: false,
            selection: selection,
          },
          _this.updatePosition
        );

        var expressionLanguage = getExpressionLanguage(selection);
        var isDisabled = !isDefaultExpressionLanguage(
          selection,
          expressionLanguage,
          expressionLanguages
        );

        _this.setState(
          {
            isVisible: false,
            selection: selection,
            isDisabled: isDisabled,
          },
          _this.updatePosition
        );
      });
      _this.onClick = _this.onClick.bind(_assertThisInitialized(_this));
      return _this;
    } // position button always on opposite site of context menu

    _createClass(SimpleModeButtonComponent, [
      {
        key: "updatePosition",
        value: function updatePosition() {
          var selection = this.state.selection;
          var node = this.node;

          if (!selection || !node) {
            return;
          }

          var container = this._renderer.getContainer(),
            containerBounds = container.getBoundingClientRect();

          var cellNode = getNodeById(selection.id, container);
          var cellBounds = cellNode.getBoundingClientRect();
          var nodeBounds = this.node.getBoundingClientRect();

          var _getTableContainerScr = getTableContainerScroll(node),
            scrollLeft = _getTableContainerScr.scrollLeft,
            scrollTop = _getTableContainerScr.scrollTop;

          var nodePosition = {};

          if (
            cellBounds.left + cellBounds.width / 2 >
            containerBounds.width / 2
          ) {
            // left
            nodePosition.left =
              -containerBounds.left +
              cellBounds.left -
              nodeBounds.width +
              OFFSET +
              scrollLeft +
              "px";
            node.classList.remove("right");
            node.classList.add("left");
          } else {
            // right
            nodePosition.left =
              -containerBounds.left +
              cellBounds.left +
              cellBounds.width -
              OFFSET +
              scrollLeft +
              "px";
            node.classList.remove("left");
            node.classList.add("right");
          }

          if (
            cellBounds.top + cellBounds.height / 2 >
            containerBounds.height / 2
          ) {
            // bottom
            nodePosition.top =
              -containerBounds.top +
              cellBounds.top -
              nodeBounds.height +
              OFFSET +
              scrollTop +
              "px";
            node.classList.remove("top");
            node.classList.add("bottom");
          } else {
            // top
            nodePosition.top =
              -containerBounds.top + cellBounds.top - OFFSET + scrollTop + "px";
            node.classList.remove("bottom");
            node.classList.add("top");
          }

          assign(this.node.style, nodePosition);
        },
      },
      {
        key: "onClick",
        value: function onClick() {
          var isDisabled = this.state.isDisabled;

          if (isDisabled) {
            return;
          }

          var element = this._selection.get();

          if (!element) {
            return;
          }

          this._eventBus.fire("simpleMode.open", {
            element: element,
            node: getNodeById(element.id, this._container),
          });

          this.setState({
            isVisible: false,
          });
        },
      },
      {
        key: "render",
        value: function render() {
          var _this2 = this;

          var _this$state = this.state,
            isDisabled = _this$state.isDisabled,
            isVisible = _this$state.isVisible,
            top = _this$state.top,
            left = _this$state.left;
          var classes = ["simple-mode-button", "no-deselect"];

          if (isDisabled) {
            classes.push("disabled");
          }

          return isVisible
            ? createVNode(
                1,
                "div",
                classes.join(" "),
                createVNode(1, "span", "dmn-icon-edit"),
                2,
                {
                  onClick: this.onClick,
                  style: {
                    top: top,
                    left: left,
                  },
                  title: isDisabled
                    ? translate(
                        "Editing not supported for set expression language"
                      )
                    : translate("Edit"),
                },
                null,
                function (node) {
                  return (_this2.node = node);
                }
              )
            : null;
        },
      },
    ]);

    return SimpleModeButtonComponent;
  })(Component); // helpers //////////////////////

/**
 * Return set expression language if found.
 *
 * @param {Cell} cell - Cell.
 */

export { SimpleModeButtonComponent as default };

function getExpressionLanguage(cell) {
  return cell.businessObject.expressionLanguage;
}

function isDefaultExpressionLanguage(
  cell,
  expressionLanguage,
  expressionLanguages
) {
  return (
    !expressionLanguage ||
    expressionLanguage ===
      getDefaultExpressionLanguage(cell, expressionLanguages)
  );
}

function getDefaultExpressionLanguage(cell, expressionLanguages) {
  if (isInput(cell.col)) {
    return expressionLanguages.getDefault("inputCell").value;
  } else if (isOutput(cell.col)) {
    return expressionLanguages.getDefault("outputCell").value;
  }
}

function getTableContainerScroll(node) {
  var tableContainer = domClosest(node, ".tjs-table-container");

  if (!tableContainer) {
    return {
      scrollTop: 0,
      scrollLeft: 0,
    };
  }

  var scrollLeft = tableContainer.scrollLeft,
    scrollTop = tableContainer.scrollTop;
  return {
    scrollTop: scrollTop,
    scrollLeft: scrollLeft,
  };
}
