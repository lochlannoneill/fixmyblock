import { useState } from "react";

export type MapLayer = "default" | "satellite" | "terrain" | "flat";

interface LayerOption {
  id: MapLayer;
  label: string;
  thumbnail: string;
}

const LAYER_THUMBNAILS_LIGHT: Record<MapLayer, string> = {
  default: "https://a.basemaps.cartocdn.com/light_all/13/4093/2723.png",
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/13/2723/4093",
  terrain: "https://a.basemaps.cartocdn.com/rastertiles/voyager/13/4093/2723.png",
  flat: "https://a.basemaps.cartocdn.com/light_all/13/4093/2723.png",
};

const LAYER_THUMBNAILS_DARK: Record<MapLayer, string> = {
  default: "https://a.basemaps.cartocdn.com/dark_all/13/4093/2723.png",
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/13/2723/4093",
  terrain: "https://a.basemaps.cartocdn.com/dark_all/13/4093/2723.png",
  flat: "https://a.basemaps.cartocdn.com/dark_all/13/4093/2723.png",
};

interface LayersProps {
  activeLayer: MapLayer;
  onLayerChange: (layer: MapLayer) => void;
  darkMode: boolean;
}

export default function Layers({ activeLayer, onLayerChange, darkMode }: LayersProps) {
  const [expanded, setExpanded] = useState(false);
  const thumbnails = darkMode ? LAYER_THUMBNAILS_DARK : LAYER_THUMBNAILS_LIGHT;

  const LAYERS: LayerOption[] = [
    { id: "terrain", label: "3D", thumbnail: thumbnails.terrain },
    { id: "satellite", label: "Satellite", thumbnail: thumbnails.satellite },
    { id: "default", label: "2D", thumbnail: thumbnails.default },
  ];

  return (
    <div className="absolute bottom-6 left-4 z-50 flex items-end gap-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="group relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 border-white dark:border-[#3a3a3a] shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        title="Map layers"
      >
        <img
          src={thumbnails[activeLayer]}
          alt="Layers"
          className="absolute inset-0 w-full h-full object-cover transition-all duration-200 group-hover:brightness-110"
        />
        <div className="absolute inset-0 rounded-[10px] shadow-[inset_0_0_20px_rgba(0,0,0,0.65)] z-10 pointer-events-none" />
        <div className="relative z-20 flex flex-col items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}>
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <span className="text-[11px] font-semibold text-white" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.7)" }}>
            Layers
          </span>
        </div>
      </button>
      <div
        className={`flex overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? "max-w-lg opacity-100 scale-100" : "max-w-0 opacity-0 scale-95"
        }`}
      >
        <div className="flex gap-2 bg-white dark:bg-[#2a2a2a] rounded-xl shadow-lg border border-slate-200 dark:border-[#3a3a3a] p-2">
          {LAYERS.map((layer) => (
            <button
              key={layer.id}
              onClick={() => {
                onLayerChange(layer.id);
                setExpanded(false);
              }}
              className={`flex flex-col items-center gap-1.5 rounded-lg transition-all ${
                activeLayer === layer.id
                  ? ""
                  : "hover:ring-2 hover:ring-slate-300 dark:hover:ring-[#555] ring-offset-1 dark:ring-offset-[#2a2a2a]"
              }`}
            >
              <img
                src={layer.thumbnail}
                alt={layer.label}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <span className={`text-[11px] font-medium pb-1 ${
                activeLayer === layer.id
                  ? "text-blue-500"
                  : "text-slate-600 dark:text-zinc-400"
              }`}>
                {layer.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
