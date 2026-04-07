/**
 * Clickable AOS business object link badge (D-19, D-21, UI-SPEC).
 *
 * Renders a type badge (model name) + display name.
 * Clicking navigates the AOP parent to the record via axelorBridge.openView().
 */

import { axelorBridge } from "@studio/shared/bridge";

import type { LinkedObject } from "../../api/types";

import styles from "./LinkedObjectBadge.module.css";

interface LinkedObjectBadgeProps {
  linkedObject: LinkedObject;
}

export function LinkedObjectBadge({ linkedObject }: LinkedObjectBadgeProps) {
  const handleClick = () => {
    axelorBridge.openView({
      model: linkedObject.modelFullName,
      viewType: "form",
      context: { _showRecord: linkedObject.recordId },
    });
  };

  return (
    <button
      type="button"
      className={styles.badge}
      onClick={handleClick}
      title={`${linkedObject.modelName}: ${linkedObject.displayName}`}
    >
      <span className={styles.type}>{linkedObject.modelName}</span>
      <span className={styles.name}>{linkedObject.displayName}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Multi-model list wrapper (D-21)
// ---------------------------------------------------------------------------

interface LinkedObjectListProps {
  linkedObjects: LinkedObject[];
}

export function LinkedObjectList({ linkedObjects }: LinkedObjectListProps) {
  if (linkedObjects.length === 0) {
    return (
      <span className={styles.empty}>
        {axelorBridge.translate("No linked objects")}
      </span>
    );
  }

  return (
    <div className={styles.list}>
      {linkedObjects.map((obj) => (
        <LinkedObjectBadge
          key={`${obj.modelFullName}-${obj.recordId}`}
          linkedObject={obj}
        />
      ))}
    </div>
  );
}
