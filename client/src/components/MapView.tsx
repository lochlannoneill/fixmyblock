import { useRef, useEffect, useCallback, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Complaint } from "../types/complaint";
import { STATUS_COLORS, CATEGORY_LABELS } from "../types/complaint";

interface MapViewProps {
  complaints: Complaint[];
  onMapClick: (lng: number, lat: number) => void;
  selectedComplaint: Complaint | null;
  onSelectComplaint: (c: Complaint | null) => void;
  onUpvote: (id: string) => void;
  reportMode: boolean;
  dropPinLocation: { lng: number; lat: number } | null;
}

export default function MapView({
  complaints,
  onMapClick,
  selectedComplaint,
  onSelectComplaint,
  onUpvote,
  reportMode,
  dropPinLocation,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const popupCloseHandlerRef = useRef<(() => void) | null>(null);
  const dropPinRef = useRef<maplibregl.Marker | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const reportModeRef = useRef(reportMode);
  const [mapReady, setMapReady] = useState(false);

  // Keep refs in sync so the map click handler always has latest values
  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => { reportModeRef.current = reportMode; }, [reportMode]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const azureMapsKey = import.meta.env.VITE_AZURE_MAPS_KEY || "";

    // Use Azure Maps tiles if key is available, otherwise use free OSM tiles
    const styleUrl = azureMapsKey
      ? `https://atlas.microsoft.com/map/style?api-version=2024-04-01&style=microsoft-imagery&subscription-key=${azureMapsKey}`
      : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

    map.current = new maplibregl.Map({
      container: mapContainer.current,
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
        : styleUrl,
      center: [-6.2603, 53.3498], // Default: Dublin
      zoom: 13,
      pitch: 45, // 3D tilt
      bearing: -17.6,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    map.current.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      "top-right"
    );

    map.current.on("load", () => {
      setMapReady(true);

      // Add 3D building layer if using styles that support it
      const layers = map.current!.getStyle().layers;
      if (layers) {
        const labelLayer = layers.find(
          (l) => l.type === "symbol" && l.layout && "text-field" in l.layout
        );
        const firstLabelId = labelLayer?.id;

        // Only add 3D buildings if the source exists
        const sources = map.current!.getStyle().sources;
        if (sources["openmaptiles"] || sources["carto"]) {
          const sourceId = sources["openmaptiles"]
            ? "openmaptiles"
            : "carto";
          map.current!.addLayer(
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
                "fill-extrusion-opacity": 0.6,
              },
            },
            firstLabelId
          );
        }
      }
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

  // Sync markers with complaints
  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    complaints.forEach((complaint) => {
      const el = document.createElement("div");
      el.className = "complaint-marker";
      el.style.cssText = `
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        background: ${STATUS_COLORS[complaint.status]};
        transform: rotate(-45deg);
        border: 2px solid white;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      const inner = document.createElement("div");
      inner.style.cssText = `
        transform: rotate(45deg);
        font-size: 14px;
        color: white;
        font-weight: bold;
      `;
      inner.textContent = complaint.upvotes > 0 ? `${complaint.upvotes}` : "!";
      el.appendChild(inner);

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectComplaint(complaint);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([complaint.longitude, complaint.latitude])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [complaints, mapReady, onSelectComplaint]);

  // Show popup for selected complaint
  const showPopup = useCallback(
    (complaint: Complaint) => {
      if (!map.current) return;
      // Remove old popup without triggering its close handler
      if (popupRef.current) {
        popupRef.current.off("close", popupCloseHandlerRef.current!);
        popupRef.current.remove();
      }

      const thumbs = complaint.imageUrls.length
        ? `<div style="display:flex;gap:4px;margin:8px 0;overflow-x:auto">
            ${complaint.imageUrls
              .slice(0, 3)
              .map(
                (url) =>
                  `<img src="${url}" style="width:80px;height:60px;object-fit:cover;border-radius:4px" />`
              )
              .join("")}
          </div>`
        : "";

      const html = `
        <div class="popup-content">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${STATUS_COLORS[complaint.status]}"></span>
            <strong class="popup-title">${complaint.title}</strong>
          </div>
          <div class="popup-meta">
            ${CATEGORY_LABELS[complaint.category]} · ${complaint.status} · ${new Date(complaint.createdAt).toLocaleDateString()}
          </div>
          ${thumbs}
          <p class="popup-desc">${complaint.description.slice(0, 150)}${complaint.description.length > 150 ? "..." : ""}</p>
          <div style="display:flex;align-items:center;gap:12px;margin-top:8px">
            <button id="popup-upvote-${complaint.id}" class="popup-upvote-btn">
              👍 ${complaint.upvotes}
            </button>
            <span class="popup-reporter">Reported by ${complaint.reporterName}</span>
          </div>
        </div>
      `;

      const popup = new maplibregl.Popup({
        offset: 25,
        closeOnClick: true,
        maxWidth: "320px",
      })
        .setLngLat([complaint.longitude, complaint.latitude])
        .setHTML(html)
        .addTo(map.current);

      const closeHandler = () => onSelectComplaint(null);
      popupCloseHandlerRef.current = closeHandler;
      popup.on("close", closeHandler);

      // Attach upvote handler after DOM insertion
      setTimeout(() => {
        const btn = document.getElementById(`popup-upvote-${complaint.id}`);
        btn?.addEventListener("click", (e) => {
          e.stopPropagation();
          onUpvote(complaint.id);
        });
      }, 0);

      popupRef.current = popup;
    },
    [onSelectComplaint, onUpvote]
  );

  useEffect(() => {
    if (selectedComplaint) {
      showPopup(selectedComplaint);
      map.current?.flyTo({
        center: [selectedComplaint.longitude, selectedComplaint.latitude],
        zoom: 16,
        pitch: 50,
      });
    } else {
      if (popupRef.current) {
        popupRef.current.off("close", popupCloseHandlerRef.current!);
        popupRef.current.remove();
      }
    }
  }, [selectedComplaint, showPopup]);

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

  return (
    <div
      ref={mapContainer}
      style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
    />
  );
}
