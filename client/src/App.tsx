import { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import MapView from "./components/MapView";
import ReportForm from "./components/ReportForm";
import ComplaintList from "./components/ComplaintList";
import type { Complaint, NewComplaint } from "./types/complaint";
import { fetchComplaints, createComplaint, upvoteComplaint, deleteComplaint } from "./services/api";
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

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
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
    <div className="app">
      <Header
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode((d) => !d)}
      />
      <div className="app-body">
        <aside className="sidebar">
          {sidebarView === "form" ? (
            <ReportForm
              selectedLocation={selectedLocation}
              onSubmit={handleSubmit}
              onCancel={handleCancelReport}
            />
          ) : (
            <ComplaintList
              complaints={complaints}
              onSelect={handleSelectComplaint}
              onDelete={handleDelete}
              onNewRequest={handleStartReport}
              selectedId={selectedComplaint?.id ?? null}
              showingForm={showForm}
            />
          )}
        </aside>
        <main className="map-container">
          {showForm && (
            <div className="map-overlay-hint">
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
