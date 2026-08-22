"use client";

export function CheckLinkField({ url }: { url: string }) {
  return (
    <input
      className="cms-input"
      onFocus={(e) => e.currentTarget.select()}
      readOnly
      style={{ fontSize: 13 }}
      value={url}
    />
  );
}
