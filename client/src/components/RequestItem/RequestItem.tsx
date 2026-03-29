import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as faHeartSolid, faComment as faCommentSolid, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular, faComment as faCommentRegular } from "@fortawesome/free-regular-svg-icons";
import type { Request } from "../../types/request";
import { STATUS_COLORS } from "../../types/request";

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
  const comments = c.comments || [];
  const likeCount = (c.likers || []).length;
  const hasLiked = !!(currentUserId && (c.likers || []).includes(currentUserId));
  const hasCommented = !!(currentUserId && comments.some(com => com.userId === currentUserId));
  const timeSince = getTimeSince(c.createdAt);
  const locationName = c.location || `${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`;

  return (
    <div
      className={`py-3.5 px-2 -mx-2 rounded-lg cursor-pointer transition-all duration-150 ${
        selected
          ? "bg-blue-50/50 dark:bg-blue-500/5"
          : "hover:bg-white dark:hover:bg-[#2a2a2a] hover:scale-[1.01]"
      }`}
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
        <span className="flex items-center gap-1 shrink-0">
          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[10px]" />
          {locationName}
        </span>
        <span>{timeSince}</span>
      </div>
      {(c.imageUrls || []).length > 0 && (
        <div className="mt-2 rounded-lg overflow-hidden h-80">
          <img className="w-full h-full object-cover" src={c.imageUrls[0]} alt={c.title} />
        </div>
      )}
      <p className="text-[13px] text-slate-500 dark:text-[#8c8c96] mt-2 leading-relaxed">
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
  );
}
