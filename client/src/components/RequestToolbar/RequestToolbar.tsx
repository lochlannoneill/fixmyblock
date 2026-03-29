import { useState, useMemo, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLayerGroup, faCircleInfo, faArrowDownUpAcrossLine } from "@fortawesome/free-solid-svg-icons";
import type { Request, RequestCategory, RequestStatus } from "../../types/request";
import { CATEGORY_LABELS } from "../../types/request";
import RequestList from "../RequestList";

type SortBy = "newest" | "oldest" | "likes";
type OpenDropdown = "category" | "status" | "sort" | null;

const STATUS_LABELS: Record<RequestStatus, string> = { open: "Open", "in-progress": "In Progress", resolved: "Resolved" };

interface RequestToolbarProps {
  requests: Request[];
  loading?: boolean;
  currentUserId?: string;
  onNewRequest: () => void;
  showingForm: boolean;
  onSelectRequest: (c: Request) => void;
  selectedId: string | null;
}

export default function RequestToolbar({
  requests,
  loading,
  currentUserId,
  onSelectRequest,
  selectedId,
}: RequestToolbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<RequestCategory | "">("");
  const [filterStatus, setFilterStatus] = useState<RequestStatus | "">("");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownAnimate, setDropdownAnimate] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openDropdown) {
      setDropdownVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setDropdownAnimate(true)));
    } else {
      setDropdownAnimate(false);
      const timer = setTimeout(() => setDropdownVisible(false), 150);
      return () => clearTimeout(timer);
    }
  }, [openDropdown]);

  useEffect(() => {
    if (!openDropdown) return;
    const handler = (e: MouseEvent) => {
      const refs = [categoryRef, statusRef, sortRef];
      if (refs.every((r) => !r.current?.contains(e.target as Node))) setOpenDropdown(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openDropdown]);

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

  const toggle = (dropdown: OpenDropdown) => setOpenDropdown((prev) => (prev === dropdown ? null : dropdown));

  const chevron = (isOpen: boolean) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );

  const btnClass = (isOpen: boolean, isActive: boolean) =>
    `flex items-center gap-1 h-7 px-2 border rounded-md text-[12px] cursor-pointer transition-colors ${
      isOpen
        ? "text-blue-500 border-blue-500 bg-blue-500/10"
        : isActive
          ? "text-blue-500 border-gray-300 dark:border-zinc-700 bg-white dark:bg-[#2a2a2a]"
          : "text-slate-500 dark:text-[#8c8c96] border-gray-300 dark:border-zinc-700 bg-white dark:bg-[#2a2a2a] hover:text-blue-500 hover:border-blue-500"
    }`;

  const popoverStyle = {
    transition: "opacity 150ms ease, transform 150ms ease",
    opacity: dropdownAnimate ? 1 : 0,
    transform: dropdownAnimate ? "scale(1) translateY(0)" : "scale(0.95) translateY(-4px)",
  };

  const optionClass = (isSelected: boolean) =>
    `w-full text-left px-3 py-1.5 text-[12px] cursor-pointer transition-colors ${
      isSelected
        ? "text-blue-500 font-semibold bg-blue-500/5"
        : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#333]"
    }`;

  return (
    <>
      <div className="px-3 pt-3">
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search requests..."
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-[#2a2a2a] text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:border-blue-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-col px-3 py-2">
        <div className="flex gap-1.5 justify-between">
          <div className="flex gap-1.5">
          {/* Category filter */}
          <div className="relative" ref={categoryRef}>
            <button className={btnClass(openDropdown === "category", filterCategory !== "")} onClick={() => toggle("category")}>
              <FontAwesomeIcon icon={faLayerGroup} className="text-[12px]" />
              <span className="font-medium">{filterCategory ? CATEGORY_LABELS[filterCategory] : "Category"}</span>
              {chevron(openDropdown === "category")}
            </button>
            {dropdownVisible && openDropdown === "category" && (
              <div className="absolute left-0 top-full mt-1 w-40 bg-white dark:bg-[#272727] border border-gray-200 dark:border-zinc-700 rounded-xl shadow-lg z-50 overflow-hidden origin-top-left" style={popoverStyle}>
                <button onClick={() => { setFilterCategory(""); setOpenDropdown(null); }} className={optionClass(filterCategory === "")}>All Categories</button>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <button key={key} onClick={() => { setFilterCategory(key as RequestCategory); setOpenDropdown(null); }} className={optionClass(filterCategory === key)}>{label}</button>
                ))}
              </div>
            )}
          </div>
          {/* Status filter */}
          <div className="relative" ref={statusRef}>
            <button className={btnClass(openDropdown === "status", filterStatus !== "")} onClick={() => toggle("status")}>
              <FontAwesomeIcon icon={faCircleInfo} className="text-[12px]" />
              <span className="font-medium">{filterStatus ? STATUS_LABELS[filterStatus] : "Status"}</span>
              {chevron(openDropdown === "status")}
            </button>
            {dropdownVisible && openDropdown === "status" && (
              <div className="absolute left-0 top-full mt-1 w-40 bg-white dark:bg-[#272727] border border-gray-200 dark:border-zinc-700 rounded-xl shadow-lg z-50 overflow-hidden origin-top-left" style={popoverStyle}>
                <button onClick={() => { setFilterStatus(""); setOpenDropdown(null); }} className={optionClass(filterStatus === "")}>All Statuses</button>
                {(Object.entries(STATUS_LABELS) as [RequestStatus, string][]).map(([key, label]) => (
                  <button key={key} onClick={() => { setFilterStatus(key); setOpenDropdown(null); }} className={optionClass(filterStatus === key)}>{label}</button>
                ))}
              </div>
            )}
          </div>
          </div>
          {/* Sort */}
          <div className="relative" ref={sortRef}>
            <button className={btnClass(openDropdown === "sort", false)} onClick={() => toggle("sort")}>
              <FontAwesomeIcon icon={faArrowDownUpAcrossLine} className="text-[12px]" />
              <span className="font-medium">{{ newest: "Newest", oldest: "Oldest", likes: "Most Liked" }[sortBy]}</span>
              {chevron(openDropdown === "sort")}
            </button>
            {dropdownVisible && openDropdown === "sort" && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-[#272727] border border-gray-200 dark:border-zinc-700 rounded-xl shadow-lg z-50 overflow-hidden origin-top-right" style={popoverStyle}>
                {(["newest", "oldest", "likes"] as SortBy[]).map((value) => (
                  <button key={value} onClick={() => { setSortBy(value); setOpenDropdown(null); }} className={optionClass(sortBy === value)}>
                    {{ newest: "Newest", oldest: "Oldest", likes: "Most Liked" }[value]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="h-4 w-32 bg-slate-200 dark:bg-zinc-700 rounded-full animate-pulse mt-1.5" />
        ) : (
          <span className="text-[12px] font-semibold text-slate-500 dark:text-[#8c8c96] mt-1.5">
            {filteredSorted.length} of {requests.length} requests
          </span>
        )}
      </div>
      <RequestList
        requests={filteredSorted}
        loading={loading}
        onSelect={onSelectRequest}
        selectedId={selectedId}
        currentUserId={currentUserId}
      />
    </>
  );
}
