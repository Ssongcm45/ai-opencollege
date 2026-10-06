const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const { test, beforeEach } = require('node:test');
require('tsx/cjs/api').register();
process.env.ADMIN_EMAIL = 'admin@example.test';

const original = Module._load;
let available = true;
let rows = [];
let insertCount = 0;
let scheduled = [];
let authorized = true;
let claimedRow = null;
let changes = [];
let analysisCalls = 0;
let analysisResult = null;
const db = {
  execute: async () => ({ rows: [{ rate_key: 'ok' }] }),
  insert: () => ({ values: () => ({ onConflictDoNothing: () => ({ returning: async () => { insertCount++; return rows; } }) }) }),
  select: () => ({ from: () => ({ where: () => ({ limit: async () => rows }) }) }),
  update: () => ({ set: values => ({ where: () => ({ returning: async () => {
    changes.push(values);
    if (!claimedRow) return [];
    claimedRow = { ...claimedRow, ...values };
    return [claimedRow];
  }, then: (resolve, reject) => Promise.resolve().then(() => { changes.push(values); if (claimedRow) claimedRow = { ...claimedRow, ...values }; }).then(resolve, reject) }) }) }),
};
const dbMock = { getDb: () => db, get hasDatabase() { return available; } };
const authMock = { requireAdminSession: async () => { if (!authorized) throw Error('unauthorized'); } };
const afterMock = { after: callback => scheduled.push(callback) };
const mocks = {
  '@/lib/db': dbMock,
  '@/lib/auth': authMock,
  '@/lib/inquiry-analysis': { analyzeInquiry: async () => { analysisCalls++; if (analysisResult) return analysisResult; throw Error('mock AI failed'); }, getInquiryAiProvider: () => 'codex', InquiryAnalysisSchema: { safeParse: value => value && value.summary && value.educationGoal ? { success: true, data: value } : { success: false } }, INQUIRY_COURSES: {} },
  'next/server': afterMock,
  'next/cache': { revalidatePath: () => {} },
};
Module._load = function (id, parent, isMain) {
  const normalized = id.replaceAll('\\', '/');
  for (const [alias, mock] of Object.entries(mocks)) {
    const relative = alias.startsWith('@/') ? path.resolve(__dirname, '..', alias.slice(2)) + '.ts' : null;
    if (id === alias || (relative && normalized === relative.replaceAll('\\', '/'))) return mock;
  }
  return original.call(this, id, parent, isMain);
};
const service = require('../lib/inquiry-service.ts');
const admin = require('../lib/inquiry-admin-actions.ts');
const valid = {
  name: 'Name', organization: 'Org', email: 'person@example.test', phone: '01012345678',
  audience: 'Staff', message: 'We need training', educationGoal: 'Learn AI', source: 'contact'
};
beforeEach(() => { available = true; rows = [{ id: 'ee7957ef-1057-4848-8de6-e0fb87817927' }]; insertCount = 0; scheduled = []; authorized = true; claimedRow = null; changes = []; analysisCalls = 0; analysisResult = null; delete process.env.RESEND_API_KEY; });

test('database absence fails closed before returning a receipt', async () => {
  available = false;
  assert.equal((await service.receiveInquiry(valid)).ok, false);
  assert.equal(insertCount, 0);
});
test('both intake sources persist before scheduling processing', async () => {
  assert.equal((await service.receiveInquiry(valid)).ok, true);
  assert.equal((await service.receiveInquiry({ ...valid, source: 'learning_check' })).ok, true);
  assert.equal(insertCount, 2);
  assert.equal(scheduled.length, 2);
});
test('a duplicate insert keeps the original receipt and does not reschedule', async () => {
  rows = [];
  assert.equal((await service.receiveInquiry(valid)).ok, true);
  assert.equal(scheduled.length, 0);
});
test('admin retry rejects unauthenticated and malformed IDs', async () => {
  authorized = false;
  await assert.rejects(admin.retryInquiryProcessing('ee7957ef-1057-4848-8de6-e0fb87817927'), /unauthorized/);
  authorized = true;
  assert.equal((await admin.retryInquiryProcessing('bad')).ok, false);
});
const row = () => ({
  id: 'ee7957ef-1057-4848-8de6-e0fb87817927', name: 'Name', organization: 'Org',
  email: 'person@example.test', phone: '01012345678', audience: 'Staff',
  educationGoal: 'Learn AI', message: 'Original inquiry <tag>',
  analysis: null, analysisStatus: 'pending', notificationStatus: 'pending',
  analysisAt: null, notificationPayload: null, notificationKey: null,
  notificationAttemptedAt: null,
});
test('an active lease causes no analysis or delivery', async () => {
  await service.processInquiry(row().id);
  assert.equal(analysisCalls, 0);
  assert.equal(changes.length, 1);
});
test('AI failure still sends escaped original inquiry to owner', async () => {
  claimedRow = row();
  process.env.RESEND_API_KEY = 'test-key';
  const oldFetch = global.fetch;
  let request;
  global.fetch = async (_url, init) => { request = init; return { ok: true, json: async () => ({ id: 'mail-1' }) }; };
  try {
    await service.processInquiry(claimedRow.id);
    assert.equal(analysisCalls, 1);
    assert.equal(claimedRow.analysisStatus, 'failed');
    assert.equal(claimedRow.notificationStatus, 'sent');
    const payload = JSON.parse(request.body);
    assert.equal(payload.to, 'admin@example.test');
    assert.match(payload.html, /Original inquiry &lt;tag&gt;/);
    assert.match(payload.html, /AI 분석 실패/);
  } finally { global.fetch = oldFetch; }
});
test('provider returned error records failure rather than success', async () => {
  claimedRow = { ...row(), analysisStatus: 'complete', analysis: { summary: 'stored' } };
  process.env.RESEND_API_KEY = 'test-key';
  const oldFetch = global.fetch;
  global.fetch = async () => ({ ok: false, status: 422, json: async () => ({ message: 'rejected' }) });
  try {
    await service.processInquiry(claimedRow.id);
    assert.equal(analysisCalls, 0);
    assert.equal(claimedRow.notificationStatus, 'failed');
    assert.equal(claimedRow.notificationProviderId, undefined);
  } finally { global.fetch = oldFetch; }
});
test('missing provider key records definite unsent failure without starting the idempotency clock', async () => {
  claimedRow = { ...row(), analysisStatus: 'complete' };
  await service.processInquiry(claimedRow.id);
  assert.equal(claimedRow.notificationStatus, 'failed');
  assert.equal(claimedRow.notificationAttemptedAt, null);
});
test('expired uncertain delivery does not call the provider again', async () => {
  claimedRow = { ...row(), analysisStatus: 'complete', notificationStatus: 'failed',
    notificationKey: 'old-key', notificationPayload: { to: 'admin@example.test' },
    notificationAttemptedAt: new Date(Date.now() - 25 * 3_600_000) };
  process.env.RESEND_API_KEY = 'test-key';
  const oldFetch = global.fetch;
  global.fetch = async () => { throw Error('Unexpected mail call'); };
  try {
    await service.processInquiry(claimedRow.id);
    assert.equal(claimedRow.notificationStatus, 'uncertain');
  } finally { global.fetch = oldFetch; }
});
test('mail-only retry reuses frozen payload and key without rerunning analysis', async () => {
  const frozen = { to: 'admin@example.test', html: '<p>Frozen delivery</p>' };
  const analysisAt = new Date('2026-09-30T00:00:00.000Z');
  claimedRow = { ...row(), analysisStatus: 'complete', analysis: { summary: 'done' },
    analysisAt, notificationStatus: 'failed', notificationKey: `inquiry-${row().id}-${analysisAt.getTime()}`, notificationPayload: frozen,
    notificationAttemptedAt: new Date() };
  process.env.RESEND_API_KEY = 'test-key';
  const oldFetch = global.fetch;
  let request;
  global.fetch = async (_url, init) => { request = init; return { ok: true, json: async () => ({ id: 'mail-2' }) }; };
  try {
    await service.processInquiry(claimedRow.id);
    assert.equal(analysisCalls, 0);
    assert.equal(request.headers['Idempotency-Key'], `inquiry-${row().id}-${analysisAt.getTime()}`);
    assert.deepEqual(JSON.parse(request.body), frozen);
    assert.equal(claimedRow.notificationStatus, 'sent');
  } finally { global.fetch = oldFetch; }
});
test('recovered fallback delivery is followed by latest analysis notification', async () => {
  const frozen = { to: 'admin@example.test', html: '<p>Original fallback</p>' };
  claimedRow = { ...row(), analysisStatus: 'failed', notificationStatus: 'failed',
    notificationKey: 'fallback-key', notificationPayload: frozen,
    notificationAttemptedAt: new Date() };
  analysisResult = { summary: 'New analysis', educationGoal: { stated: 'Learn AI', interpretation: null },
    confirmedFacts: [], recommendedCourses: [], deliveryRecommendation: 'Lecture',
    missingInformation: [], nextActions: [], replyDraft: 'Reply draft' };
  process.env.RESEND_API_KEY = 'test-key';
  const oldFetch = global.fetch;
  const deliveries = [];
  global.fetch = async (_url, init) => { deliveries.push(init); return { ok: true, json: async () => ({ id: `mail-${deliveries.length}` }) }; };
  try {
    await service.processInquiry(claimedRow.id);
    assert.equal(analysisCalls, 1);
    assert.equal(deliveries.length, 2);
    assert.equal(deliveries[0].headers['Idempotency-Key'], 'fallback-key');
    assert.deepEqual(JSON.parse(deliveries[0].body), frozen);
    assert.notEqual(deliveries[1].headers['Idempotency-Key'], 'fallback-key');
    assert.match(JSON.parse(deliveries[1].body).html, /New analysis/);
    assert.equal(claimedRow.notificationStatus, 'sent');
  } finally { global.fetch = oldFetch; }
});
