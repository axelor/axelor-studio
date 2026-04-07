import { Link, useLocation, useParams } from "react-router-dom";
import { axelorBridge } from "@studio/shared/bridge";
import { useCockpitStore } from "../../stores/useCockpitStore";
import styles from "./Breadcrumbs.module.css";
import classnames from "classnames";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BreadcrumbSegment {
  label: string;
  path: string;
  title?: string;
}

// ---------------------------------------------------------------------------
// Breadcrumbs (D-12)
// ---------------------------------------------------------------------------

/**
 * Route-aware breadcrumb trail positioned between toolbar and content.
 * Hidden on dashboard (root level). Shows navigation path with direct jump links.
 *
 * - `/dashboard`                              -> null (hidden)
 * - `/process/:processId`                     -> [Dashboard] > [Process "Name"]
 * - `/process/:processId/instance/:instanceId` -> [Dashboard] > [Process "Name"] > [Instance #abc]
 */
export function Breadcrumbs() {
  const { pathname } = useLocation();
  const params = useParams<{ processId?: string; instanceId?: string }>();

  // Attempt to resolve process name from store
  const selectedProcessId = useCockpitStore((s) => s.selectedProcessId);

  // Hide on dashboard root (no breadcrumb needed)
  if (pathname === "/dashboard" || pathname === "/") {
    return null;
  }

  const segments: BreadcrumbSegment[] = [
    { label: axelorBridge.translate("Dashboard"), path: "/dashboard" },
  ];

  // Process segment
  if (params.processId) {
    const processLabel =
      selectedProcessId === params.processId
        ? `Process #${params.processId}`
        : `Process #${params.processId}`;
    segments.push({
      label: processLabel,
      path: `/process/${params.processId}`,
    });
  }

  // Instance segment
  if (params.instanceId) {
    const truncatedId = params.instanceId.substring(0, 8);
    const fullLabel = `Instance #${params.instanceId}`;
    segments.push({
      label: `Instance #${truncatedId}`,
      path: `/process/${params.processId}/instance/${params.instanceId}`,
      title: fullLabel,
    });
  }

  return (
    <nav className={styles.bar} aria-label={axelorBridge.translate("Breadcrumb")}>
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        return (
          <span key={segment.path}>
            {index > 0 && (
              <span className={styles.separator} aria-hidden="true">
                {">"}
              </span>
            )}
            {isLast ? (
              <span
                className={classnames(styles.segment, styles.current)}
                title={segment.title}
                aria-current="page"
              >
                {segment.label}
              </span>
            ) : (
              <Link
                to={segment.path}
                className={styles.segment}
                title={segment.title}
              >
                {segment.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
