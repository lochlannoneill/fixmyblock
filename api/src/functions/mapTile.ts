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

  const allowedTilesets = [
    "microsoft.base.road",
    "microsoft.base.darkgrey",
    "microsoft.traffic.relative.main",
    "microsoft.traffic.relative.dark",
    "microsoft.weather.radar.main",
    "microsoft.weather.infrared.main",
    "microsoft.imagery",
  ];
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

  // Short cache for live data overlays, long cache for base tiles
  const isLiveData = tilesetId.includes("traffic") || tilesetId.includes("weather");
  const cacheControl = isLiveData
    ? "public, max-age=120, stale-while-revalidate=60"
    : "public, max-age=604800, immutable";

  const buffer = await response.arrayBuffer();
  return {
    status: 200,
    body: new Uint8Array(buffer),
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "image/png",
      "Cache-Control": cacheControl,
    },
  };
}

app.http("mapTile", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "map/tile",
  handler: mapTile,
});

async function trafficIncidents(
  req: HttpRequest,
  _ctx: InvocationContext
): Promise<HttpResponseInit> {
  const bbox = req.query.get("bbox");
  const zoom = req.query.get("zoom");

  if (!bbox || !zoom) {
    return { status: 400, jsonBody: { error: "Missing bbox or zoom parameters" } };
  }

  // Validate bbox format: minLat,minLon,maxLat,maxLon
  const parts = bbox.split(",").map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) {
    return { status: 400, jsonBody: { error: "Invalid bbox format" } };
  }

  const zoomNum = Number(zoom);
  if (isNaN(zoomNum) || zoomNum < 0 || zoomNum > 22) {
    return { status: 400, jsonBody: { error: "Invalid zoom" } };
  }

  const key = process.env.AZURE_MAPS_KEY;
  if (!key) {
    return { status: 503, jsonBody: { error: "Azure Maps not configured" } };
  }

  const url = `https://atlas.microsoft.com/traffic/incident/detail/json?api-version=1.0&style=s3&boundingbox=${encodeURIComponent(bbox)}&boundingZoom=${Math.round(zoomNum)}&trafficmodelid=-1&projection=EPSG4326&language=en&expandCluster=true`;

  const response = await fetch(url, {
    headers: { "subscription-key": key },
  });
  if (!response.ok) {
    return { status: response.status, jsonBody: { error: "Traffic incident fetch failed" } };
  }

  const data = await response.json();
  return {
    status: 200,
    jsonBody: data,
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=30",
    },
  };
}

app.http("trafficIncidents", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "map/traffic-incidents",
  handler: trafficIncidents,
});
