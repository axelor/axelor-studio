/**
 * Pagination bar with numbered pages (D-17, UI-SPEC).
 *
 * Shows page numbers with ellipsis for gaps, prev/next arrows,
 * and a "Showing X-Y of Z instances" label.
 */

import { axelorBridge } from "@studio/shared/bridge";

import styles from "./PaginationBar.module.css";

interface PaginationBarProps {
  total: number;
  offset: number;
  limit: number;
  onPageChange: (page: number) => void;
}

/**
 * Compute visible page numbers with ellipsis markers.
 * Returns at most 7 items: first, last, current +/- 1, with -1 as ellipsis.
 */
function getVisiblePages(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const pages = new Set<number>();
  pages.add(0);
  pages.add(totalPages - 1);

  for (
    let i = Math.max(1, currentPage - 1);
    i <= Math.min(totalPages - 2, currentPage + 1);
    i++
  ) {
    pages.add(i);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: number[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push(-1); // ellipsis marker
    }
    result.push(sorted[i]);
  }
  return result;
}

export function PaginationBar({
  total,
  offset,
  limit,
  onPageChange,
}: PaginationBarProps) {
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit);
  const start = offset + 1;
  const end = Math.min(offset + limit, total);

  if (totalPages <= 1) return null;

  const visiblePages = getVisiblePages(currentPage, totalPages);

  return (
    <nav className={styles.container} aria-label="Pagination">
      <span className={styles.info}>
        {axelorBridge.translate("Showing")} {start}-{end}{" "}
        {axelorBridge.translate("of")} {total}{" "}
        {axelorBridge.translate("instances")}
      </span>
      <div className={styles.pages}>
        <button
          type="button"
          className={styles.arrow}
          disabled={currentPage === 0}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label={axelorBridge.translate("Previous page")}
        >
          &lt;
        </button>
        {visiblePages.map((page, idx) =>
          page === -1 ? (
            <span key={`ellipsis-${idx}`} className={styles.ellipsis}>
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              className={`${styles.page} ${page === currentPage ? styles.current : ""}`}
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page + 1}
            </button>
          ),
        )}
        <button
          type="button"
          className={styles.arrow}
          disabled={currentPage >= totalPages - 1}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label={axelorBridge.translate("Next page")}
        >
          &gt;
        </button>
      </div>
    </nav>
  );
}
