import { useState, useRef } from "react";
import type { ComplaintCategory, NewComplaint } from "../types/complaint";
import { CATEGORY_LABELS } from "../types/complaint";

interface ReportFormProps {
  selectedLocation: { lng: number; lat: number } | null;
  onSubmit: (data: NewComplaint) => Promise<void>;
  onCancel: () => void;
}

export default function ReportForm({
  selectedLocation,
  onSubmit,
  onCancel,
}: ReportFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ComplaintCategory>("pothole");
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
      setError("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClasses =
    "block w-full mt-1 px-3 py-2.5 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm font-[inherit] bg-white dark:bg-[#2a2a2a] text-slate-800 dark:text-zinc-200 transition-colors focus:outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10";

  return (
    <form className="p-6" onSubmit={handleSubmit}>
      <h2 className="m-0 mb-4 text-lg text-slate-800 dark:text-zinc-200">Report an Issue</h2>

      <div className="bg-blue-50 dark:bg-[#1a2a1a] border border-blue-200 dark:border-blue-800 rounded-lg px-3.5 py-2.5 text-[13px] text-blue-800 dark:text-blue-300 mb-4">
        {selectedLocation
          ? `Location: ${selectedLocation.lat.toFixed(5)}, ${selectedLocation.lng.toFixed(5)}`
          : "Click on the map to drop a pin"}
      </div>

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
          onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
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

      <label className="block text-[13px] font-semibold text-slate-600 dark:text-[#b4b4bb] mb-3.5">
        Photos (up to 5)
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          style={{ display: "none" }}
        />
        <button
          type="button"
          className="inline-block mt-1.5 px-4 py-2 bg-slate-100 dark:bg-[#2a2a2a] border border-dashed border-slate-400 dark:border-zinc-600 rounded-lg cursor-pointer text-[13px] text-slate-600 dark:text-[#b4b4bb] transition-colors hover:bg-slate-200 dark:hover:bg-[#353535]"
          onClick={() => fileInputRef.current?.click()}
        >
          Add Photos
        </button>
      </label>

      {previews.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {previews.map((src, i) => (
            <div key={i} className="relative w-[72px] h-[72px] rounded-lg overflow-hidden">
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
        </div>
      )}

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
          {submitting ? "Submitting..." : "Submit Report"}
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
