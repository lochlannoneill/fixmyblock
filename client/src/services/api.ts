import type { Request, NewRequest, RequestStatus, UserProfile, UserSettings, UserRole } from "../types/request";

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

export async function updateRequestStatus(id: string, status: RequestStatus): Promise<Request> {
  const res = await fetch(
    `${API_BASE}/posts/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }
  );
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
}

// ── User API ──

export async function fetchMe(): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/users/me`);
  if (!res.ok) throw new Error("Failed to fetch user profile");
  return res.json();
}

export async function upsertMe(): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/users/me`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to upsert user");
  return res.json();
}

export async function patchSettings(settings: Partial<UserSettings>): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/users/me/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error("Failed to update settings");
  return res.json();
}

export async function updateProfile(data: { firstName: string; lastName: string }): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/users/me/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}

export async function uploadAvatar(file: File): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/users/me/avatar`, {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) {
    const body = await res.text();
    console.error("Avatar upload response:", res.status, body);
    throw new Error("Failed to upload avatar");
  }
  return res.json();
}

export async function deleteAvatar(): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/users/me/avatar`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to remove avatar");
  return res.json();
}

// ── Admin API ──

export async function fetchAllUsers(): Promise<UserProfile[]> {
  const res = await fetch(`${API_BASE}/users`);
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function changeUserRole(userId: string, role: UserRole): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/users/${encodeURIComponent(userId)}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to change role" }));
    throw new Error(err.error || "Failed to change role");
  }
  return res.json();
}
