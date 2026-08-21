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

  // 스마트폰 원본 사진은 서버 요청 한도(4.5MB)를 넘기 쉬우므로
  // 브라우저에서 먼저 1600px 이하로 축소해 전송한다. 실패 시 원본을 그대로 보낸다.
  async function shrinkImage(file: File): Promise<Blob> {
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
      return blob && blob.size < file.size ? blob : file;
    } catch {
      return file;
    }
  }

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);
    try {
      const shrunk = await shrinkImage(file);
      const body = new FormData();
      body.append("file", shrunk, shrunk === file ? file.name : "thumbnail.jpg");
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 413) {
          setError("이미지가 너무 큽니다. 4MB 이하로 줄여서 다시 시도해 주세요.");
        } else {
          setError(data?.error ?? `이미지 업로드에 실패했습니다. (오류 ${res.status})`);
        }
        return;
      }
      setUrl(data.url);
    } catch {
      setError("이미지 업로드에 실패했습니다. 네트워크 상태를 확인해 주세요.");
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
        JPG/PNG 등 어떤 형식이든 WebP로 자동 변환됩니다. 권장 비율: 포트폴리오 4:3, 블로그·출강사례 16:9. 최대 4MB.
      </p>
    </div>
  );
}
