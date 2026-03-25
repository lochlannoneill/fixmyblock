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
      if (f.size > 10 * 1024 * 1024) return false; // 10MB max
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
      // Reset form
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

  return (
    <form className="report-form" onSubmit={handleSubmit}>
      <h2>Report an Issue</h2>

      <div className="form-hint">
        {selectedLocation
          ? `📍 Location: ${selectedLocation.lat.toFixed(5)}, ${selectedLocation.lng.toFixed(5)}`
          : "👆 Click on the map to drop a pin"}
      </div>

      <label>
        Your Name *
        <input
          type="text"
          value={reporterName}
          onChange={(e) => setReporterName(e.target.value)}
          placeholder="Jane Doe"
          maxLength={100}
          required
        />
      </label>

      <label>
        Title *
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Large pothole on Main Street"
          maxLength={200}
          required
        />
      </label>

      <label>
        Category
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
        >
          {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Description *
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the issue in detail..."
          rows={4}
          maxLength={2000}
          required
        />
      </label>

      <label>
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
          className="upload-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          📷 Add Photos
        </button>
      </label>

      {previews.length > 0 && (
        <div className="image-previews">
          {previews.map((src, i) => (
            <div key={i} className="preview-thumb">
              <img src={src} alt={`preview ${i + 1}`} />
              <button
                type="button"
                className="remove-btn"
                onClick={() => removeImage(i)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <div className="form-error">{error}</div>}

      <div className="form-actions">
        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Report"}
        </button>
        <button type="button" className="cancel-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
