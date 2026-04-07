/**
 * ReadOnly module for bpmn-js -- intercepts modeling operations
 * when read-only mode is active and restricts palette entries.
 */
import forEach from "lodash/forEach";

const HIGH_PRIORITY = 10001;

interface EventBus {
  on(event: string, priority: number, callback: (e: ReadOnlyChangedEvent) => void): void;
  fire(event: string, payload: { readOnly: boolean }): void;
}

interface ContextPad {
  open(target: unknown): void;
  close(): void;
}

interface Dragging {
  cancel(): void;
}

interface DirectEditing {
  cancel(): void;
}

interface Interceptable {
  [key: string]: (...args: unknown[]) => unknown;
}

interface Palette {
  _update(): void;
}

interface PaletteEntries {
  [key: string]: unknown;
}

interface PaletteProvider {
  getPaletteEntries(): PaletteEntries;
}

interface ReadOnlyChangedEvent {
  readOnly: boolean;
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
  ] as const;

  _readOnly: boolean;
  _eventBus: EventBus;

  constructor(
    eventBus: EventBus,
    contextPad: ContextPad,
    dragging: Dragging,
    directEditing: DirectEditing,
    _editorActions: unknown,
    modeling: Interceptable,
    palette: Palette,
    paletteProvider: PaletteProvider,
  ) {
    this._readOnly = false;
    this._eventBus = eventBus;

    const isReadOnly = () => this._readOnly;
    eventBus.on("readOnly.changed", HIGH_PRIORITY, (e: ReadOnlyChangedEvent) => {
      this._readOnly = e.readOnly;

      if (e.readOnly) {
        directEditing.cancel();
        contextPad.close();
        dragging.cancel();
      }

      palette._update();
    });

    function intercept(
      obj: Interceptable,
      fnName: string,
      cb: (this: unknown, fn: (...args: unknown[]) => unknown, args: IArguments) => unknown,
    ): void {
      const fn = obj[fnName];
      obj[fnName] = function (this: unknown) {
        // eslint-disable-next-line prefer-rest-params
        return cb.call(this, fn, arguments);
      };
    }

    function ignoreWhenReadOnly(obj: Interceptable, fnName: string): void {
      intercept(obj, fnName, function (this: unknown, fn, args) {
        if (isReadOnly()) {
          return;
        }
        return fn.apply(this, Array.from(args));
      });
    }

    function throwIfReadOnly(obj: Interceptable, fnName: string): void {
      intercept(obj, fnName, function (this: unknown, fn, args) {
        if (isReadOnly()) {
          return;
        }
        return fn.apply(this, Array.from(args));
      });
    }

    ignoreWhenReadOnly(contextPad as unknown as Interceptable, "open"); // safety: bpmn-js service type differs from Interceptable interface

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
    throwIfReadOnly(modeling, "createSpace");
    throwIfReadOnly(modeling, "updateWaypoints");
    throwIfReadOnly(modeling, "reconnectStart");
    throwIfReadOnly(modeling, "reconnectEnd");

    intercept(
      paletteProvider as unknown as Interceptable, // safety: bpmn-js service type differs from Interceptable interface
      "getPaletteEntries",
      function (this: unknown, fn, args) {
        const entries = fn.apply(this, Array.from(args)) as PaletteEntries;
        if (isReadOnly()) {
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
