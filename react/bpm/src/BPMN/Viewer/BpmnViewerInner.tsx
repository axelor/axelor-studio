import React, { useState, useEffect, useMemo } from "react";
import Service from "@studio/shared/services/Service";
import { translate } from "@studio/shared/i18n";
import type BpmnModelerCtor from "bpmn-js/lib/Modeler";
import { Box, CommandBar } from "@axelor/ui";

import { download } from "../../utils";
import { Logo } from "../../components/Logo";
import Alert from "../../components/Alert";

import { useViewerDiagram, fetchId } from "./hooks/useViewerDiagram";
import { useViewerEvents } from "./hooks/useViewerEvents";
type BpmnModeler = InstanceType<typeof BpmnModelerCtor>;


import styles from "./bpmn-viewer.module.css";

interface BpmnViewerInnerProps {
  isInstance: boolean;
  viewerRef: React.MutableRefObject<BpmnModeler | null>;
  viewer: BpmnModeler | null;
}

interface SnackbarState {
  open: boolean;
  messageType: string | null;
  message: string | null;
}

export default function BpmnViewerInner({ isInstance, viewerRef, viewer }: BpmnViewerInnerProps) {
  const [node, setNode] = useState<Record<string, unknown> | null>(null);
  const [id, setId] = useState<string | undefined>(undefined);
  const [openSnackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    messageType: null,
    message: null,
  });
  const [activityIds, setActivityIds] = useState<string[] | null>(null);
  const [taskIds, setTaskIds] = useState<string[] | undefined>(undefined);
  const [activityCounts, setActivityCounts] = useState<string | undefined>(undefined);
  const [activeProcessId, setActiveProcessId] = useState<string | undefined>(undefined);

  const { fetchDiagram, fetchInstanceDiagram } = useViewerDiagram(viewerRef);

  // Set up viewer events (element.click, shape.changed)
  useViewerEvents(
    viewer,
    isInstance,
    taskIds ?? null,
    activityCounts ?? null,
    setNode,
    setActiveProcessId,
  );

  const zoomIn = () => {
    (
      viewerRef.current?.get("zoomScroll") as Record<string, (...args: unknown[]) => unknown>
    )?.stepZoom(1);
  };

  const zoomOut = () => {
    (
      viewerRef.current?.get("zoomScroll") as Record<string, (...args: unknown[]) => unknown>
    )?.stepZoom(-1);
  };

  const resetZoom = () => {
    (viewerRef.current?.get("canvas") as Record<string, (...args: unknown[]) => unknown>)?.zoom(
      "fit-viewport",
    );
  };

  const saveSVG = async () => {
    if (!viewerRef.current) return;
    const { svg } = await viewerRef.current.saveSVG({ format: true });
    download(svg, "diagram.svg", false);
  };

  const commandItems = [
    {
      key: "download",
      iconOnly: true,
      description: translate("Download SVG"),
      iconProps: { icon: "photo" },
      onClick: saveSVG,
    },
    {
      key: "zoom-in",
      iconOnly: true,
      description: translate("Zoom in"),
      iconProps: { icon: "add" },
      onClick: zoomIn,
    },
    {
      key: "zoom-out",
      iconOnly: true,
      description: translate("Zoom out"),
      iconProps: { icon: "remove" },
      onClick: zoomOut,
    },
    {
      key: "zoom-reset",
      iconOnly: true,
      description: translate("Reset zoom"),
      iconProps: { icon: "refresh" },
      onClick: resetZoom,
    },
  ];

  const handleSnackbarClick = (messageType: string, message: string) => {
    setSnackbar({
      open: true,
      messageType,
      message,
    });
  };

  const handleSnackbarClose = (...args: unknown[]) => {
    const reason = args[1] as string | undefined;
    if (reason === "clickaway") {
      return;
    }
    setSnackbar({
      open: false,
      messageType: null,
      message: null,
    });
  };

  const restartBefore = async () => {
    if (!isInstance || !node || !activityIds || !activityIds.includes(node.id as string)) return;
    const actionRes = await Service.action({
      model: "com.axelor.studio.db.WkfModel",
      action: "action-wkf-instance-method-restart-instance",
      data: {
        context: {
          _model: "com.axelor.studio.db.WkfModel",
          processInstanceId: id,
          activityId: node && node.id,
          processId: activeProcessId,
        },
      },
    });
    const firstData = actionRes?.data?.[0];
    if (actionRes?.status === 0 && firstData && !firstData.error) {
      handleSnackbarClick("success", "Restarted successfully");
      const updatedUrl = (firstData.values as { updatedUrl?: string } | undefined)?.updatedUrl;
      const params = fetchId(true, updatedUrl);
      fetchInstanceDiagram(params.id, params.taskIds, params.activityCounts, params.errorNode);
    } else {
      handleSnackbarClick(
        "danger",
        firstData?.error?.message ||
          actionRes?.errors?.message ||
          actionRes?.errors?.title ||
          "Error",
      );
    }
    setNode(null);
  };

  const cancelNode = async () => {
    if (!isInstance || !node || !(taskIds && taskIds.includes(node.id as string))) return;
    const actionRes = await Service.action({
      model: "com.axelor.studio.db.WkfModel",
      action: "action-wkf-instance-method-cancel-node",
      data: {
        context: {
          _model: "com.axelor.studio.db.WkfModel",
          processInstanceId: id,
          activityId: node && node.id,
          processId: activeProcessId,
        },
      },
    });
    if (actionRes?.status === 0) {
      handleSnackbarClick("success", "Cancelled successfully");
      fetchInstanceDiagram(id, taskIds, activityCounts);
    } else {
      handleSnackbarClick(
        "danger",
        actionRes?.errors?.message ||
          actionRes?.errors?.title ||
          "Error",
      );
    }
    setNode(null);
  };

  // Load diagram once the viewer instance is ready
  useEffect(() => {
    if (!viewer) return;
    const params = fetchId(isInstance) || {};
    setId(params.id);
    setTaskIds(params.taskIds);
    setActivityCounts(params.activityCounts);
    if (isInstance) {
      const activities = (params.activityCounts && params.activityCounts.split(",")) || [];
      const ids: string[] = [];
      activities?.forEach((activity: string) => {
        const taskActivity = activity?.split(":");
        if (taskActivity?.length) {
          ids.push(taskActivity[0]);
        }
      });
      setActivityIds(ids);
      fetchInstanceDiagram(params.id, params.taskIds, params.activityCounts, params.errorNode);
    } else {
      fetchDiagram(params.id, params.taskIds ?? null, params.activityCounts, params.errorNode);
    }
  }, [viewer, isInstance, fetchDiagram, fetchInstanceDiagram]);

  const getItems = useMemo(() => {
    return !isInstance
      ? commandItems
      : activityIds?.includes(node?.id as string)
        ? [
            ...commandItems,
            {
              key: "restart",
              text: translate("Restart"),
              onClick: restartBefore,
            },
          ]
        : taskIds?.includes(node?.id as string)
          ? [
              ...commandItems,
              {
                key: "cancel",
                text: translate("Cancel node"),
                onClick: cancelNode,
              },
            ]
          : commandItems;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInstance, activityIds, taskIds, node]);

  return (
    <React.Fragment>
      <Box d="flex" position="absolute" className={styles.container}>
        {/* @ts-expect-error -- safety: @axelor/ui CommandBar items type mismatch with mixed item shapes */}
        <CommandBar items={getItems} className={styles.commandButtons} />
      </Box>
      <div id="canvas-task"></div>
      {openSnackbar.open && (
        <Alert
          open={openSnackbar.open}
          messageType={openSnackbar.messageType}
          message={openSnackbar.message}
          onClose={handleSnackbarClose}
        />
      )}
      <Logo />
    </React.Fragment>
  );
}
