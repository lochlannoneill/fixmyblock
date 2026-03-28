import { useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSliders, faArrowDownUpAcrossLine } from "@fortawesome/free-solid-svg-icons";
import type { Request, RequestCategory, RequestStatus } from "../../types/request";
import { CATEGORY_LABELS } from "../../types/request";
import RequestList from "../RequestList";

type SortBy = "newest" | "oldest" | "upvotes";

interface RequestToolbarProps {
  requests: Request[];
  loading?: boolean;
  onNewRequest: () => void;
  showingForm: boolean;
  onSelectRequest: (c: Request) => void;
  onDeleteRequest: (id: string) => void;
  selectedId: string | null;
}

export default function RequestToolbar({
  requests,
  loading,
  onSelectRequest,
  onDeleteRequest,
  selectedId,
}: RequestToolbarProps) {
  const [filterCategory, setFilterCategory] = useState<RequestCategory | "">("");
  const [filterStatus, setFilterStatus] = useState<RequestStatus | "">("");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const isFiltering = filterCategory !== "" || filterStatus !== "";

  const filteredSorted = useMemo(() => {
    const filtered = requests.filter((c) => {
      if (filterCategory && c.category !== filterCategory) return false;
      if (filterStatus && c.status !== filterStatus) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return (b.upvoters || []).length - (a.upvoters || []).length;
    });
  }, [requests, filterCategory, filterStatus, sortBy]);

  const selectClasses =
    "w-full min-w-0 py-1.5 px-2 text-[13px] border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-[#2a2a2a] text-slate-800 dark:text-zinc-200 cursor-pointer transition-colors focus:outline-none focus:border-blue-500";

  return (
    <>
      <div className="flex flex-col items-end px-3 py-2 mx-3 mt-3">
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
              onChange={(e) => setFilterCategory(e.target.value as RequestCategory | "")}
            >
              <option value="">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              className={selectClasses}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as RequestStatus | "")}
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
              onChange={(e) => setSortBy(e.target.value as SortBy)}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="upvotes">Most Upvoted</option>
            </select>
          </div>
        )}
        {loading ? (
          <div className="h-4 w-32 bg-slate-200 dark:bg-zinc-700 rounded-full animate-pulse mt-1.5" />
        ) : (
          <span className="text-[13px] font-semibold text-slate-500 dark:text-[#8c8c96] mt-1.5">
            {filteredSorted.length} of {requests.length} requests
          </span>
        )}
      </div>
      <RequestList
        requests={filteredSorted}
        loading={loading}
        onSelect={onSelectRequest}
        onDelete={onDeleteRequest}
        selectedId={selectedId}
      />
    </>
  );
}
