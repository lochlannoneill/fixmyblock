import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { v4 as uuidv4 } from "uuid";
import {
  getAllRequests,
  getRequestById,
  createRequest as createRequestDoc,
  toggleUpvote,
  addComment as addCommentDoc,
  deleteRequest as deleteRequestDoc,
  RequestDoc,
} from "../cosmos.js";
import { uploadImage } from "../storage.js";
import { parseMultipart } from "../multipart.js";

// GET /api/complaints
async function listRequests(
  _req: HttpRequest,
  _ctx: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const requests = await getAllRequests();
    return { status: 200, jsonBody: requests };
  } catch (err) {
    return { status: 500, jsonBody: { error: "Failed to fetch requests" } };
  }
}

// GET /api/complaints/{id}
async function getRequest(
  req: HttpRequest,
  _ctx: InvocationContext
): Promise<HttpResponseInit> {
  const id = req.params.id;
  if (!id) return { status: 400, jsonBody: { error: "Missing id" } };

  const request = await getRequestById(id);
  if (!request) return { status: 404, jsonBody: { error: "Not found" } };

  return { status: 200, jsonBody: request };
}

// POST /api/complaints
async function postRequest(
  req: HttpRequest,
  ctx: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return {
        status: 400,
        jsonBody: { error: "Expected multipart/form-data" },
      };
    }

    const bodyBuffer = Buffer.from(await req.arrayBuffer());
    const parsed = parseMultipart(bodyBuffer, contentType);

    const getField = (name: string) =>
      parsed.fields.find((f) => f.name === name)?.value || "";

    const title = getField("title").slice(0, 200);
    const description = getField("description").slice(0, 2000);
    const category = getField("category");
    const latitude = parseFloat(getField("latitude"));
    const longitude = parseFloat(getField("longitude"));
    const location = getField("location").slice(0, 200);

    // Extract reporter identity from SWA auth header
    let reporterId = "";
    const principal = req.headers.get("x-ms-client-principal");
    if (principal) {
      try {
        const decoded = JSON.parse(Buffer.from(principal, "base64").toString("utf8"));
        reporterId = decoded.userId || "";
      } catch {
        // ignore decode errors
      }
    }

    if (!title || !description || isNaN(latitude) || isNaN(longitude)) {
      return {
        status: 400,
        jsonBody: { error: "Missing required fields" },
      };
    }

    // Upload images (max 1)
    const imageFiles = parsed.files.filter((f) => f.name === "images").slice(0, 5);
    const imageUrls: string[] = [];

    for (const file of imageFiles) {
      // Validate content type
      if (!file.contentType.startsWith("image/")) continue;
      // Validate size (10MB)
      if (file.data.length > 10 * 1024 * 1024) continue;

      const url = await uploadImage(file.data, file.contentType, file.filename);
      imageUrls.push(url);
    }

    const doc: RequestDoc = {
      id: uuidv4(),
      title,
      description,
      category,
      status: "open",
      latitude,
      longitude,
      location: location || undefined,
      imageUrls,
      createdAt: new Date().toISOString(),
      upvotes: 0,
      upvoters: [],
      reporterId,
      comments: [],
    };

    const created = await createRequestDoc(doc);
    return { status: 201, jsonBody: created };
  } catch (err) {
    ctx.log("Error creating request:", err);
    return { status: 500, jsonBody: { error: "Failed to create request" } };
  }
}

// POST /api/complaints/{id}/upvote
async function upvote(
  req: HttpRequest,
  _ctx: InvocationContext
): Promise<HttpResponseInit> {
  const id = req.params.id;
  if (!id) return { status: 400, jsonBody: { error: "Missing id" } };

  const principal = req.headers.get("x-ms-client-principal");
  if (!principal) return { status: 401, jsonBody: { error: "Not authenticated" } };

  let userId: string;
  try {
    const decoded = JSON.parse(Buffer.from(principal, "base64").toString("utf8"));
    userId = decoded.userId;
  } catch {
    return { status: 401, jsonBody: { error: "Invalid auth token" } };
  }
  if (!userId) return { status: 401, jsonBody: { error: "Missing user identity" } };

  const updated = await toggleUpvote(id, userId);
  if (!updated) return { status: 404, jsonBody: { error: "Not found" } };

  return { status: 200, jsonBody: updated };
}

// POST /api/complaints/{id}/comments
async function postComment(
  req: HttpRequest,
  _ctx: InvocationContext
): Promise<HttpResponseInit> {
  const id = req.params.id;
  if (!id) return { status: 400, jsonBody: { error: "Missing id" } };

  const principal = req.headers.get("x-ms-client-principal");
  if (!principal) return { status: 401, jsonBody: { error: "Not authenticated" } };

  let userId: string;
  try {
    const decoded = JSON.parse(Buffer.from(principal, "base64").toString("utf8"));
    userId = decoded.userId;
  } catch {
    return { status: 401, jsonBody: { error: "Invalid auth token" } };
  }
  if (!userId) return { status: 401, jsonBody: { error: "Missing user identity" } };

  let body: { text?: string };
  try {
    body = await req.json() as { text?: string };
  } catch {
    return { status: 400, jsonBody: { error: "Invalid JSON" } };
  }

  const text = (body.text || "").trim().slice(0, 1000);
  if (!text) return { status: 400, jsonBody: { error: "Comment text is required" } };

  const comment = {
    id: uuidv4(),
    userId,
    text,
    createdAt: new Date().toISOString(),
  };

  const updated = await addCommentDoc(id, comment);
  if (!updated) return { status: 404, jsonBody: { error: "Not found" } };

  return { status: 201, jsonBody: updated };
}

// DELETE /api/complaints/{id}
async function removeRequest(
  req: HttpRequest,
  _ctx: InvocationContext
): Promise<HttpResponseInit> {
  const id = req.params.id;
  if (!id) return { status: 400, jsonBody: { error: "Missing id" } };

  const deleted = await deleteRequestDoc(id);
  if (!deleted) return { status: 404, jsonBody: { error: "Not found" } };

  return { status: 204 };
}

// Register routes
app.http("listRequests", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "complaints",
  handler: listRequests,
});

app.http("getRequest", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "complaints/{id}",
  handler: getRequest,
});

app.http("createRequest", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "complaints",
  handler: postRequest,
});

app.http("upvoteRequest", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "complaints/{id}/upvote",
  handler: upvote,
});

app.http("deleteRequest", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "complaints/{id}",
  handler: removeRequest,
});

app.http("postComment", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "complaints/{id}/comments",
  handler: postComment,
});
