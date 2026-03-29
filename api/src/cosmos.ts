import { CosmosClient, Database, Container } from "@azure/cosmos";

let client: CosmosClient;
let database: Database;
let container: Container;
let usersContainer: Container;

function getClient(): CosmosClient {
  if (!client) {
    const connectionString = process.env.COSMOS_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error("COSMOS_CONNECTION_STRING is not configured");
    }
    client = new CosmosClient(connectionString);
  }
  return client;
}

function getDatabase(): Database {
  if (!database) {
    database = getClient().database(process.env.COSMOS_DATABASE || "fixmyblock");
  }
  return database;
}

function getContainer(): Container {
  if (!container) {
    container = getDatabase().container(process.env.COSMOS_CONTAINER || "posts");
  }
  return container;
}

function getUsersContainer(): Container {
  if (!usersContainer) {
    usersContainer = getDatabase().container(process.env.USERS_CONTAINER || "users");
  }
  return usersContainer;
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

export interface RequestDoc {
  id: string;
  type: string;
  title: string;
  description: string;
  category: string;
  status: string;
  latitude: number;
  longitude: number;
  location?: string;
  imageUrls: string[];
  createdAt: string;
  likes: number;
  likers: string[];
  savedBy: string[];
  userId: string;
  userName: string;
  comments: Comment[];
}

function migrateDoc(doc: RequestDoc & { reporterId?: string; reporterName?: string }): RequestDoc {
  if (!doc.type) doc.type = "complaint";
  if (!doc.userId && doc.reporterId) doc.userId = doc.reporterId;
  if (!doc.userName && doc.reporterName) doc.userName = doc.reporterName;
  return doc;
}

export async function getAllRequests(): Promise<RequestDoc[]> {
  const { resources } = await getContainer()
    .items.query<RequestDoc>("SELECT * FROM c ORDER BY c.createdAt DESC")
    .fetchAll();
  return resources.map(migrateDoc);
}

export async function getRequestById(
  id: string
): Promise<RequestDoc | null> {
  try {
    const { resource } = await getContainer().item(id, id).read<RequestDoc>();
    return resource ? migrateDoc(resource) : null;
  } catch {
    return null;
  }
}

export async function createRequest(
  doc: RequestDoc
): Promise<RequestDoc> {
  const { resource } = await getContainer().items.create<RequestDoc>(doc);
  return resource!;
}

export async function toggleLike(id: string, userId: string): Promise<RequestDoc | null> {
  const existing = await getRequestById(id);
  if (!existing) return null;

  const likers = existing.likers || [];
  const index = likers.indexOf(userId);
  if (index === -1) {
    likers.push(userId);
  } else {
    likers.splice(index, 1);
  }
  existing.likers = likers;
  existing.likes = likers.length;

  const { resource } = await getContainer()
    .item(id, id)
    .replace<RequestDoc>(existing);
  return resource ?? null;
}

export async function addComment(id: string, comment: Comment): Promise<RequestDoc | null> {
  const existing = await getRequestById(id);
  if (!existing) return null;

  existing.comments = existing.comments || [];
  existing.comments.push(comment);

  const { resource } = await getContainer()
    .item(id, id)
    .replace<RequestDoc>(existing);
  return resource ?? null;
}

export async function deleteRequest(id: string): Promise<boolean> {
  try {
    await getContainer().item(id, id).delete();
    return true;
  } catch {
    return false;
  }
}

export async function toggleCommentLike(requestId: string, commentId: string, userId: string): Promise<RequestDoc | null> {
  const existing = await getRequestById(requestId);
  if (!existing) return null;

  const comment = (existing.comments || []).find(c => c.id === commentId);
  if (!comment) return null;

  const likers = comment.likers || [];
  const index = likers.indexOf(userId);
  if (index === -1) {
    likers.push(userId);
  } else {
    likers.splice(index, 1);
  }
  comment.likers = likers;

  const { resource } = await getContainer()
    .item(requestId, requestId)
    .replace<RequestDoc>(existing);
  return resource ?? null;
}

export async function toggleSave(id: string, userId: string): Promise<RequestDoc | null> {
  const existing = await getRequestById(id);
  if (!existing) return null;

  const savedBy = existing.savedBy || [];
  const index = savedBy.indexOf(userId);
  if (index === -1) {
    savedBy.push(userId);
  } else {
    savedBy.splice(index, 1);
  }
  existing.savedBy = savedBy;

  const { resource } = await getContainer()
    .item(id, id)
    .replace<RequestDoc>(existing);
  return resource ?? null;
}

// ── User operations ──

export interface UserSettings {
  darkMode: boolean;
  highAccuracy: boolean;
}

export type UserRole = "admin" | "moderator" | "developer" | "user";

export interface UserDoc {
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
}

export async function getUserById(id: string): Promise<UserDoc | null> {
  try {
    const { resource } = await getUsersContainer().item(id, id).read<UserDoc>();
    return resource ?? null;
  } catch {
    return null;
  }
}

export async function upsertUser(doc: UserDoc): Promise<UserDoc> {
  const { resource } = await getUsersContainer().items.upsert<UserDoc>(doc);
  return resource!;
}

export async function updateUserSettings(id: string, settings: UserSettings): Promise<UserDoc | null> {
  const existing = await getUserById(id);
  if (!existing) return null;

  existing.settings = settings;
  const { resource } = await getUsersContainer()
    .item(id, id)
    .replace<UserDoc>(existing);
  return resource ?? null;
}

export async function getAllUsers(): Promise<UserDoc[]> {
  const { resources } = await getUsersContainer()
    .items.query<UserDoc>("SELECT * FROM c ORDER BY c.createdAt DESC")
    .fetchAll();
  return resources;
}

export async function updateUserRole(id: string, role: UserRole): Promise<UserDoc | null> {
  const existing = await getUserById(id);
  if (!existing) return null;

  existing.role = role;
  const { resource } = await getUsersContainer()
    .item(id, id)
    .replace<UserDoc>(existing);
  return resource ?? null;
}

/** Update userName on all posts authored by this user, and on all their comments across all posts. */
export async function backfillUserName(userId: string, newName: string): Promise<void> {
  const allPosts = await getAllRequests();
  for (const post of allPosts) {
    let changed = false;

    // Update post author name
    if (post.userId === userId && post.userName !== newName) {
      post.userName = newName;
      changed = true;
    }

    // Update comment author names
    for (const comment of post.comments || []) {
      if (comment.userId === userId && comment.userName !== newName) {
        comment.userName = newName;
        changed = true;
      }
    }

    if (changed) {
      await getContainer().item(post.id, post.id).replace<RequestDoc>(post);
    }
  }
}
