-- 광고 유입 정보(UTM·gclid)와 랜딩 경로를 문의에 함께 저장 (2026-10-17, 광고·리드 개선 보고서 반영)
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS utm_source varchar(150);
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS utm_medium varchar(150);
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS utm_campaign varchar(150);
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS utm_term varchar(150);
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS utm_content varchar(150);
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS gclid varchar(255);
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS landing_page varchar(500);
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS referrer varchar(500);
