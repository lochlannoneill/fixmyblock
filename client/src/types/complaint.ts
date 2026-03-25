export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  latitude: number;
  longitude: number;
  imageUrls: string[];
  createdAt: string;
  upvotes: number;
  reporterName: string;
}

export type ComplaintCategory =
  | "pothole"
  | "streetlight"
  | "graffiti"
  | "litter"
  | "sidewalk"
  | "drainage"
  | "signage"
  | "other";

export type ComplaintStatus = "open" | "in-progress" | "resolved";

export interface NewComplaint {
  title: string;
  description: string;
  category: ComplaintCategory;
  latitude: number;
  longitude: number;
  images: File[];
  reporterName: string;
}

export const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  pothole: "Pothole",
  streetlight: "Broken Streetlight",
  graffiti: "Graffiti",
  litter: "Litter / Dumping",
  sidewalk: "Damaged Sidewalk",
  drainage: "Drainage Issue",
  signage: "Missing / Damaged Sign",
  other: "Other",
};

export const STATUS_COLORS: Record<ComplaintStatus, string> = {
  open: "#3b82f6",
  "in-progress": "#f59e0b",
  resolved: "#22c55e",
};
