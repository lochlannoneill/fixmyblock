import { useState } from "react";

export type MapLayer = "default" | "satellite" | "terrain" | "flat" | "topo" | "transport" | "azure";

interface LayerOption {
  id: MapLayer;
  label: string;
  thumbnail: string;
  locked?: boolean;
}

const LAYER_THUMBNAILS_LIGHT: Record<Exclude<MapLayer, "azure">, string> = {
  default: "https://a.basemaps.cartocdn.com/light_all/13/4093/2723.png",
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/13/2723/4093",
  terrain: "https://a.basemaps.cartocdn.com/rastertiles/voyager/13/4093/2723.png",
  flat: "https://a.basemaps.cartocdn.com/light_all/13/4093/2723.png",
  topo: "https://a.tile.opentopomap.org/13/4093/2723.png",
  transport: "https://a.tile.openstreetmap.org/13/4093/2723.png",
};

const LAYER_THUMBNAILS_DARK: Record<Exclude<MapLayer, "azure">, string> = {
  default: "https://a.basemaps.cartocdn.com/dark_all/13/4093/2723.png",
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/13/2723/4093",
  terrain: "https://a.basemaps.cartocdn.com/dark_all/13/4093/2723.png",
  flat: "https://a.basemaps.cartocdn.com/dark_all/13/4093/2723.png",
  topo: "https://a.tile.opentopomap.org/13/4093/2723.png",
  transport: "https://a.tile.openstreetmap.org/13/4093/2723.png",
};

interface LayersProps {
  activeLayer: MapLayer;
  onLayerChange: (layer: MapLayer) => void;
  darkMode: boolean;
  isSignedIn?: boolean;
  onSignInPrompt?: () => void;
  mobileSlide?: "top" | "middle" | "bottom";
  sidebarOpen?: boolean;
  trafficOn?: boolean;
  weatherOn?: boolean;
  infraredOn?: boolean;
  onToggleTraffic?: () => void;
  onToggleWeather?: () => void;
  onToggleInfrared?: () => void;
}

export default function Layers({ activeLayer, onLayerChange, darkMode, isSignedIn, onSignInPrompt, mobileSlide, sidebarOpen, trafficOn, weatherOn, infraredOn, onToggleTraffic, onToggleWeather, onToggleInfrared }: LayersProps) {
  const [expanded, setExpanded] = useState(false);
  const [weatherExpanded, setWeatherExpanded] = useState(false);
  const thumbnails = darkMode ? LAYER_THUMBNAILS_DARK : LAYER_THUMBNAILS_LIGHT;
  const azureLocked = !isSignedIn;

  const LAYERS: LayerOption[] = [
    { id: "terrain", label: "Terrain", thumbnail: thumbnails.terrain },
    { id: "satellite", label: "Satellite", thumbnail: thumbnails.satellite },
    { id: "topo", label: "Topo", thumbnail: thumbnails.topo },
    { id: "transport", label: "Transport", thumbnail: thumbnails.transport },
    { id: "default", label: "Minimal", thumbnail: thumbnails.default },
    { id: "azure", label: "Azure Maps", thumbnail: azureLocked ? "" : "/api/map/tile?tilesetId=microsoft.base.road&z=13&x=4093&y=2723", locked: azureLocked },
  ];

  return (
    <div
      id="mobile-layers-btn"
      className={`fixed md:absolute md:bottom-6 left-4 z-50 flex flex-col-reverse md:flex-row items-start md:items-end gap-2 transition-[bottom] duration-300 md:transition-[left] md:duration-300 md:ease-in-out ${sidebarOpen ? 'md:left-[456px]' : ''}`}
      style={
        typeof window !== "undefined" && window.innerWidth < 768
          ? { bottom: mobileSlide === "bottom" ? "4rem" : mobileSlide === "middle" ? "calc(60vh + 0.5rem)" : "calc(85vh + 0.5rem)" }
          : undefined
      }
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="group relative flex items-center justify-center w-16 h-16 md:w-24 md:h-24 rounded-xl overflow-hidden border-2 border-white dark:border-[#3a3a3a] shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        title="Map layers"
      >
        <img
          src={activeLayer !== "azure" ? thumbnails[activeLayer] : thumbnails.terrain}
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
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded
            ? "max-h-[500px] md:max-h-none md:max-w-lg opacity-100 scale-100"
            : "max-h-0 md:max-w-0 opacity-0 scale-95"
        }`}
      >
        <div className="flex flex-col-reverse md:flex-row gap-2 bg-white dark:bg-[#2a2a2a] rounded-xl shadow-lg border border-slate-200 dark:border-[#3a3a3a] p-2 max-h-[60vh] md:max-h-none overflow-y-auto md:overflow-y-visible">
          {LAYERS.map((layer) => (
            <button
              key={layer.id}
              onClick={() => {
                if (layer.locked) { onSignInPrompt?.(); return; }
                onLayerChange(layer.id);
                setExpanded(false);
              }}
              className={`flex flex-col items-center gap-1.5 rounded-lg transition-all ${
                layer.locked
                  ? "opacity-50 cursor-not-allowed"
                  : activeLayer === layer.id
                    ? "cursor-pointer"
                    : "cursor-pointer hover:ring-2 hover:ring-slate-300 dark:hover:ring-[#555] ring-offset-1 dark:ring-offset-[#2a2a2a]"
              }`}
              title={layer.locked ? "Sign in to unlock" : layer.label}
            >
              {layer.locked ? (
                <div className="w-16 h-16 rounded-lg bg-slate-200 dark:bg-zinc-700 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 dark:text-zinc-500">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
              ) : (
                <img
                  src={layer.thumbnail}
                  alt={layer.label}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
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
      {activeLayer === "azure" && (
        <div className="flex flex-col gap-1.5 self-center">
          <button
            onClick={onToggleTraffic}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold shadow-md backdrop-blur-md transition-all duration-200 cursor-pointer border ${
              trafficOn
                ? "bg-blue-500/90 text-white border-blue-400"
                : "bg-white/70 dark:bg-black/40 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-600 hover:bg-white/90 dark:hover:bg-black/60"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            Traffic
          </button>
          <div className="relative">
            <button
              onClick={() => setWeatherExpanded(v => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold shadow-md backdrop-blur-md transition-all duration-200 cursor-pointer border w-full ${
                weatherOn || infraredOn
                  ? "bg-blue-500/90 text-white border-blue-400"
                  : "bg-white/70 dark:bg-black/40 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-600 hover:bg-white/90 dark:hover:bg-black/60"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"/><path d="m9.2 22 3-7H8l4-7"/></svg>
              Weather
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`ml-auto transition-transform duration-200 ${weatherExpanded ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {weatherExpanded && (
              <div className="mt-1 flex flex-col gap-1 bg-white/80 dark:bg-black/50 backdrop-blur-md rounded-lg border border-slate-200 dark:border-zinc-600 p-1.5 shadow-md">
                <button
                  onClick={onToggleWeather}
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-zinc-700/50"
                >
                  <span className={`w-3 h-3 rounded-sm border flex items-center justify-center ${weatherOn ? "bg-blue-500 border-blue-500" : "border-slate-300 dark:border-zinc-500"}`}>
                    {weatherOn && <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </span>
                  <span className="text-slate-700 dark:text-zinc-200">Radar</span>
                </button>
                <button
                  onClick={onToggleInfrared}
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-zinc-700/50"
                >
                  <span className={`w-3 h-3 rounded-sm border flex items-center justify-center ${infraredOn ? "bg-blue-500 border-blue-500" : "border-slate-300 dark:border-zinc-500"}`}>
                    {infraredOn && <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </span>
                  <span className="text-slate-700 dark:text-zinc-200">Infrared</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
