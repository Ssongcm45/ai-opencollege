"use client";

import { useEffect, useState } from "react";
import { ATTRIBUTION_FIELDS, getAttribution, type Attribution } from "@/lib/attribution";

// 문의 폼 안에 넣는 숨은 칸. 저장된 UTM·gclid·랜딩 경로를 함께 제출한다.
export function AttributionFields() {
  const [values, setValues] = useState<Attribution>({});

  useEffect(() => {
    setValues(getAttribution());
  }, []);

  return (
    <>
      {ATTRIBUTION_FIELDS.map((key) => (
        <input type="hidden" name={key} value={values[key] ?? ""} key={key} />
      ))}
    </>
  );
}
