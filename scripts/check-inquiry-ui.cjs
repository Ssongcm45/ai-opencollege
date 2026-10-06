const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const file = path.join(__dirname, "../components/admin/InquiryAnalysisPanel.tsx");
const source = fs.readFileSync(file, "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const loaded = new Module(file, module);
loaded.filename = file;
loaded.paths = module.paths;
loaded._compile(compiled, file);

const analysis = {
  summary: "목표 분석 <script>alert(1)</script>",
  educationGoal: { stated: "반복 업무 축소", interpretation: "실습을 통한 자동화" },
  confirmedFacts: [{ label: "대상", value: "실무자", evidence: "문의 원문: 실무자 교육" }],
  recommendedCourses: [{ courseId: "practical", reason: "직접 적용 필요" }],
  deliveryRecommendation: "실습 중심",
  missingInformation: ["참여 인원"],
  nextActions: ["일정 확인"],
  replyDraft: "안녕하세요. 제안드립니다."
};
const catalog = {
  genai_intro: { name: "입문", duration: "2시간", description: "" },
  ai_basics: { name: "기초", duration: "3시간", description: "" },
  practical: { name: "실습", duration: "4시간", description: "" }
};
const html = renderToStaticMarkup(React.createElement(loaded.exports.InquiryAnalysisPanel, { analysis, catalog, email: "test@example.com", name: "테스트" }));
for (const text of ["반복 업무 축소", "목표 해석 · 제안", "근거: 문의 원문", "실습 · 4시간", "참여 인원", "안녕하세요. 제안드립니다.", "메일 앱에서 열기"]) assert.ok(html.includes(text), text);
assert.ok(html.includes("&lt;script&gt;"));
assert.ok(!html.includes("<script>"));
console.log("Inquiry analysis panel render: OK");
