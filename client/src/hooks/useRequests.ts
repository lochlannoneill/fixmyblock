import { useState, useEffect, useCallback } from "react";
import type { Request, NewRequest, RequestStatus } from "../types/request";
import { fetchRequests, createRequest, likeRequest, deleteRequest, addComment as addCommentApi, likeComment as likeCommentApi, deleteComment as deleteCommentApi, saveRequest as saveRequestApi, updateRequestStatus as updateRequestStatusApi } from "../services/api";

export function useRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  const refresh = useCallback(() => {
    fetchRequests()
      .then(setRequests)
      .catch(() => console.warn("API not connected. Running in demo mode."));
  }, []);

  useEffect(() => {
    refresh();
    setLoading(false);
  }, [refresh]);

  // Refetch when the tab regains focus (stale-while-revalidate pattern)
  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  const selectRequest = useCallback((c: Request | null) => {
    setSelectedRequest(c);
  }, []);

  const like = useCallback(async (id: string) => {
    try {
      const updated = await likeRequest(id);
      setRequests((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      setSelectedRequest((prev) =>
        prev?.id === updated.id ? updated : prev
      );
    } catch {
      console.error("Failed to like");
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

  const addComment = useCallback(async (id: string, text: string, parentId?: string) => {
    try {
      const updated = await addCommentApi(id, text, parentId);
      setRequests((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      setSelectedRequest((prev) =>
        prev?.id === updated.id ? updated : prev
      );
    } catch {
      console.error("Failed to add comment");
    }
  }, []);

  const likeComment = useCallback(async (requestId: string, commentId: string) => {
    try {
      const updated = await likeCommentApi(requestId, commentId);
      setRequests((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      setSelectedRequest((prev) =>
        prev?.id === updated.id ? updated : prev
      );
    } catch {
      console.error("Failed to like comment");
    }
  }, []);

  const removeComment = useCallback(async (requestId: string, commentId: string) => {
    try {
      const updated = await deleteCommentApi(requestId, commentId);
      setRequests((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      setSelectedRequest((prev) =>
        prev?.id === updated.id ? updated : prev
      );
    } catch {
      console.error("Failed to delete comment");
    }
  }, []);

  const save = useCallback(async (id: string) => {
    try {
      const updated = await saveRequestApi(id);
      setRequests((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      setSelectedRequest((prev) =>
        prev?.id === updated.id ? updated : prev
      );
    } catch {
      console.error("Failed to save");
    }
  }, []);

  const updateStatus = useCallback(async (id: string, status: RequestStatus, note?: string) => {
    try {
      const updated = await updateRequestStatusApi(id, status, note);
      setRequests((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      setSelectedRequest((prev) =>
        prev?.id === updated.id ? updated : prev
      );
    } catch {
      console.error("Failed to update status");
    }
  }, []);

  return { requests, loading, selectedRequest, selectRequest, like, remove, create, addComment, likeComment, removeComment, save, updateStatus };
}
