import SimpleModeButtonComponent from "./components/SimpleModeButtonComponent";
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

var SimpleMode =
  /*#__PURE__*/
  (function () {
    function SimpleMode(
      components,
      contextMenu,
      elementRegistry,
      eventBus,
      renderer
    ) {
      _classCallCheck(this, SimpleMode);

      this._providers = [];
      components.onGetComponent("table.before", function () {
        return SimpleModeButtonComponent;
      });
      eventBus.on("simpleMode.open", function (_ref) {
        var element = _ref.element,
          node = _ref.node;

        var _node$getBoundingClie = node.getBoundingClientRect(),
          left = _node$getBoundingClie.left,
          top = _node$getBoundingClie.top,
          width = _node$getBoundingClie.width,
          height = _node$getBoundingClie.height;

        var container = renderer.getContainer();
        contextMenu.open(
          {
            x: left + container.parentNode.scrollLeft,
            y: top + container.parentNode.scrollTop,
            width: width,
            height: height,
          },
          {
            contextMenuType: "simple-mode-edit",
            element: element,
            offset: {
              x: 4,
              y: 4,
            },
          }
        );
      });
      eventBus.on("cell.click", function (e) {
        var event = e.event,
          node = e.node,
          id = e.id;

        if (isCmd(event)) {
          var element = elementRegistry.get(id);

          if (element) {
            eventBus.fire("simpleMode.open", {
              node: node,
              element: element,
            });
          } // prevent focus

          e.preventDefault();
        }
      });
    }

    _createClass(SimpleMode, [
      {
        key: "registerProvider",
        value: function registerProvider(provider) {
          this._providers.push(provider);
        },
      },
      {
        key: "canSimpleEdit",
        value: function canSimpleEdit(element) {
          return this._providers.reduce(function (canSimpleEdit, provider) {
            return canSimpleEdit || provider(element);
          }, false);
        },
      },
    ]);

    return SimpleMode;
  })();

export { SimpleMode as default };
SimpleMode.$inject = [
  "components",
  "contextMenu",
  "elementRegistry",
  "eventBus",
  "renderer",
]; // helpers //////////

export function isCmd(event) {
  // ensure we don't react to AltGr
  // (mapped to CTRL + ALT)
  if (event.altKey) {
    return false;
  }

  return event.ctrlKey || event.metaKey;
}
