import { CosmosClient, Database, Container } from "@azure/cosmos";

let client: CosmosClient;
let database: Database;
let container: Container;
let usersContainer: Container;

// ── TTL Cache utility ──
interface CacheEntry<T> { data: T; expiresAt: number; }

class TtlCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  constructor(private ttlMs: number) {}
  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) { this.store.delete(key); return undefined; }
    return entry.data;
  }
  set(key: string, data: T): void {
    this.store.set(key, { data, expiresAt: Date.now() + this.ttlMs });
  }
  invalidate(key: string): void { this.store.delete(key); }
  clear(): void { this.store.clear(); }
}

// Caches (module-level, persist across invocations on same Azure Functions instance)
const userProfileCache = new TtlCache<UserProfileSummary>(5 * 60 * 1000);   // 5 min
const userDocCache = new TtlCache<UserDoc>(60 * 1000);                       // 60s
const allUsersCache = new TtlCache<UserDoc[]>(60 * 1000);                    // 60s
const ALL_USERS_KEY = "__all__";

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

export interface StatusChange {
  status: string;
  changedAt: string;
  changedBy?: string;
  changedByName?: string;
  note?: string;
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
  statusHistory: StatusChange[];
}

function migrateDoc(doc: RequestDoc & { reporterId?: string; reporterName?: string }): RequestDoc {
  if (!doc.type) doc.type = "complaint";
  if (!doc.userId && doc.reporterId) doc.userId = doc.reporterId;
  if (!doc.userName && doc.reporterName) doc.userName = doc.reporterName;
  if (!doc.statusHistory) {
    doc.statusHistory = [{ status: doc.status || "open", changedAt: doc.createdAt }];
  }
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

export async function updateRequestStatus(
  id: string,
  status: string,
  userId?: string,
  userName?: string,
  note?: string
): Promise<RequestDoc | null> {
  const existing = await getRequestById(id);
  if (!existing) return null;

  existing.status = status;
  if (!existing.statusHistory) existing.statusHistory = [];
  existing.statusHistory.push({
    status,
    changedAt: new Date().toISOString(),
    ...(userId ? { changedBy: userId } : {}),
    ...(userName ? { changedByName: userName } : {}),
    ...(note ? { note } : {}),
  });

  const { resource } = await getContainer()
    .item(id, id)
    .replace<RequestDoc>(existing);
  return resource ?? null;
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

export interface HomeAddress {
  address: string;
  latitude: number;
  longitude: number;
}

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
  homeAddress?: HomeAddress;
}

export async function getUserById(id: string): Promise<UserDoc | null> {
  const cached = userDocCache.get(id);
  if (cached) return cached;
  try {
    const { resource } = await getUsersContainer().item(id, id).read<UserDoc>();
    if (resource) userDocCache.set(id, resource);
    return resource ?? null;
  } catch {
    return null;
  }
}

export interface UserProfileSummary {
  displayName: string;
  profilePictureUrl?: string;
  role?: string;
}

export async function getUserProfileSummaries(userIds: string[]): Promise<Map<string, UserProfileSummary>> {
  const result = new Map<string, UserProfileSummary>();
  if (userIds.length === 0) return result;

  const unique = [...new Set(userIds)];
  const uncached: string[] = [];

  for (const id of unique) {
    const cached = userProfileCache.get(id);
    if (cached) {
      result.set(id, cached);
    } else {
      uncached.push(id);
    }
  }

  if (uncached.length > 0) {
    const params = uncached.map((_, i) => `@id${i}`).join(",");
    const query = {
      query: `SELECT c.id, c.displayName, c.profilePictureUrl, c.role FROM c WHERE c.id IN (${params})`,
      parameters: uncached.map((id, i) => ({ name: `@id${i}`, value: id })),
    };
    const { resources } = await getUsersContainer().items.query<{ id: string; displayName?: string; profilePictureUrl?: string; role?: string }>(query).fetchAll();
    for (const r of resources) {
      const summary: UserProfileSummary = {
        displayName: r.displayName || "Anonymous",
        profilePictureUrl: r.profilePictureUrl,
        role: r.role,
      };
      userProfileCache.set(r.id, summary);
      result.set(r.id, summary);
    }
  }

  return result;
}

/** Invalidate all user-related caches for a given user (call after profile/avatar changes). */
export function invalidateUserCaches(userId: string): void {
  userProfileCache.invalidate(userId);
  userDocCache.invalidate(userId);
  allUsersCache.clear();
}

export async function upsertUser(doc: UserDoc): Promise<UserDoc> {
  const { resource } = await getUsersContainer().items.upsert<UserDoc>(doc);
  invalidateUserCaches(doc.id);
  return resource!;
}

export async function updateUserSettings(id: string, settings: UserSettings): Promise<UserDoc | null> {
  const existing = await getUserById(id);
  if (!existing) return null;

  existing.settings = settings;
  const { resource } = await getUsersContainer()
    .item(id, id)
    .replace<UserDoc>(existing);
  invalidateUserCaches(id);
  return resource ?? null;
}

export async function getAllUsers(): Promise<UserDoc[]> {
  const cached = allUsersCache.get(ALL_USERS_KEY);
  if (cached) return cached;
  const { resources } = await getUsersContainer()
    .items.query<UserDoc>("SELECT * FROM c ORDER BY c.createdAt DESC")
    .fetchAll();
  allUsersCache.set(ALL_USERS_KEY, resources);
  return resources;
}

export async function updateUserRole(id: string, role: UserRole): Promise<UserDoc | null> {
  const existing = await getUserById(id);
  if (!existing) return null;

  existing.role = role;
  const { resource } = await getUsersContainer()
    .item(id, id)
    .replace<UserDoc>(existing);
  invalidateUserCaches(id);
  return resource ?? null;
}

