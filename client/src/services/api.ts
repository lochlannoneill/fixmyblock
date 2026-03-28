import type { Request, NewRequest } from "../types/request";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export async function fetchRequests(): Promise<Request[]> {
  const res = await fetch(`${API_BASE}/posts`);
  if (!res.ok) throw new Error("Failed to fetch requests");
  return res.json();
}

export async function fetchRequest(id: string): Promise<Request> {
  const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error("Failed to fetch request");
  return res.json();
}

export async function createRequest(data: NewRequest): Promise<Request> {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("description", data.description);
  formData.append("category", data.category);
  formData.append("latitude", data.latitude.toString());
  formData.append("longitude", data.longitude.toString());
  if (data.location) formData.append("location", data.location);

  for (const image of data.images) {
    formData.append("images", image);
  }

  const res = await fetch(`${API_BASE}/posts`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to create request");
  return res.json();
}

export async function likeRequest(id: string): Promise<Request> {
  const res = await fetch(
    `${API_BASE}/posts/${encodeURIComponent(id)}/like`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error("Failed to like request");
  return res.json();
}

export async function deleteRequest(id: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/posts/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error("Failed to delete request");
}

export async function addComment(id: string, text: string, parentId?: string): Promise<Request> {
  const res = await fetch(
    `${API_BASE}/posts/${encodeURIComponent(id)}/comments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, ...(parentId ? { parentId } : {}) }),
    }
  );
  if (!res.ok) throw new Error("Failed to add comment");
  return res.json();
}

export async function likeComment(requestId: string, commentId: string): Promise<Request> {
  const res = await fetch(
    `${API_BASE}/posts/${encodeURIComponent(requestId)}/comments/${encodeURIComponent(commentId)}/like`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error("Failed to like comment");
  return res.json();
}

export async function saveRequest(id: string): Promise<Request> {
  const res = await fetch(
    `${API_BASE}/posts/${encodeURIComponent(id)}/save`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error("Failed to save request");
  return res.json();
}
