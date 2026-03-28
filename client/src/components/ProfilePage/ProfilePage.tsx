import type { AuthUser } from "../../hooks/useAuth";
import type { Request } from "../../types/request";
import { CATEGORY_LABELS, STATUS_COLORS } from "../../types/request";

interface ProfilePageProps {
  user: AuthUser;
  requests: Request[];
  onClose: () => void;
  onSelectRequest: (r: Request) => void;
}

const PROVIDER_LABELS: Record<string, string> = {
  aad: "Microsoft",
  google: "Google",
  apple: "Apple",
  facebook: "Facebook",
};

export default function ProfilePage({ user, requests, onClose, onSelectRequest }: ProfilePageProps) {
  const myPosts = requests.filter((r) => r.reporterId === user.userId);
  const totalUpvotesReceived = myPosts.reduce((sum, r) => sum + (r.upvoters || []).length, 0);
  const resolvedCount = myPosts.filter((r) => r.status === "resolved").length;
  const myUpvotesGiven = requests.filter((r) => (r.upvoters || []).includes(user.userId)).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="m-0 text-lg font-semibold text-slate-800 dark:text-zinc-200">{user.userDetails}</h2>
        <button
          onClick={onClose}
          className="text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer transition-colors"
          aria-label="Close profile"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* User info card */}
      <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-white dark:bg-[#272727] border border-slate-200 dark:border-[#3a3a3a]">
        <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
          {(user.userDetails?.[0] ?? "U").toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold truncate">{user.userDetails}</p>
          <p className="text-sm text-slate-400 dark:text-zinc-500">
            {PROVIDER_LABELS[user.identityProvider] ?? user.identityProvider} account
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Posts" value={myPosts.length} icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        } />
        <StatCard label="Upvotes Received" value={totalUpvotesReceived} icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        } />
        <StatCard label="Issues Resolved" value={resolvedCount} icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        } />
        <StatCard label="Upvotes Given" value={myUpvotesGiven} icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        } />
      </div>

      {/* Recent posts */}
      <h3 className="text-sm font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
        Your Posts
      </h3>
      {myPosts.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-zinc-500 text-center py-8">
          You haven't posted any requests yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {myPosts.map((r) => (
            <button
              key={r.id}
              onClick={() => onSelectRequest(r)}
              className="text-left p-3 rounded-lg border border-slate-200 dark:border-[#3a3a3a] bg-white dark:bg-[#272727] hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="flex-1 text-sm font-semibold truncate">{r.title}</span>
                <span
                  className="text-[11px] font-semibold text-white px-2 py-0.5 rounded-full shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[r.status] }}
                >
                  {r.status === "in-progress" ? "In Progress" : r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-[#6e6e79]">
                <span>{CATEGORY_LABELS[r.category]}</span>
                <span>&middot;</span>
                <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                <span>&middot;</span>
                <span className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                  {(r.upvoters || []).length}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="p-3 rounded-xl border border-slate-200 dark:border-[#3a3a3a] bg-white dark:bg-[#272727]">
      <div className="flex items-center gap-2 mb-1 text-slate-400 dark:text-zinc-500">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-zinc-200">{value}</p>
    </div>
  );
}
