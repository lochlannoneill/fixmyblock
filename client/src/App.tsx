import { useState, useEffect, useCallback, useMemo } from "react";
import Header from "./components/Header";
import MapView from "./components/MapView";
import RequestForm from "./components/RequestForm";
import RequestList from "./components/RequestList";
import RequestToolbar from "./components/RequestToolbar";
import type { Request, NewRequest, RequestCategory, RequestStatus } from "./types/request";
import { fetchRequests, createRequest, upvoteRequest, deleteRequest } from "./services/api";
import type { SortBy } from "./components/RequestToolbar";
import "./App.css";

export default function App() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lng: number;
    lat: number;
  } | null>(null);
  const [sidebarView, setSidebarView] = useState<"list" | "form">("list");
  const [, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("fixmyblock-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [filterCategory, setFilterCategory] = useState<RequestCategory | "">("")
  const [filterStatus, setFilterStatus] = useState<RequestStatus | "">("")
  const [sortBy, setSortBy] = useState<SortBy>("newest");

  const filteredSorted = useMemo(() => {
    const filtered = requests.filter((c) => {
      if (filterCategory && c.category !== filterCategory) return false;
      if (filterStatus && c.status !== filterStatus) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return b.upvotes - a.upvotes;
    });
  }, [requests, filterCategory, filterStatus, sortBy]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem("fixmyblock-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      const data = await fetchRequests();
      setRequests(data);
    } catch {
      console.warn("API not connected. Running in demo mode.");
    } finally {
      setLoading(false);
    }
  }

  const handleMapClick = useCallback(
    (lng: number, lat: number) => {
      if (showForm) {
        setSelectedLocation({ lng, lat });
      }
    },
    [showForm]
  );

  const handleSelectRequest = useCallback((c: Request | null) => {
    setSelectedRequest(c);
    if (c) {
      setSidebarView("list");
      setShowForm(false);
    }
  }, []);

  const handleUpvote = useCallback(async (id: string) => {
    try {
      const updated = await upvoteRequest(id);
      setRequests((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      setSelectedRequest((prev) =>
        prev?.id === updated.id ? updated : prev
      );
    } catch {
      console.error("Failed to upvote");
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteRequest(id);
      setRequests((prev) => prev.filter((c) => c.id !== id));
      setSelectedRequest((prev) => (prev?.id === id ? null : prev));
    } catch {
      console.error("Failed to delete");
    }
  }, []);

  const handleSubmit = async (data: NewRequest) => {
    const created = await createRequest(data);
    setRequests((prev) => [created, ...prev]);
    setShowForm(false);
    setSidebarView("list");
    setSelectedLocation(null);
    setSelectedRequest(created);
  };

  const handleStartRequest = () => {
    setShowForm(true);
    setSidebarView("form");
    setSelectedRequest(null);
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
        onToggleTheme={() => setDarkMode((d) => !d)}
      />
      <div className="flex flex-col-reverse md:flex-row flex-1 overflow-hidden">
        <aside className="sidebar w-full flex-1 border-t border-slate-200 dark:border-[#2a2a2a] md:w-[380px] md:min-w-[380px] md:flex-none md:border-r md:border-t-0 bg-slate-50 dark:bg-[#1e1e1e] overflow-y-auto z-10">
          {sidebarView === "form" ? (
            <RequestForm
              selectedLocation={selectedLocation}
              onSubmit={handleSubmit}
              onCancel={handleCancelRequest}
            />
          ) : (
            <>
              <RequestToolbar
                onNewRequest={handleStartRequest}
                showingForm={showForm}
                totalCount={requests.length}
                filteredCount={filteredSorted.length}
                filterCategory={filterCategory}
                filterStatus={filterStatus}
                sortBy={sortBy}
                onFilterCategory={setFilterCategory}
                onFilterStatus={setFilterStatus}
                onSortBy={setSortBy}
              />
              <RequestList
                requests={filteredSorted}
                onSelect={handleSelectRequest}
                onDelete={handleDelete}
                selectedId={selectedRequest?.id ?? null}
              />
            </>
          )}
        </aside>
        <main className="flex-none h-[25vh] min-h-[25vh] md:flex-1 md:h-auto md:min-h-0 relative">
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
            onUpvote={handleUpvote}
            reportMode={showForm}
            dropPinLocation={selectedLocation}
          />
        </main>
      </div>
    </div>
  );
}
