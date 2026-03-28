import { useState } from "react";

interface FeedbackPageProps {
  onClose: () => void;
}

export default function FeedbackPage({ onClose }: FeedbackPageProps) {
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="m-0 text-lg font-semibold text-slate-800 dark:text-zinc-200">Feedback</h2>
          <button
            onClick={onClose}
            className="text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer transition-colors"
            aria-label="Close feedback"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-700 dark:text-zinc-300 mb-1">Thank you!</h3>
          <p className="text-sm text-slate-400 dark:text-zinc-500">Your feedback has been submitted. We appreciate your input.</p>
          <button
            onClick={() => { setSubmitted(false); setMessage(""); }}
            className="mt-6 text-sm text-blue-500 hover:text-blue-600 font-medium cursor-pointer"
          >
            Send more feedback
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="m-0 text-lg font-semibold text-slate-800 dark:text-zinc-200">Feedback</h2>
        <button
          onClick={onClose}
          className="text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer transition-colors"
          aria-label="Close feedback"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <p className="text-sm text-slate-500 dark:text-zinc-400 mb-5">Help us improve FixMyBlock by sharing your thoughts, reporting bugs, or suggesting features.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-[#3a3a3a] bg-white dark:bg-[#272727] text-sm text-slate-700 dark:text-zinc-300 outline-none focus:border-blue-400"
          >
            <option value="general">General Feedback</option>
            <option value="bug">Bug Report</option>
            <option value="feature">Feature Request</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what's on your mind..."
            rows={5}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-[#3a3a3a] bg-white dark:bg-[#272727] text-sm text-slate-700 dark:text-zinc-300 outline-none focus:border-blue-400 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={!message.trim()}
          className="w-full py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Submit Feedback
        </button>
      </form>
    </div>
  );
}
