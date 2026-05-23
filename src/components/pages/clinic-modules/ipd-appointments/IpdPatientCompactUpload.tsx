"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

interface IIpdPatientCompactUploadProps {
  label: string;
  placeholder: string;
  hint: string;
  accept: string;
  file: File | null;
  previewUrl?: string;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}

const IpdPatientCompactUpload = ({
  label,
  placeholder,
  hint,
  accept,
  file,
  previewUrl,
  onFileChange,
  disabled = false,
}: IIpdPatientCompactUploadProps) => {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file?.type.startsWith("image/")) {
      setFilePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setFilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const imagePreviewSrc = filePreviewUrl ?? (previewUrl && !file ? previewUrl : null);

  const applyFile = useCallback(
    (next: File | null) => {
      if (disabled) return;
      onFileChange(next);
    },
    [disabled, onFileChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    applyFile(e.target.files?.[0] ?? null);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) applyFile(dropped);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    applyFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="d-flex flex-column" style={{ width: "7.5rem", maxWidth: "100%" }}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        className={`border border-2 rounded-3 d-flex flex-column align-items-center justify-content-center text-center px-2 py-3 ${
          disabled ? "bg-light opacity-75" : "bg-white"
        } ${isDragging ? "border-primary bg-light" : "border-secondary border-opacity-25"}`}
        style={{
          minHeight: "7.5rem",
          cursor: disabled ? "not-allowed" : "pointer",
          borderStyle: "dashed",
        }}
        onClick={() => {
          if (!disabled) inputRef.current?.click();
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="d-none"
          accept={accept}
          disabled={disabled}
          onChange={handleInputChange}
        />
        {file || imagePreviewSrc ? (
          <>
            {imagePreviewSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagePreviewSrc}
                alt=""
                className="rounded mb-2 object-fit-cover"
                style={{ width: "4rem", height: "4rem" }}
              />
            ) : (
              <i className="ti ti-file-text fs-28 text-muted mb-2" aria-hidden />
            )}
            <span className="fs-12 text-dark text-truncate w-100 px-1">
              {file?.name ?? "Uploaded"}
            </span>
            {!disabled ? (
              <button
                type="button"
                className="btn btn-link btn-sm text-danger p-0 mt-1"
                onClick={handleRemove}
              >
                Remove
              </button>
            ) : null}
          </>
        ) : (
          <>
            <i className="ti ti-camera fs-28 text-muted mb-2" aria-hidden />
            <span className="fs-13 text-muted lh-sm px-1">{placeholder}</span>
          </>
        )}
      </div>
      <span className="fw-semibold text-dark fs-14 mt-1 mb-0">{label}</span>
      <span className="text-muted fs-12 mb-0">{hint}</span>
    </div>
  );
};

export default IpdPatientCompactUpload;
