"use client";

import { useRef, useState } from "react";

interface Props {
  name?: string;
  defaultValue?: string | null;
}

export function ThumbnailUpload({ name = "thumbnailUrl", defaultValue }: Props) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "이미지 업로드에 실패했습니다.");
        return;
      }
      setUrl(data.url);
    } catch {
      setError("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function clearImage() {
    setUrl("");
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div>
      <input type="hidden" name={name} value={url} readOnly />
      {url ? (
        <div style={{ marginBottom: 8 }}>
          <img
            src={url}
            alt="썸네일 미리보기"
            style={{ borderRadius: 8, display: "block", marginBottom: 8, maxWidth: 280 }}
          />
          <button type="button" className="cms-btn cms-btn-cancel" onClick={clearImage}>
            이미지 제거
          </button>
        </div>
      ) : null}
      <input
        ref={fileRef}
        className="cms-input"
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={uploading}
      />
      {uploading ? (
        <p style={{ color: "#6b7280", fontSize: 13, marginTop: 6 }}>변환·업로드 중...</p>
      ) : null}
      {error ? (
        <p style={{ color: "#dc2626", fontSize: 13, marginTop: 6 }}>{error}</p>
      ) : null}
      <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 6 }}>
        JPG/PNG 등 어떤 형식이든 WebP로 자동 변환됩니다. 권장 비율 16:9, 최대 4MB.
      </p>
    </div>
  );
}
