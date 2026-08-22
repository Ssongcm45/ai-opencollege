"use client";

export function PrintButton() {
  return <button className="report-print no-print" onClick={() => window.print()} type="button">PDF로 저장 / 인쇄</button>;
}
