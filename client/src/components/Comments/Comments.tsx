import { useState, useRef, useEffect } from "react";
import type { Comment } from "../../types/request";
import CommentItem from "./CommentItem";

interface CommentsProps {
  requestId: string;
  comments: Comment[];
  onAddComment: (requestId: string, text: string, parentId?: string) => void;
  onLikeComment: (requestId: string, commentId: string) => void;
  currentUserId?: string;
}

export default function Comments({ requestId, comments, onAddComment, onLikeComment, currentUserId }: CommentsProps) {
  const [commentText, setCommentText] = useState("");
  const [commentMenuId, setCommentMenuId] = useState<string | null>(null);
  const COMMENT_PAGE = 5;
  const [visibleComments, setVisibleComments] = useState(COMMENT_PAGE);
  const commentSentinelRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const topLevelComments = comments.filter(c => !c.parentId);
  const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId);

  useEffect(() => {
    setVisibleComments(COMMENT_PAGE);
  }, [requestId]);

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

  return (
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
              onAddComment(requestId, commentText.trim());
              setCommentText("");
            }
          }}
        />
        {commentText.trim() && (
          <button
            className="text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors cursor-pointer"
            onClick={() => {
              onAddComment(requestId, commentText.trim());
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
          {topLevelComments.slice(0, visibleComments).map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={getReplies(comment.id)}
              currentUserId={currentUserId}
              commentMenuId={commentMenuId}
              onToggleMenu={setCommentMenuId}
              onLike={(commentId) => onLikeComment(requestId, commentId)}
              onReply={(parentId, text) => onAddComment(requestId, text, parentId)}
            />
          ))}
          {visibleComments < topLevelComments.length && (
            <div ref={commentSentinelRef} className="flex justify-center py-3">
              <div className="w-4 h-4 border-2 border-slate-300 dark:border-zinc-600 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
