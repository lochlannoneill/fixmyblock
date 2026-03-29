import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

async function mapTile(
  req: HttpRequest,
  _ctx: InvocationContext
): Promise<HttpResponseInit> {
  const tilesetId = req.query.get("tilesetId") || "microsoft.base.road";
  const zoom = req.query.get("z");
  const x = req.query.get("x");
  const y = req.query.get("y");

  if (!zoom || !x || !y) {
    return { status: 400, jsonBody: { error: "Missing z, x, or y parameters" } };
  }

  const allowedTilesets = ["microsoft.base.road", "microsoft.base.darkgrey"];
  if (!allowedTilesets.includes(tilesetId)) {
    return { status: 400, jsonBody: { error: "Invalid tilesetId" } };
  }

  const key = process.env.AZURE_MAPS_KEY;
  if (!key) {
    return { status: 503, jsonBody: { error: "Azure Maps not configured" } };
  }

  const url = `https://atlas.microsoft.com/map/tile?api-version=2024-04-01&tilesetId=${encodeURIComponent(tilesetId)}&zoom=${encodeURIComponent(zoom)}&x=${encodeURIComponent(x)}&y=${encodeURIComponent(y)}&subscription-key=${key}`;

  const response = await fetch(url);
  if (!response.ok) {
    return { status: response.status, jsonBody: { error: "Tile fetch failed" } };
  }

  const buffer = await response.arrayBuffer();
  return {
    status: 200,
    body: new Uint8Array(buffer),
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  };
}

app.http("mapTile", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "map/tile",
  handler: mapTile,
});
