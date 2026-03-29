import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import {
  getUserById,
  upsertUser,
  updateUserSettings,
  updateUserRole,
  getAllUsers,
  UserDoc,
  UserSettings,
  UserRole,
} from "../cosmos.js";

function parseAuthPrincipal(req: HttpRequest): { userId: string; userDetails: string; identityProvider: string } | null {
  const principal = req.headers.get("x-ms-client-principal");
  if (!principal) return null;
  try {
    const decoded = JSON.parse(Buffer.from(principal, "base64").toString("utf8"));
    if (!decoded.userId) return null;
    return {
      userId: decoded.userId,
      userDetails: decoded.userDetails || "",
      identityProvider: decoded.identityProvider || "",
    };
  } catch {
    return null;
  }
}

// GET /api/users/me
async function getMe(
  req: HttpRequest,
  _ctx: InvocationContext
): Promise<HttpResponseInit> {
  const auth = parseAuthPrincipal(req);
  if (!auth) return { status: 401, jsonBody: { error: "Not authenticated" } };

  const user = await getUserById(auth.userId);
  if (!user) return { status: 404, jsonBody: { error: "User not found" } };

  return { status: 200, jsonBody: user };
}

// POST /api/users/me — upsert on login
async function upsertMe(
  req: HttpRequest,
  _ctx: InvocationContext
): Promise<HttpResponseInit> {
  const auth = parseAuthPrincipal(req);
  if (!auth) return { status: 401, jsonBody: { error: "Not authenticated" } };

  const existing = await getUserById(auth.userId);

  const doc: UserDoc = existing
    ? {
        ...existing,
        displayName: auth.userDetails || existing.displayName,
        identityProvider: auth.identityProvider,
        role: existing.role || "user",
      }
    : {
        id: auth.userId,
        displayName: auth.userDetails || "Anonymous",
        email: auth.userDetails || undefined,
        identityProvider: auth.identityProvider,
        role: "user",
        createdAt: new Date().toISOString(),
        settings: { darkMode: false, highAccuracy: true },
      };

  const saved = await upsertUser(doc);
  return { status: 200, jsonBody: saved };
}

// PATCH /api/users/me/settings
async function patchSettings(
  req: HttpRequest,
  _ctx: InvocationContext
): Promise<HttpResponseInit> {
  const auth = parseAuthPrincipal(req);
  if (!auth) return { status: 401, jsonBody: { error: "Not authenticated" } };

  let body: Partial<UserSettings>;
  try {
    body = (await req.json()) as Partial<UserSettings>;
  } catch {
    return { status: 400, jsonBody: { error: "Invalid JSON" } };
  }

  const existing = await getUserById(auth.userId);
  if (!existing) return { status: 404, jsonBody: { error: "User not found" } };

  const merged: UserSettings = {
    darkMode: body.darkMode ?? existing.settings.darkMode,
    highAccuracy: body.highAccuracy ?? existing.settings.highAccuracy,
  };

  const updated = await updateUserSettings(auth.userId, merged);
  if (!updated) return { status: 404, jsonBody: { error: "User not found" } };

  return { status: 200, jsonBody: updated };
}

const VALID_ROLES: UserRole[] = ["admin", "moderator", "developer", "user"];

// GET /api/users — admin only: list all users
async function listUsers(
  req: HttpRequest,
  _ctx: InvocationContext
): Promise<HttpResponseInit> {
  const auth = parseAuthPrincipal(req);
  if (!auth) return { status: 401, jsonBody: { error: "Not authenticated" } };

  const caller = await getUserById(auth.userId);
  if (!caller || caller.role !== "admin") {
    return { status: 403, jsonBody: { error: "Admin access required" } };
  }

  const users = await getAllUsers();
  return { status: 200, jsonBody: users };
}

// PATCH /api/users/{id}/role — admin only: change a user's role
async function changeRole(
  req: HttpRequest,
  _ctx: InvocationContext
): Promise<HttpResponseInit> {
  const auth = parseAuthPrincipal(req);
  if (!auth) return { status: 401, jsonBody: { error: "Not authenticated" } };

  const caller = await getUserById(auth.userId);
  if (!caller || caller.role !== "admin") {
    return { status: 403, jsonBody: { error: "Admin access required" } };
  }

  const targetId = req.params.id;
  if (!targetId) return { status: 400, jsonBody: { error: "Missing user id" } };

  // Prevent admins from demoting themselves
  if (targetId === auth.userId) {
    return { status: 400, jsonBody: { error: "Cannot change your own role" } };
  }

  let body: { role?: string };
  try {
    body = (await req.json()) as { role?: string };
  } catch {
    return { status: 400, jsonBody: { error: "Invalid JSON" } };
  }

  if (!body.role || !VALID_ROLES.includes(body.role as UserRole)) {
    return { status: 400, jsonBody: { error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` } };
  }

  const updated = await updateUserRole(targetId, body.role as UserRole);
  if (!updated) return { status: 404, jsonBody: { error: "User not found" } };

  return { status: 200, jsonBody: updated };
}

// Register routes
app.http("getMe", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "users/me",
  handler: getMe,
});

app.http("upsertMe", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "users/me",
  handler: upsertMe,
});

app.http("patchSettings", {
  methods: ["PATCH"],
  authLevel: "anonymous",
  route: "users/me/settings",
  handler: patchSettings,
});

app.http("listUsers", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "users",
  handler: listUsers,
});

app.http("changeRole", {
  methods: ["PATCH"],
  authLevel: "anonymous",
  route: "users/{id}/role",
  handler: changeRole,
});
