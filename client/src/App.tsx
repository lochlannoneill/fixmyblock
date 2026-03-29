import { useState, useCallback, useRef, type TouchEvent as ReactTouchEvent } from "react";
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
  // Mobile slide positions: "bottom" = full map, "middle" = 40vh map, "top" = 15vh map
  const [mobileSlide, setMobileSlide] = useState<"top" | "middle" | "bottom">(() => window.innerWidth < 768 ? "bottom" : "middle");
  const geoAbortRef = useRef(false);
  const userLocationRef = useRef<{ lng: number; lat: number } | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isDragging = useRef(false);
  const [dragMapHeight, setDragMapHeight] = useState<number | null>(null);
  const [isSnapping, setIsSnapping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSlideBarTouchStart = (e: ReactTouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  };

  const handleSlideBarTouchMove = (e: ReactTouchEvent) => {
    if (touchStartY.current === null || !containerRef.current) return;
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (deltaY > 10) isDragging.current = true;
    if (!isDragging.current) return;
    e.preventDefault();
    const containerRect = containerRef.current.getBoundingClientRect();
    const fingerY = e.touches[0].clientY;
    const mapH = Math.max(80, Math.min(fingerY - containerRect.top, containerRect.height - 80));
    setDragMapHeight(mapH);
  };

  const handleSlideBarTouchEnd = (e: ReactTouchEvent) => {
    if (touchStartY.current === null) return;
    const wasDragging = isDragging.current;
    touchStartY.current = null;
    isDragging.current = false;
    if (wasDragging && dragMapHeight !== null && containerRef.current) {
      const containerH = containerRef.current.getBoundingClientRect().height;
      const ratio = dragMapHeight / containerH;
      // Determine snap target
      let target: "top" | "middle" | "bottom";
      if (ratio > 0.7) {
        target = "bottom";
      } else if (ratio > 0.35) {
        target = "middle";
      } else {
        target = "top";
      }
      // Animate to snap point: compute target height in px
      const targetH = target === "bottom" ? containerH : target === "top" ? containerH * 0.15 : containerH * 0.4;
      setIsSnapping(true);
      setDragMapHeight(targetH);
      setMobileSlide(target);
      // After transition ends, clear inline height
      setTimeout(() => {
        setDragMapHeight(null);
        setIsSnapping(false);
      }, 300);
    } else if (!wasDragging) {
      // Simple tap — let onClick handle it
    }
  };

  const handleUserLocation = useCallback((lng: number, lat: number) => {
    userLocationRef.current = { lng, lat };
  }, []);

  const handleMapClick = useCallback(
    (lng: number, lat: number) => {
      if (showForm) {
        setSelectedLocation({ lng, lat });
        setSelectingOnMap(false);
        setUsedGeolocation(false);
        setMobileSlide("middle");
      }
    },
    [showForm]
  );

  const handleSelectRequest = useCallback((c: Request | null) => {
    selectRequest(c);
    if (c) {
      setSidebarView("detail");
      setShowForm(false);
      if (window.innerWidth >= 768) setMobileSlide("middle");
      else setMobileSlide("bottom");
    } else {
      setSidebarView("list");
      if (window.innerWidth < 768) setMobileSlide("bottom");
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
    setMobileSlide("middle");
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
      setMobileSlide("bottom");
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
          setMobileSlide("middle");
          selectRequest(null);
        }}
        onSettingsClick={() => {
          setShowForm(false);
          setSidebarView("settings");
          setMobileSlide("middle");
          selectRequest(null);
        }}
        onFeedbackClick={() => {
          setShowForm(false);
          setSidebarView("feedback");
          setMobileSlide("middle");
          selectRequest(null);
        }}
      />
      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={(provider) => { login(provider); setShowAuthModal(false); }}
      />
      <div ref={containerRef} className="flex flex-col-reverse md:flex-row flex-1 overflow-hidden">
        <aside className={`sidebar border-t border-slate-200 dark:border-[#2a2a2a] md:border-r md:border-t-0 bg-slate-50 dark:bg-[#1e1e1e] overflow-y-auto z-10 ${
          dragMapHeight !== null && !isSnapping ? "" : "transition-all duration-300"
        } ${
          dragMapHeight !== null
            ? "w-full flex-1"
            : mobileSlide === "bottom"
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
              onBack={() => { if (window.innerWidth < 768) { setMobileSlide("bottom"); } else { selectRequest(null); setSidebarView("list"); } }}
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
        <main
          className={`md:flex-1 md:h-auto md:min-h-0 relative ${
            dragMapHeight !== null && !isSnapping ? "" : "transition-all duration-300"
          } ${
            mobileSlide === "bottom" ? "flex-1" : "flex-none"
          }`}
          style={
            dragMapHeight !== null
              ? { height: dragMapHeight, minHeight: dragMapHeight, flexGrow: 0 }
              : mobileSlide === "bottom"
                ? undefined
                : { height: mobileSlide === "top" ? "15vh" : "40vh", minHeight: mobileSlide === "top" ? "15vh" : "40vh" }
          }
        >
          {/* Desktop: floating pill toggle */}
          <button
            onClick={() => setMobileSlide(mobileSlide === "bottom" ? "middle" : "bottom")}
            className="hidden md:flex absolute z-50 transition-colors items-center gap-1.5 px-3 py-2 rounded-full bg-white dark:bg-[#2a2a2a] border border-slate-200 dark:border-[#3a3a3a] shadow-lg text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#333] cursor-pointer left-4 top-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform duration-300 ${mobileSlide === "bottom" ? "rotate-0" : "rotate-180"}`}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            {mobileSlide === "bottom" ? "Show Requests" : "Hide Requests List"}
          </button>
          {/* Mobile: full-width slide bar */}
          <div
            onClick={() => { if (!isDragging.current) setMobileSlide(mobileSlide === "bottom" ? "top" : "bottom"); }}
            onTouchStart={handleSlideBarTouchStart}
            onTouchMove={handleSlideBarTouchMove}
            onTouchEnd={handleSlideBarTouchEnd}
            className="md:hidden absolute bottom-0 left-0 right-0 z-50 flex items-center justify-center py-2.5 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-sm border-t border-slate-200 dark:border-[#2a2a2a] text-xs font-medium text-slate-400 dark:text-zinc-500 cursor-pointer select-none touch-none"
          >
            <span className="inline-flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className={`transition-transform duration-300 ${mobileSlide === "bottom" ? "rotate-0" : "rotate-180"}`}
              >
                <polyline points="18 18 12 12 6 18" />
                <polyline points="18 14 12 8 6 14" />
                <polyline points="18 10 12 4 6 10" />
              </svg>
              {mobileSlide === "bottom" ? "Slide for requests" : "Slide for map"}
            </span>
          </div>
          {showForm && selectingOnMap && !selectedLocation && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-[#121212] text-white py-2.5 px-6 rounded-3xl text-sm font-medium z-50 shadow-lg animate-pulse">
              Click anywhere on the map to place your pin
            </div>
          )}
          {!showForm && (
            <button
              onClick={handleStartRequest}
              className="absolute bottom-14 md:bottom-6 right-4 z-50 w-16 h-16 md:w-auto md:h-auto md:px-6 md:py-4 flex items-center justify-center md:gap-2 rounded-full border-2 border-dashed border-slate-400 dark:border-zinc-500 bg-white/60 dark:bg-[#2a2a2a]/60 backdrop-blur-sm text-slate-600 dark:text-zinc-300 hover:border-blue-500 hover:text-blue-500 shadow-lg cursor-pointer transition-colors"
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
            onExpandRequest={() => setMobileSlide("top")}
          />
        </main>
      </div>
    </div>
  );
}
