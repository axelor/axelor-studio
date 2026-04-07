import { useCallback, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Popper } from "@axelor/ui";
import { axelorBridge } from "@studio/shared/bridge";
import { useCockpitStore } from "../../stores/useCockpitStore";
import styles from "./CockpitSidebar.module.css";
import classnames from "classnames";

// ---------------------------------------------------------------------------
// Inline SVG icons (20x20)
// ---------------------------------------------------------------------------

const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="11" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="2" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="11" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const ProcessesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <line x1="4" y1="5" x2="16" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="4" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="4" y1="15" x2="16" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const TasksIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <polyline points="6,10 9,13 14,7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AnalyticsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="3" y="11" width="3" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="8.5" y="7" width="3" height="10" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="14" y="3" width="3" height="14" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

// ---------------------------------------------------------------------------
// Navigation items (D-11: route-based navigation)
// ---------------------------------------------------------------------------

interface NavItem {
  path: string;
  label: string;
  icon: React.FC;
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { path: "/process", label: "Processes", icon: ProcessesIcon },
  // Tasks is a future stub; render disabled for now
  { path: "/tasks", label: "Tasks", icon: TasksIcon, disabled: true },
  { path: "/analytics", label: "Analytics", icon: AnalyticsIcon },
];

// ---------------------------------------------------------------------------
// SidebarButton with Popper tooltip
// ---------------------------------------------------------------------------

interface SidebarButtonProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}

function SidebarButton({ item, isActive, onClick }: SidebarButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleEnter = useCallback(() => setShowTooltip(true), []);
  const handleLeave = useCallback(() => setShowTooltip(false), []);

  const Icon = item.icon;
  const translatedLabel = axelorBridge.translate(item.label);

  return (
    <>
      <button
        ref={ref}
        type="button"
        className={classnames(styles.navBtn, {
          [styles.active]: isActive,
          [styles.disabled]: item.disabled,
        })}
        aria-label={translatedLabel}
        onClick={onClick}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        disabled={item.disabled}
      >
        <Icon />
      </button>
      {showTooltip && ref.current && (
        <Popper target={ref.current} open={showTooltip} placement="end" arrow>
          <div className={styles.tooltip}>{translatedLabel}</div>
        </Popper>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// CockpitSidebar (D-11: react-router-dom navigation)
// ---------------------------------------------------------------------------

export function CockpitSidebar() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const selectedProcessId = useCockpitStore((s) => s.selectedProcessId);

  const isAnalyticsActive = search.includes("tab=analytics");

  return (
    <nav className={styles.sidebar} aria-label={axelorBridge.translate("Cockpit navigation")}>
      <div className={styles.navGroup}>
        {NAV_ITEMS.map((item, index) => {
          const isActive =
            !item.disabled &&
            (item.path === "/analytics"
              ? isAnalyticsActive
              : pathname === item.path || pathname.startsWith(item.path + "/"));

          return (
            <SidebarButton
              key={`${item.label}-${index}`}
              item={item}
              isActive={isActive}
              onClick={() => {
                if (!item.disabled) {
                  if (item.path === "/analytics" && selectedProcessId) {
                    navigate(`/process/${selectedProcessId}?tab=analytics`);
                  } else if (item.path === "/analytics") {
                    navigate("/process");
                  } else {
                    navigate(item.path);
                  }
                }
              }}
            />
          );
        })}
      </div>
    </nav>
  );
}
