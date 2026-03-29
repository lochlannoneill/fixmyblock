import { useState, useMemo, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSliders, faArrowDownUpAcrossLine } from "@fortawesome/free-solid-svg-icons";
import type { Request, RequestCategory, RequestStatus } from "../../types/request";
import { CATEGORY_LABELS } from "../../types/request";
import RequestList from "../RequestList";

type SortBy = "newest" | "oldest" | "likes";

interface RequestToolbarProps {
  requests: Request[];
  loading?: boolean;
  searchQuery?: string;
  onNewRequest: () => void;
  showingForm: boolean;
  onSelectRequest: (c: Request) => void;
  selectedId: string | null;
}

export default function RequestToolbar({
  requests,
  loading,
  searchQuery = "",
  onSelectRequest,
  selectedId,
}: RequestToolbarProps) {
  const [filterCategory, setFilterCategory] = useState<RequestCategory | "">("");
  const [filterStatus, setFilterStatus] = useState<RequestStatus | "">("");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);
  const [sortAnimate, setSortAnimate] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showSort) {
      setSortVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setSortAnimate(true)));
    } else {
      setSortAnimate(false);
      const timer = setTimeout(() => setSortVisible(false), 150);
      return () => clearTimeout(timer);
    }
  }, [showSort]);

  useEffect(() => {
    if (!showSort) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSort(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSort]);

  const isFiltering = filterCategory !== "" || filterStatus !== "";

  const filteredSorted = useMemo(() => {
    const filtered = requests.filter((c) => {
      if (filterCategory && c.category !== filterCategory) return false;
      if (filterStatus && c.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const categoryLabel = CATEGORY_LABELS[c.category]?.toLowerCase() || "";
        const location = (c.location || "").toLowerCase();
        if (
          !c.title.toLowerCase().includes(q) &&
          !c.description.toLowerCase().includes(q) &&
          !categoryLabel.includes(q) &&
          !location.includes(q)
        ) return false;
      }
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return (b.likers || []).length - (a.likers || []).length;
    });
  }, [requests, filterCategory, filterStatus, sortBy, searchQuery]);

  const selectClasses =
    "w-full min-w-0 py-1.5 px-2 text-[13px] border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-[#2a2a2a] text-slate-800 dark:text-zinc-200 cursor-pointer transition-colors focus:outline-none focus:border-blue-500";

  return (
    <>
      <div className="flex flex-col items-end px-3 py-2 mx-3 mt-3">
        <div className="flex gap-1.5 justify-end">
          <button
            className={`flex items-center gap-1.5 h-9 px-2.5 border rounded-lg text-[13px] cursor-pointer transition-colors
              ${showFilter
                ? "text-blue-500 border-blue-500 bg-blue-500/10"
                : isFiltering
                  ? "text-blue-500 border-gray-300 dark:border-zinc-700 bg-white dark:bg-[#2a2a2a]"
                  : "text-slate-500 dark:text-[#8c8c96] border-gray-300 dark:border-zinc-700 bg-white dark:bg-[#2a2a2a] hover:text-blue-500 hover:border-blue-500"
              }`}
            onClick={() => { setShowFilter((v) => !v); setShowSort(false); }}
            title="Filter"
          >
            <FontAwesomeIcon icon={faSliders} className="text-[14px]" />
            <span className="font-medium">Filters</span>
          </button>
          <div className="relative" ref={sortRef}>
            <button
              className={`flex items-center gap-1.5 h-9 px-2.5 border rounded-lg text-[13px] cursor-pointer transition-colors
                ${showSort
                  ? "text-blue-500 border-blue-500 bg-blue-500/10"
                  : "text-slate-500 dark:text-[#8c8c96] border-gray-300 dark:border-zinc-700 bg-white dark:bg-[#2a2a2a] hover:text-blue-500 hover:border-blue-500"
                }`}
              onClick={() => { setShowSort((v) => !v); setShowFilter(false); }}
              title="Sort"
            >
              <FontAwesomeIcon icon={faArrowDownUpAcrossLine} className="text-[14px]" />
              <span className="font-medium">{{ newest: "Newest", oldest: "Oldest", likes: "Most Liked" }[sortBy]}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${showSort ? "rotate-180" : ""}`}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {sortVisible && (
              <div
                className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-[#272727] border border-gray-200 dark:border-zinc-700 rounded-xl shadow-lg z-50 overflow-hidden origin-top-right"
                style={{
                  transition: "opacity 150ms ease, transform 150ms ease",
                  opacity: sortAnimate ? 1 : 0,
                  transform: sortAnimate ? "scale(1) translateY(0)" : "scale(0.95) translateY(-4px)",
                }}
              >
                {(["newest", "oldest", "likes"] as SortBy[]).map((value) => {
                  const label = { newest: "Newest", oldest: "Oldest", likes: "Most Liked" }[value];
                  return (
                    <button
                      key={value}
                      onClick={() => { setSortBy(value); setShowSort(false); }}
                      className={`w-full text-left px-3 py-2 text-[13px] cursor-pointer transition-colors ${
                        sortBy === value
                          ? "text-blue-500 font-semibold bg-blue-500/5"
                          : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#333]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
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
        selectedId={selectedId}
      />
    </>
  );
}
