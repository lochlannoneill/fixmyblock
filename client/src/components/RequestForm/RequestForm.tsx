import { useState, useRef } from "react";
import type { RequestCategory, NewRequest } from "../../types/request";
import { CATEGORY_LABELS } from "../../types/request";

interface RequestFormProps {
  selectedLocation: { lng: number; lat: number } | null;
  geolocating: boolean;
  usedGeolocation: boolean;
  selectingOnMap: boolean;
  onSubmit: (data: NewRequest) => Promise<void>;
  onCancel: () => void;
  onUseCurrentLocation: () => void;
  onSelectOnMap: () => void;
}

export default function RequestForm({
  selectedLocation,
  geolocating,
  usedGeolocation,
  selectingOnMap,
  onSubmit,
  onCancel,
  onUseCurrentLocation,
  onSelectOnMap,
}: RequestFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<RequestCategory>("pothole");
  const [reporterName, setReporterName] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      setError("Maximum 5 images allowed");
      return;
    }
    const valid = files.filter((f) => {
      if (!f.type.startsWith("image/")) return false;
      if (f.size > 10 * 1024 * 1024) return false;
      return true;
    });
    setImages((prev) => [...prev, ...valid]);
    valid.forEach((f) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        setPreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
    setError("");
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) {
      setError("Click on the map to select a location first");
      return;
    }
    if (!title.trim() || !description.trim() || !reporterName.trim()) {
      setError("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        images,
        reporterName: reporterName.trim(),
      });
      setTitle("");
      setDescription("");
      setCategory("pothole");
      setReporterName("");
      setImages([]);
      setPreviews([]);
    } catch {
      setError("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClasses =
    "block w-full mt-1 px-3 py-2.5 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm font-[inherit] bg-white dark:bg-[#2a2a2a] text-slate-800 dark:text-zinc-200 transition-colors focus:outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10";

  return (
    <form className="p-6" onSubmit={handleSubmit}>
      <h2 className="m-0 mb-4 text-lg text-slate-800 dark:text-zinc-200">New Request</h2>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={onUseCurrentLocation}
          className={`flex-1 flex items-center justify-center py-2.5 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
            geolocating || usedGeolocation
              ? "border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/40"
              : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#2a2a2a] text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#333]"
          }`}
        >
          <span className="inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline shrink-0 mr-1.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4m0 12v4m10-10h-4M6 12H2" />
            </svg>
            {geolocating ? "Getting location..." : "Use Current Location"}
          </span>
        </button>
        <button
          type="button"
          onClick={onSelectOnMap}
          className={`flex-1 flex items-center justify-center py-2.5 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
            selectedLocation && !usedGeolocation
              ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40"
              : selectingOnMap
                ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40"
                : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#2a2a2a] text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#333]"
          }`}
        >
          <span className="inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline shrink-0 mr-1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Select on Map
          </span>
        </button>
      </div>

      {selectedLocation && !selectingOnMap && !geolocating && !usedGeolocation && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Location: {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
        </div>
      )}

      <label className="block text-[13px] font-semibold text-slate-600 dark:text-[#b4b4bb] mb-3.5">
        Your Name *
        <input
          type="text"
          className={inputClasses}
          value={reporterName}
          onChange={(e) => setReporterName(e.target.value)}
          placeholder="Jane Doe"
          maxLength={100}
          required
        />
      </label>

      <label className="block text-[13px] font-semibold text-slate-600 dark:text-[#b4b4bb] mb-3.5">
        Title *
        <input
          type="text"
          className={inputClasses}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Large pothole on Main Street"
          maxLength={200}
          required
        />
      </label>

      <label className="block text-[13px] font-semibold text-slate-600 dark:text-[#b4b4bb] mb-3.5">
        Category
        <select
          className={inputClasses}
          value={category}
          onChange={(e) => setCategory(e.target.value as RequestCategory)}
        >
          {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </label>

      <label className="block text-[13px] font-semibold text-slate-600 dark:text-[#b4b4bb] mb-3.5">
        Description *
        <textarea
          className={inputClasses}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the issue in detail..."
          rows={4}
          maxLength={2000}
          required
        />
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageChange}
        style={{ display: "none" }}
      />

      <span className="block text-[13px] font-semibold text-slate-600 dark:text-[#b4b4bb] mb-1.5">Images <span className="font-normal text-slate-400 dark:text-zinc-500">(max 1)</span></span>
      <div className="flex gap-2 flex-wrap mb-4">
        {previews.map((src, i) => (
          <div key={i} className="relative w-18 h-18 rounded-lg overflow-hidden">
            <img className="w-full h-full object-cover" src={src} alt={`preview ${i + 1}`} />
            <button
              type="button"
              className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white border-none cursor-pointer text-[11px] flex items-center justify-center"
              onClick={() => removeImage(i)}
            >
              X
            </button>
          </div>
        ))}
        {images.length < 5 && (
          <button
            type="button"
            className="group/add relative w-18 h-18 rounded-lg border-2 border-dashed border-slate-300 dark:border-zinc-600 bg-slate-100 dark:bg-[#2a2a2a] cursor-pointer flex items-center justify-center transition-colors hover:border-blue-500 hover:bg-blue-500/5 overflow-hidden"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg className="absolute inset-3.5 w-[calc(100%-28px)] h-[calc(100%-28px)] text-slate-300 dark:text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" preserveAspectRatio="none">
              <rect x="0" y="0" width="24" height="24" />
              <circle cx="6" cy="6" r="2" />
              <path d="M24 16l-7-7L0 24" />
            </svg>
            <svg className="relative w-8 h-8 text-blue-500 opacity-0 group-hover/add:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 8v8M8 12h8" />
            </svg>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-[#3d1111] border border-red-200 dark:border-[#5c1a1a] text-red-800 dark:text-red-300 px-3 py-2 rounded-lg text-[13px] mb-3">
          {error}
        </div>
      )}

      <div className="flex gap-2 mt-2">
        <button
          type="submit"
          className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-900 text-white border-none rounded-lg font-semibold text-sm cursor-pointer disabled:cursor-not-allowed transition-colors"
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Request"}
        </button>
        <button
          type="button"
          className="px-5 py-2.5 bg-white dark:bg-[#272727] hover:bg-slate-50 dark:hover:bg-[#1e1e1e] text-slate-600 dark:text-[#b4b4bb] border border-gray-300 dark:border-zinc-700 rounded-lg cursor-pointer text-sm transition-colors"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
