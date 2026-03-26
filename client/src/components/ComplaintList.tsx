import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronUp } from "@fortawesome/free-solid-svg-icons";
import type { Complaint } from "../types/complaint";
import { CATEGORY_LABELS } from "../types/complaint";

interface ComplaintListProps {
  complaints: Complaint[];
  onSelect: (c: Complaint) => void;
  onDelete: (id: string) => void;
  selectedId: string | null;
}

export default function ComplaintList({
  complaints,
  onSelect,
  onDelete,
  selectedId,
}: ComplaintListProps) {
  if (complaints.length === 0) {
    return (
      <div className="complaint-list-empty">
        <p>No reports match your criteria.</p>
      </div>
    );
  }

  return (
    <div className="complaint-list">
      {complaints.map((c) => (
        <div
          key={c.id}
          className={`complaint-card ${c.id === selectedId ? "selected" : ""}`}
          onClick={() => onSelect(c)}
        >
          <div className="card-header">
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
