import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { v4 as uuidv4 } from "uuid";
import {
  getAllComplaints,
  getComplaintById,
  createComplaint as createComplaintDoc,
  incrementUpvote,
  deleteComplaint as deleteComplaintDoc,
  ComplaintDoc,
} from "../cosmos.js";
import { uploadImage } from "../storage.js";
import { parseMultipart } from "../multipart.js";

// GET /api/complaints
async function listComplaints(
  _req: HttpRequest,
  _ctx: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const complaints = await getAllComplaints();
    return { status: 200, jsonBody: complaints };
  } catch (err) {
    return { status: 500, jsonBody: { error: "Failed to fetch complaints" } };
  }
}

// GET /api/complaints/{id}
async function getComplaint(
  req: HttpRequest,
  _ctx: InvocationContext
): Promise<HttpResponseInit> {
  const id = req.params.id;
  if (!id) return { status: 400, jsonBody: { error: "Missing id" } };

  const complaint = await getComplaintById(id);
  if (!complaint) return { status: 404, jsonBody: { error: "Not found" } };

  return { status: 200, jsonBody: complaint };
}

// POST /api/complaints
async function postComplaint(
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
    const reporterName = getField("reporterName").slice(0, 100);

    if (!title || !description || isNaN(latitude) || isNaN(longitude)) {
      return {
        status: 400,
        jsonBody: { error: "Missing required fields" },
      };
    }

    // Upload images (max 5)
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

    const doc: ComplaintDoc = {
      id: uuidv4(),
      title,
      description,
      category,
      status: "open",
      latitude,
      longitude,
      imageUrls,
      createdAt: new Date().toISOString(),
      upvotes: 0,
      reporterName,
    };

    const created = await createComplaintDoc(doc);
    return { status: 201, jsonBody: created };
  } catch (err) {
    ctx.log("Error creating complaint:", err);
    return { status: 500, jsonBody: { error: "Failed to create complaint" } };
  }
}

// POST /api/complaints/{id}/upvote
async function upvote(
  req: HttpRequest,
  _ctx: InvocationContext
): Promise<HttpResponseInit> {
  const id = req.params.id;
  if (!id) return { status: 400, jsonBody: { error: "Missing id" } };

  const updated = await incrementUpvote(id);
  if (!updated) return { status: 404, jsonBody: { error: "Not found" } };

  return { status: 200, jsonBody: updated };
}

// DELETE /api/complaints/{id}
async function removeComplaint(
  req: HttpRequest,
  _ctx: InvocationContext
): Promise<HttpResponseInit> {
  const id = req.params.id;
  if (!id) return { status: 400, jsonBody: { error: "Missing id" } };

  const deleted = await deleteComplaintDoc(id);
  if (!deleted) return { status: 404, jsonBody: { error: "Not found" } };

  return { status: 204 };
}

// Register routes
app.http("listComplaints", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "complaints",
  handler: listComplaints,
});

app.http("getComplaint", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "complaints/{id}",
  handler: getComplaint,
});

app.http("createComplaint", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "complaints",
  handler: postComplaint,
});

app.http("upvoteComplaint", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "complaints/{id}/upvote",
  handler: upvote,
});

app.http("deleteComplaint", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "complaints/{id}",
  handler: removeComplaint,
});
