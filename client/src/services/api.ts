import type { Complaint, NewComplaint } from "../types/complaint";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export async function fetchComplaints(): Promise<Complaint[]> {
  const res = await fetch(`${API_BASE}/complaints`);
  if (!res.ok) throw new Error("Failed to fetch complaints");
  return res.json();
}

export async function fetchComplaint(id: string): Promise<Complaint> {
  const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error("Failed to fetch complaint");
  return res.json();
}

export async function createComplaint(data: NewComplaint): Promise<Complaint> {
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
  if (!res.ok) throw new Error("Failed to create complaint");
  return res.json();
}

export async function upvoteComplaint(id: string): Promise<Complaint> {
  const res = await fetch(
    `${API_BASE}/complaints/${encodeURIComponent(id)}/upvote`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error("Failed to upvote complaint");
  return res.json();
}

export async function deleteComplaint(id: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/complaints/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error("Failed to delete complaint");
}
