export interface StatusChange {
  status: RequestStatus;
  changedAt: string;
  changedBy?: string;
  changedByName?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
  likers: string[];
  parentId?: string;
}

export interface Request {
  id: string;
  type: string;
  title: string;
  description: string;
  category: RequestCategory;
  status: RequestStatus;
  latitude: number;
  longitude: number;
  location?: string;
  imageUrls: string[];
  createdAt: string;
  likes: number;
  likers: string[];
  savedBy: string[];
  userId: string;
  userName?: string;
  comments: Comment[];
  statusHistory: StatusChange[];
}

export type RequestCategory =
  | "pothole"
  | "streetlight"
  | "graffiti"
  | "litter"
  | "sidewalk"
  | "drainage"
  | "signage"
  | "other";

export type RequestStatus = "open" | "under-review" | "in-progress" | "resolved";

export interface NewRequest {
  title: string;
  description: string;
  category: RequestCategory;
  latitude: number;
  longitude: number;
  location?: string;
  images: File[];
}

export const CATEGORY_LABELS: Record<RequestCategory, string> = {
  pothole: "Pothole",
  streetlight: "Broken Streetlight",
  graffiti: "Graffiti",
  litter: "Litter / Dumping",
  sidewalk: "Damaged Sidewalk",
  drainage: "Drainage Issue",
  signage: "Missing / Damaged Sign",
  other: "Other",
};

export const STATUS_COLORS: Record<RequestStatus, string> = {
  open: "#ef4444",
  "under-review": "#3b82f6",
  "in-progress": "#f59e0b",
  resolved: "#22c55e",
};

export interface UserSettings {
  darkMode: boolean;
  highAccuracy: boolean;
}

export interface HomeAddress {
  address: string;
  latitude: number;
  longitude: number;
}

export type UserRole = "admin" | "moderator" | "developer" | "user";

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email?: string;
  identityProvider: string;
  role: UserRole;
  createdAt: string;
  settings: UserSettings;
  profilePictureUrl?: string;
  homeAddress?: HomeAddress;
}
