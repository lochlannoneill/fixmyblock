import { useRef, useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronUp, faChevronDown, faComment, faCalendar, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import type { Request } from "../../types/request";
import { CATEGORY_LABELS, STATUS_COLORS } from "../../types/request";

interface RequestListProps {
  requests: Request[];
  loading?: boolean;
  onSelect: (c: Request) => void;
  onDelete: (id: string) => void;
  onUpvote?: (id: string) => void;
  onAddComment?: (id: string, text: string) => void;
  selectedId: string | null;
  currentUserId?: string;
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-[#272727] rounded-xl p-3.5 mb-2.5 border-2 border-transparent animate-pulse">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-4 bg-slate-200 dark:bg-zinc-700 rounded-full" />
        <div className="w-16 h-5 bg-slate-200 dark:bg-zinc-700 rounded-full" />
      </div>
      <div className="h-3 w-2/3 bg-slate-200 dark:bg-zinc-700 rounded-full mt-2" />
      <div className="h-24 bg-slate-200 dark:bg-zinc-700 rounded-lg mt-2" />
      <div className="h-3 w-full bg-slate-200 dark:bg-zinc-700 rounded-full mt-2" />
      <div className="h-3 w-4/5 bg-slate-200 dark:bg-zinc-700 rounded-full mt-1" />
    </div>
  );
}

export default function RequestList({
  requests,
  loading,
  onSelect,
  onDelete,
  onUpvote,
  onAddComment,
  selectedId,
  currentUserId,
}: RequestListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [locationNames, setLocationNames] = useState<Record<string, string>>({});

  // Reverse geocode locations on mount / when requests change
  useEffect(() => {
    const cache: Record<string, string> = { ...locationNames };
    const toFetch = requests.filter((r) => {
      const key = `${r.latitude.toFixed(4)},${r.longitude.toFixed(4)}`;
      return !cache[key];
    });

    // Deduplicate by coordinate key
    const unique = new Map<string, { lat: number; lng: number }>();
    for (const r of toFetch) {
      const key = `${r.latitude.toFixed(4)},${r.longitude.toFixed(4)}`;
      if (!unique.has(key)) unique.set(key, { lat: r.latitude, lng: r.longitude });
    }

    let cancelled = false;
    (async () => {
      for (const [key, { lat, lng }] of unique) {
        if (cancelled) break;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address;
            const parts = [
              addr?.suburb || addr?.neighbourhood || addr?.village || addr?.town || "",
              addr?.city || addr?.county || "",
            ].filter(Boolean);
            cache[key] = parts.join(", ") || data.display_name?.split(",").slice(0, 2).join(",").trim() || "";
          }
        } catch {
          // best-effort
        }
      }
      if (!cancelled) setLocationNames({ ...cache });
    })();

    return () => { cancelled = true; };
  }, [requests]);

  const handleScroll = useCallback(() => {
    const el = listRef.current?.closest(".sidebar");
    if (el) {
      setShowBackToTop(el.scrollTop > 150);
    }
  }, []);

  useEffect(() => {
    const el = listRef.current?.closest(".sidebar");
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollToTop = () => {
    const el = listRef.current?.closest(".sidebar");
    el?.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="p-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="py-12 px-6 text-center text-slate-400 dark:text-[#6e6e79] text-sm">
        <p>No requests match your criteria.</p>
      </div>
    );
  }

  return (
    <div className="p-3 relative" ref={listRef}>
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="sticky top-0 z-20 w-full mb-2 py-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 bg-slate-100/90 dark:bg-[#1e1e1e]/90 backdrop-blur-sm hover:text-blue-500 cursor-pointer transition-colors"
        >
          ↑ Back to top
        </button>
      )}
      {requests.map((c) => {
        const isExpanded = expandedId === c.id;
        const comments = c.comments || [];
        const upvoteCount = (c.upvoters || []).length;
        const hasUpvoted = currentUserId && (c.upvoters || []).includes(currentUserId);
        const timeSince = getTimeSince(c.createdAt);
        const locKey = `${c.latitude.toFixed(4)},${c.longitude.toFixed(4)}`;
        const locationName = locationNames[locKey] || `${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`;

        return (
        <div
          key={c.id}
          className={`group bg-white dark:bg-[#272727] rounded-xl mb-2.5 border-2 transition-all shadow-sm relative
            ${c.id === selectedId
              ? "border-blue-500"
              : "border-transparent hover:border-blue-200 dark:hover:border-blue-900 hover:shadow-md"
            }`}
        >
          {/* Collapsed header - always visible */}
          <div
            className="p-3.5 cursor-pointer"
            onClick={() => onSelect(c)}
          >
            <div className="flex items-center gap-2">
              <span className="flex-1 font-semibold text-sm text-slate-800 dark:text-zinc-200">{c.title}</span>
              <span
                className="text-[11px] font-semibold text-white px-2 py-0.5 rounded-full shrink-0"
                style={{ backgroundColor: STATUS_COLORS[c.status] }}
              >
                {c.status === "in-progress" ? "In Progress" : c.status.charAt(0).toUpperCase() + c.status.slice(1)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-[#6e6e79] mt-1">
              <span>{CATEGORY_LABELS[c.category]} &middot; {timeSince}</span>
              <span className="flex items-center gap-1 shrink-0">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[10px]" />
                {locationName}
              </span>
            </div>
            {c.imageUrls.length > 0 && (
              <div className="mt-2 rounded-lg overflow-hidden h-30">
                <img className="w-full h-full object-cover" src={c.imageUrls[0]} alt={c.title} />
              </div>
            )}
            <p className="text-[13px] text-slate-500 dark:text-[#8c8c96] mt-2 leading-relaxed">
              {isExpanded ? c.description : (
                <>
                  {c.description.slice(0, 100)}
                  {c.description.length > 100 ? "..." : ""}
                </>
              )}
            </p>
          </div>

          {/* Metrics bar */}
          <div className="flex items-center gap-3 px-3.5 pb-2 text-xs">
            <button
              className={`flex items-center gap-1 transition-colors cursor-pointer ${
                hasUpvoted
                  ? "text-blue-500 font-semibold"
                  : "text-slate-400 dark:text-[#8c8c96] hover:text-blue-500"
              }`}
              onClick={(e) => { e.stopPropagation(); onUpvote?.(c.id); }}
              title={hasUpvoted ? "Remove upvote" : "Upvote"}
            >
              <FontAwesomeIcon icon={faChevronUp} /> {upvoteCount}
            </button>
            <button
              className="flex items-center gap-1 text-slate-400 dark:text-[#8c8c96] hover:text-blue-500 transition-colors cursor-pointer"
              onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : c.id); }}
              title="Comments"
            >
              <FontAwesomeIcon icon={faComment} /> {comments.length}
            </button>
            <button
              className="ml-auto flex items-center gap-1 text-slate-400 dark:text-[#6e6e79] hover:text-blue-500 transition-colors cursor-pointer"
              onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : c.id); }}
            >
              <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} className="text-[10px]" />
              <span>{isExpanded ? "Less" : "More"}</span>
            </button>
          </div>

          {/* Expanded section */}
          {isExpanded && (
            <div className="border-t border-slate-100 dark:border-[#3a3a3a] px-3.5 pb-3.5">
              {/* Extra images */}
              {c.imageUrls.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto">
                  {c.imageUrls.slice(1).map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`${c.title} ${i + 2}`}
                      className="w-20 h-16 object-cover rounded-lg shrink-0"
                    />
                  ))}
                </div>
              )}

              {/* Comments section */}
              <div className="mt-3">
                <h4 className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
                  Comments ({comments.length})
                </h4>
                {comments.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-zinc-500 italic">No comments yet.</p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                    {comments.map((comment) => (
                      <div key={comment.id} className="p-2 rounded-lg bg-slate-50 dark:bg-[#2a2a2a] text-xs">
                        <p className="text-slate-700 dark:text-zinc-300">{comment.text}</p>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">
                          {getTimeSince(comment.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add comment */}
                {onAddComment && (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={expandedId === c.id ? commentText : ""}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-[#2a2a2a] text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && commentText.trim()) {
                          onAddComment(c.id, commentText.trim());
                          setCommentText("");
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      className="px-3 py-1.5 text-xs font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!commentText.trim()}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (commentText.trim()) {
                          onAddComment(c.id, commentText.trim());
                          setCommentText("");
                        }
                      }}
                    >
                      Post
                    </button>
                  </div>
                )}
              </div>

              {/* Delete */}
              <button
                className="mt-3 w-full py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Delete this request?")) onDelete(c.id);
                }}
              >
                Delete request
              </button>
            </div>
          )}
        </div>
        );
      })}
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
