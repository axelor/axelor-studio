import { useMemo } from "react";
import { translate } from "@studio/shared/i18n";
import type { TypedBpmnModeler } from "@studio/shared/types";

import { uploadXml, saveSVG, downloadXml } from "../extra";
import { openWebApp } from "../properties/parts/CustomImplementation/utils";
import type { WkfModel } from "../stores/useWkfStore";

interface ToolbarItem {
  key: string;
  iconOnly: boolean;
  description: string;
  iconProps: { icon: string };
  onClick: (...args: unknown[]) => void;
  disable?: boolean;
}

interface UseToolbarItemsParams {
  onNew: () => void;
  onSave: () => void;
  onDelete: () => void;
  onRefresh: () => void;
  deployDiagram: () => void;
  addDiagramProperties: () => void;
  toggleXmlEditor: () => void;
  toggleMinimap: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetViewport: () => void;
  enterFullscreen: () => void;
  wkf: WkfModel | null;
  id: number | string | null;
  bpmnModeler: TypedBpmnModeler | null;
}

interface UseToolbarItemsReturn {
  leftToolbar: ToolbarItem[];
  rightToolbar: ToolbarItem[];
  bottomToolbar: ToolbarItem[];
}

/**
 * Hook that builds the toolbar item arrays for the BpmnModeler CommandBars.
 */
export function useToolbarItems({
  onNew,
  onSave,
  onDelete,
  onRefresh,
  deployDiagram,
  addDiagramProperties,
  toggleXmlEditor,
  toggleMinimap,
  zoomIn,
  zoomOut,
  resetViewport,
  enterFullscreen,
  wkf,
  id,
  bpmnModeler,
}: UseToolbarItemsParams): UseToolbarItemsReturn {
  const leftToolbar = useMemo(
    () => [
      {
        key: "new",
        iconOnly: true,
        description: translate("Add new"),
        iconProps: {
          icon: "add",
        },
        onClick: () => onNew(),
      },
      {
        key: "save",
        iconOnly: true,
        description: translate("Save"),
        iconProps: {
          icon: "save",
        },
        onClick: onSave,
      },
      {
        key: "delete",
        iconOnly: true,
        description: translate("Delete"),
        iconProps: {
          icon: "delete",
        },
        onClick: onDelete,
      },
      {
        key: "refresh",
        iconOnly: true,
        description: translate("Refresh"),
        iconProps: {
          icon: "refresh",
        },
        onClick: onRefresh,
      },
      {
        key: "deploy",
        iconOnly: true,
        description: wkf && wkf.statusSelect === 1 ? translate("Start") : translate("Deploy"),
        iconProps: {
          icon: "rocket",
        },
        onClick: deployDiagram,
        disable: id ? false : true,
      },
      {
        key: "properties",
        iconOnly: true,
        description: translate("Show diagram properties"),
        iconProps: {
          icon: "menu",
        },
        onClick: addDiagramProperties,
      },
      {
        key: "xmlEditor",
        iconOnly: true,
        description: translate("Toggle XML Editor"),
        iconProps: { icon: "code" },
        onClick: toggleXmlEditor,
      },
    ],
    [
      onNew,
      onSave,
      onDelete,
      onRefresh,
      deployDiagram,
      addDiagramProperties,
      toggleXmlEditor,
      wkf,
      id,
    ],
  );

  const rightToolbar = useMemo(
    () => [
      {
        key: "upload",
        iconOnly: true,
        description: translate("Upload"),
        iconProps: { icon: "upload" },
        onClick: uploadXml,
      },
      {
        key: "download",
        iconOnly: true,
        description: translate("Download"),
        iconProps: { icon: "download" },
        onClick: () => downloadXml(bpmnModeler, wkf?.name),
      },
      {
        key: "image",
        iconOnly: true,
        description: translate("Download SVG"),
        iconProps: { icon: "photo" },
        onClick: () => saveSVG(bpmnModeler, wkf?.name),
      },
      {
        key: "split",
        iconOnly: true,
        description: translate("Split"),
        iconProps: { icon: "splitScreen" },
        onClick: () =>
          openWebApp(`bpm-merge-split/?type=split&id=${id}`, translate("Split editor")),
      },
      {
        key: "merge",
        iconOnly: true,
        description: translate("Merge"),
        iconProps: { icon: "vertical_split" },
        onClick: () =>
          openWebApp(`bpm-merge-split/?type=merge&id=${id}`, translate("Merge editor")),
      },
    ],
    [bpmnModeler, wkf, id],
  );

  const bottomToolbar = useMemo(
    () => [
      {
        key: "minimap",
        iconOnly: true,
        description: translate("Toggle Minimap"),
        iconProps: { icon: "map" },
        onClick: toggleMinimap,
      },
      {
        key: "zoomIn",
        iconOnly: true,
        description: translate("Zoom In"),
        iconProps: { icon: "add" },
        onClick: zoomIn,
      },
      {
        key: "zoomOut",
        iconOnly: true,
        description: translate("Zoom Out"),
        iconProps: { icon: "remove" },
        onClick: zoomOut,
      },
      {
        key: "resetViewport",
        iconOnly: true,
        description: translate("Reset Viewport"),
        iconProps: { icon: "restart_alt" },
        onClick: resetViewport,
      },
      {
        key: "fullscreen",
        iconOnly: true,
        description: translate("Enter Fullscreen"),
        iconProps: { icon: "fullscreen" },
        onClick: enterFullscreen,
      },
    ],
    [toggleMinimap, zoomIn, zoomOut, resetViewport, enterFullscreen],
  );

  return { leftToolbar, rightToolbar, bottomToolbar };
}
