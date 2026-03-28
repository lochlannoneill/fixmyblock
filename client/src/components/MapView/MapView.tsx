import { useRef, useEffect, useCallback, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./MapView.css";
import type { Request } from "../../types/request";
import { STATUS_COLORS, CATEGORY_LABELS } from "../../types/request";
import Layers from "../Layers";
import type { MapLayer } from "../Layers";

interface MapViewProps {
  requests: Request[];
  onMapClick: (lng: number, lat: number) => void;
  selectedRequest: Request | null;
  onSelectRequest: (c: Request | null) => void;
  onUpvote: (id: string) => void;
  reportMode: boolean;
  dropPinLocation: { lng: number; lat: number } | null;
  darkMode: boolean;
  onUserLocation?: (lng: number, lat: number) => void;
  currentUserId?: string;
}

export default function MapView({
  requests,
  onMapClick,
  selectedRequest,
  onSelectRequest,
  onUpvote,
  reportMode,
  dropPinLocation,
  darkMode,
  onUserLocation,
  currentUserId,
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

    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
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
        border: 2px solid ${darkMode ? "#2a2a2a" : "white"};
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
      inner.textContent = `${(req.upvoters || []).length}`;
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

      const thumbs = req.imageUrls.length
        ? `<div style="display:flex;gap:4px;margin:8px 0;overflow-x:auto">
            ${req.imageUrls
              .slice(0, 3)
              .map(
                (url) =>
                  `<img src="${url}" style="width:80px;height:60px;object-fit:cover;border-radius:4px" />`
              )
              .join("")}
          </div>`
        : "";

      const statusColors: Record<string, string> = { open: "#ef4444", "in-progress": "#eab308", resolved: "#22c55e" };
      const statusLabels: Record<string, string> = { open: "Open", "in-progress": "In Progress", resolved: "Resolved" };
      const statusColor = statusColors[req.status] || "#ef4444";
      const statusLabel = statusLabels[req.status] || req.status;

      const hasUpvoted = currentUserId && (req.upvoters || []).includes(currentUserId);
      const upvoteCount = (req.upvoters || []).length;
      const upvoteBtnClass = hasUpvoted ? "popup-upvote-btn popup-upvote-active" : "popup-upvote-btn";

      const html = `
        <div class="popup-content" style="position:relative;min-width:260px;min-height:120px">
          <span style="position:absolute;top:0;right:0;display:flex;align-items:center;gap:6px">
            <span style="background:${statusColor};color:#fff;font-size:11px;font-weight:600;padding:2px 8px;border-radius:9999px">${statusLabel}</span>
            <button id="popup-upvote-${req.id}" class="${upvoteBtnClass}" style="margin:0">${upvoteCount} <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 512 512" fill="currentColor"><path d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z"/></svg></button>
          </span>
          <div class="popup-meta" style="margin-bottom:4px">
            <div>${new Date(req.createdAt).toLocaleDateString()} · ${new Date(req.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
            <div>${CATEGORY_LABELS[req.category]}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;padding-right:80px">
            <strong class="popup-title">${req.title}</strong>
          </div>
          ${thumbs}
          <p class="popup-desc">${req.description.slice(0, 150)}${req.description.length > 150 ? "..." : ""}</p>
          <span class="popup-reporter" style="display:block;margin-top:8px">Reported by ${req.reporterName}</span>
        </div>
      `;

      const popup = new maplibregl.Popup({
        offset: 25,
        closeOnClick: true,
        closeButton: false,
        maxWidth: "320px",
      })
        .setLngLat([req.longitude, req.latitude])
        .setHTML(html)
        .addTo(map.current);

      const closeHandler = () => onSelectRequest(null);
      popupCloseHandlerRef.current = closeHandler;
      popup.on("close", closeHandler);

      // Attach upvote handler after DOM insertion
      setTimeout(() => {
        const btn = document.getElementById(`popup-upvote-${req.id}`);
        btn?.addEventListener("click", (e) => {
          e.stopPropagation();
          onUpvote(req.id);
        });
      }, 0);

      popupRef.current = popup;
    },
    [onSelectRequest, onUpvote, currentUserId]
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
      if (dropPinRef.current) {
        dropPinRef.current.setLngLat([dropPinLocation.lng, dropPinLocation.lat]);
      } else {
        const el = document.createElement("div");
        el.className = "drop-pin-marker";
        el.innerHTML = `<svg width="36" height="48" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 0C8.06 0 0 8.06 0 18c0 12.63 16.37 28.87 17.08 29.54a1.35 1.35 0 001.84 0C19.63 46.87 36 30.63 36 18 36 8.06 27.94 0 18 0z" fill="#3b82f6"/>
          <circle cx="18" cy="18" r="8" fill="white"/>
        </svg>`;

        dropPinRef.current = new maplibregl.Marker({
          element: el,
          draggable: true,
          anchor: "bottom",
        })
          .setLngLat([dropPinLocation.lng, dropPinLocation.lat])
          .addTo(map.current!);

        dropPinRef.current.on("dragend", () => {
          const lngLat = dropPinRef.current!.getLngLat();
          onMapClickRef.current(lngLat.lng, lngLat.lat);
        });
      }
    } else {
      dropPinRef.current?.remove();
      dropPinRef.current = null;
    }
  }, [reportMode, dropPinLocation, mapReady]);

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
          backgroundColor: darkMode ? "#121212" : "#ffffff",
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
