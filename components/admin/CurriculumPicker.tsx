"use client";

import { useState } from "react";
import { MATURITY_LEVELS } from "@/lib/diagnostic";
import {
  LECTURE_STYLES,
  composeCurriculum,
  type LectureStyleId
} from "@/lib/curriculum";

const LEVELS = [1, 2, 3, 4, 5] as const;

// 관리자 통계 페이지 — 레벨 × 강의 스타일을 골라 추천 커리큘럼 형태를 미리 본다.
export function CurriculumPicker({ dominantLevel }: { dominantLevel: 1 | 2 | 3 | 4 | 5 }) {
  const [level, setLevel] = useState<1 | 2 | 3 | 4 | 5>(dominantLevel);
  const [styleId, setStyleId] = useState<LectureStyleId>("balanced");
  const c = composeCurriculum(level, styleId);

  return (
    <div className="curri-picker">
      <div className="curri-controls">
        <label className="curri-control">
          <span>레벨</span>
          <select
            className="cms-input"
            value={level}
            onChange={(e) => setLevel(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                Level {l} · {MATURITY_LEVELS[l].name}
                {l === dominantLevel ? " (조직 우세)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="curri-control">
          <span>강의 스타일</span>
          <select
            className="cms-input"
            value={styleId}
            onChange={(e) => setStyleId(e.target.value as LectureStyleId)}
          >
            {LECTURE_STYLES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="curri-primary">
        <div className="curri-head">
          <span className="curri-badge">Level {c.level}</span>
          <div>
            <div className="curri-title">{c.levelName}</div>
            <div className="curri-headline">{c.headline}</div>
          </div>
          <span className="curri-ratio">{c.style.ratio}</span>
        </div>
        <div className="curri-meta">권장 {c.duration} · {c.format}</div>
        <p className="curri-blurb">진행 방식 — {c.style.blurb}</p>
        <ol className="curri-modules">
          {c.modules.map((m, i) => (
            <li key={i}><b>{m.title}</b> — {m.detail}</li>
          ))}
        </ol>
        <div className="curri-outcome">완료 후 — {c.outcome}</div>
      </div>
    </div>
  );
}
