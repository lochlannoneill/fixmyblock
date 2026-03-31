import { useRef, useEffect, useCallback, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./MapView.css";
import type { Request, RequestStatus, HomeAddress } from "../../types/request";
import { STATUS_COLORS } from "../../types/request";
import Layers from "../Layers";
import type { MapLayer } from "../Layers";

interface MapViewProps {
  requests: Request[];
  onMapClick: (lng: number, lat: number) => void;
  selectedRequest: Request | null;
  onSelectRequest: (c: Request | null) => void;
  onLike: (id: string) => void;
  reportMode: boolean;
  dropPinLocation: { lng: number; lat: number } | null;
  darkMode: boolean;
  onUserLocation?: (lng: number, lat: number) => void;
  currentUserId?: string;
  usedGeolocation?: boolean;
  highAccuracy?: boolean;
  onExpandRequest?: () => void;
  onShowResolution?: (req: Request) => void;
  flyToTarget?: { lng: number; lat: number } | null;
  onSignInPrompt?: () => void;
  isAdmin?: boolean;
  onUpdateStatus?: (id: string, status: RequestStatus) => void;
  homeAddress?: HomeAddress | null;
}

export default function MapView({
  requests,
  onMapClick,
  selectedRequest,
  onSelectRequest,
  onLike,
  reportMode,
  dropPinLocation,
  darkMode,
  onUserLocation,
  currentUserId,
  usedGeolocation,
  highAccuracy = true,
  onExpandRequest,
  onShowResolution,
  flyToTarget,
  onSignInPrompt,
  isAdmin,
  onUpdateStatus,
  homeAddress,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const clusterMarkersRef = useRef<maplibregl.Marker[]>([]);
  const clusterPopupsRef = useRef<maplibregl.Popup[]>([]);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const popupCloseHandlerRef = useRef<(() => void) | null>(null);
  const hoverPopupRef = useRef<maplibregl.Popup | null>(null);
  const showPopupRef = useRef<((req: Request, hover?: boolean) => void) | null>(null);
  const dropPinRef = useRef<maplibregl.Marker | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const reportModeRef = useRef(reportMode);
  const onUserLocationRef = useRef(onUserLocation);
  const homeAddressRef = useRef(homeAddress);
  const requestsRef = useRef(requests);
  const selectedIdRef = useRef<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [activeLayer, setActiveLayer] = useState<MapLayer>("terrain");
  const lastDarkModeApplied = useRef(darkMode);
  const activeLayerRef = useRef<MapLayer>("terrain");
  const [mapFading, setMapFading] = useState(false);

  const add3dBuildings = useCallback(() => {
    if (!map.current) return;
    if (activeLayerRef.current !== "terrain") return;
    if (map.current.getLayer("3d-buildings")) return; // already added
    const layers = map.current.getStyle().layers;
    const sources = map.current.getStyle().sources;
    if (!layers || !(sources["openmaptiles"] || sources["carto"])) return;
    const sourceId = sources["openmaptiles"] ? "openmaptiles" : "carto";
    for (const l of layers) {
      if ((l as Record<string, unknown>)["source-layer"] === "building" && (l.type === "fill" || l.type === "line")) {
        map.current.setLayoutProperty(l.id, "visibility", "none");
      }
    }
    const labelLayer = layers.find(
      (l) => l.type === "symbol" && l.layout && "text-field" in l.layout
    );
    map.current.addLayer(
      {
        id: "3d-buildings",
        source: sourceId,
        "source-layer": "building",
        type: "fill-extrusion",
        minzoom: 14,
        paint: {
          "fill-extrusion-color": "#c4b5a2",
          "fill-extrusion-height": ["get", "render_height"],
          "fill-extrusion-base": ["get", "render_min_height"],
          "fill-extrusion-opacity": 0.85,
        },
      },
      labelLayer?.id
    );
  }, []);

  // Keep refs in sync so the map click handler always has latest values
  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => { onUserLocationRef.current = onUserLocation; }, [onUserLocation]);
  useEffect(() => { reportModeRef.current = reportMode; }, [reportMode]);
  useEffect(() => { homeAddressRef.current = homeAddress; }, [homeAddress]);
  useEffect(() => { requestsRef.current = requests; }, [requests]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const defaultStyle = darkMode
      ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      : "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      attributionControl: false,
      style: defaultStyle,
      center: [-6.2603, 53.3498], // Default: Dublin
      zoom: 13,
      pitch: 45, // 3D tilt
      bearing: 0,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");
    (map.current as unknown as { _styleUrl?: string })._styleUrl = defaultStyle;

    // Invert horizontal drag-rotate so left-right feels natural
    const hm = (map.current as unknown as { handlers: { _handlers: { handlerName: string; handler: { _move: (...args: unknown[]) => unknown } }[] } }).handlers;
    const rotateEntry = hm._handlers.find((h) => h.handlerName === "mouseRotate");
    if (rotateEntry) {
      const origMove = rotateEntry.handler._move.bind(rotateEntry.handler);
      rotateEntry.handler._move = (...args: unknown[]) => {
        const result = origMove(...args) as { bearingDelta?: number } | undefined;
        if (result?.bearingDelta != null) result.bearingDelta = -result.bearingDelta;
        return result;
      };
    }

    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: highAccuracy },
      trackUserLocation: true,
    });
    map.current.addControl(geolocate, "top-right");

    geolocate.on("geolocate", (e: unknown) => {
      const pos = e as GeolocationPosition;
      onUserLocationRef.current?.(pos.coords.longitude, pos.coords.latitude);
    });

    geolocate.on("error", () => {
      // Geolocation denied/failed — fly to home address if set
      const ha = homeAddressRef.current;
      if (ha) {
        map.current?.flyTo({
          center: [ha.longitude, ha.latitude],
          zoom: 15,
          pitch: 45,
        });
      }
    });

    map.current.on("load", () => {
      setMapReady(true);
      geolocate.trigger();
      add3dBuildings();
    });

    map.current.on("click", (e) => {
      if (reportModeRef.current) {
        onMapClickRef.current(e.lngLat.lng, e.lngLat.lat);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch map style on dark mode toggle
  useEffect(() => {
    if (!map.current || !mapReady) return;
    if (lastDarkModeApplied.current === darkMode) return;
    lastDarkModeApplied.current = darkMode;

    // Handle Azure Maps dark mode toggle
    if (activeLayer === "azure") {
      const tilesetId = darkMode ? "microsoft.base.darkgrey" : "microsoft.base.road";
      const azureStyle = {
        version: 8 as const,
        sources: {
          "azure-maps": {
            type: "raster" as const,
            tiles: [
              `/api/map/tile?tilesetId=${tilesetId}&z={z}&x={x}&y={y}`,
            ],
            tileSize: 256,
          },
        },
        layers: [
          { id: "azure-maps-layer", type: "raster" as const, source: "azure-maps", minzoom: 0, maxzoom: 22 },
        ],
      };
      map.current.setStyle(azureStyle);
      return;
    }

    if (activeLayer !== "default" && activeLayer !== "terrain") return; // Don't override other raster layers
    setMapFading(true);
    const style = darkMode
      ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      : activeLayer === "terrain"
        ? "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
        : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
    map.current.setStyle(style);
    (map.current as unknown as { _styleUrl?: string })._styleUrl = style;

    map.current.once("style.load", () => {
      add3dBuildings();
      setTimeout(() => setMapFading(false), 50);
    });
  }, [darkMode, mapReady, activeLayer, add3dBuildings]);

  // Sync markers with requests (with clustering)
  const updateMarkers = useCallback(() => {
    if (!map.current || !mapReady) return;
    const m = map.current;
    const reqs = requestsRef.current;

    // Only cluster when zoomed out past threshold
    const CLUSTER_MAX_ZOOM = 16;
    const currentZoom = m.getZoom();
    const clusteringEnabled = currentZoom < CLUSTER_MAX_ZOOM;

    // Cluster radius in pixels
    const CLUSTER_RADIUS = 40;

    // Project each request to screen coords
    const projected = reqs.map((req) => {
      const pt = m.project([req.longitude, req.latitude]);
      return { req, x: pt.x, y: pt.y };
    });

    // Simple greedy clustering
    const used = new Set<number>();
    const clusters: { reqs: Request[]; lng: number; lat: number }[] = [];

    for (let i = 0; i < projected.length; i++) {
      if (used.has(i)) continue;
      const group: Request[] = [projected[i].req];
      used.add(i);
      let sumLng = projected[i].req.longitude;
      let sumLat = projected[i].req.latitude;

      if (clusteringEnabled) {
        for (let j = i + 1; j < projected.length; j++) {
          if (used.has(j)) continue;
          const dx = projected[i].x - projected[j].x;
          const dy = projected[i].y - projected[j].y;
          if (dx * dx + dy * dy < CLUSTER_RADIUS * CLUSTER_RADIUS) {
            group.push(projected[j].req);
            used.add(j);
            sumLng += projected[j].req.longitude;
            sumLat += projected[j].req.latitude;
          }
        }
      }

      clusters.push({
        reqs: group,
        lng: sumLng / group.length,
        lat: sumLat / group.length,
      });
    }

    // Determine which individual request IDs are visible (not clustered)
    const singleIds = new Set<string>();
    const clusterData: { reqs: Request[]; lng: number; lat: number }[] = [];
    for (const c of clusters) {
      if (c.reqs.length === 1) {
        singleIds.add(c.reqs[0].id);
      } else {
        clusterData.push(c);
      }
    }

    // Update individual markers — add/remove as needed
    const existingIds = new Set(markersRef.current.keys());
    // Remove markers no longer needed
    for (const [id, marker] of markersRef.current) {
      if (!singleIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }
    // Add or update individual markers
    for (const id of singleIds) {
      const req = reqs.find((r) => r.id === id)!;
      if (existingIds.has(id)) {
        // Update position if needed
        const marker = markersRef.current.get(id)!;
        const el = marker.getElement();
        el.style.background = STATUS_COLORS[req.status];
        continue;
      }
      // Create new marker
      const el = document.createElement("div");
      el.className = "request-marker";
      el.style.cssText = `
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        background: ${STATUS_COLORS[req.status]};
        border: 2px solid var(--pin-border);
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        hoverPopupRef.current?.remove();
        hoverPopupRef.current = null;
        onSelectRequest(req);
      });

      el.addEventListener("mouseenter", () => {
        if (popupRef.current && selectedIdRef.current === req.id) return;
        hoverPopupRef.current?.remove();
        showPopupRef.current?.(req, true);
      });

      el.addEventListener("mouseleave", () => {
        hoverPopupRef.current?.remove();
        hoverPopupRef.current = null;
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([req.longitude, req.latitude])
        .addTo(m);
      markersRef.current.set(id, marker);
    }

    // Remove old cluster markers and their hover popups
    clusterPopupsRef.current.forEach((p) => p.remove());
    clusterPopupsRef.current = [];
    clusterMarkersRef.current.forEach((cm) => cm.remove());
    clusterMarkersRef.current = [];

    // Create cluster markers with pie chart
    for (const cluster of clusterData) {
      const counts: Record<string, number> = {};
      for (const r of cluster.reqs) {
        counts[r.status] = (counts[r.status] || 0) + 1;
      }
      const total = cluster.reqs.length;
      const size = Math.min(44 + total * 3, 64);

      // Build pie chart SVG
      const statusOrder: RequestStatus[] = ["open", "under-review", "in-progress", "resolved"];
      const slices: { color: string; fraction: number }[] = [];
      for (const s of statusOrder) {
        if (counts[s]) slices.push({ color: STATUS_COLORS[s], fraction: counts[s] / total });
      }

      let svg: string;
      if (slices.length === 1) {
        svg = `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${slices[0].color}"/>`;
      } else {
        const cx = size / 2, cy = size / 2, r = size / 2;
        let angle = -Math.PI / 2;
        const paths: string[] = [];
        for (const slice of slices) {
          const startAngle = angle;
          const endAngle = angle + slice.fraction * 2 * Math.PI;
          const largeArc = slice.fraction > 0.5 ? 1 : 0;
          const x1 = cx + r * Math.cos(startAngle);
          const y1 = cy + r * Math.sin(startAngle);
          const x2 = cx + r * Math.cos(endAngle);
          const y2 = cy + r * Math.sin(endAngle);
          paths.push(`<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z" fill="${slice.color}"/>`);
          angle = endAngle;
        }
        svg = paths.join("");
      }

      // Build hover tooltip content
      const tooltipItems = statusOrder
        .filter((s) => counts[s])
        .map((s) => {
          const label = s === "in-progress" ? "In Progress" : s === "under-review" ? "Under Review" : s.charAt(0).toUpperCase() + s.slice(1);
          return `<div style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:${STATUS_COLORS[s]};flex-shrink:0"></span><span>${counts[s]} ${label}</span></div>`;
        })
        .join("");

      const el = document.createElement("div");
      el.className = "cluster-marker";
      el.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        cursor: pointer;
        position: relative;
      `;
      el.innerHTML = `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="filter: drop-shadow(0 2px 6px rgba(0,0,0,0.35)); border-radius: 50%;">
          ${svg}
          <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.32}" fill="rgba(0,0,0,0.35)"/>
          <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.3}" fill="var(--bg-card, #fff)"/>
          <text x="${size / 2}" y="${size / 2}" text-anchor="middle" dominant-baseline="central" font-size="${Math.max(11, size * 0.28)}px" font-weight="700" fill="var(--text-primary, #334155)">${total}</text>
        </svg>
      `;

      // Hover tooltip
      let hoverPopup: maplibregl.Popup | null = null;
      el.addEventListener("mouseenter", () => {
        hoverPopup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: [0, -(size / 2 + 4)],
          className: "cluster-tooltip",
        })
          .setLngLat([cluster.lng, cluster.lat])
          .setHTML(`<div style="font-family:system-ui,sans-serif;font-size:12px;padding:6px 10px;display:flex;flex-direction:column;gap:3px;color:var(--text-primary,#334155)">${tooltipItems}</div>`)
          .addTo(m);
        clusterPopupsRef.current.push(hoverPopup);
      });
      el.addEventListener("mouseleave", () => {
        if (hoverPopup) {
          const idx = clusterPopupsRef.current.indexOf(hoverPopup);
          if (idx !== -1) clusterPopupsRef.current.splice(idx, 1);
          hoverPopup.remove();
          hoverPopup = null;
        }
      });

      // Click to zoom in
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        m.flyTo({
          center: [cluster.lng, cluster.lat],
          zoom: m.getZoom() + 2,
        });
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([cluster.lng, cluster.lat])
        .addTo(m);
      clusterMarkersRef.current.push(marker);
    }
  }, [mapReady, onSelectRequest]);

  // Sync markers when requests change
  useEffect(() => {
    updateMarkers();
  }, [requests, mapReady, darkMode, updateMarkers]);

  // Re-cluster on zoom/move
  useEffect(() => {
    if (!map.current || !mapReady) return;
    const m = map.current;
    const handler = () => updateMarkers();
    m.on("zoomend", handler);
    m.on("moveend", handler);
    return () => {
      m.off("zoomend", handler);
      m.off("moveend", handler);
    };
  }, [mapReady, updateMarkers]);

  // Show popup for selected request
  const showPopup = useCallback(
    (req: Request, hover = false) => {
      if (!map.current) return;

      const idPrefix = hover ? `h-${req.id}` : req.id;

      if (hover) {
        hoverPopupRef.current?.remove();
      } else {
        // Remove old active popup without triggering its close handler
        if (popupRef.current) {
          popupRef.current.off("close", popupCloseHandlerRef.current!);
          popupRef.current.remove();
        }
      }

      const isMobile = window.innerWidth < 640;
      const locationText = req.location || `${req.latitude.toFixed(4)}, ${req.longitude.toFixed(4)}`;
      const images = req.imageUrls || [];
      const thumbs = images.length
        ? `<div style="margin-top:12px;border-radius:8px;overflow:hidden;height:${isMobile ? '100px' : '120px'};position:relative">
            <img src="${images[0]}" style="width:100%;height:100%;object-fit:cover" />
            <div style="position:absolute;bottom:0;left:0;right:0;display:flex;align-items:center;justify-content:center;gap:4px;padding:4px 0;font-size:11px;color:#fff;background:rgba(0,0,0,0.4);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 384 512" fill="currentColor"><path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/></svg>
              ${locationText}
            </div>
          </div>`
        : "";

      const statusColor = STATUS_COLORS[req.status] || "#ef4444";
      const statusLabel = req.status === "in-progress" ? "In Progress" : req.status === "under-review" ? "Under Review" : req.status.charAt(0).toUpperCase() + req.status.slice(1);

      const hasLiked = currentUserId && (req.likers || []).includes(currentUserId);
      const likeCount = (req.likers || []).length;
      const commentCount = (req.comments || []).length;
      const likeColor = hasLiked ? "color:#ef4444;font-weight:600" : "";

      // Time since
      const seconds = Math.floor((Date.now() - new Date(req.createdAt).getTime()) / 1000);
      let timeSince = "just now";
      if (seconds >= 60) {
        const minutes = Math.floor(seconds / 60);
        if (minutes >= 60) {
          const hours = Math.floor(minutes / 60);
          if (hours >= 24) {
            const days = Math.floor(hours / 24);
            timeSince = days >= 30 ? new Date(req.createdAt).toLocaleDateString() : `${days}d ago`;
          } else timeSince = `${hours}h ago`;
        } else timeSince = `${minutes}m ago`;
      }

      const userName = (req.userName || "Anonymous").split(" ")[0];
      const userInitial = (userName[0] ?? "A").toUpperCase();

      const actionLogBtnColor = req.status === 'resolved' ? '#059669' : req.status === 'under-review' ? '#3b82f6' : '#d97706';
      const actionLogBtnBg = req.status === 'resolved' ? 'rgba(16,185,129,0.08)' : req.status === 'under-review' ? 'rgba(59,130,246,0.08)' : 'rgba(245,158,11,0.08)';
      const actionLogBtnBorder = req.status === 'resolved' ? 'rgba(16,185,129,0.2)' : req.status === 'under-review' ? 'rgba(59,130,246,0.2)' : 'rgba(245,158,11,0.2)';
      const actionLogBtn = req.status !== "open"
        ? `<button id="popup-resolution-${idPrefix}" style="display:flex;align-items:center;justify-content:center;gap:6px;width:100%;margin-top:12px;padding:8px 12px;border-radius:8px;font-size:12px;font-weight:500;color:${actionLogBtnColor};background:${actionLogBtnBg};border:1px solid ${actionLogBtnBorder};cursor:pointer;transition:background 150ms">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            View Action Log
          </button>`
        : "";

      const html = `
        <div class="popup-content" style="font-family:system-ui,sans-serif">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
            <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#ec4899,#a855f7,#f97316);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;flex-shrink:0">${userInitial}</div>
            <div style="display:flex;flex-direction:column;flex:1;min-width:0;line-height:1.2">
              <span class="popup-title" style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block">${userName}</span>
              <span style="font-size:11px;font-weight:600;color:var(--text-muted)">${timeSince}${!images.length ? ` &middot; ${locationText}` : ''}</span>
            </div>
            <div style="position:relative">
              <span id="popup-status-${idPrefix}" style="background:${statusColor};color:#fff;font-size:11px;font-weight:600;padding:6px 8px;border-radius:9999px;white-space:nowrap;${isAdmin && onUpdateStatus ? 'cursor:pointer' : ''}">${statusLabel}${isAdmin && onUpdateStatus ? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;margin-left:4px;vertical-align:-1px"><polyline points="6 9 12 15 18 9"/></svg>' : ''}</span>
              ${isAdmin && onUpdateStatus ? `<div id="popup-status-dropdown-${idPrefix}" style="display:none;position:absolute;right:0;top:100%;margin-top:4px;width:140px;background:var(--bg-card);border:1px solid var(--border-input);border-radius:12px;box-shadow:var(--shadow-md);z-index:100;overflow:hidden;padding:4px 0;opacity:0;transform:scale(0.95) translateY(-4px);transition:opacity 150ms ease,transform 150ms ease;transform-origin:top right">
                ${(['open', 'under-review', 'in-progress', 'resolved'] as const).map(s => {
                  const label = s === 'in-progress' ? 'In Progress' : s === 'under-review' ? 'Under Review' : s.charAt(0).toUpperCase() + s.slice(1);
                  const isCurrentStatus = s === req.status;
                  return `<button data-status="${s}" class="popup-status-option" style="display:flex;align-items:center;gap:6px;width:100%;text-align:left;padding:6px 10px;font-size:12px;border:none;background:none;cursor:${isCurrentStatus ? 'default' : 'pointer'};color:${isCurrentStatus ? STATUS_COLORS[s] : 'var(--text-primary)'};${isCurrentStatus ? 'font-weight:600' : ''}"><span style="width:8px;height:8px;border-radius:50%;background:${STATUS_COLORS[s]};flex-shrink:0"></span>${label}${isCurrentStatus ? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left:auto"><polyline points="20 6 9 17 4 12"/></svg>' : ''}</button>`;
                }).join('')}
              </div>` : ''}
            </div>
          </div>
          ${thumbs}
          ${actionLogBtn}
          <div style="margin-top:12px">
            <span style="font-weight:600;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block" class="popup-title">${req.title}</span>
          </div>
          <p class="popup-desc" style="margin:6px 0 0;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${req.description}</p>
          <div style="display:flex;align-items:center;gap:12px;margin-top:8px;font-size:12px">
            <button id="popup-like-${idPrefix}" style="background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:4px;padding:0;font-size:12px;${likeColor}" class="popup-metric-btn">
              ${likeCount > 0
                ? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'
                : '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'}
              ${likeCount}
            </button>
            <span style="display:flex;align-items:center;gap:4px" class="popup-metric">
              ${commentCount > 0
                ? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 512 512" fill="currentColor"><path d="M512 240c0 114.9-114.6 208-256 208c-37.1 0-72.3-6.4-104.1-17.9c-11.9 8.7-31.3 20.6-54.3 30.6C73.6 471.1 44.7 480 16 480c-6.5 0-12.3-3.9-14.8-9.9c-2.5-6-1.1-12.8 3.4-17.4c0 0 0 0 0 0s0 0 0 0s0 0 0 0c0 0 0 0 0 0l.3-.3c.3-.3 .7-.7 1.3-1.4c1.1-1.2 2.8-3.1 4.9-5.7c4.1-5 9.6-12.4 15.2-21.6c10-16.6 19.5-38.4 21.4-62.9C17.7 326.8 0 285.1 0 240C0 125.1 114.6 32 256 32s256 93.1 256 208z"/></svg>'
                : '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 512 512" fill="currentColor"><path d="M123.6 391.3c12.9-9.4 29.6-11.8 44.6-6.4c26.5 9.6 56.2 15.1 87.8 15.1c124.7 0 208-80.5 208-160s-83.3-160-208-160S48 160.5 48 240c0 32 12.4 62.8 35.7 89.2c8.6 9.7 12.8 22.5 11.8 35.5c-1.4 18.1-5.7 34.7-11.3 49.4c17-7.9 31.1-16.7 39.4-22.7zM21.2 431.9c1.8-2.7 3.5-5.4 5.1-8.1c10-16.6 19.5-38.4 21.4-62.9C17.7 326.8 0 285.1 0 240C0 125.1 114.6 32 256 32s256 93.1 256 208s-114.6 208-256 208c-37.1 0-72.3-6.4-104.1-17.9c-11.9 8.7-31.3 20.6-54.3 30.6C73.6 471.1 44.7 480 16 480c-6.5 0-12.3-3.9-14.8-9.9c-2.5-6-1.1-12.8 3.4-17.4l0 0 0 0 0 0 .3-.3c.3-.3 .7-.7 1.3-1.4c1.1-1.2 2.8-3.1 4.9-5.7z"/></svg>'}
              ${commentCount}
            </span>
          </div>
          ${isMobile ? '<div style="display:flex;flex-direction:column;align-items:center;gap:2px"><span style="font-size:10px;color:var(--text-muted);opacity:0.5">Click to expand</span><div style="width:32px;height:4px;border-radius:2px;background:var(--text-muted);opacity:0.3"></div></div>' : ''}
        </div>
      `;

      const popup = new maplibregl.Popup({
        offset: 25,
        closeOnClick: !hover,
        closeButton: false,
        maxWidth: isMobile ? "220px" : "320px",
        className: hover ? "hover-popup" : undefined,
      })
        .setLngLat([req.longitude, req.latitude])
        .setHTML(html)
        .addTo(map.current);

      if (hover) {
        hoverPopupRef.current = popup;
      } else {
        const closeHandler = () => onSelectRequest(null);
        popupCloseHandlerRef.current = closeHandler;
        popup.on("close", closeHandler);
        popupRef.current = popup;
      }

      // Attach like handler + resolution button + make entire popup tappable on mobile to expand
      setTimeout(() => {
        const btn = document.getElementById(`popup-like-${idPrefix}`);
        btn?.addEventListener("click", (e) => {
          e.stopPropagation();
          onLike(req.id);
        });
        const resBtn = document.getElementById(`popup-resolution-${idPrefix}`);
        resBtn?.addEventListener("click", (e) => {
          e.stopPropagation();
          onShowResolution?.(req);
        });
        // Admin status dropdown
        if (isAdmin && onUpdateStatus) {
          const statusBadge = document.getElementById(`popup-status-${idPrefix}`);
          const statusDropdown = document.getElementById(`popup-status-dropdown-${idPrefix}`);
          if (statusBadge && statusDropdown) {
            statusBadge.addEventListener("click", (e) => {
              e.stopPropagation();
              const isOpen = statusDropdown.style.display !== "none";
              if (isOpen) {
                statusDropdown.style.opacity = "0";
                statusDropdown.style.transform = "scale(0.95) translateY(-4px)";
                setTimeout(() => { statusDropdown.style.display = "none"; }, 150);
              } else {
                statusDropdown.style.display = "block";
                requestAnimationFrame(() => requestAnimationFrame(() => {
                  statusDropdown.style.opacity = "1";
                  statusDropdown.style.transform = "scale(1) translateY(0)";
                }));
              }
              if (!isOpen) {
                setTimeout(() => {
                  const closeDropdown = () => {
                    statusDropdown.style.opacity = "0";
                    statusDropdown.style.transform = "scale(0.95) translateY(-4px)";
                    setTimeout(() => { statusDropdown.style.display = "none"; }, 150);
                  };
                  document.addEventListener("click", closeDropdown, { once: true });
                }, 0);
              }
            });
            statusDropdown.querySelectorAll(".popup-status-option").forEach(opt => {
              opt.addEventListener("click", (e) => {
                e.stopPropagation();
                const newStatus = (opt as HTMLElement).dataset.status as RequestStatus;
                if (newStatus && newStatus !== req.status) {
                  onUpdateStatus(req.id, newStatus);
                  statusDropdown.style.display = "none";
                }
              });
            });
          }
        }
        if (!hover && isMobile) {
          const popupContent = popup.getElement()?.querySelector(".popup-content") as HTMLElement | null;
          if (popupContent) {
            popupContent.style.cursor = "pointer";
            popupContent.addEventListener("click", (e) => {
              // Don't expand if tapping the like button
              if ((e.target as HTMLElement).closest(`#popup-like-${idPrefix}`)) return;
              onExpandRequest?.();
            });
          }
        }
      }, 0);
    },
    [onSelectRequest, onLike, currentUserId, onExpandRequest, onShowResolution, isAdmin, onUpdateStatus]
  );

  showPopupRef.current = showPopup;

  useEffect(() => {
    if (selectedRequest) {
      const isNewSelection = selectedIdRef.current !== selectedRequest.id;
      selectedIdRef.current = selectedRequest.id;
      showPopup(selectedRequest);
      if (isNewSelection) {
        map.current?.flyTo({
          center: [selectedRequest.longitude, selectedRequest.latitude],
          zoom: 18,
          pitch: 50,
        });
      }
    } else {
      selectedIdRef.current = null;
      if (popupRef.current) {
        popupRef.current.off("close", popupCloseHandlerRef.current!);
        popupRef.current.remove();
      }
    }
  }, [selectedRequest, showPopup]);

  // Fly to target location from search
  useEffect(() => {
    if (flyToTarget && map.current) {
      map.current.flyTo({
        center: [flyToTarget.lng, flyToTarget.lat],
        zoom: 15,
        pitch: 45,
      });
    }
  }, [flyToTarget]);

  // Toggle crosshair cursor in report mode
  useEffect(() => {
    if (!map.current) return;
    const canvas = map.current.getCanvas();
    canvas.style.cursor = reportMode ? "crosshair" : "";
  }, [reportMode, mapReady]);

  // Show/update/remove the draggable drop-pin marker
  useEffect(() => {
    if (!map.current || !mapReady) return;

    if (reportMode && dropPinLocation) {
      const pinColor = usedGeolocation ? "#06b6d4" : "#a855f7";

      if (dropPinRef.current) {
        dropPinRef.current.setLngLat([dropPinLocation.lng, dropPinLocation.lat]);
        const pathEl = dropPinRef.current.getElement().querySelector("path");
        if (pathEl) pathEl.setAttribute("fill", pinColor);
        map.current?.flyTo({
          center: [dropPinLocation.lng, dropPinLocation.lat],
          zoom: Math.max(map.current?.getZoom() ?? 0, 15),
        });
      } else {
        const el = document.createElement("div");
        el.className = "drop-pin-marker";
        el.innerHTML = `<svg width="36" height="48" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 0C8.06 0 0 8.06 0 18c0 12.63 16.37 28.87 17.08 29.54a1.35 1.35 0 001.84 0C19.63 46.87 36 30.63 36 18 36 8.06 27.94 0 18 0z" fill="${pinColor}"/>
          <circle cx="18" cy="18" r="8" fill="white"/>
        </svg>`;

        const marker = new maplibregl.Marker({
          element: el,
          draggable: true,
          anchor: "bottom",
        })
          .setLngLat([dropPinLocation.lng, dropPinLocation.lat]);

        marker.on("dragend", () => {
          const lngLat = marker.getLngLat();
          onMapClickRef.current(lngLat.lng, lngLat.lat);
        });

        dropPinRef.current = marker;

        marker.addTo(map.current!);
        map.current?.flyTo({
          center: [dropPinLocation.lng, dropPinLocation.lat],
          zoom: Math.max(map.current?.getZoom() ?? 0, 15),
        });
      }
    } else {
      dropPinRef.current?.remove();
      dropPinRef.current = null;
    }
  }, [reportMode, dropPinLocation, mapReady, usedGeolocation]);

  const handleLayerChange = useCallback((layer: MapLayer) => {
    if (!map.current) return;
    setActiveLayer(layer);
    activeLayerRef.current = layer;

    const styles: Record<MapLayer, string | object> = {
      default: darkMode
        ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      satellite: {
        version: 8,
        sources: {
          "esri-satellite": {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            maxzoom: 19,
          },
        },
        layers: [
          { id: "esri-satellite-layer", type: "raster", source: "esri-satellite" },
        ],
      },
      terrain: darkMode
        ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        : "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
      flat: darkMode
        ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      topo: {
        version: 8,
        sources: {
          "opentopomap": {
            type: "raster",
            tiles: [
              "https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
              "https://b.tile.opentopomap.org/{z}/{x}/{y}.png",
              "https://c.tile.opentopomap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            maxzoom: 17,
          },
        },
        layers: [
          { id: "opentopomap-layer", type: "raster", source: "opentopomap" },
        ],
      },
      transport: {
        version: 8,
        sources: {
          "osm-transport": {
            type: "raster",
            tiles: [
              "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            maxzoom: 19,
            attribution: "&copy; OpenStreetMap contributors",
          },
        },
        layers: [
          { id: "osm-transport-layer", type: "raster", source: "osm-transport" },
        ],
      },
      azure: {
        version: 8,
        sources: {
          "azure-maps": {
            type: "raster",
            tiles: [
              `/api/map/tile?tilesetId=${darkMode ? "microsoft.base.darkgrey" : "microsoft.base.road"}&z={z}&x={x}&y={y}`,
            ],
            tileSize: 256,
          },
        },
        layers: [
          { id: "azure-maps-layer", type: "raster", source: "azure-maps", minzoom: 0, maxzoom: 22 },
        ],
      },
    };

    const newStyle = styles[layer];
    const newStyleUrl = typeof newStyle === "string" ? newStyle : null;
    if (newStyleUrl) (map.current as unknown as { _styleUrl?: string })._styleUrl = newStyleUrl;

    // Remove existing 3d-buildings before style change
    if (map.current.getLayer("3d-buildings")) {
      map.current.removeLayer("3d-buildings");
    }

    map.current.setStyle(newStyle as string);

    // Always listen for style.load, and also try immediately (for same-style cases)
    map.current.once("style.load", add3dBuildings);
    // Defer to let MapLibre process the setStyle — if style didn't change, style.load won't fire
    setTimeout(add3dBuildings, 100);

    if (layer === "flat") {
      map.current.easeTo({ pitch: 0, bearing: 0, duration: 500 });
    } else if (map.current.getPitch() === 0) {
      map.current.easeTo({ pitch: 45, bearing: -17.6, duration: 500 });
    }
  }, [darkMode]);

  return (
    <div style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}>
      <div
        ref={mapContainer}
        style={{ width: "100%", height: "100%" }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "var(--map-bg)",
          opacity: mapFading ? 1 : 0,
          transition: "opacity 200ms ease",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <Layers activeLayer={activeLayer} onLayerChange={handleLayerChange} darkMode={darkMode} isSignedIn={!!currentUserId} onSignInPrompt={onSignInPrompt} />
    </div>
  );
}
