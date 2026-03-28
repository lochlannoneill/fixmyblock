import { useState, useRef } from "react";
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
  const commentInputRef = useRef<HTMLInputElement>(null);

  const comments = request.comments || [];
  const topLevelComments = comments.filter(c => !c.parentId);
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
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-[#2a2a2a]">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer text-slate-500 dark:text-zinc-400"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <span className="flex-1 font-semibold text-base text-slate-800 dark:text-zinc-200 truncate">
          {request.title.length > 30 ? `${request.title.slice(0, 30)}...` : request.title}
        </span>
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
          {(request.imageUrls || []).length > 0 && (
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
              <FontAwesomeIcon icon={comments.length > 0 ? faCommentSolid : faCommentRegular} /> {comments.length}
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
                {topLevelComments.map((comment) => {
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
                      <span className="font-medium text-slate-700 dark:text-zinc-300 truncate">{comment.userName || "Anonymous"}</span>
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
                          <FontAwesomeIcon icon={hasLikedComment || commentLikes > 0 ? faHeartSolid : faHeartRegular} className="text-[9px]" />
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
                            <span className="font-medium text-slate-700 dark:text-zinc-300 truncate">{reply.userName || "Anonymous"}</span>
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
                                <FontAwesomeIcon icon={hasLikedReply || replyLikes > 0 ? faHeartSolid : faHeartRegular} className="text-[9px]" />
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
              </div>
            )}
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
