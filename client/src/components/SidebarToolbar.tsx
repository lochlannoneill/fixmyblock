import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSliders, faArrowDownUpAcrossLine } from "@fortawesome/free-solid-svg-icons";
import type { ComplaintCategory, ComplaintStatus } from "../types/complaint";
import { CATEGORY_LABELS } from "../types/complaint";

export type SortBy = "newest" | "oldest" | "upvotes";

interface SidebarToolbarProps {
  onNewRequest: () => void;
  showingForm: boolean;
  totalCount: number;
  filteredCount: number;
  filterCategory: ComplaintCategory | "";
  filterStatus: ComplaintStatus | "";
  sortBy: SortBy;
  onFilterCategory: (v: ComplaintCategory | "") => void;
  onFilterStatus: (v: ComplaintStatus | "") => void;
  onSortBy: (v: SortBy) => void;
}

export default function SidebarToolbar({
  onNewRequest,
  showingForm,
  totalCount,
  filteredCount,
  filterCategory,
  filterStatus,
  sortBy,
  onFilterCategory,
  onFilterStatus,
  onSortBy,
}: SidebarToolbarProps) {
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const isFiltering = filterCategory !== "" || filterStatus !== "";

  return (
    <>
      {!showingForm && (
        <div className="new-request-card" onClick={onNewRequest}>
          <span className="new-request-icon">+</span>
          <span>New Request</span>
        </div>
      )}
      <div className="toolbar">
        <div className="toolbar-icons">
          <button
            className={`toolbar-btn ${showFilter ? "active" : ""} ${isFiltering ? "has-filter" : ""}`}
            onClick={() => { setShowFilter((v) => !v); setShowSort(false); }}
            title="Filter"
          >
            <FontAwesomeIcon icon={faSliders} />
          </button>
          <button
            className={`toolbar-btn ${showSort ? "active" : ""}`}
            onClick={() => { setShowSort((v) => !v); setShowFilter(false); }}
            title="Sort"
          >
            <FontAwesomeIcon icon={faArrowDownUpAcrossLine} />
          </button>
        </div>
        {showFilter && (
          <div className="toolbar-dropdown">
            <select
              className="filter-select"
              value={filterCategory}
              onChange={(e) => onFilterCategory(e.target.value as ComplaintCategory | "")}
            >
              <option value="">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => onFilterStatus(e.target.value as ComplaintStatus | "")}
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        )}
        {showSort && (
          <div className="toolbar-dropdown">
            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => onSortBy(e.target.value as SortBy)}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="upvotes">Most Upvoted</option>
            </select>
          </div>
        )}
        <span className="report-count">{filteredCount} of {totalCount} reports</span>
      </div>
    </>
  );
}
