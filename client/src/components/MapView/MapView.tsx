import { useRef, useEffect, useCallback, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./MapView.css";
import type { Request } from "../../types/request";
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
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const popupCloseHandlerRef = useRef<(() => void) | null>(null);
  const dropPinRef = useRef<maplibregl.Marker | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const reportModeRef = useRef(reportMode);
  const onUserLocationRef = useRef(onUserLocation);
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

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const azureMapsKey = import.meta.env.VITE_AZURE_MAPS_KEY || "";

    // Use Azure Maps tiles if key is available, otherwise use free OSM tiles
    const defaultStyle = darkMode
      ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      : "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      attributionControl: false,
      style: azureMapsKey
        ? {
            version: 8,
            sources: {
              "azure-maps": {
                type: "raster",
                tiles: [
                  `https://atlas.microsoft.com/map/tile?api-version=2024-04-01&tilesetId=microsoft.base.road&zoom={z}&x={x}&y={y}&subscription-key=${azureMapsKey}`,
                ],
                tileSize: 256,
              },
            },
            layers: [
              {
                id: "azure-maps-layer",
                type: "raster",
                source: "azure-maps",
                minzoom: 0,
                maxzoom: 22,
              },
            ],
          }
        : defaultStyle,
      center: [-6.2603, 53.3498], // Default: Dublin
      zoom: 13,
      pitch: 45, // 3D tilt
      bearing: 0,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");
    if (!azureMapsKey) (map.current as unknown as { _styleUrl?: string })._styleUrl = defaultStyle;

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
    setMapFading(true);
    const azureMapsKey = import.meta.env.VITE_AZURE_MAPS_KEY || "";
    if (azureMapsKey) return; // Azure Maps doesn't support style switching this way
    if (activeLayer !== "default" && activeLayer !== "terrain") return; // Don't override raster layer selections
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

  // Sync markers with requests
  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    requests.forEach((req) => {
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

      const inner = document.createElement("div");
      inner.style.cssText = `
        font-size: 14px;
        color: white;
        font-weight: bold;
      `;
      inner.textContent = `${(req.likers || []).length}`;
      el.appendChild(inner);

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectRequest(req);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([req.longitude, req.latitude])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [requests, mapReady, onSelectRequest, darkMode]);

  // Show popup for selected request
  const showPopup = useCallback(
    (req: Request) => {
      if (!map.current) return;
      // Remove old popup without triggering its close handler
      if (popupRef.current) {
        popupRef.current.off("close", popupCloseHandlerRef.current!);
        popupRef.current.remove();
      }

      const isMobile = window.innerWidth < 640;
      const locationText = req.location || `${req.latitude.toFixed(4)}, ${req.longitude.toFixed(4)}`;
      const images = req.imageUrls || [];
      const thumbs = images.length
        ? `<div style="margin-top:6px;border-radius:8px;overflow:hidden;height:${isMobile ? '80px' : '120px'};position:relative">
            <img src="${images[0]}" style="width:100%;height:100%;object-fit:cover" />
            <div style="position:absolute;bottom:0;left:0;right:0;display:flex;align-items:center;justify-content:center;gap:4px;padding:4px 0;font-size:11px;color:#fff;background:rgba(0,0,0,0.4);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 384 512" fill="currentColor"><path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/></svg>
              ${locationText}
            </div>
          </div>`
        : "";

      const statusColor = STATUS_COLORS[req.status] || "#ef4444";
      const statusLabel = req.status === "in-progress" ? "In Progress" : req.status.charAt(0).toUpperCase() + req.status.slice(1);

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

      const html = `
        <div class="popup-content" style="font-family:system-ui,sans-serif">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="flex:1;font-weight:600;font-size:14px" class="popup-title">${req.title.length > 30 ? `${req.title.slice(0, 30)}...` : req.title}</span>
            <span style="background:${statusColor};color:#fff;font-size:11px;font-weight:600;padding:2px 8px;border-radius:9999px;white-space:nowrap">${statusLabel}</span>
          </div>
          <div class="popup-meta" style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">
            ${!images.length ? `<span style="display:flex;align-items:center;gap:4px"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 384 512" fill="currentColor"><path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/></svg>${locationText}</span>` : '<span></span>'}
            <span>${timeSince}</span>
          </div>
          ${thumbs}
          <p class="popup-desc" style="margin:6px 0 0;line-height:1.4">${req.description.slice(0, isMobile ? 120 : 200)}${req.description.length > (isMobile ? 120 : 200) ? "..." : ""}</p></p>
          <div style="display:flex;align-items:center;gap:12px;margin-top:8px;font-size:12px">
            <button id="popup-like-${req.id}" style="background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:4px;padding:0;font-size:12px;${likeColor}" class="popup-metric-btn">
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
        </div>
      `;

      const popup = new maplibregl.Popup({
        offset: 25,
        closeOnClick: true,
        closeButton: false,
        maxWidth: isMobile ? "220px" : "320px",
      })
        .setLngLat([req.longitude, req.latitude])
        .setHTML(html)
        .addTo(map.current);

      const closeHandler = () => onSelectRequest(null);
      popupCloseHandlerRef.current = closeHandler;
      popup.on("close", closeHandler);

      // Attach like handler after DOM insertion
      setTimeout(() => {
        const btn = document.getElementById(`popup-like-${req.id}`);
        btn?.addEventListener("click", (e) => {
          e.stopPropagation();
          onLike(req.id);
        });
      }, 0);

      popupRef.current = popup;
    },
    [onSelectRequest, onLike, currentUserId]
  );

  const selectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedRequest) {
      const isNewSelection = selectedIdRef.current !== selectedRequest.id;
      selectedIdRef.current = selectedRequest.id;
      showPopup(selectedRequest);
      if (isNewSelection) {
        map.current?.flyTo({
          center: [selectedRequest.longitude, selectedRequest.latitude],
          zoom: 16,
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
      <Layers activeLayer={activeLayer} onLayerChange={handleLayerChange} darkMode={darkMode} />
    </div>
  );
}
