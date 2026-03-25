import type { Complaint } from "../types/complaint";
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
      <div className="list-header">
        <span className="report-count">{complaints.length} reports</span>
      </div>
      {complaints.map((c) => (
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
            <span className="card-votes">👍 {c.upvotes}</span>
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
