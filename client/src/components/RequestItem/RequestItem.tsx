import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as faHeartSolid, faComment as faCommentSolid, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular, faComment as faCommentRegular } from "@fortawesome/free-regular-svg-icons";
import type { Request, RequestStatus } from "../../types/request";
import { STATUS_COLORS } from "../../types/request";
import { ResolutionModal } from "../ResolutionModal";

const STATUS_OPTIONS: { value: RequestStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "under-review", label: "Under Review" },
  { value: "in-progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

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

export default function RequestItem({ request: c, onSelect, selected, currentUserId, isAdmin, onUpdateStatus }: {
  request: Request;
  onSelect: (r: Request) => void;
  selected?: boolean;
  currentUserId?: string;
  isAdmin?: boolean;
  onUpdateStatus?: (id: string, status: RequestStatus, note?: string) => void;
}) {
  const [showResolution, setShowResolution] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [statusVisible, setStatusVisible] = useState(false);
  const [statusAnimate, setStatusAnimate] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<RequestStatus | null>(null);
  const [noteText, setNoteText] = useState("");
  const statusRef = useRef<HTMLDivElement>(null);
  const comments = c.comments || [];
  const likeCount = (c.likers || []).length;
  const hasLiked = !!(currentUserId && (c.likers || []).includes(currentUserId));
  const hasCommented = !!(currentUserId && comments.some(com => com.userId === currentUserId));
  const timeSince = getTimeSince(c.createdAt);
  const locationName = c.location || `${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`;
  const statusLabel = c.status === "in-progress" ? "In Progress" : c.status === "under-review" ? "Under Review" : c.status.charAt(0).toUpperCase() + c.status.slice(1);

  useEffect(() => {
    if (showStatusDropdown) {
      setStatusVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setStatusAnimate(true)));
    } else {
      setStatusAnimate(false);
      const timer = setTimeout(() => setStatusVisible(false), 150);
      return () => clearTimeout(timer);
    }
  }, [showStatusDropdown]);

  useEffect(() => {
    if (!showStatusDropdown) return;
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setShowStatusDropdown(false);
        setPendingStatus(null);
        setNoteText("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showStatusDropdown]);

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
      <div className="flex items-center gap-3 mb-2">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{background:'linear-gradient(135deg,#ec4899,#a855f7,#f97316)'}}>
          {((c.userName || "A")[0] ?? "A").toUpperCase()}
        </div>
        <div className="flex flex-col flex-1 min-w-0 leading-tight">
          <span className="text-[13px] font-semibold text-slate-700 dark:text-zinc-300 truncate">{c.userName || "Anonymous"}</span>
          <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500">{timeSince}</span>
        </div>
        <div className="relative shrink-0" ref={statusRef}>
          <button
            onClick={(e) => { e.stopPropagation(); if (isAdmin && onUpdateStatus) setShowStatusDropdown(v => !v); }}
            className={`text-[11px] font-semibold text-white px-3.5 py-1.5 rounded-full ${isAdmin && onUpdateStatus ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
            style={{ backgroundColor: STATUS_COLORS[c.status] }}
          >
            {statusLabel}
            {isAdmin && onUpdateStatus && (
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block ml-1 -mt-px"><polyline points="6 9 12 15 18 9" /></svg>
            )}
          </button>
          {statusVisible && (
            <div
              className="absolute right-0 top-full mt-1 bg-white dark:bg-[#272727] border border-gray-200 dark:border-zinc-700 rounded-xl shadow-lg z-50 overflow-hidden py-1 origin-top-right"
              style={{
                transition: "opacity 150ms ease, transform 150ms ease",
                opacity: statusAnimate ? 1 : 0,
                transform: statusAnimate ? "scale(1) translateY(0)" : "scale(0.95) translateY(-4px)",
                width: pendingStatus ? "240px" : "160px",
              }}
            >
              {pendingStatus ? (
                <div className="px-3 py-2" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[pendingStatus] }} />
                    <span className="text-[13px] font-semibold text-slate-700 dark:text-zinc-300">
                      {STATUS_OPTIONS.find(o => o.value === pendingStatus)?.label}
                    </span>
                  </div>
                  <textarea
                    className="w-full px-2.5 py-2 text-[12px] rounded-lg border border-gray-200 dark:border-zinc-600 bg-slate-50 dark:bg-[#1e1e1e] text-slate-700 dark:text-zinc-300 resize-none placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    placeholder="Add a note (optional)"
                    rows={2}
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      className="flex-1 text-[12px] font-medium px-2 py-1.5 rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#333] transition-colors cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); setPendingStatus(null); setNoteText(""); }}
                    >
                      Cancel
                    </button>
                    <button
                      className="flex-1 text-[12px] font-medium px-2 py-1.5 rounded-lg text-white transition-colors cursor-pointer"
                      style={{ backgroundColor: STATUS_COLORS[pendingStatus] }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateStatus!(c.id, pendingStatus, noteText.trim() || undefined);
                        setShowStatusDropdown(false);
                        setPendingStatus(null);
                        setNoteText("");
                      }}
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              ) : (
                STATUS_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    className={`w-full text-left px-3 py-2 text-[13px] cursor-pointer transition-colors flex items-center gap-2 ${
                      o.value === c.status
                        ? "font-semibold"
                        : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#333]"
                    }`}
                    style={o.value === c.status ? { color: STATUS_COLORS[o.value] } : undefined}
                    disabled={o.value === c.status}
                    onClick={(e) => { e.stopPropagation(); setPendingStatus(o.value); }}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[o.value] }} />
                    {o.label}
                    {o.value === c.status && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-auto"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
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
      {c.status !== "open" && (
        <button
          className="flex items-center justify-center gap-1.5 w-full mt-3 px-3 py-2.5 rounded-lg text-xs font-medium cursor-pointer transition-all border hover:brightness-75"
          style={{
            color: c.status === 'resolved' ? '#059669' : c.status === 'under-review' ? '#6366f1' : '#d97706',
            background: c.status === 'resolved' ? 'rgba(16,185,129,0.08)' : c.status === 'under-review' ? 'rgba(99,102,241,0.08)' : 'rgba(245,158,11,0.08)',
            borderColor: c.status === 'resolved' ? 'rgba(16,185,129,0.2)' : c.status === 'under-review' ? 'rgba(99,102,241,0.2)' : 'rgba(245,158,11,0.2)',
          }}
          onClick={(e) => { e.stopPropagation(); setShowResolution(true); }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          View Action Log
        </button>
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
        <span className={`flex items-center gap-1 ${hasCommented ? "text-blue-500" : ""}`}>
          <FontAwesomeIcon icon={hasCommented ? faCommentSolid : faCommentRegular} /> {comments.length}
        </span>
      </div>
    </div>
    </>
  );
}
