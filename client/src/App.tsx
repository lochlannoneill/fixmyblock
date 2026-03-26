import { useState, useEffect, useCallback, useMemo } from "react";
import Header from "./components/Header";
import MapView from "./components/MapView";
import ReportForm from "./components/ReportForm";
import ComplaintList from "./components/ComplaintList";
import SidebarToolbar from "./components/SidebarToolbar";
import type { Complaint, NewComplaint, ComplaintCategory, ComplaintStatus } from "./types/complaint";
import { fetchComplaints, createComplaint, upvoteComplaint, deleteComplaint } from "./services/api";
import type { SortBy } from "./components/SidebarToolbar";
import "./App.css";

export default function App() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
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
  const [filterCategory, setFilterCategory] = useState<ComplaintCategory | "">("");
  const [filterStatus, setFilterStatus] = useState<ComplaintStatus | "">("");
  const [sortBy, setSortBy] = useState<SortBy>("newest");

  const filteredSorted = useMemo(() => {
    const filtered = complaints.filter((c) => {
      if (filterCategory && c.category !== filterCategory) return false;
      if (filterStatus && c.status !== filterStatus) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return b.upvotes - a.upvotes;
    });
  }, [complaints, filterCategory, filterStatus, sortBy]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem("fixmyblock-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    loadComplaints();
  }, []);

  async function loadComplaints() {
    try {
      const data = await fetchComplaints();
      setComplaints(data);
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

  const handleSelectComplaint = useCallback((c: Complaint | null) => {
    setSelectedComplaint(c);
    if (c) {
      setSidebarView("list");
      setShowForm(false);
    }
  }, []);

  const handleUpvote = useCallback(async (id: string) => {
    try {
      const updated = await upvoteComplaint(id);
      setComplaints((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      setSelectedComplaint((prev) =>
        prev?.id === updated.id ? updated : prev
      );
    } catch {
      console.error("Failed to upvote");
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteComplaint(id);
      setComplaints((prev) => prev.filter((c) => c.id !== id));
      setSelectedComplaint((prev) => (prev?.id === id ? null : prev));
    } catch {
      console.error("Failed to delete");
    }
  }, []);

  const handleSubmit = async (data: NewComplaint) => {
    const created = await createComplaint(data);
    setComplaints((prev) => [created, ...prev]);
    setShowForm(false);
    setSidebarView("list");
    setSelectedLocation(null);
    setSelectedComplaint(created);
  };

  const handleStartReport = () => {
    setShowForm(true);
    setSidebarView("form");
    setSelectedComplaint(null);
    setSelectedLocation(null);
  };

  const handleCancelReport = () => {
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
            <ReportForm
              selectedLocation={selectedLocation}
              onSubmit={handleSubmit}
              onCancel={handleCancelReport}
            />
          ) : (
            <>
              <SidebarToolbar
                onNewRequest={handleStartReport}
                showingForm={showForm}
                totalCount={complaints.length}
                filteredCount={filteredSorted.length}
                filterCategory={filterCategory}
                filterStatus={filterStatus}
                sortBy={sortBy}
                onFilterCategory={setFilterCategory}
                onFilterStatus={setFilterStatus}
                onSortBy={setSortBy}
              />
              <ComplaintList
                complaints={filteredSorted}
                onSelect={handleSelectComplaint}
                onDelete={handleDelete}
                selectedId={selectedComplaint?.id ?? null}
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
            complaints={complaints}
            onMapClick={handleMapClick}
            selectedComplaint={selectedComplaint}
            onSelectComplaint={handleSelectComplaint}
            onUpvote={handleUpvote}
            reportMode={showForm}
            dropPinLocation={selectedLocation}
          />
        </main>
      </div>
    </div>
  );
}
