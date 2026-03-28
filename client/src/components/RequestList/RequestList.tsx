import { useRef, useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronUp, faComment, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import type { Request } from "../../types/request";
import { STATUS_COLORS } from "../../types/request";

interface RequestListProps {
  requests: Request[];
  loading?: boolean;
  onSelect: (c: Request) => void;
  selectedId: string | null;
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
  selectedId,
}: RequestListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

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
        const comments = c.comments || [];
        const upvoteCount = (c.upvoters || []).length;
        const timeSince = getTimeSince(c.createdAt);
        const locationName = c.location || `${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`;

        return (
        <div
          key={c.id}
          className={`group bg-white dark:bg-[#272727] rounded-xl mb-2.5 border-2 transition-all shadow-sm cursor-pointer
            ${c.id === selectedId
              ? "border-blue-500"
              : "border-transparent hover:border-blue-200 dark:hover:border-blue-900 hover:shadow-md"
            }`}
          onClick={() => onSelect(c)}
        >
          <div className="p-3.5">
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
              <span className="flex items-center gap-1 shrink-0">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[10px]" />
                {locationName}
              </span>
              <span>{timeSince}</span>
            </div>
            {(c.imageUrls || []).length > 0 && (
              <div className="mt-2 rounded-lg overflow-hidden h-30">
                <img className="w-full h-full object-cover" src={c.imageUrls[0]} alt={c.title} />
              </div>
            )}
            <p className="text-[13px] text-slate-500 dark:text-[#8c8c96] mt-2 leading-relaxed">
              {c.description.slice(0, 200)}
              {c.description.length > 200 ? "..." : ""}
            </p>
          </div>
          <div className="flex items-center gap-3 px-3.5 pb-2.5 text-xs text-slate-400 dark:text-[#8c8c96]">
            <span className="flex items-center gap-1">
              <FontAwesomeIcon icon={faChevronUp} /> {upvoteCount}
            </span>
            <span className="flex items-center gap-1">
              <FontAwesomeIcon icon={faComment} /> {comments.length}
            </span>
          </div>
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
