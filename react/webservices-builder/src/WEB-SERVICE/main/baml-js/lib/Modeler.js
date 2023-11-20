import inherits from "inherits";

import BaseModeler from "./BaseModeler";

import Viewer from "./Viewer";
import NavigatedViewer from "./NavigatedViewer";

import KeyboardMoveModule from "diagram-js/lib/navigation/keyboard-move";
import MoveCanvasModule from "diagram-js/lib/navigation/movecanvas";
import TouchModule from "diagram-js/lib/navigation/touch";
import ZoomScrollModule from "diagram-js/lib/navigation/zoomscroll";

import AlignElementsModule from "diagram-js/lib/features/align-elements";
import AutoPlaceModule from "./features/auto-place";
import AutoResizeModule from "./features/auto-resize";
import AutoScrollModule from "diagram-js/lib/features/auto-scroll";
import BendpointsModule from "diagram-js/lib/features/bendpoints";
import ConnectModule from "diagram-js/lib/features/connect";
import ConnectionPreviewModule from "diagram-js/lib/features/connection-preview";
import ContextPadModule from "./features/context-pad";
import CopyPasteModule from "./features/copy-paste";
import CreateModule from "diagram-js/lib/features/create";
import DistributeElementsModule from "./features/distribute-elements";
import EditorActionsModule from "./features/editor-actions";
import GridSnappingModule from "./features/grid-snapping";
import InteractionEventsModule from "./features/interaction-events";
import KeyboardModule from "./features/keyboard";
import KeyboardMoveSelectionModule from "diagram-js/lib/features/keyboard-move-selection";
import LabelEditingModule from "./features/label-editing";
import ModelingModule from "./features/modeling";
import MoveModule from "diagram-js/lib/features/move";
import PaletteModule from "./features/palette";
import ReplacePreviewModule from "./features/replace-preview";
import ResizeModule from "diagram-js/lib/features/resize";
import SnappingModule from "./features/snapping";
import SearchModule from "./features/search";

const initialDiagram = `<?xml version="1.0" encoding="UTF-8"?>
  <process-Actions
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  targetNamespace="http://bpmn.io/schema/bpmn"
  id="Definitions_1">
  <process-Action id="ProcessAction_1">
  </process-Action>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
  <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
  <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
  <dc:Bounds height="36.0" width="36.0" x="173.0" y="102.0"/>
  </bpmndi:BPMNShape>
  </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
  </process-Actions>`;

export default function Modeler(options) {
  BaseModeler.call(this, options);
}

inherits(Modeler, BaseModeler);

Modeler.Viewer = Viewer;
Modeler.NavigatedViewer = NavigatedViewer;

/**
 * Create a new diagram to start modeling.
 *
 * @param {Function} [done]
 */
Modeler.prototype.createDiagram = function (done) {
  return this.importXML(initialDiagram, done);
};

Modeler.prototype._interactionModules = [
  // non-modeling components
  KeyboardMoveModule,
  MoveCanvasModule,
  TouchModule,
  ZoomScrollModule,
];

Modeler.prototype._modelingModules = [
  // modeling components
  AlignElementsModule,
  AutoPlaceModule,
  AutoScrollModule,
  BendpointsModule,
  ConnectModule,
  AutoResizeModule,
  ConnectionPreviewModule,
  ContextPadModule,
  CopyPasteModule,
  CreateModule,
  DistributeElementsModule,
  EditorActionsModule,
  GridSnappingModule,
  InteractionEventsModule,
  KeyboardModule,
  KeyboardMoveSelectionModule,
  LabelEditingModule,
  ModelingModule,
  MoveModule,
  PaletteModule,
  ReplacePreviewModule,
  ResizeModule,
  SnappingModule,
  SearchModule,
];

// modules the modeler is composed of
//
// - viewer modules
// - interaction modules
// - modeling modules

Modeler.prototype._modules = [].concat(
  Viewer.prototype._modules,
  Modeler.prototype._interactionModules,
  Modeler.prototype._modelingModules
);
