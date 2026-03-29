import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as faHeartSolid, faComment as faCommentSolid, faMapMarkerAlt, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular, faComment as faCommentRegular } from "@fortawesome/free-regular-svg-icons";
import type { Request } from "../../types/request";
import { STATUS_COLORS } from "../../types/request";

interface RequestDetailProps {
  request: Request;
  onBack: () => void;
  onLike: (id: string) => void;
  onAddComment: (id: string, text: string, parentId?: string) => void;
  onLikeComment: (requestId: string, commentId: string) => void;
  onSave: (id: string) => void;
  onDelete: (id: string) => void;
  currentUserId?: string;
}

export default function RequestDetail({
  request,
  onBack,
  onLike,
  onAddComment,
  onLikeComment,
  onSave,
  onDelete,
  currentUserId,
}: RequestDetailProps) {
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAnimate, setMenuAnimate] = useState(false);
  const [commentMenuId, setCommentMenuId] = useState<string | null>(null);
  const COMMENT_PAGE = 5;
  const [visibleComments, setVisibleComments] = useState(COMMENT_PAGE);
  const commentSentinelRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const comments = request.comments || [];
  const topLevelComments = comments.filter(c => !c.parentId);

  // Reset visible comments when switching posts
  useEffect(() => {
    setVisibleComments(COMMENT_PAGE);
  }, [request.id]);

  // Lazy load comments via IntersectionObserver
  useEffect(() => {
    const sentinel = commentSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleComments((prev) => Math.min(prev + COMMENT_PAGE, topLevelComments.length));
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [topLevelComments.length]);

  const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId);
  const likeCount = (request.likers || []).length;
  const hasLiked = currentUserId && (request.likers || []).includes(currentUserId);
  const hasSaved = currentUserId && (request.savedBy || []).includes(currentUserId);

  const displayLocation = request.location || `${request.latitude.toFixed(4)}, ${request.longitude.toFixed(4)}`;
  const statusLabel = request.status === "in-progress" ? "In Progress" : request.status.charAt(0).toUpperCase() + request.status.slice(1);

  const formatCommentText = (text: string) => {
    const parts = text.split(/(@\S+)/g);
    return parts.map((part, i) =>
      part.startsWith("@") ? <span key={i} className="text-blue-500 font-medium">{part}</span> : part
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - desktop only */}
      <div className="hidden md:flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-[#2a2a2a]">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer text-slate-500 dark:text-zinc-400"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {/* Poster info */}
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {((request.userName || "A")[0] ?? "A").toUpperCase()}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                {request.userName || "Anonymous"}
              </span>
              <span className="text-xs text-slate-400 dark:text-[#6e6e79]">{getTimeSince(request.createdAt)}</span>
            </div>
            <span
              className="text-[11px] font-semibold text-white px-2.5 py-0.5 rounded-full shrink-0"
              style={{ backgroundColor: STATUS_COLORS[request.status] }}
            >
              {statusLabel}
            </span>
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

          {/* Images */}
          {(request.imageUrls || []).length > 0 ? (
            <div className="mt-3 flex flex-col gap-2">
              {request.imageUrls.map((url, i) => (
                <div key={i} className="relative rounded-lg overflow-hidden">
                  <img
                    src={url}
                    alt={`${request.title} ${i + 1}`}
                    className="w-full rounded-lg object-cover max-h-60"
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

          {/* Title */}
          <h2 className="text-base font-semibold text-slate-800 dark:text-zinc-200 mt-5">{request.title}</h2>

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
              onClick={() => commentInputRef.current?.focus()}
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

          {/* Comments */}
          <div className="mt-8">
            {/* Add comment input */}
            <div className="flex gap-2 mb-3 items-center">
              <input
                ref={commentInputRef}
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-0 py-1 text-xs border-0 border-b border-slate-200 dark:border-zinc-700 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && commentText.trim()) {
                    onAddComment(request.id, commentText.trim());
                    setCommentText("");
                  }
                }}
              />
              {commentText.trim() && (
                <button
                  className="text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors cursor-pointer"
                  onClick={() => {
                    onAddComment(request.id, commentText.trim());
                    setCommentText("");
                  }}
                >
                  Post
                </button>
              )}
            </div>

            {comments.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-xs text-slate-400 dark:text-zinc-500 italic">No comments yet. Be the first to comment.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {topLevelComments.slice(0, visibleComments).map((comment) => {
                  const commentLikes = (comment.likers || []).length;
                  const hasLikedComment = currentUserId && (comment.likers || []).includes(currentUserId);
                  const replies = getReplies(comment.id);
                  return (
                  <div key={comment.id}>
                  <div className="flex gap-2.5 p-2.5 text-xs">
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-[#3a3a3a] text-slate-500 dark:text-zinc-400 flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5">
                      {((comment.userName || "U")[0] ?? "U").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-700 dark:text-zinc-300 truncate">{comment.userName || "Anonymous"}</span>
                        <CommentMenu
                          commentId={comment.id}
                          isAuthor={currentUserId === comment.userId}
                          openMenuId={commentMenuId}
                          onToggle={(id) => setCommentMenuId(commentMenuId === id ? null : id)}
                          onDelete={() => { /* TODO: delete comment */ }}
                          onEdit={() => { /* TODO: edit comment */ }}
                          onReport={() => { /* TODO: report comment */ }}
                        />
                      </div>
                      <p className="text-slate-600 dark:text-zinc-400 mt-0.5">{comment.text}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500">{getTimeSince(comment.createdAt)}</span>
                          <button
                            className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 hover:text-blue-500 cursor-pointer transition-colors"
                            onClick={() => { setReplyingTo(replyingTo === comment.id ? null : comment.id); setReplyText(`@${comment.userName || "Anonymous"} `); }}
                          >
                            Reply
                          </button>
                        </div>
                        <button
                          className={`flex items-center gap-1 transition-colors cursor-pointer text-[11px] ${
                            hasLikedComment
                              ? "text-red-500 font-semibold"
                              : "text-slate-400 dark:text-zinc-500 hover:text-red-500"
                          }`}
                          onClick={() => onLikeComment(request.id, comment.id)}
                        >
                          <FontAwesomeIcon icon={hasLikedComment ? faHeartSolid : faHeartRegular} className="text-[9px]" />
                          <span>{commentLikes}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Replies */}
                  <div className="ml-9 border-l-2 border-slate-100 dark:border-[#333] pl-2">
                  {replies.length > 0 && (
                    <>
                      {replies.map((reply) => {
                        const replyLikes = (reply.likers || []).length;
                        const hasLikedReply = currentUserId && (reply.likers || []).includes(currentUserId);
                        return (
                        <div key={reply.id} className="flex gap-2.5 p-2.5 text-xs">
                          <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-[#3a3a3a] text-slate-500 dark:text-zinc-400 flex items-center justify-center text-[9px] font-semibold shrink-0 mt-0.5">
                            {((reply.userName || "U")[0] ?? "U").toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-slate-700 dark:text-zinc-300 truncate">{reply.userName || "Anonymous"}</span>
                              <CommentMenu
                                commentId={reply.id}
                                isAuthor={currentUserId === reply.userId}
                                openMenuId={commentMenuId}
                                onToggle={(id) => setCommentMenuId(commentMenuId === id ? null : id)}
                                onDelete={() => { /* TODO: delete reply */ }}
                                onEdit={() => { /* TODO: edit reply */ }}
                                onReport={() => { /* TODO: report reply */ }}
                              />
                            </div>
                            <p className="text-slate-600 dark:text-zinc-400 mt-0.5">{formatCommentText(reply.text)}</p>
                            <div className="flex items-center justify-between mt-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 dark:text-zinc-500">{getTimeSince(reply.createdAt)}</span>
                                <button
                                  className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 hover:text-blue-500 cursor-pointer transition-colors"
                                  onClick={() => { setReplyingTo(replyingTo === comment.id ? null : comment.id); setReplyText(`@${reply.userName || "Anonymous"} `); }}
                                >
                                  Reply
                                </button>
                              </div>
                              <button
                                className={`flex items-center gap-1 transition-colors cursor-pointer text-[11px] ${
                                  hasLikedReply
                                    ? "text-red-500 font-semibold"
                                    : "text-slate-400 dark:text-zinc-500 hover:text-red-500"
                                }`}
                                onClick={() => onLikeComment(request.id, reply.id)}
                              >
                                <FontAwesomeIcon icon={hasLikedReply ? faHeartSolid : faHeartRegular} className="text-[9px]" />
                                <span>{replyLikes}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </>
                  )}
                  {/* Inline reply input */}
                  {replyingTo === comment.id && (
                    <div className="flex gap-2 items-center p-2.5">
                      <input
                        autoFocus
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        className="flex-1 px-0 py-1 text-xs border-0 border-b border-slate-200 dark:border-zinc-700 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && replyText.trim()) {
                            onAddComment(request.id, replyText.trim(), comment.id);
                            setReplyText("");
                            setReplyingTo(null);
                          }
                          if (e.key === "Escape") {
                            setReplyingTo(null);
                          }
                        }}
                      />
                      {replyText.trim() && (
                        <button
                          className="text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors cursor-pointer"
                          onClick={() => {
                            onAddComment(request.id, replyText.trim(), comment.id);
                            setReplyText("");
                            setReplyingTo(null);
                          }}
                        >
                          Post
                        </button>
                      )}
                      <button
                        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                        onClick={() => setReplyingTo(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  </div>
                  </div>
                  );
                })}
                {visibleComments < topLevelComments.length && (
                  <div ref={commentSentinelRef} className="flex justify-center py-3">
                    <div className="w-4 h-4 border-2 border-slate-300 dark:border-zinc-600 border-t-blue-500 rounded-full animate-spin" />
                  </div>
                )}
              </div>
            )}
          </div>
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

function CommentMenu({ commentId, isAuthor, openMenuId, onToggle, onDelete, onEdit, onReport }: {
  commentId: string;
  isAuthor: boolean;
  openMenuId: string | null;
  onToggle: (id: string) => void;
  onDelete: () => void;
  onEdit: () => void;
  onReport: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isOpen = openMenuId === commentId;

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onToggle(commentId);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, commentId, onToggle]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(commentId); }}
        className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer text-slate-400 dark:text-zinc-500"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2"/>
          <circle cx="12" cy="12" r="2"/>
          <circle cx="12" cy="19" r="2"/>
        </svg>
      </button>
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 w-28 bg-white dark:bg-[#272727] border border-gray-200 dark:border-zinc-700 rounded-xl shadow-lg z-50 overflow-hidden origin-top-right animate-[fadeScale_150ms_ease]"
          style={{ animation: "fadeScale 150ms ease" }}
        >
          {isAuthor ? (
            <>
              <button
                className="w-full text-left px-3 py-2 text-[12px] text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#333] cursor-pointer transition-colors"
                onClick={() => { onToggle(commentId); onEdit(); }}
              >
                Edit
              </button>
              <button
                className="w-full text-left px-3 py-2 text-[12px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors"
                onClick={() => { onToggle(commentId); onDelete(); }}
              >
                Delete
              </button>
            </>
          ) : (
            <button
              className="w-full text-left px-3 py-2 text-[12px] text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#333] cursor-pointer transition-colors"
              onClick={() => { onToggle(commentId); onReport(); }}
            >
              Report
            </button>
          )}
        </div>
      )}
    </div>
  );
}
