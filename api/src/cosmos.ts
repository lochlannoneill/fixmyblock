import { CosmosClient, Database, Container } from "@azure/cosmos";

let client: CosmosClient;
let database: Database;
let container: Container;

function getContainer(): Container {
  if (!container) {
    const connectionString = process.env.COSMOS_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error("COSMOS_CONNECTION_STRING is not configured");
    }
    client = new CosmosClient(connectionString);
    database = client.database(process.env.COSMOS_DATABASE || "fixmyblock");
    container = database.container(process.env.COSMOS_CONTAINER || "complaints");
  }
  return container;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
  upvoters: string[];
  parentId?: string;
}

export interface RequestDoc {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  latitude: number;
  longitude: number;
  location?: string;
  imageUrls: string[];
  createdAt: string;
  upvotes: number;
  upvoters: string[];
  savedBy: string[];
  reporterId: string;
  comments: Comment[];
}

export async function getAllRequests(): Promise<RequestDoc[]> {
  const { resources } = await getContainer()
    .items.query<RequestDoc>("SELECT * FROM c ORDER BY c.createdAt DESC")
    .fetchAll();
  return resources;
}

export async function getRequestById(
  id: string
): Promise<RequestDoc | null> {
  try {
    const { resource } = await getContainer().item(id, id).read<RequestDoc>();
    return resource ?? null;
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

export async function toggleUpvote(id: string, userId: string): Promise<RequestDoc | null> {
  const existing = await getRequestById(id);
  if (!existing) return null;

  const upvoters = existing.upvoters || [];
  const index = upvoters.indexOf(userId);
  if (index === -1) {
    upvoters.push(userId);
  } else {
    upvoters.splice(index, 1);
  }
  existing.upvoters = upvoters;
  existing.upvotes = upvoters.length;

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

export async function toggleCommentUpvote(requestId: string, commentId: string, userId: string): Promise<RequestDoc | null> {
  const existing = await getRequestById(requestId);
  if (!existing) return null;

  const comment = (existing.comments || []).find(c => c.id === commentId);
  if (!comment) return null;

  const upvoters = comment.upvoters || [];
  const index = upvoters.indexOf(userId);
  if (index === -1) {
    upvoters.push(userId);
  } else {
    upvoters.splice(index, 1);
  }
  comment.upvoters = upvoters;

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
