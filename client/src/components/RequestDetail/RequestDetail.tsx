import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronUp, faComment, faMapMarkerAlt, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import type { Request } from "../../types/request";
import { STATUS_COLORS } from "../../types/request";

interface RequestDetailProps {
  request: Request;
  onBack: () => void;
  onUpvote: (id: string) => void;
  onAddComment: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  currentUserId?: string;
}

export default function RequestDetail({
  request,
  onBack,
  onUpvote,
  onAddComment,
  onDelete,
  currentUserId,
}: RequestDetailProps) {
  const [commentText, setCommentText] = useState("");
  const [locationName, setLocationName] = useState("");

  const comments = request.comments || [];
  const upvoteCount = (request.upvoters || []).length;
  const hasUpvoted = currentUserId && (request.upvoters || []).includes(currentUserId);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${request.latitude}&lon=${request.longitude}&format=json&zoom=14`
        );
        if (res.ok && !cancelled) {
          const data = await res.json();
          const addr = data.address;
          const parts = [
            addr?.suburb || addr?.neighbourhood || addr?.village || addr?.town || "",
            addr?.city || addr?.county || "",
          ].filter(Boolean);
          setLocationName(parts.join(", ") || data.display_name?.split(",").slice(0, 2).join(",").trim() || "");
        }
      } catch {
        // best-effort
      }
    })();
    return () => { cancelled = true; };
  }, [request.latitude, request.longitude]);

  const displayLocation = locationName || `${request.latitude.toFixed(4)}, ${request.longitude.toFixed(4)}`;
  const statusLabel = request.status === "in-progress" ? "In Progress" : request.status.charAt(0).toUpperCase() + request.status.slice(1);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-[#2a2a2a]">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer text-slate-500 dark:text-zinc-400"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <span className="flex-1 font-semibold text-base text-slate-800 dark:text-zinc-200 truncate">{request.title}</span>
        <span
          className="text-[11px] font-semibold text-white px-2.5 py-0.5 rounded-full shrink-0"
          style={{ backgroundColor: STATUS_COLORS[request.status] }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {/* Meta */}
          <div className="flex items-center justify-between text-xs text-slate-400 dark:text-[#6e6e79]">
            <span className="flex items-center gap-1">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[10px]" />
              {displayLocation}
            </span>
            <span>{getTimeSince(request.createdAt)}</span>
          </div>

          {/* Images */}
          {request.imageUrls.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {request.imageUrls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`${request.title} ${i + 1}`}
                  className="w-full rounded-lg object-cover max-h-60"
                />
              ))}
            </div>
          )}

          {/* Description */}
          <p className="text-[13px] text-slate-600 dark:text-[#b0b0b8] mt-3 leading-relaxed whitespace-pre-wrap">
            {request.description}
          </p>

          {/* Metrics bar */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-[#3a3a3a] text-xs">
            <button
              className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                hasUpvoted
                  ? "text-blue-500 font-semibold"
                  : "text-slate-400 dark:text-[#8c8c96] hover:text-blue-500"
              }`}
              onClick={() => onUpvote(request.id)}
              title={hasUpvoted ? "Remove upvote" : "Upvote"}
            >
              <FontAwesomeIcon icon={faChevronUp} /> {upvoteCount}
            </button>
            <span className="flex items-center gap-1.5 text-slate-400 dark:text-[#8c8c96]">
              <FontAwesomeIcon icon={faComment} /> {comments.length}
            </span>
          </div>

          {/* Comments */}
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
              Comments ({comments.length})
            </h4>
            {comments.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-zinc-500 italic">No comments yet. Be the first to comment.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#2a2a2a] text-xs">
                    <p className="text-slate-700 dark:text-zinc-300">{comment.text}</p>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">
                      {getTimeSince(comment.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Add comment input */}
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-2.5 py-2 text-xs border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-[#2a2a2a] text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && commentText.trim()) {
                    onAddComment(request.id, commentText.trim());
                    setCommentText("");
                  }
                }}
              />
              <button
                className="px-3 py-2 text-xs font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!commentText.trim()}
                onClick={() => {
                  if (commentText.trim()) {
                    onAddComment(request.id, commentText.trim());
                    setCommentText("");
                  }
                }}
              >
                Post
              </button>
            </div>
          </div>

          {/* Delete */}
          <button
            className="mt-6 w-full py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer border border-red-200 dark:border-red-900/30"
            onClick={() => {
              if (confirm("Delete this request?")) onDelete(request.id);
            }}
          >
            Delete request
          </button>
        </div>
      </div>
    </div>
  );
}

function getTimeSince(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
