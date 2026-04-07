/**
 * Instance detail page (D-10).
 *
 * Route: /process/:processId/instance/:instanceId
 * Full-height BPMN viewer with NodeDetailPanel slide-in on node click.
 */

import { useCallback } from "react";
import { useParams } from "react-router-dom";

import { useCockpitStore } from "../stores/useCockpitStore";
import { InstanceDiagram } from "../components/widgets/InstanceDiagram";
import { NodeDetailPanel } from "../components/widgets/NodeDetailPanel";

import styles from "./InstanceDetailPage.module.css";

export function InstanceDetailPage() {
  const { processId, instanceId } = useParams<{
    processId: string;
    instanceId: string;
  }>();

  const selectedNodeId = useCockpitStore((s) => s.selectedNodeId);
  const selectNode = useCockpitStore((s) => s.selectNode);

  const handleNodeClick = useCallback(
    (activityId: string) => {
      selectNode(activityId);
    },
    [selectNode],
  );

  const handleClosePanel = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const numericProcessId = Number(processId);

  if (!processId || !instanceId || isNaN(numericProcessId)) {
    return <div className={styles.error}>Invalid process or instance ID</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.viewer}>
        <InstanceDiagram
          processId={numericProcessId}
          instanceId={instanceId}
          onNodeClick={handleNodeClick}
          mode="full"
        />
      </div>

      <NodeDetailPanel
        isOpen={selectedNodeId !== null}
        onClose={handleClosePanel}
        processInstanceId={instanceId}
        activityId={selectedNodeId}
        processDefinitionKey={`process-${processId}`}
      />
    </div>
  );
}
