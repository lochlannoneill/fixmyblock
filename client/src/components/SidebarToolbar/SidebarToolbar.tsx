import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSliders, faArrowDownUpAcrossLine } from "@fortawesome/free-solid-svg-icons";
import type { ComplaintCategory, ComplaintStatus } from "../../types/complaint";
import { CATEGORY_LABELS } from "../../types/complaint";

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

  const selectClasses =
    "w-full min-w-0 py-1.5 px-2 text-[13px] border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-[#2a2a2a] text-slate-800 dark:text-zinc-200 cursor-pointer transition-colors focus:outline-none focus:border-blue-500";

  return (
    <>
      {!showingForm && (
        <div
          className="flex items-center justify-center gap-2 m-3 p-[18px] border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl text-slate-500 dark:text-[#8c8c96] text-[15px] font-semibold cursor-pointer transition-colors hover:border-blue-500 hover:text-blue-500 hover:bg-blue-500/10"
          onClick={onNewRequest}
        >
          <span className="text-lg font-bold leading-none flex items-center">+</span>
          <span>New Request</span>
        </div>
      )}
      <div className="flex flex-col items-end px-3 py-2 mx-3">
        <div className="flex gap-1.5 justify-end">
          <button
            className={`flex items-center justify-center w-9 h-9 border rounded-lg text-[15px] cursor-pointer transition-colors
              ${showFilter
                ? "text-blue-500 border-blue-500 bg-blue-500/10"
                : isFiltering
                  ? "text-blue-500 border-gray-300 dark:border-zinc-700 bg-white dark:bg-[#2a2a2a]"
                  : "text-slate-500 dark:text-[#8c8c96] border-gray-300 dark:border-zinc-700 bg-white dark:bg-[#2a2a2a] hover:text-blue-500 hover:border-blue-500"
              }`}
            onClick={() => { setShowFilter((v) => !v); setShowSort(false); }}
            title="Filter"
          >
            <FontAwesomeIcon icon={faSliders} />
          </button>
          <button
            className={`flex items-center justify-center w-9 h-9 border rounded-lg text-[15px] cursor-pointer transition-colors
              ${showSort
                ? "text-blue-500 border-blue-500 bg-blue-500/10"
                : "text-slate-500 dark:text-[#8c8c96] border-gray-300 dark:border-zinc-700 bg-white dark:bg-[#2a2a2a] hover:text-blue-500 hover:border-blue-500"
              }`}
            onClick={() => { setShowSort((v) => !v); setShowFilter(false); }}
            title="Sort"
          >
            <FontAwesomeIcon icon={faArrowDownUpAcrossLine} />
          </button>
        </div>
        {showFilter && (
          <div className="flex flex-col gap-1.5 mt-2 w-full">
            <select
              className={selectClasses}
              value={filterCategory}
              onChange={(e) => onFilterCategory(e.target.value as ComplaintCategory | "")}
            >
              <option value="">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              className={selectClasses}
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
          <div className="flex flex-col gap-1.5 mt-2 w-full">
            <select
              className={selectClasses}
              value={sortBy}
              onChange={(e) => onSortBy(e.target.value as SortBy)}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="upvotes">Most Upvoted</option>
            </select>
          </div>
        )}
        <span className="text-[13px] font-semibold text-slate-500 dark:text-[#8c8c96] mt-1.5">
          {filteredCount} of {totalCount} reports
        </span>
      </div>
    </>
  );
}
