// Narrow release runner for migration 0013. Output contains no connection string or row data.
const assert = require('node:assert/strict');
const { createHash, createHmac, randomBytes } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { loadEnvConfig } = require('@next/env');
const { neon } = require('@neondatabase/serverless');

const root = path.resolve(__dirname, '..');
loadEnvConfig(root, false);
const migrationPath = path.join(root, 'migrations', '0013_inquiry_analysis.sql');
const expectedColumns = [
  'education_goal', 'intake_key', 'source', 'analysis', 'analysis_status',
  'analysis_error', 'analysis_model', 'analysis_at', 'notification_status',
  'notification_error', 'notification_sent_at', 'notification_provider_id',
  'notification_key', 'notification_payload', 'notification_attempted_at',
  'processing_token', 'processing_lease_until'
];
const expectedIndexes = ['inquiries_intake_key_unique', 'inquiry_rate_limits_pkey', 'inquiry_rate_limits_window_start_idx'];
const expectedRateColumns = ['rate_key', 'window_start', 'attempts'];

function fail(category, error) {
  const code = typeof error?.code === 'string' && /^[A-Z0-9]{2,8}$/i.test(error.code)
    ? error.code : 'unknown';
  const safeMessage = typeof error?.message === 'string' && /^Inquiry analysis (is unavailable|service failed|returned an invalid response|timed out)/.test(error.message)
    ? error.message : undefined;
  console.error(JSON.stringify({ ok: false, category, code, errorName: String(error?.name || 'unknown').replace(/[^A-Za-z0-9]/g, ''),
    ...(safeMessage ? { safeMessage } : {}) }));
  process.exitCode = 1;
}

function identityHash(raw) {
  const url = new URL(raw);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('invalid_database_url');
  const identity = [url.hostname.toLowerCase(), url.port || '5432', decodeURIComponent(url.username),
    decodeURIComponent(url.pathname.replace(/^\//, ''))].join('\0');
  return createHash('sha256').update(identity).digest('hex');
}

function environment() {
  const keys = ['DATABASE_URL', 'ADMIN_SESSION_SECRET', 'ADMIN_EMAIL', 'RESEND_API_KEY', 'OPENROUTER_API_KEY'];
  return Object.fromEntries(keys.map((key) => [key, Boolean(process.env[key]?.trim())]));
}

function database() {
  if (!process.env.DATABASE_URL) throw new Error('database_url_missing');
  return neon(process.env.DATABASE_URL);
}

async function schema(sql) {
  const [columns, indexes] = await sql.transaction([
    sql`select table_name, column_name from information_schema.columns
        where table_schema = 'public' and table_name in ('inquiries', 'inquiry_rate_limits')`,
    sql`select tablename, indexname from pg_indexes
        where schemaname = 'public' and tablename in ('inquiries', 'inquiry_rate_limits')`
  ], { readOnly: true });
  const foundColumns = new Set(columns.map((row) => `${row.table_name}.${row.column_name}`));
  const foundIndexes = new Set(indexes.map((row) => row.indexname));
  const missingColumns = [
    ...expectedColumns.map((name) => `inquiries.${name}`),
    ...expectedRateColumns.map((name) => `inquiry_rate_limits.${name}`)
  ].filter((name) => !foundColumns.has(name));
  const missingIndexes = expectedIndexes.filter((name) => !foundIndexes.has(name));
  return { ready: missingColumns.length === 0 && missingIndexes.length === 0,
    missingColumns, missingIndexes };
}

function migrationStatements() {
  const source = fs.readFileSync(migrationPath, 'utf8');
  const statements = source.split(';').map((part) => part.trim()).filter(Boolean);
  if (statements.length !== 20 || !statements.every((statement) =>
    /^(ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS |CREATE UNIQUE INDEX IF NOT EXISTS inquiries_intake_key_unique |CREATE TABLE IF NOT EXISTS inquiry_rate_limits |CREATE INDEX IF NOT EXISTS inquiry_rate_limits_window_start_idx )/i.test(statement))) {
    throw new Error('unexpected_migration_contents');
  }
  return statements;
}

async function check() {
  const present = environment();
  const hash = present.DATABASE_URL ? identityHash(process.env.DATABASE_URL) : null;
  console.log(JSON.stringify({ environment: present, databaseIdentitySha256: hash }));
  if (!present.DATABASE_URL) throw new Error('database_url_missing');
  const state = await schema(database());
  console.log(JSON.stringify({ schema: state }));
  if (!state.ready) process.exitCode = 1;
}

async function migrate() {
  const statements = migrationStatements();
  const sql = database();
  const queries = [sql`select count(*)::bigint as count from public.inquiries`,
    ...statements.map((statement) => sql.query(statement))];
  queries.push(sql`select count(*)::bigint as count from public.inquiries`);
  const results = await sql.transaction(queries, { isolationLevel: 'RepeatableRead' });
  const before = results[0];
  const after = results.at(-1)[0].count;
  assert.equal(BigInt(before[0].count), BigInt(after), 'inquiry_count_changed');
  const state = await schema(sql);
  console.log(JSON.stringify({ migration: '0013_inquiry_analysis', statements: statements.length,
    inquiryCountBefore: String(before[0].count), inquiryCountAfter: String(after), schema: state }));
  if (!state.ready) process.exitCode = 1;
}

async function aiSmoke() {
  require('tsx/cjs/api').register();
  const { getInquiryAiProvider } = require('../lib/inquiry-cli.ts');
  const provider = getInquiryAiProvider();
  if (provider === 'openrouter' && !process.env.OPENROUTER_API_KEY?.trim()) {
    throw new Error('ai_key_missing');
  }
  const { analyzeInquiry, INQUIRY_COURSES, INQUIRY_DELIVERY_POLICY } = require('../lib/inquiry-analysis.ts');
  const goal = '생성형 AI 기초 학습';
  const started = Date.now();
  const originalFetch = global.fetch;
  global.fetch = async (...args) => {
    const response = await originalFetch(...args);
    if (new URL(args[0]).hostname === 'openrouter.ai') console.log(JSON.stringify({ aiHttpStatus: response.status, provider }));
    return response;
  };
  const result = await analyzeInquiry({ educationGoal: goal, message: '가상의 교육 문의입니다. 직원 대상 AI 기초 교육을 검토합니다.' });
  assert.equal(result.educationGoal.stated, goal, 'goal_mismatch');
  assert.equal(result.deliveryRecommendation, Object.values(INQUIRY_DELIVERY_POLICY).join(' '), 'policy_mismatch');
  assert.ok(result.recommendedCourses.every((course) => Object.hasOwn(INQUIRY_COURSES, course.courseId)), 'course_mismatch');
  console.log(JSON.stringify({ aiSmoke: 'ok', provider, elapsedMs: Date.now() - started,
    courseIds: result.recommendedCourses.map((course) => course.courseId) }));
}

async function siteSmoke() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configured || !process.env.DATABASE_URL || (process.env.ADMIN_SESSION_SECRET?.length ?? 0) < 32) {
    throw new Error('smoke_environment_missing');
  }
  const site = new URL(configured);
  if (site.protocol !== 'https:') throw new Error('smoke_site_invalid');
  const base = site.origin;
  const home = await fetch(`${base}/`, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(15000) });
  assert.equal(home.status, 200, 'homepage_status');
  assert.match(await home.text(), /name="educationGoal"/, 'education_goal_field_missing');
  console.log(JSON.stringify({ siteSmoke: 'homepage', status: home.status, educationGoalField: true }));

  const anonymous = await fetch(`${base}/admin`, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(15000) });
  assert.ok([307, 308].includes(anonymous.status), 'admin_redirect_status');
  assert.equal(new URL(anonymous.headers.get('location'), base).pathname, '/admin/login', 'admin_redirect_target');
  console.log(JSON.stringify({ siteSmoke: 'anonymous_admin', status: anonymous.status }));

  const sql = database();
  const [rows] = await sql.transaction([
    sql`select session_version from public.admin_config where id = 1 and password_hash is not null`
  ], { readOnly: true });
  assert.equal(rows.length, 1, 'initialized_admin_missing');
  const payload = Buffer.from(JSON.stringify({ sub: 'admin', exp: Math.floor(Date.now() / 1000) + 300,
    ver: rows[0].session_version, nonce: randomBytes(16).toString('hex') })).toString('base64url');
  const signature = createHmac('sha256', process.env.ADMIN_SESSION_SECRET).update(payload).digest('base64url');
  const authenticated = await fetch(`${base}/admin/inquiries`, { method: 'GET', redirect: 'manual',
    signal: AbortSignal.timeout(15000), headers: { cookie: `admin_session=${payload}.${signature}` } });
  assert.equal(authenticated.status, 200, 'admin_inquiries_status');
  assert.match(await authenticated.text(), /문의 관리/, 'admin_inquiries_heading_missing');
  console.log(JSON.stringify({ siteSmoke: 'admin_inquiries', status: authenticated.status, heading: true }));
}

async function main() {
  const command = process.argv[2];
  if (process.argv.length !== 3 || !['check', 'migrate', 'ai-smoke', 'smoke'].includes(command)) {
    console.error('Usage: node scripts/release-inquiry.cjs check|migrate|ai-smoke|smoke');
    process.exitCode = 2;
    return;
  }
  try {
    if (command === 'check') await check();
    else if (command === 'migrate') await migrate();
    else if (command === 'ai-smoke') await aiSmoke();
    else await siteSmoke();
  } catch (error) {
    const category = error?.message === 'database_url_missing' ? 'environment' :
      error?.message === 'unexpected_migration_contents' ? 'migration_file' :
      error?.message === 'ai_key_missing' ? 'environment' :
      error?.message === 'inquiry_count_changed' ? 'migration_invariant' :
      command === 'ai-smoke' ? 'ai_smoke' : command === 'smoke' ? 'site_smoke' : command === 'migrate' ? 'migration' : 'preflight';
    fail(category, error);
  }
}

main();
