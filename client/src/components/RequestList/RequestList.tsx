import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronUp } from "@fortawesome/free-solid-svg-icons";
import type { Request } from "../../types/request";
import { CATEGORY_LABELS, STATUS_COLORS } from "../../types/request";

interface RequestListProps {
  requests: Request[];
  onSelect: (c: Request) => void;
  onDelete: (id: string) => void;
  selectedId: string | null;
}

export default function RequestList({
  requests,
  onSelect,
  onDelete,
  selectedId,
}: RequestListProps) {
  if (requests.length === 0) {
    return (
      <div className="py-12 px-6 text-center text-slate-400 dark:text-[#6e6e79] text-sm">
        <p>No requests match your criteria.</p>
      </div>
    );
  }

  return (
    <div className="p-3">
      {requests.map((c) => (
        <div
          key={c.id}
          className={`group bg-white dark:bg-[#272727] rounded-xl p-3.5 mb-2.5 cursor-pointer border-2 transition-all shadow-sm relative
            ${c.id === selectedId
              ? "border-blue-500"
              : "border-transparent hover:border-blue-200 dark:hover:border-blue-900 hover:shadow-md"
            }`}
          onClick={() => onSelect(c)}
        >
          <div className="flex items-center gap-2">
            <span className="flex-1 font-semibold text-sm text-slate-800 dark:text-zinc-200">{c.title}</span>
            <span
              className="text-[11px] font-semibold text-white px-2 py-0.5 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[c.status] }}
            >
              {c.status === "in-progress" ? "In Progress" : c.status.charAt(0).toUpperCase() + c.status.slice(1)}
            </span>
            <span className="text-xs text-slate-500 dark:text-[#8c8c96] flex items-center gap-1 transition-colors hover:text-blue-500">
              <FontAwesomeIcon icon={faChevronUp} /> {c.upvotes}
            </span>
          </div>
          <div className="text-xs text-slate-400 dark:text-[#6e6e79] mt-1">
            {CATEGORY_LABELS[c.category]} &middot;{" "}
            {new Date(c.createdAt).toLocaleDateString()}
          </div>
          {c.imageUrls.length > 0 && (
            <div className="mt-2 rounded-lg overflow-hidden h-[120px]">
              <img className="w-full h-full object-cover" src={c.imageUrls[0]} alt={c.title} />
            </div>
          )}
          <p className="text-[13px] text-slate-500 dark:text-[#8c8c96] mt-2 leading-relaxed">
            {c.description.slice(0, 100)}
            {c.description.length > 100 ? "..." : ""}
          </p>
          <button
            className="absolute bottom-2.5 right-2.5 bg-transparent border-none text-sm cursor-pointer opacity-30 group-hover:opacity-60 hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all p-1 px-1.5 rounded"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm("Delete this request?")) onDelete(c.id);
            }}
            title="Delete request"
          >
            &#128465;
          </button>
        </div>
      ))}
    </div>
  );
}
