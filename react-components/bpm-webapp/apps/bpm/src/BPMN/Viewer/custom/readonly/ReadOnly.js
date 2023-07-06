import forEach from "lodash/forEach";

const HIGH_PRIORITY = 10001;

export default function ReadOnly(
  eventBus,
  contextPad,
  dragging,
  directEditing,
  editorActions,
  modeling,
  palette,
  paletteProvider
) {
  this._readOnly = false;
  this._eventBus = eventBus;

  let self = this;
  eventBus.on("readOnly.changed", HIGH_PRIORITY, function (e) {
    self._readOnly = e.readOnly;

    if (e.readOnly) {
      directEditing.cancel();
      contextPad.close();
      dragging.cancel();
    }

    palette._update();
  });

  function intercept(obj, fnName, cb) {
    let fn = obj[fnName];
    obj[fnName] = function () {
      return cb.call(this, fn, arguments);
    };
  }

  function ignoreWhenReadOnly(obj, fnName) {
    intercept(obj, fnName, function (fn, args) {
      if (self._readOnly) {
        return;
      }

      return fn.apply(this, args);
    });
  }

  function throwIfReadOnly(obj, fnName) {
    intercept(obj, fnName, function (fn, args) {
      if (self._readOnly) {
        return;
      }

      return fn.apply(this, args);
    });
  }

  ignoreWhenReadOnly(contextPad, "open");
  ignoreWhenReadOnly(dragging, "init");
  ignoreWhenReadOnly(directEditing, "activate");

  throwIfReadOnly(modeling, "moveShape");
  throwIfReadOnly(modeling, "updateAttachment");
  throwIfReadOnly(modeling, "moveElements");
  throwIfReadOnly(modeling, "moveConnection");
  throwIfReadOnly(modeling, "layoutConnection");
  throwIfReadOnly(modeling, "createConnection");
  throwIfReadOnly(modeling, "createShape");
  throwIfReadOnly(modeling, "createLabel");
  throwIfReadOnly(modeling, "appendShape");
  throwIfReadOnly(modeling, "removeElements");
  throwIfReadOnly(modeling, "distributeElements");
  throwIfReadOnly(modeling, "removeShape");
  throwIfReadOnly(modeling, "removeConnection");
  throwIfReadOnly(modeling, "replaceShape");
  throwIfReadOnly(modeling, "pasteElements");
  throwIfReadOnly(modeling, "alignElements");
  throwIfReadOnly(modeling, "resizeShape");
  throwIfReadOnly(modeling, "createSpace");
  throwIfReadOnly(modeling, "updateWaypoints");
  throwIfReadOnly(modeling, "reconnectStart");
  throwIfReadOnly(modeling, "reconnectEnd");

  intercept(paletteProvider, "getPaletteEntries", function (fn, args) {
    let entries = fn.apply(this, args);
    if (self._readOnly) {
      let allowedEntries = ["hand-tool"];

      forEach(entries, function (value, key) {
        if (allowedEntries.indexOf(key) === -1) {
          delete entries[key];
        }
      });
    }
    return entries;
  });
}

ReadOnly.$inject = [
  "eventBus",
  "contextPad",
  "dragging",
  "directEditing",
  "editorActions",
  "modeling",
  "palette",
  "paletteProvider",
];

ReadOnly.prototype.readOnly = function (readOnly) {
  let newValue = !!readOnly,
    oldValue = !!this._readOnly;

  if (readOnly === undefined || newValue === oldValue) {
    return oldValue;
  }

  this._readOnly = newValue;
  this._eventBus.fire("readOnly.changed", { readOnly: newValue });
  return newValue;
};
