import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import type { Comment } from "../../types/request";

interface CommentItemProps {
  comment: Comment;
  replies: Comment[];
  currentUserId?: string;
  commentMenuId: string | null;
  onToggleMenu: (id: string | null) => void;
  onLike: (commentId: string) => void;
  onReply: (parentId: string, text: string) => void;
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

function formatCommentText(text: string) {
  const parts = text.split(/(@\S+)/g);
  return parts.map((part, i) =>
    part.startsWith("@") ? <span key={i} className="text-blue-500 font-medium">{part}</span> : part
  );
}

export default function CommentItem({ comment, replies, currentUserId, commentMenuId, onToggleMenu, onLike, onReply }: CommentItemProps) {
  const [replyingTo, setReplyingTo] = useState(false);
  const [replyText, setReplyText] = useState("");

  const commentLikes = (comment.likers || []).length;
  const hasLikedComment = currentUserId && (comment.likers || []).includes(currentUserId);

  return (
    <div>
      <div className="relative flex gap-2.5 py-2.5 text-xs">
        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-[#3a3a3a] text-slate-500 dark:text-zinc-400 flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5">
          {((comment.userName || "U")[0] ?? "U").toUpperCase()}
        </div>
        <div className="absolute right-1 top-1">
          <CommentMenu
            commentId={comment.id}
            isAuthor={currentUserId === comment.userId}
            openMenuId={commentMenuId}
            onToggle={(id) => onToggleMenu(commentMenuId === id ? null : id)}
            onDelete={() => { /* TODO: delete comment */ }}
            onEdit={() => { /* TODO: edit comment */ }}
            onReport={() => { /* TODO: report comment */ }}
          />
        </div>
        <div className="absolute right-2 bottom-2">
          <button
            className={`flex items-center gap-1 transition-colors cursor-pointer text-[11px] ${
              hasLikedComment
                ? "text-red-500 font-semibold"
                : "text-slate-400 dark:text-zinc-500 hover:text-red-500"
            }`}
            onClick={() => onLike(comment.id)}
          >
            <FontAwesomeIcon icon={hasLikedComment ? faHeartSolid : faHeartRegular} className="text-[9px]" />
            <span>{commentLikes}</span>
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-medium text-slate-700 dark:text-zinc-300 truncate">{comment.userName || "Anonymous"}</span>
          <p className="text-slate-600 dark:text-zinc-400 mt-0.5">{comment.text}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] text-slate-400 dark:text-zinc-500">{getTimeSince(comment.createdAt)}</span>
            <button
              className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 hover:text-blue-500 cursor-pointer transition-colors"
              onClick={() => { setReplyingTo(!replyingTo); setReplyText(`@${comment.userName || "Anonymous"} `); }}
            >
              Reply
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
                <div key={reply.id} className="relative flex gap-2.5 py-2.5 text-xs">
                  <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-[#3a3a3a] text-slate-500 dark:text-zinc-400 flex items-center justify-center text-[9px] font-semibold shrink-0 mt-0.5">
                    {((reply.userName || "U")[0] ?? "U").toUpperCase()}
                  </div>
                  <div className="absolute right-1 top-1">
                    <CommentMenu
                      commentId={reply.id}
                      isAuthor={currentUserId === reply.userId}
                      openMenuId={commentMenuId}
                      onToggle={(id) => onToggleMenu(commentMenuId === id ? null : id)}
                      onDelete={() => { /* TODO: delete reply */ }}
                      onEdit={() => { /* TODO: edit reply */ }}
                      onReport={() => { /* TODO: report reply */ }}
                    />
                  </div>
                  <div className="absolute right-2 bottom-2">
                    <button
                      className={`flex items-center gap-1 transition-colors cursor-pointer text-[11px] ${
                        hasLikedReply
                          ? "text-red-500 font-semibold"
                          : "text-slate-400 dark:text-zinc-500 hover:text-red-500"
                      }`}
                      onClick={() => onLike(reply.id)}
                    >
                      <FontAwesomeIcon icon={hasLikedReply ? faHeartSolid : faHeartRegular} className="text-[9px]" />
                      <span>{replyLikes}</span>
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-slate-700 dark:text-zinc-300 truncate">{reply.userName || "Anonymous"}</span>
                    <p className="text-slate-600 dark:text-zinc-400 mt-0.5">{formatCommentText(reply.text)}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">{getTimeSince(reply.createdAt)}</span>
                      <button
                        className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 hover:text-blue-500 cursor-pointer transition-colors"
                        onClick={() => { setReplyingTo(!replyingTo); setReplyText(`@${reply.userName || "Anonymous"} `); }}
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
        {/* Inline reply input */}
        {replyingTo && (
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
                  onReply(comment.id, replyText.trim());
                  setReplyText("");
                  setReplyingTo(false);
                }
                if (e.key === "Escape") {
                  setReplyingTo(false);
                }
              }}
            />
            {replyText.trim() && (
              <button
                className="text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors cursor-pointer"
                onClick={() => {
                  onReply(comment.id, replyText.trim());
                  setReplyText("");
                  setReplyingTo(false);
                }}
              >
                Post
              </button>
            )}
            <button
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
              onClick={() => setReplyingTo(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
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
