import forEach from "lodash/forEach";

const HIGH_PRIORITY = 10001;

interface DiService {
  [method: string]: (...args: unknown[]) => unknown;
}

export default class ReadOnly {
  static $inject = [
    "eventBus",
    "contextPad",
    "dragging",
    "directEditing",
    "editorActions",
    "modeling",
    "palette",
    "paletteProvider",
  ];

  private _readOnly = false;
  private readonly _eventBus: DiService;

  constructor(
    eventBus: DiService,
    contextPad: DiService,
    dragging: DiService,
    directEditing: DiService,
    _editorActions: DiService,
    modeling: DiService,
    palette: DiService & { _update: () => void },
    paletteProvider: DiService & {
      getPaletteEntries: (...args: unknown[]) => Record<string, unknown>;
    },
  ) {
    this._eventBus = eventBus;

    const self = this;
    eventBus.on("readOnly.changed", HIGH_PRIORITY, function (e: { readOnly: boolean }) {
      self._readOnly = e.readOnly;

      if (e.readOnly) {
        directEditing.cancel();
        contextPad.close();
        dragging.cancel();
      }

      palette._update();
    });

    function intercept(
      obj: DiService,
      fnName: string,
      cb: (this: unknown, fn: (...args: unknown[]) => unknown, args: IArguments) => unknown,
    ) {
      const fn = obj[fnName];
      obj[fnName] = function (this: unknown) {
        // eslint-disable-next-line prefer-rest-params -- legacy interceptor pattern requires arguments object
        return cb.call(this, fn, arguments);
      };
    }

    function ignoreWhenReadOnly(obj: DiService, fnName: string) {
      intercept(obj, fnName, function (this: unknown, fn, args) {
        if (self._readOnly) {
          return;
        }
        return fn.apply(this, args as unknown as unknown[]); // safety: IArguments is not assignable to unknown[]
      });
    }

    function throwIfReadOnly(obj: DiService, fnName: string) {
      intercept(obj, fnName, function (this: unknown, fn, args) {
        if (self._readOnly) {
          return;
        }
        return fn.apply(this, args as unknown as unknown[]); // safety: IArguments is not assignable to unknown[]
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

    intercept(
      paletteProvider as DiService, // safety: intersection type requires narrowing to DiService
      "getPaletteEntries",
      function (this: unknown, fn, args) {
        const entries = fn.apply(this, args as unknown as unknown[]) as Record<string, unknown>; // safety: IArguments is not assignable to unknown[]
        if (self._readOnly) {
          const allowedEntries = ["hand-tool"];

          forEach(entries, function (_value: unknown, key: string) {
            if (allowedEntries.indexOf(key) === -1) {
              delete entries[key];
            }
          });
        }
        return entries;
      },
    );
  }

  readOnly(readOnly?: boolean): boolean {
    const newValue = !!readOnly;
    const oldValue = !!this._readOnly;

    if (readOnly === undefined || newValue === oldValue) {
      return oldValue;
    }

    this._readOnly = newValue;
    this._eventBus.fire("readOnly.changed", { readOnly: newValue });
    return newValue;
  }
}
