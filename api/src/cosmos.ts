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

export interface RequestDoc {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  latitude: number;
  longitude: number;
  imageUrls: string[];
  createdAt: string;
  upvotes: number;
  reporterName: string;
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

export async function incrementUpvote(id: string): Promise<RequestDoc | null> {
  const existing = await getRequestById(id);
  if (!existing) return null;

  existing.upvotes = (existing.upvotes || 0) + 1;
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
