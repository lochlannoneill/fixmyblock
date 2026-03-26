import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronUp, faSliders, faArrowDownUpAcrossLine } from "@fortawesome/free-solid-svg-icons";
import type { Complaint, ComplaintCategory, ComplaintStatus } from "../types/complaint";
import { CATEGORY_LABELS, STATUS_COLORS } from "../types/complaint";

interface ComplaintListProps {
  complaints: Complaint[];
  onSelect: (c: Complaint) => void;
  onDelete: (id: string) => void;
  onNewRequest: () => void;
  selectedId: string | null;
  showingForm: boolean;
}

export default function ComplaintList({
  complaints,
  onSelect,
  onDelete,
  onNewRequest,
  selectedId,
  showingForm,
}: ComplaintListProps) {
  const [filterCategory, setFilterCategory] = useState<ComplaintCategory | "">("");
  const [filterStatus, setFilterStatus] = useState<ComplaintStatus | "">("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "upvotes">("newest");
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const isFiltering = filterCategory !== "" || filterStatus !== "";

  const filtered = complaints.filter((c) => {
    if (filterCategory && c.category !== filterCategory) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return b.upvotes - a.upvotes;
  });

  const toolbar = (
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
            onChange={(e) => setFilterCategory(e.target.value as ComplaintCategory | "")}
          >
            <option value="">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ComplaintStatus | "")}
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
            onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "upvotes")}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="upvotes">Most Upvoted</option>
          </select>
        </div>
      )}
      <span className="report-count">{filtered.length} of {complaints.length} reports</span>
    </div>
  );

  if (complaints.length === 0) {
    return (
      <div className="complaint-list-empty">
        {!showingForm && (
          <div className="new-request-card" onClick={onNewRequest}>
            <span className="new-request-icon">+</span>
            <span>New Request</span>
          </div>
        )}
        <div className="list-header">
          <span className="report-count">0 reports</span>
        </div>
        <p>No reports yet. Click the card above to report an issue!</p>
      </div>
    );
  }

  return (
    <div className="complaint-list">
      {!showingForm && (
        <div className="new-request-card" onClick={onNewRequest}>
          <span className="new-request-icon">+</span>
          <span>New Request</span>
        </div>
      )}
      {toolbar}
      {sorted.map((c) => (
        <div
          key={c.id}
          className={`complaint-card ${c.id === selectedId ? "selected" : ""}`}
          onClick={() => onSelect(c)}
        >
          <div className="card-header">
            <span
              className="status-dot"
              style={{ background: STATUS_COLORS[c.status] }}
            />
            <span className="card-title">{c.title}</span>
            <span className="card-votes"><FontAwesomeIcon icon={faChevronUp} /> {c.upvotes}</span>
          </div>
          <div className="card-meta">
            {CATEGORY_LABELS[c.category]} ·{" "}
            {new Date(c.createdAt).toLocaleDateString()}
          </div>
          {c.imageUrls.length > 0 && (
            <div className="card-thumb">
              <img src={c.imageUrls[0]} alt={c.title} />
            </div>
          )}
          <p className="card-desc">
            {c.description.slice(0, 100)}
            {c.description.length > 100 ? "..." : ""}
          </p>
          <button
            className="card-delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm("Delete this report?")) onDelete(c.id);
            }}
            title="Delete report"
          >
            🗑
          </button>
        </div>
      ))}
    </div>
  );
}
