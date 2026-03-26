import type { Request, NewRequest } from "../types/request";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export async function fetchRequests(): Promise<Request[]> {
  const res = await fetch(`${API_BASE}/complaints`);
  if (!res.ok) throw new Error("Failed to fetch requests");
  return res.json();
}

export async function fetchRequest(id: string): Promise<Request> {
  const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(id)}`);
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
  formData.append("reporterName", data.reporterName);

  for (const image of data.images) {
    formData.append("images", image);
  }

  const res = await fetch(`${API_BASE}/complaints`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to create request");
  return res.json();
}

export async function upvoteRequest(id: string): Promise<Request> {
  const res = await fetch(
    `${API_BASE}/complaints/${encodeURIComponent(id)}/upvote`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error("Failed to upvote request");
  return res.json();
}

export async function deleteRequest(id: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/complaints/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error("Failed to delete request");
}
