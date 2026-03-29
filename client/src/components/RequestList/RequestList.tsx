import { useRef, useState, useEffect, useCallback } from "react";
import type { Request } from "../../types/request";
import { RequestItem } from "../RequestItem";

interface RequestListProps {
  requests: Request[];
  loading?: boolean;
  onSelect: (c: Request) => void;
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
  selectedId,
  currentUserId,
}: RequestListProps) {
  const PAGE_SIZE = 5;
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Reset visible count when the list changes (new filter/sort)
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [requests]);

  // Infinite scroll via IntersectionObserver on a sentinel element
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const scrollRoot = sentinel.closest(".sidebar") as Element | null;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, requests.length));
        }
      },
      { root: scrollRoot, rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [requests.length]);

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
          className="sticky top-2 z-20 block mx-auto mb-2 px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 bg-slate-100/90 dark:bg-[#1e1e1e]/90 backdrop-blur-sm rounded-full hover:text-blue-500 cursor-pointer transition-colors"
        >
          Back to top
        </button>
      )}
      {requests.slice(0, visibleCount).map((c, index) => {
        return (
        <div key={c.id}>
          {index > 0 && <hr className="border-slate-200 dark:border-[#2a2a2a] my-2 mx-auto w-4/5" />}
          <RequestItem
            request={c}
            onSelect={onSelect}
            selected={c.id === selectedId}
            currentUserId={currentUserId}
          />
        </div>
        );
      })}
      {visibleCount < requests.length && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-slate-300 dark:border-zinc-600 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
