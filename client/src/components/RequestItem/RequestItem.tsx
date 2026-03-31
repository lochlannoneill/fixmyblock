import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as faHeartSolid, faComment as faCommentSolid, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular, faComment as faCommentRegular } from "@fortawesome/free-regular-svg-icons";
import type { Request } from "../../types/request";
import { STATUS_COLORS } from "../../types/request";
import { ResolutionModal } from "../ResolutionModal";

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

export default function RequestItem({ request: c, onSelect, selected, currentUserId }: {
  request: Request;
  onSelect: (r: Request) => void;
  selected?: boolean;
  currentUserId?: string;
}) {
  const [showResolution, setShowResolution] = useState(false);
  const comments = c.comments || [];
  const likeCount = (c.likers || []).length;
  const hasLiked = !!(currentUserId && (c.likers || []).includes(currentUserId));
  const hasCommented = !!(currentUserId && comments.some(com => com.userId === currentUserId));
  const timeSince = getTimeSince(c.createdAt);
  const locationName = c.location || `${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`;

  return (
    <>
    <ResolutionModal request={showResolution ? c : null} onClose={() => setShowResolution(false)} />
    <div
      className={`py-3.5 px-2 -mx-2 rounded-lg cursor-pointer transition-all duration-150 ${
        selected
          ? "bg-blue-50/50 dark:bg-blue-500/5"
          : "hover:bg-white dark:hover:bg-[#2a2a2a] hover:scale-[1.01]"
      }`}
      onClick={() => onSelect(c)}
    >
      {/* Top bar – avatar, name/time, status */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
          {((c.userName || "A")[0] ?? "A").toUpperCase()}
        </div>
        <div className="flex flex-col flex-1 min-w-0 leading-tight">
          <span className="text-[13px] font-semibold text-slate-700 dark:text-zinc-300 truncate">{c.userName || "Anonymous"}</span>
          <span className="text-[11px] text-slate-400 dark:text-[#6e6e79]">{timeSince}</span>
        </div>
        <span
          className="text-[11px] font-semibold text-white px-2 py-1.5 rounded-full shrink-0"
          style={{ backgroundColor: STATUS_COLORS[c.status] }}
        >
          {c.status === "in-progress" ? "In Progress" : c.status === "under-review" ? "Under Review" : c.status.charAt(0).toUpperCase() + c.status.slice(1)}
        </span>
      </div>
      {c.status !== "open" && (
        <button
          className={`flex items-center justify-center gap-1.5 w-full mt-2 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
            c.status === "resolved"
              ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
              : c.status === "under-review"
                ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                : "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20"
          }`}
          onClick={(e) => { e.stopPropagation(); setShowResolution(true); }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          View Action Log
        </button>
      )}
      {(c.imageUrls || []).length > 0 ? (
        <div className="mt-3 relative rounded-lg overflow-hidden h-80">
          <img className="w-full h-full object-cover" src={c.imageUrls[0]} alt={c.title} />
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 py-1.5 text-xs text-white bg-black/40 backdrop-blur-sm">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[10px]" />
            {locationName}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1 mt-2 text-xs text-slate-400 dark:text-[#6e6e79]">
          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[10px]" />
          {locationName}
        </div>
      )}
      <span className="font-semibold text-sm text-slate-800 dark:text-zinc-200 block mt-3">{c.title}</span>
      <p className="text-[13px] text-slate-500 dark:text-[#8c8c96] mt-1 leading-relaxed">
        {c.description.slice(0, 200)}
        {c.description.length > 200 ? "..." : ""}
      </p>
      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 dark:text-[#8c8c96]">
        <span className={`flex items-center gap-1 ${hasLiked ? "text-red-500" : ""}`}>
          <FontAwesomeIcon icon={hasLiked ? faHeartSolid : faHeartRegular} /> {likeCount}
        </span>
        <span className="flex items-center gap-1">
          <FontAwesomeIcon icon={hasCommented ? faCommentSolid : faCommentRegular} /> {comments.length}
        </span>
      </div>
    </div>
    </>
  );
}
