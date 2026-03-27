import { useState, useCallback } from "react";
import Header from "./components/Header";
import MapView from "./components/MapView";
import RequestForm from "./components/RequestForm";
import RequestToolbar from "./components/RequestToolbar";
import { useTheme } from "./hooks/useTheme";
import { useRequests } from "./hooks/useRequests";
import type { Request, NewRequest } from "./types/request";
import "./App.css";

export default function App() {
  const { darkMode, toggleTheme } = useTheme();
  const { requests, selectedRequest, selectRequest, upvote, remove, create } = useRequests();

  const [showForm, setShowForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lng: number;
    lat: number;
  } | null>(null);
  const [sidebarView, setSidebarView] = useState<"list" | "form">("list");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth < 768);

  const handleMapClick = useCallback(
    (lng: number, lat: number) => {
      if (showForm) {
        setSelectedLocation({ lng, lat });
      }
    },
    [showForm]
  );

  const handleSelectRequest = useCallback((c: Request | null) => {
    selectRequest(c);
    if (c) {
      setSidebarView("list");
      setShowForm(false);
    }
  }, [selectRequest]);

  const handleSubmit = async (data: NewRequest) => {
    await create(data);
    setShowForm(false);
    setSidebarView("list");
    setSelectedLocation(null);
  };

  const handleStartRequest = () => {
    setShowForm(true);
    setSidebarView("form");
    selectRequest(null);
    setSelectedLocation(null);
  };

  const handleCancelRequest = () => {
    setShowForm(false);
    setSidebarView("list");
    setSelectedLocation(null);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-[#121212] text-slate-800 dark:text-zinc-200">
      <Header
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
      />
      <div className="flex flex-col-reverse md:flex-row flex-1 overflow-hidden">
        <aside className={`sidebar border-t border-slate-200 dark:border-[#2a2a2a] md:border-r md:border-t-0 bg-slate-50 dark:bg-[#1e1e1e] overflow-y-auto z-10 transition-all duration-300 ${
          sidebarCollapsed
            ? "hidden md:block md:w-0 md:min-w-0 md:overflow-hidden"
            : "w-full flex-1 md:w-[380px] md:min-w-[380px] md:flex-none"
        }`}>
          {sidebarView === "form" ? (
            <RequestForm
              selectedLocation={selectedLocation}
              onSubmit={handleSubmit}
              onCancel={handleCancelRequest}
            />
          ) : (
            <>
              <RequestToolbar
                requests={requests}
                onNewRequest={handleStartRequest}
                showingForm={showForm}
                onSelectRequest={handleSelectRequest}
                onDeleteRequest={remove}
                selectedId={selectedRequest?.id ?? null}
              />
            </>
          )}
        </aside>
        <main className={`md:flex-1 md:h-auto md:min-h-0 relative transition-all duration-300 ${
          sidebarCollapsed ? "flex-1" : "flex-none h-[25vh] min-h-[25vh]"
        }`}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute z-50 transition-colors flex items-center gap-1.5 px-3 py-2 rounded-full bg-white dark:bg-[#2a2a2a] border border-slate-200 dark:border-[#3a3a3a] shadow-lg text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#333] cursor-pointer bottom-3 left-1/2 -translate-x-1/2 md:bottom-auto md:left-4 md:translate-x-0 md:top-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform duration-300 ${sidebarCollapsed ? "rotate-0" : "rotate-180"}`}
            >
              <polyline points="18 15 12 9 6 15" className="md:hidden" />
              <polyline points="9 18 15 12 9 6" className="hidden md:block" />
            </svg>
            {sidebarCollapsed ? "Show Requests List" : (<><span className="md:hidden">Show map</span><span className="hidden md:inline">Hide Requests List</span></>)}
          </button>
          {showForm && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-[#121212] text-white py-2.5 px-6 rounded-3xl text-sm font-medium z-50 shadow-lg animate-pulse">
              Click anywhere on the map to place your pin
            </div>
          )}
          <MapView
            requests={requests}
            onMapClick={handleMapClick}
            selectedRequest={selectedRequest}
            onSelectRequest={handleSelectRequest}
            onUpvote={upvote}
            reportMode={showForm}
            dropPinLocation={selectedLocation}
            darkMode={darkMode}
          />
        </main>
      </div>
    </div>
  );
}
