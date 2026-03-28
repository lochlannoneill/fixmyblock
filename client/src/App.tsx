import { useState, useCallback, useRef } from "react";
import Header from "./components/Header";
import MapView from "./components/MapView";
import RequestForm from "./components/RequestForm";
import RequestToolbar from "./components/RequestToolbar";
import RequestDetail from "./components/RequestDetail";
import AuthModal from "./components/AuthModal";
import ProfilePage from "./components/ProfilePage";
import { SettingsPage } from "./components/SettingsPage";
import { FeedbackPage } from "./components/FeedbackPage";
import { useTheme } from "./hooks/useTheme";
import { useRequests } from "./hooks/useRequests";
import { useAuth } from "./hooks/useAuth";
import type { Request, NewRequest } from "./types/request";
import "./App.css";

export default function App() {
  const { darkMode, toggleTheme } = useTheme();
  const { requests, loading, selectedRequest, selectRequest, like, remove, create, addComment, likeComment, save } = useRequests();
  const { user, login, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lng: number;
    lat: number;
  } | null>(null);
  const [geolocating, setGeolocating] = useState(false);
  const [usedGeolocation, setUsedGeolocation] = useState(false);
  const [selectingOnMap, setSelectingOnMap] = useState(false);
  const [highAccuracy, setHighAccuracy] = useState(() => localStorage.getItem("highAccuracy") !== "false");
  const [sidebarView, setSidebarView] = useState<"list" | "form" | "profile" | "detail" | "settings" | "feedback">("list");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth < 768);
  const geoAbortRef = useRef(false);
  const userLocationRef = useRef<{ lng: number; lat: number } | null>(null);

  const handleUserLocation = useCallback((lng: number, lat: number) => {
    userLocationRef.current = { lng, lat };
  }, []);

  const handleMapClick = useCallback(
    (lng: number, lat: number) => {
      if (showForm) {
        setSelectedLocation({ lng, lat });
        setSelectingOnMap(false);
        setUsedGeolocation(false);
        setSidebarCollapsed(false);
      }
    },
    [showForm]
  );

  const handleSelectRequest = useCallback((c: Request | null) => {
    selectRequest(c);
    if (c) {
      setSidebarView("detail");
      setShowForm(false);
      if (window.innerWidth >= 768) setSidebarCollapsed(false);
    } else {
      setSidebarView("list");
    }
  }, [selectRequest]);

  const handleSubmit = async (data: NewRequest) => {
    await create(data);
    setShowForm(false);
    setSidebarView("list");
    setSelectedLocation(null);
  };

  const handleStartRequest = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setShowForm(true);
    setSidebarView("form");
    setSidebarCollapsed(false);
    selectRequest(null);
    setSelectedLocation(null);
    setSelectingOnMap(false);
  };

  const handleCancelRequest = () => {
    setShowForm(false);
    setSidebarView("list");
    setSelectedLocation(null);
  };

  const handleUseCurrentLocation = () => {
    setSelectingOnMap(false);
    setSelectedLocation(null);
    if (userLocationRef.current) {
      setSelectedLocation(userLocationRef.current);
      setUsedGeolocation(true);
      return;
    }
    setGeolocating(true);
    geoAbortRef.current = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (geoAbortRef.current) return;
        setSelectedLocation({ lng: pos.coords.longitude, lat: pos.coords.latitude });
        setGeolocating(false);
        setUsedGeolocation(true);
      },
      () => {
        if (geoAbortRef.current) return;
        setGeolocating(false);
        alert("Unable to get your location. Please allow location access or select on the map.");
      },
      { enableHighAccuracy: highAccuracy }
    );
  };

  const handleSelectOnMap = () => {
    geoAbortRef.current = true;
    setGeolocating(false);
    setUsedGeolocation(false);
    setSelectingOnMap(true);
    setSelectedLocation(null);
    if (window.innerWidth < 768) {
      setSidebarCollapsed(true);
    }
  };

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-white dark:bg-[#121212] text-slate-800 dark:text-zinc-200">
      <Header
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
        user={user}
        onLoginClick={() => setShowAuthModal(true)}
        onLogout={logout}
        onProfileClick={() => {
          setShowForm(false);
          setSidebarView("profile");
          setSidebarCollapsed(false);
          selectRequest(null);
        }}
        onSettingsClick={() => {
          setShowForm(false);
          setSidebarView("settings");
          setSidebarCollapsed(false);
          selectRequest(null);
        }}
        onFeedbackClick={() => {
          setShowForm(false);
          setSidebarView("feedback");
          setSidebarCollapsed(false);
          selectRequest(null);
        }}
      />
      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={(provider) => { login(provider); setShowAuthModal(false); }}
      />
      <div className="flex flex-col-reverse md:flex-row flex-1 overflow-hidden">
        <aside className={`sidebar border-t border-slate-200 dark:border-[#2a2a2a] md:border-r md:border-t-0 bg-slate-50 dark:bg-[#1e1e1e] overflow-y-auto z-10 transition-all duration-300 ${
          sidebarCollapsed
            ? "hidden md:block md:w-0 md:min-w-0 md:overflow-hidden"
            : "w-full flex-1 md:w-96 md:min-w-96 md:flex-none"
        }`}>
          {sidebarView === "form" ? (
            <RequestForm
              selectedLocation={selectedLocation}
              geolocating={geolocating}
              usedGeolocation={usedGeolocation}
              selectingOnMap={selectingOnMap}
              onSubmit={handleSubmit}
              onCancel={handleCancelRequest}
              onUseCurrentLocation={handleUseCurrentLocation}
              onSelectOnMap={handleSelectOnMap}
            />
          ) : sidebarView === "profile" && user ? (
            <ProfilePage
              user={user}
              requests={requests}
              onClose={() => setSidebarView("list")}
              onSelectRequest={(r) => {
                setSidebarView("list");
                handleSelectRequest(r);
              }}
            />
          ) : sidebarView === "settings" ? (
            <SettingsPage
              darkMode={darkMode}
              onToggleTheme={toggleTheme}
              highAccuracy={highAccuracy}
              onToggleHighAccuracy={() => { const next = !highAccuracy; setHighAccuracy(next); localStorage.setItem("highAccuracy", String(next)); }}
              onClose={() => setSidebarView("list")}
            />
          ) : sidebarView === "feedback" ? (
            <FeedbackPage
              onClose={() => setSidebarView("list")}
            />
          ) : sidebarView === "detail" && selectedRequest ? (
            <RequestDetail
              request={selectedRequest}
              onBack={() => { if (window.innerWidth < 768) { setSidebarCollapsed(true); } else { selectRequest(null); setSidebarView("list"); } }}
              onLike={(id: string) => { if (!user) { setShowAuthModal(true); return; } like(id); }}
              onAddComment={(id: string, text: string, parentId?: string) => { if (!user) { setShowAuthModal(true); return; } addComment(id, text, parentId); }}
              onLikeComment={(requestId: string, commentId: string) => { if (!user) { setShowAuthModal(true); return; } likeComment(requestId, commentId); }}
              onSave={(id: string) => { if (!user) { setShowAuthModal(true); return; } save(id); }}
              onDelete={(id: string) => { remove(id); setSidebarView("list"); }}
              currentUserId={user?.userId}
            />
          ) : (
            <RequestToolbar
              requests={requests}
              loading={loading}
              onNewRequest={handleStartRequest}
              showingForm={showForm}
              onSelectRequest={handleSelectRequest}
              selectedId={selectedRequest?.id ?? null}
            />
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
            {sidebarCollapsed ? "Show Requests" : (<><span className="md:hidden">Show map</span><span className="hidden md:inline">Hide Requests List</span></>)}
          </button>
          {showForm && selectingOnMap && !selectedLocation && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-[#121212] text-white py-2.5 px-6 rounded-3xl text-sm font-medium z-50 shadow-lg animate-pulse">
              Click anywhere on the map to place your pin
            </div>
          )}
          {!showForm && (
            <button
              onClick={handleStartRequest}
              className="absolute bottom-6 right-4 z-50 w-16 h-16 md:w-auto md:h-auto md:px-6 md:py-4 flex items-center justify-center md:gap-2 rounded-full border-2 border-dashed border-slate-400 dark:border-zinc-500 bg-white/60 dark:bg-[#2a2a2a]/60 backdrop-blur-sm text-slate-600 dark:text-zinc-300 hover:border-blue-500 hover:text-blue-500 shadow-lg cursor-pointer transition-colors"
              title="New Request"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span className="hidden md:inline text-base font-semibold">New Request</span>
            </button>
          )}
          <MapView
            requests={requests}
            onMapClick={handleMapClick}
            selectedRequest={selectedRequest}
            onSelectRequest={handleSelectRequest}
            onLike={(id: string) => { if (!user) { setShowAuthModal(true); return; } like(id); }}
            reportMode={showForm}
            dropPinLocation={selectedLocation}
            darkMode={darkMode}
            onUserLocation={handleUserLocation}
            currentUserId={user?.userId}
            usedGeolocation={usedGeolocation}
            highAccuracy={highAccuracy}
            onExpandRequest={() => setSidebarCollapsed(false)}
          />
        </main>
      </div>
    </div>
  );
}
