import {
  BlobServiceClient,
  ContainerClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";

let containerClient: ContainerClient;

function getContainerClient(): ContainerClient {
  if (!containerClient) {
    const connectionString = process.env.STORAGE_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error("STORAGE_CONNECTION_STRING is not configured");
    }
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerName = process.env.STORAGE_CONTAINER || "images";
    containerClient = blobServiceClient.getContainerClient(containerName);
  }
  return containerClient;
}

export async function uploadImage(
  data: Buffer,
  contentType: string,
  originalName: string
): Promise<string> {
  const client = getContainerClient();

  // Ensure container exists with public blob access
  await client.createIfNotExists({ access: "blob" });

  const ext = originalName.split(".").pop() || "jpg";
  const blobName = `${uuidv4()}.${ext}`;
  const blockBlobClient = client.getBlockBlobClient(blobName);

  await blockBlobClient.upload(data, data.length, {
    blobHTTPHeaders: { blobContentType: contentType },
  });

  return blockBlobClient.url;
}
