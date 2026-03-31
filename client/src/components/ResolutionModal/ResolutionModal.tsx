import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { Request } from "../../types/request";

interface ResolutionModalProps {
  request: Request | null;
  onClose: () => void;
}

export default function ResolutionModal({ request, onClose }: ResolutionModalProps) {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const open = !!request;

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        setAnimate(true);
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }));
    } else {
      setAnimate(false);
      const timer = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!visible || !request) return null;

  const isResolved = request.status === "resolved";
  const isUnderReview = request.status === "under-review";

  const history = request.statusHistory || [];

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const statusIcon = (s: string): "report" | "review" | "progress" | "resolved" =>
    s === "under-review" ? "review" : s === "in-progress" ? "progress" : s === "resolved" ? "resolved" : "report";

  const statusTitle = (s: string) =>
    s === "open" ? "Issue Reported"
    : s === "under-review" ? "Under Review"
    : s === "in-progress" ? "Work In Progress"
    : s === "resolved" ? "Resolved"
    : s;

  const statusDescription = (s: string, isActive: boolean, isCurrent: boolean) => {
    if (s === "open") return "This issue was reported by a member of the community.";
    if (s === "under-review") return isCurrent && isActive ? "The report is currently being assessed by the local authority." : "Status moved to under review.";
    if (s === "in-progress") return isCurrent && isActive ? "Mitigation efforts are underway. Work is actively being done to resolve this issue." : "Status moved to in progress.";
    if (s === "resolved") return "This issue has been addressed and marked as resolved.";
    return "";
  };

  // Build entries: if no history, create a synthetic "open" entry
  const entries = history.length > 0 ? history : [{ status: "open" as const, changedAt: request.createdAt, changedByName: request.userName }];

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center backdrop-blur-sm transition-colors duration-200"
      style={{ backgroundColor: animate ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0)" }}
      onClick={onClose}
    >
      <div
        className="bg-white/80 dark:bg-[#272727]/80 backdrop-blur-xl rounded-2xl shadow-2xl w-[90vw] max-w-md relative transition-all duration-200 max-h-[80vh] flex flex-col overflow-hidden"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "scale(1)" : "scale(0.95)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-[#333] text-slate-400 dark:text-zinc-500 cursor-pointer transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header – sticky */}
        <div className="sticky top-0 bg-white/80 dark:bg-[#272727]/80 backdrop-blur-xl px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-slate-100 dark:bg-[#333] text-slate-600 dark:text-zinc-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-zinc-100">{request.title}</h2>
              <p className="text-xs text-slate-400 dark:text-zinc-500">Action Log</p>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div ref={scrollRef} className="sidebar flex-1 overflow-y-auto px-6 py-6">

        {/* Mitigation timeline */}
        <div className="space-y-0">
          {entries.map((entry, i) => {
            const isLast = i === entries.length - 1;
            const isActive = isLast && !isResolved;
            const icon = statusIcon(entry.status);
            const author = entry.status === "open" ? (entry.changedByName || request.userName) : entry.changedByName;
            const date = entry.changedAt
              ? `${formatDate(entry.changedAt)}${author ? ` by ${author}` : ''}`
              : '';
            return (
              <LogEntry
                key={i}
                icon={icon}
                title={statusTitle(entry.status)}
                description={statusDescription(entry.status, isActive, isLast)}
                date={date}
                note={entry.note}
                active={isActive}
                isLast={isLast}
                dimmed={!isLast && !isActive}
              />
            );
          })}
        </div>

        {/* Summary */}
        <div className={`mt-5 p-3 rounded-lg border ${
          isResolved
            ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
            : isUnderReview
              ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20"
              : "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20"
        }`}>
          <p className={`text-xs leading-relaxed ${
            isResolved
              ? "text-emerald-700 dark:text-emerald-300"
              : isUnderReview
                ? "text-indigo-700 dark:text-indigo-300"
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
    </div>,
    document.body
  );
}

function LogEntry({ icon, title, description, date, note, isLast, active, dimmed }: {
  icon: "report" | "review" | "progress" | "resolved";
  title: string;
  description: string;
  date: string;
  note?: string;
  isLast?: boolean;
  active?: boolean;
  dimmed?: boolean;
}) {
  const iconColors: Record<string, string> = {
    report: "bg-red-100 dark:bg-red-500/15 text-red-500",
    review: "bg-indigo-100 dark:bg-indigo-500/15 text-indigo-500",
    progress: "bg-amber-100 dark:bg-amber-500/15 text-amber-500",
    resolved: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-500",
  };

  const lineColors: Record<string, string> = {
    report: "bg-red-300 dark:bg-red-500/40",
    review: "bg-indigo-300 dark:bg-indigo-500/40",
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
                borderTopColor: icon === "review" ? "#6366f1" : "#f59e0b",
                borderRightColor: icon === "review" ? "#6366f180" : "#f59e0b80",
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
        <p className={`text-sm font-semibold ${
          active
            ? icon === "review" ? "text-indigo-500 dark:text-indigo-400" : "text-amber-500 dark:text-amber-400"
            : isLast
              ? icon === "resolved" ? "text-emerald-600 dark:text-emerald-400"
                : icon === "review" ? "text-indigo-500 dark:text-indigo-400"
                : icon === "progress" ? "text-amber-500 dark:text-amber-400"
                : "text-red-500 dark:text-red-400"
              : "text-slate-700 dark:text-zinc-200"
        }`}>{title}{active && " ..."}</p>
        <p className={`text-xs mt-0.5 leading-relaxed ${active || isLast ? "text-slate-700 dark:text-zinc-200" : "text-slate-500 dark:text-zinc-400"}`}>{description}</p>
        {note && (
          <div className="mt-1.5 inline-flex items-start gap-1 px-2.5 py-2 rounded-lg bg-slate-100 dark:bg-[#1e1e1e] leading-relaxed">
            <span className={`text-2xl font-serif leading-none -mt-1 shrink-0 ${
              icon === "report" ? "text-red-400 dark:text-red-500" :
              icon === "review" ? "text-indigo-400 dark:text-indigo-500" :
              icon === "progress" ? "text-amber-400 dark:text-amber-500" :
              "text-emerald-400 dark:text-emerald-500"
            }`}>&ldquo;</span>
            <span className="text-xs text-slate-600 dark:text-zinc-300 italic">{note}</span>
            <span className={`text-2xl font-serif leading-none self-end -mb-1.5 shrink-0 ${
              icon === "report" ? "text-red-400 dark:text-red-500" :
              icon === "review" ? "text-indigo-400 dark:text-indigo-500" :
              icon === "progress" ? "text-amber-400 dark:text-amber-500" :
              "text-emerald-400 dark:text-emerald-500"
            }`}>&rdquo;</span>
          </div>
        )}
        {date && <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">{date}</p>}
      </div>
    </div>
  );
}
