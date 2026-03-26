import { useState, useEffect, useCallback } from "react";
import type { Request, NewRequest } from "../types/request";
import { fetchRequests, createRequest, upvoteRequest, deleteRequest } from "../services/api";

export function useRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  useEffect(() => {
    fetchRequests()
      .then(setRequests)
      .catch(() => console.warn("API not connected. Running in demo mode."));
  }, []);

  const selectRequest = useCallback((c: Request | null) => {
    setSelectedRequest(c);
  }, []);

  const upvote = useCallback(async (id: string) => {
    try {
      const updated = await upvoteRequest(id);
      setRequests((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      setSelectedRequest((prev) =>
        prev?.id === updated.id ? updated : prev
      );
    } catch {
      console.error("Failed to upvote");
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      await deleteRequest(id);
      setRequests((prev) => prev.filter((c) => c.id !== id));
      setSelectedRequest((prev) => (prev?.id === id ? null : prev));
    } catch {
      console.error("Failed to delete");
    }
  }, []);

  const create = useCallback(async (data: NewRequest) => {
    const created = await createRequest(data);
    setRequests((prev) => [created, ...prev]);
    setSelectedRequest(created);
    return created;
  }, []);

  return { requests, selectedRequest, selectRequest, upvote, remove, create };
}
