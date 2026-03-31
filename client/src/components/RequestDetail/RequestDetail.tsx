import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as faHeartSolid, faComment as faCommentSolid, faMapMarkerAlt, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular, faComment as faCommentRegular } from "@fortawesome/free-regular-svg-icons";
import type { Request, RequestStatus } from "../../types/request";
import { STATUS_COLORS } from "../../types/request";
import { Comments } from "../Comments";
import { ResolutionModal } from "../ResolutionModal";

const STATUS_OPTIONS: { value: RequestStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "under-review", label: "Under Review" },
  { value: "in-progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

interface RequestDetailProps {
  request: Request;
  onBack: () => void;
  onLike: (id: string) => void;
  onAddComment: (id: string, text: string, parentId?: string) => void;
  onLikeComment: (requestId: string, commentId: string) => void;
  onSave: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateStatus?: (id: string, status: RequestStatus) => void;
  currentUserId?: string;
  isAdmin?: boolean;
}

export default function RequestDetail({
  request,
  onBack,
  onLike,
  onAddComment,
  onLikeComment,
  onSave,
  onDelete,
  onUpdateStatus,
  currentUserId,
  isAdmin,
}: RequestDetailProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAnimate, setMenuAnimate] = useState(false);
  const [showResolution, setShowResolution] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [statusVisible, setStatusVisible] = useState(false);
  const [statusAnimate, setStatusAnimate] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const [showBackToTop, setShowBackToTop] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isOwner = currentUserId && currentUserId === request.userId;

  useEffect(() => {
    if (showMenu) {
      setMenuVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setMenuAnimate(true)));
    } else {
      setMenuAnimate(false);
      const timer = setTimeout(() => setMenuVisible(false), 150);
      return () => clearTimeout(timer);
    }
  }, [showMenu]);

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

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
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setShowStatusDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showStatusDropdown]);

  const comments = request.comments || [];
  const likeCount = (request.likers || []).length;
  const hasLiked = currentUserId && (request.likers || []).includes(currentUserId);
  const hasSaved = currentUserId && (request.savedBy || []).includes(currentUserId);

  const displayLocation = request.location || `${request.latitude.toFixed(4)}, ${request.longitude.toFixed(4)}`;
  const statusLabel = request.status === "in-progress" ? "In Progress" : request.status === "under-review" ? "Under Review" : request.status.charAt(0).toUpperCase() + request.status.slice(1);

  return (
    <>
    <ResolutionModal request={showResolution ? request : null} onClose={() => setShowResolution(false)} />
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-1 md:py-3 border-b border-slate-200 dark:border-[#2a2a2a]">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer text-slate-500 dark:text-zinc-400"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
      </div>

      {/* Scrollable content */}
      <div
        className="flex-1 overflow-y-auto relative"
        ref={scrollRef}
        onScroll={() => { if (scrollRef.current) setShowBackToTop(scrollRef.current.scrollTop > 150); }}
      >
        {showBackToTop && (
          <button
            onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
            className="sticky top-2 z-20 block mx-auto mb-2 px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 bg-slate-100/90 dark:bg-[#1e1e1e]/90 backdrop-blur-sm rounded-full hover:text-blue-500 cursor-pointer transition-colors"
          >
            Back to top
          </button>
        )}
        <div className="p-4 md:p-5">
          {/* Top bar – avatar, name/time, status, menu */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{background:'linear-gradient(135deg,#ec4899,#a855f7,#f97316)'}}>
              {((request.userName || "A")[0] ?? "A").toUpperCase()}
            </div>
            <div className="flex flex-col flex-1 min-w-0 leading-tight">
              <span className="text-[13px] font-semibold text-slate-700 dark:text-zinc-300 truncate">
                {request.userName || "Anonymous"}
              </span>
              <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500">{getTimeSince(request.createdAt)}</span>
            </div>
            <div className="flex items-center gap-0.5 shrink-0 -mr-2">
            <div className="relative" ref={statusRef}>
              <button
                onClick={() => { if (isAdmin && onUpdateStatus) setShowStatusDropdown(v => !v); }}
                className={`text-[11px] font-semibold text-white px-2.5 py-1.5 rounded-full shrink-0 ${isAdmin && onUpdateStatus ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
                style={{ backgroundColor: STATUS_COLORS[request.status] }}
              >
                {statusLabel}
                {isAdmin && onUpdateStatus && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block ml-1 -mt-px"><polyline points="6 9 12 15 18 9" /></svg>
                )}
              </button>
              {statusVisible && (
                <div
                  className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-[#272727] border border-gray-200 dark:border-zinc-700 rounded-xl shadow-lg z-50 overflow-hidden py-1 origin-top-right"
                  style={{
                    transition: "opacity 150ms ease, transform 150ms ease",
                    opacity: statusAnimate ? 1 : 0,
                    transform: statusAnimate ? "scale(1) translateY(0)" : "scale(0.95) translateY(-4px)",
                  }}
                >
                  {STATUS_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      className={`w-full text-left px-3 py-2 text-[13px] cursor-pointer transition-colors flex items-center gap-2 ${
                        o.value === request.status
                          ? "font-semibold"
                          : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#333]"
                      }`}
                      style={o.value === request.status ? { color: STATUS_COLORS[o.value] } : undefined}
                      disabled={o.value === request.status}
                      onClick={() => { setShowStatusDropdown(false); onUpdateStatus!(request.id, o.value); }}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[o.value] }} />
                      {o.label}
                      {o.value === request.status && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-auto"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(v => !v)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer text-slate-400 dark:text-zinc-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="2"/>
                  <circle cx="12" cy="12" r="2"/>
                  <circle cx="12" cy="19" r="2"/>
                </svg>
              </button>
              {menuVisible && (
                <div
                  className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[#272727] border border-gray-200 dark:border-zinc-700 rounded-xl shadow-lg z-50 overflow-hidden origin-top-right"
                  style={{
                    transition: "opacity 150ms ease, transform 150ms ease",
                    opacity: menuAnimate ? 1 : 0,
                    transform: menuAnimate ? "scale(1) translateY(0)" : "scale(0.95) translateY(-4px)",
                  }}
                >
                  {isOwner ? (
                    <>
                      <button
                        className="w-full text-left px-3 py-2 text-[13px] text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#333] cursor-pointer transition-colors"
                        onClick={() => { setShowMenu(false); /* TODO: edit handler */ }}
                      >
                        Edit
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors"
                        onClick={() => {
                          setShowMenu(false);
                          if (confirm("Delete this request?")) onDelete(request.id);
                        }}
                      >
                        Delete
                      </button>
                    </>
                  ) : isAdmin ? (
                    <button
                      className="w-full text-left px-3 py-2 text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors"
                      onClick={() => {
                        setShowMenu(false);
                        if (confirm("Delete this request?")) onDelete(request.id);
                      }}
                    >
                      Delete
                    </button>
                  ) : (
                    <button
                      className="w-full text-left px-3 py-2 text-[13px] text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#333] cursor-pointer transition-colors"
                      onClick={() => { setShowMenu(false); /* TODO: report handler */ }}
                    >
                      Report
                    </button>
                  )}
                </div>
              )}
            </div>
            </div>
          </div>

          {/* Images */}
          {(request.imageUrls || []).length > 0 ? (
            <div className="mt-3 flex flex-col gap-2">
              {request.imageUrls.map((url, i) => (
                <div key={i} className="relative rounded-lg overflow-hidden">
                  <img
                    src={url}
                    alt={`${request.title} ${i + 1}`}
                    className="w-full rounded-lg"
                  />
                  {i === request.imageUrls.length - 1 && (
                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 py-1.5 text-xs text-white bg-black/40 backdrop-blur-sm">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[10px]" />
                      {displayLocation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1 mt-3 text-xs text-slate-400 dark:text-[#6e6e79]">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[10px]" />
              {displayLocation}
            </div>
          )}

          {/* Map links */}
          <div className="flex gap-2 mt-3">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${request.latitude},${request.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-[#2a2a2a] text-slate-600 dark:text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8c0 4.5-6 12-6 12s-6-7.5-6-12a6 6 0 0 1 12 0z"/><circle cx="12" cy="8" r="2"/></svg>
              Google Maps
            </a>
            <a
              href={`https://maps.apple.com/?ll=${request.latitude},${request.longitude}&q=${encodeURIComponent(request.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-[#2a2a2a] text-slate-600 dark:text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8c0 4.5-6 12-6 12s-6-7.5-6-12a6 6 0 0 1 12 0z"/><circle cx="12" cy="8" r="2"/></svg>
              Apple Maps
            </a>
          </div>

          {/* Action log button */}
          {request.status !== "open" && (
            <button
              className="flex items-center justify-center gap-1.5 w-full mt-3 px-3 py-2.5 rounded-lg text-xs font-medium cursor-pointer transition-all border hover:brightness-75"
              style={{
                color: request.status === 'resolved' ? '#059669' : request.status === 'under-review' ? '#3b82f6' : '#d97706',
                background: request.status === 'resolved' ? 'rgba(16,185,129,0.08)' : request.status === 'under-review' ? 'rgba(59,130,246,0.08)' : 'rgba(245,158,11,0.08)',
                borderColor: request.status === 'resolved' ? 'rgba(16,185,129,0.2)' : request.status === 'under-review' ? 'rgba(59,130,246,0.2)' : 'rgba(245,158,11,0.2)',
              }}
              onClick={() => setShowResolution(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              View Action Log
            </button>
          )}

          {/* Title */}
          <h2 className="text-base font-semibold text-slate-800 dark:text-zinc-200 mt-3">{request.title}</h2>

          {/* Description */}
          <p className="text-[13px] text-slate-600 dark:text-[#b0b0b8] mt-1 leading-relaxed whitespace-pre-wrap">
            {request.description}
          </p>

          {/* Metrics bar */}
          <div className="flex items-center justify-between mt-4 text-xs">
            <div className="flex items-center gap-2">
            <button
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                hasLiked
                  ? "text-red-500 font-semibold bg-red-50 dark:bg-red-500/10"
                  : "text-slate-500 dark:text-[#8c8c96] bg-slate-100 dark:bg-[#2a2a2a] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
              }`}
              onClick={() => onLike(request.id)}
              title={hasLiked ? "Unlike" : "Like"}
            >
              <FontAwesomeIcon icon={hasLiked ? faHeartSolid : faHeartRegular} /> {likeCount}
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#2a2a2a] text-slate-500 dark:text-[#8c8c96] hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors cursor-pointer"
            >
              <FontAwesomeIcon icon={currentUserId && comments.some(com => com.userId === currentUserId) ? faCommentSolid : faCommentRegular} /> {comments.length}
            </button>
            </div>
            <div className="flex items-center gap-2">
            <button
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                hasSaved
                  ? "text-blue-500 font-semibold bg-blue-50 dark:bg-blue-500/10"
                  : "text-slate-500 dark:text-[#8c8c96] bg-slate-100 dark:bg-[#2a2a2a] hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10"
              }`}
              onClick={() => onSave(request.id)}
              title={hasSaved ? "Unsave" : "Save"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill={hasSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              Save
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#2a2a2a] text-slate-500 dark:text-[#8c8c96] hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors cursor-pointer"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: request.title, text: request.description, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
              title="Share"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              Share
            </button>
            </div>
          </div>

          <Comments
            requestId={request.id}
            comments={comments}
            onAddComment={onAddComment}
            onLikeComment={onLikeComment}
            currentUserId={currentUserId}
          />
        </div>
      </div>
    </div>
    </>
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
