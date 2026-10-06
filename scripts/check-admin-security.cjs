// Runs production auth/actions against mocked request boundaries and Drizzle's
// SQL-generating proxy driver. No environment file, network, or live DB is used.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const Module = require('node:module');
const path = require('node:path');
const { test, beforeEach, afterEach } = require('node:test');
require('tsx/cjs/api').register();
const { drizzle } = require('drizzle-orm/pg-proxy');

process.env.ADMIN_EMAIL = 'admin@example.test';
process.env.ADMIN_SESSION_SECRET = 'test-session-secret-'.repeat(3);
delete process.env.RESEND_API_KEY;
delete process.env.DATABASE_URL;

let token;
let steps = [];
let writes = [];
const dbModule = { hasDatabase: true, getDb: () => db };
const db = drizzle(async (sql, params) => {
  const step = steps.shift();
  assert.ok(step, `Unexpected SQL: ${sql}`);
  return step(sql, params);
});
const originalLoad = Module._load;
const mocks = {
  'next/headers': {
    cookies: async () => ({
      get: () => token ? { value: token } : undefined,
      set: (name, value, options) => { writes.push({ name, value, options }); token = value; },
      delete: () => { token = undefined; }
    }),
    headers: async () => new Headers()
  },
  'next/navigation': { redirect: (location) => { throw new Error(`REDIRECT:${location}`); } },
  'next/cache': { revalidatePath: () => {} },
  '@/lib/db': dbModule,
  '@/lib/audit': { audit: async () => {} },
  '@vercel/blob': { put: async () => { throw new Error('Unexpected blob upload'); } }
};
Module._load = function (id, parent, isMain) {
  if (Object.hasOwn(mocks, id)) return mocks[id];
  // tsx may resolve aliases before invoking the loader.
  const normalized = id.replaceAll('\\', '/');
  if (normalized === path.resolve(__dirname, '../lib/db/index.ts').replaceAll('\\', '/')) return dbModule;
  if (normalized === path.resolve(__dirname, '../lib/audit.ts').replaceAll('\\', '/')) return mocks['@/lib/audit'];
  return originalLoad.call(this, id, parent, isMain);
};
const auth = require('../lib/auth.ts');
const actions = require('../lib/actions.ts');
const upload = require('../app/api/admin/upload/route.ts');

const config = (overrides = {}) => ({
  id: 1, password_hash: 'existing-hash', failed_attempts: 0,
  locked_until: null, session_version: 2, created_at: '2026-01-01T00:00:00Z', ...overrides
});
function query(pattern, records, inspect) {
  steps.push((sql, params) => {
    assert.match(sql, pattern);
    inspect?.(sql, params);
    const projection = sql.startsWith('select ')
      ? sql.slice(7, sql.indexOf(' from '))
      : sql.slice(sql.lastIndexOf(' returning ') + 11);
    const columns = projection.split(',').map((part) => [...part.matchAll(/"([^"]+)"/g)].at(-1)?.[1]);
    return { rows: records.map((row) => columns.map((column) => row[column])) };
  });
}
function signed(payload) {
  const body = Buffer.from(JSON.stringify({ sub: 'admin', exp: Math.floor(Date.now() / 1000) + 300, nonce: 'test', ver: 2, ...payload })).toString('base64url');
  return `${body}.${crypto.createHmac('sha256', process.env.ADMIN_SESSION_SECRET).update(body).digest('base64url')}`;
}
function form(values) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}
const setupForm = (extra = {}) => form({
  email: process.env.ADMIN_EMAIL, password: 'test-password-123', confirm: 'test-password-123',
  setupToken: process.env.ADMIN_SETUP_TOKEN ?? '', ...extra
});
const redirect = (action, location) => assert.rejects(action, (error) => error.message === `REDIRECT:${location}`);

beforeEach(() => {
  token = undefined;
  steps = [];
  writes = [];
  dbModule.hasDatabase = true;
  process.env.ADMIN_SETUP_TOKEN = 'test-setup-token-'.repeat(3);
});
afterEach(() => assert.equal(steps.length, 0, 'Expected SQL was not executed'));

test('missing, tampered, and expired cookies are rejected without a DB query', async () => {
  assert.equal(await auth.isAdminSessionValid(), false);
  token = `${signed({})}tampered`;
  assert.equal(await auth.isAdminSessionValid(), false);
  token = signed({ exp: 1 });
  assert.equal(await auth.isAdminSessionValid(), false);
});

test('current session is accepted; revoked session is rejected', async () => {
  token = signed({});
  query(/^select /, [config()]);
  assert.equal(await auth.isAdminSessionValid(), true);
  token = signed({ ver: 1 });
  query(/^select /, [config()]);
  assert.equal(await auth.isAdminSessionValid(), false);
});

test('missing DB, missing admin, and uninitialized admin fail closed', async () => {
  token = signed({});
  dbModule.hasDatabase = false;
  assert.equal(await auth.isAdminSessionValid(), false);
  dbModule.hasDatabase = true;
  query(/^select /, []);
  assert.equal(await auth.isAdminSessionValid(), false);
  query(/^select /, [config({ password_hash: null })]);
  assert.equal(await auth.isAdminSessionValid(), false);
});

test('DB failure rejects both boolean and redirect-based authorization', async () => {
  token = signed({});
  steps.push(() => { throw new Error('Database unavailable'); });
  assert.equal(await auth.isAdminSessionValid(), false);
  steps.push(() => { throw new Error('Database unavailable'); });
  await redirect(() => auth.requireAdminSession(), '/admin/login');
});

test('revoked upload session returns 401 before parsing the request body', async () => {
  token = signed({ ver: 1 });
  query(/^select /, [config()]);
  const response = await upload.POST({ formData: () => { throw new Error('Body must not be parsed'); } });
  assert.equal(response.status, 401);
});

test('setup without a configured secret cannot write credentials or issue a session', async () => {
  delete process.env.ADMIN_SETUP_TOKEN;
  await assert.rejects(() => actions.setupAdminPassword(setupForm()), /REDIRECT:\/admin\/login/);
  assert.equal(writes.length, 0);
});

test('short, missing, or incorrect setup secrets cannot initialize the admin', async () => {
  process.env.ADMIN_SETUP_TOKEN = 'short';
  await assert.rejects(() => actions.setupAdminPassword(setupForm()), /REDIRECT:\/admin\/login/);
  process.env.ADMIN_SETUP_TOKEN = 'test-setup-token-'.repeat(3);
  for (const setupToken of ['', 'wrong', 'x'.repeat(process.env.ADMIN_SETUP_TOKEN.length)]) {
    await assert.rejects(() => actions.setupAdminPassword(setupForm({ setupToken })), /REDIRECT:\/admin\/login/);
  }
  assert.equal(writes.length, 0);
});

test('authorized setup uses a conditional upsert and issues the returned session version', async () => {
  query(/^insert into "admin_config"/, [config({ session_version: 4 })], (sql, params) => {
    assert.match(sql, /on conflict \("id"\) do update/);
    assert.match(sql, /where "admin_config"\."password_hash" is null/);
    assert.ok(params.some((value) => typeof value === 'string' && /^[a-f0-9]{32}:[a-f0-9]{128}$/.test(value)));
    assert.ok(!params.includes(process.env.ADMIN_SETUP_TOKEN), 'Setup token must not be persisted');
  });
  await redirect(() => actions.setupAdminPassword(setupForm()), '/admin');
  assert.equal(writes.length, 1);
  assert.equal(JSON.parse(Buffer.from(token.split('.')[0], 'base64url')).ver, 4);
  assert.equal(writes[0].options.httpOnly, true);
});

test('an existing password or losing concurrent setup cannot issue a session', async () => {
  query(/^insert into "admin_config"/, [], (sql) => {
    assert.match(sql, /where "admin_config"\."password_hash" is null/);
  });
  await redirect(() => actions.setupAdminPassword(setupForm()), '/admin/login?error=1');
  assert.equal(writes.length, 0);
});

test('an unrelated email cannot change global login failure counters', async () => {
  await redirect(() => actions.loginAdmin(form({ email: 'unrelated@example.test', password: 'wrong' })), '/admin/login?error=1');
  assert.equal(writes.length, 0);
});

function passwordConfig() {
  const salt = 'test-salt';
  return config({ password_hash: `${salt}:${crypto.scryptSync('current-password', salt, 64).toString('hex')}` });
}
const passwordForm = () => form({ currentPassword: 'current-password', newPassword: 'replacement-password', confirm: 'replacement-password' });

test('password change atomically advances version and revokes the previous cookie', async () => {
  token = signed({});
  const previousCookie = token;
  const row = passwordConfig();
  query(/^select /, [row]);
  query(/^select /, [row]);
  query(/^update "admin_config"/, [config({ session_version: 3 })], (sql, params) => {
    assert.match(sql, /"session_version" = "admin_config"\."session_version" \+ 1/);
    assert.match(sql, /where .*"admin_config"\."password_hash" = /);
    assert.ok(params.includes(row.password_hash), 'Update must compare the verified password hash');
  });
  await redirect(() => actions.changeAdminPassword(passwordForm()), '/admin/settings?pwsaved=1');
  assert.equal(JSON.parse(Buffer.from(token.split('.')[0], 'base64url')).ver, 3);
  const newCookie = token;
  token = previousCookie;
  query(/^select /, [config({ session_version: 3 })]);
  assert.equal(await auth.isAdminSessionValid(), false);
  token = newCookie;
  query(/^select /, [config({ session_version: 3 })]);
  assert.equal(await auth.isAdminSessionValid(), true);
});

test('a concurrent password change cannot overwrite the winner or issue a new cookie', async () => {
  token = signed({});
  query(/^select /, [passwordConfig()]);
  query(/^select /, [passwordConfig()]);
  query(/^update "admin_config"/, []);
  await redirect(() => actions.changeAdminPassword(passwordForm()), '/admin/settings?pwerror=current');
  assert.equal(writes.length, 0);
});

test('setup query parameter cannot show the setup form for an initialized admin', async () => {
  const LoginPage = require('../app/admin/login/page.tsx').default;
  const { renderToStaticMarkup } = require('react-dom/server');
  query(/^select /, [config()]);
  const html = renderToStaticMarkup(await LoginPage({ searchParams: Promise.resolve({ setup: '1' }) }));
  assert.ok(!html.includes('name="setupToken"'));
  assert.ok(html.includes('관리자 로그인'));
});

test('first setup renders an empty password-type token input without exposing the secret', async () => {
  const LoginPage = require('../app/admin/login/page.tsx').default;
  const { renderToStaticMarkup } = require('react-dom/server');
  query(/^select /, []);
  const html = renderToStaticMarkup(await LoginPage({ searchParams: Promise.resolve({}) }));
  assert.match(html, /type="password"[^>]*name="setupToken"/);
  assert.ok(!html.includes(process.env.ADMIN_SETUP_TOKEN));
});
