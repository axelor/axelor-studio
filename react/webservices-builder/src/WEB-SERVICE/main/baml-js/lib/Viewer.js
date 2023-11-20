import inherits from "inherits";

import CoreModule from "./core";
import TranslateModule from "diagram-js/lib/i18n/translate";
import SelectionModule from "diagram-js/lib/features/selection";
import OverlaysModule from "diagram-js/lib/features/overlays";

import BaseViewer from "./BaseViewer";

/**
 * @param {Object} [options] configuration options to pass to the viewer
 * @param {DOMElement} [options.container] the container to render the viewer in, defaults to body.
 * @param {String|Number} [options.width] the width of the viewer
 * @param {String|Number} [options.height] the height of the viewer
 * @param {Object} [options.moddleExtensions] extension packages to provide
 * @param {Array<didi.Module>} [options.modules] a list of modules to override the default modules
 * @param {Array<didi.Module>} [options.additionalModules] a list of modules to use with the default modules
 */
export default function Viewer(options) {
  BaseViewer.call(this, options);
}

inherits(Viewer, BaseViewer);

// modules the viewer is composed of
Viewer.prototype._modules = [
  CoreModule,
  TranslateModule,
  SelectionModule,
  OverlaysModule,
];

// default moddle extensions the viewer is composed of
Viewer.prototype._moddleExtensions = {};
