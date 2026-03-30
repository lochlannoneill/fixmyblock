import { useState, useEffect } from "react";
import type { Request, RequestStatus } from "../../types/request";

interface ResolutionModalProps {
  request: Request | null;
  onClose: () => void;
}

export default function ResolutionModal({ request, onClose }: ResolutionModalProps) {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  const open = !!request;

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    } else {
      setAnimate(false);
      const timer = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!visible || !request) return null;

  const isResolved = request.status === "resolved";
  const isUnderReview = request.status === "under-review";
  const isInProgress = request.status === "in-progress";

  const history = request.statusHistory || [];
  const findEntry = (status: RequestStatus) => history.find((h) => h.status === status);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const openEntry = findEntry("open");
  const reviewEntry = findEntry("under-review");
  const progressEntry = findEntry("in-progress");
  const resolvedEntry = findEntry("resolved");

  const reportAuthor = openEntry?.changedByName || request.userName;
  const reportDate = openEntry
    ? `${formatDate(openEntry.changedAt)}${reportAuthor ? ` by ${reportAuthor}` : ''}`
    : `${formatDate(request.createdAt)}${request.userName ? ` by ${request.userName}` : ''}`;

  const reviewDate = reviewEntry
    ? `${formatDate(reviewEntry.changedAt)}${reviewEntry.changedByName ? ` by ${reviewEntry.changedByName}` : ''}`
    : '';

  const progressDate = progressEntry
    ? `${formatDate(progressEntry.changedAt)}${progressEntry.changedByName ? ` by ${progressEntry.changedByName}` : ''}`
    : '';

  const resolvedDate = resolvedEntry
    ? `${formatDate(resolvedEntry.changedAt)}${resolvedEntry.changedByName ? ` by ${resolvedEntry.changedByName}` : ''}`
    : '';

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center backdrop-blur-sm transition-colors duration-200"
      style={{ backgroundColor: animate ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0)" }}
      onClick={onClose}
    >
      <div
        className="bg-white/80 dark:bg-[#272727]/80 backdrop-blur-xl rounded-2xl shadow-2xl w-[90vw] max-w-md p-6 relative transition-all duration-200 max-h-[80vh] overflow-y-auto"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "scale(1)" : "scale(0.95)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-[#333] text-slate-400 dark:text-zinc-500 cursor-pointer transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-slate-100 dark:bg-[#333] text-slate-600 dark:text-zinc-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-zinc-100">Action Log</h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500">{request.title}</p>
          </div>
        </div>

        {/* Mitigation timeline */}
        <div className="space-y-0">
          <LogEntry
            icon="report"
            title="Issue Reported"
            description="This issue was reported by a member of the community."
            date={reportDate}
            dimmed={isUnderReview || isInProgress || isResolved}
            nextIcon="review"
          />
          <LogEntry
            icon="review"
            title="Under Review"
            description={isUnderReview
              ? "The report is currently being assessed by the local authority."
              : reviewEntry
                ? "Moved to review."
                : "The report was received and queued for assessment by the local authority."}
            date={reviewDate}
            active={isUnderReview}
            isLast={isUnderReview}
            activeLabel="Currently under review..."
            dimmed={isInProgress || isResolved}
            nextIcon={isUnderReview ? undefined : "progress"}
          />
          {!isUnderReview && (
          <LogEntry
            icon="progress"
            title="Work In Progress"
            description={isInProgress
              ? "Mitigation efforts are underway. Work is actively being done to resolve this issue."
              : progressEntry
                ? "Work began on resolving the issue."
                : "Mitigation efforts were scheduled and work began on resolving the issue."}
            date={progressDate}
            active={isInProgress}
            isLast={isInProgress}
            activeLabel="In progress..."
            dimmed={isResolved}
            nextIcon={isResolved ? "resolved" : undefined}
          />
          )}
          {isResolved && (
            <LogEntry
              icon="resolved"
              title="Resolved"
              description="The issue has been addressed and marked as resolved."
              date={resolvedDate}
              isLast
            />
          )}
        </div>

        {/* Summary */}
        <div className={`mt-5 p-3 rounded-lg border ${
          isResolved
            ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
            : isUnderReview
              ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20"
              : "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20"
        }`}>
          <p className={`text-xs leading-relaxed ${
            isResolved
              ? "text-emerald-700 dark:text-emerald-300"
              : isUnderReview
                ? "text-blue-700 dark:text-blue-300"
                : "text-amber-700 dark:text-amber-300"
          }`}>
            {isResolved
              ? "This issue has been successfully resolved. If you believe the problem persists, please submit a new report."
              : isUnderReview
                ? "This issue is currently under review. The local authority is assessing the report and will take action soon."
                : "This issue is currently being worked on. Check back later for updates on the resolution progress."}
          </p>
        </div>
      </div>
    </div>
  );
}

function LogEntry({ icon, title, description, date, isLast, active, dimmed, activeLabel, nextIcon }: {
  icon: "report" | "review" | "progress" | "resolved";
  title: string;
  description: string;
  date: string;
  isLast?: boolean;
  active?: boolean;
  dimmed?: boolean;
  activeLabel?: string;
  nextIcon?: "report" | "review" | "progress" | "resolved";
}) {
  const iconColors: Record<string, string> = {
    report: "bg-red-100 dark:bg-red-500/15 text-red-500",
    review: "bg-blue-100 dark:bg-blue-500/15 text-blue-500",
    progress: "bg-amber-100 dark:bg-amber-500/15 text-amber-500",
    resolved: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-500",
  };

  const lineColors: Record<string, string> = {
    report: "bg-red-300 dark:bg-red-500/40",
    review: "bg-blue-300 dark:bg-blue-500/40",
    progress: "bg-amber-300 dark:bg-amber-500/40",
    resolved: "bg-emerald-300 dark:bg-emerald-500/40",
  };

  const icons: Record<string, React.ReactNode> = {
    report: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    review: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    progress: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 3 21 3 21 8" />
        <line x1="4" y1="20" x2="21" y2="3" />
        <polyline points="21 16 21 21 16 21" />
        <line x1="15" y1="15" x2="21" y2="21" />
        <line x1="4" y1="4" x2="9" y2="9" />
      </svg>
    ),
    resolved: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  };

  return (
    <div className={`flex gap-3 ${dimmed ? "opacity-50" : ""}${active ? " animate-pulse" : ""}`}>
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <div className="relative shrink-0">
          {active && isLast && (
            <div
              className="absolute inset-[-4px] rounded-full animate-spin"
              style={{
                border: "2px solid transparent",
                borderTopColor: icon === "review" ? "#3b82f6" : "#f59e0b",
                borderRightColor: icon === "review" ? "#3b82f680" : "#f59e0b80",
                animationDuration: "1.2s",
              }}
            />
          )}
          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${iconColors[icon]}${isLast && !active ? " ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#272727] ring-current" : ""}`}>
            {icons[icon]}
          </div>
        </div>
        {!isLast && <div className={`w-0.5 flex-1 ${lineColors[icon]} my-1`} />}
      </div>
      {/* Content */}
      <div className={`pt-0.5 ${isLast ? "pb-0" : "pb-4"}`}>
        <p className={`text-sm font-semibold ${active ? `${icon === "review" ? "text-blue-500 dark:text-blue-400" : "text-amber-500 dark:text-amber-400"}` : "text-slate-700 dark:text-zinc-200"}`}>{title}{active && " ..."}</p>
        <p className={`text-xs mt-0.5 leading-relaxed ${active ? "text-slate-700 dark:text-zinc-200" : "text-slate-500 dark:text-zinc-400"}`}>{description}</p>
        {date && <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">{date}</p>}
      </div>
    </div>
  );
}
