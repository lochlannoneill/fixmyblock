import { useState, useMemo } from "react";
import type { Request, RequestCategory, RequestStatus } from "../types/request";

export type SortBy = "newest" | "oldest" | "upvotes";

export function useRequestFilters(requests: Request[]) {
  const [filterCategory, setFilterCategory] = useState<RequestCategory | "">("");
  const [filterStatus, setFilterStatus] = useState<RequestStatus | "">("");
  const [sortBy, setSortBy] = useState<SortBy>("newest");

  const filteredSorted = useMemo(() => {
    const filtered = requests.filter((c) => {
      if (filterCategory && c.category !== filterCategory) return false;
      if (filterStatus && c.status !== filterStatus) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return b.upvotes - a.upvotes;
    });
  }, [requests, filterCategory, filterStatus, sortBy]);

  return { filterCategory, setFilterCategory, filterStatus, setFilterStatus, sortBy, setSortBy, filteredSorted };
}
