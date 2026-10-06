// Smoke-test the published .next output from this workspace, not its build staging folder.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const live = process.argv.includes('--live');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function freePort() {
  const socket = net.createServer();
  await new Promise((resolve, reject) => {
    socket.once('error', reject);
    socket.listen(0, '127.0.0.1', resolve);
  });
  const port = socket.address().port;
  await new Promise((resolve) => socket.close(resolve));
  return port;
}

async function main() {
  let fixtures;
  if (live) {
    require('@next/env').loadEnvConfig(root, false);
    assert.ok(process.env.DATABASE_URL, 'Live checks require DATABASE_URL');
    assert.ok(process.env.ADMIN_SESSION_SECRET?.length >= 32, 'Live checks require ADMIN_SESSION_SECRET (32+ characters)');
    const { neon } = require('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);
    const [posts, cases, portfolio, admin] = await sql.transaction([
      sql`SELECT slug, title FROM blog_posts WHERE published = true ORDER BY published_at DESC LIMIT 1`,
      sql`SELECT slug, title FROM field_cases WHERE published = true ORDER BY "order" ASC LIMIT 1`,
      sql`SELECT id, title FROM portfolio_items WHERE published = true ORDER BY "order" ASC LIMIT 1`,
      sql`SELECT session_version FROM admin_config WHERE id = 1 AND password_hash IS NOT NULL`
    ], { readOnly: true });
    fixtures = { post: posts[0], item: cases[0], portfolio: portfolio[0], admin: admin[0] };
    assert.ok(fixtures.admin, 'An initialized admin is required for authenticated live checks');
    assert.ok(fixtures.post && fixtures.item && fixtures.portfolio, 'Published blog, case, and portfolio records are required for live detail checks');
    console.log('PASS read-only live database queries');
  }
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const server = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
    cwd: root,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      ...(live ? {} : { DATABASE_URL: '', ADMIN_SESSION_SECRET: 'build-smoke-test-secret-'.repeat(3) }),
      NEXT_TELEMETRY_DISABLED: '1',
    }
  });
  let output = '';
  let startError;
  server.on('error', (error) => { startError = error; });
  for (const stream of [server.stdout, server.stderr]) {
    stream.on('data', (data) => { output = (output + data.toString()).slice(-16000); });
  }
  try {
    let ready = false;
    for (let attempt = 0; attempt < 120; attempt++) {
      if (startError) throw startError;
      if (server.exitCode !== null) throw new Error(`Production server exited${live ? ' (live logs withheld)' : `: ${output}`}`);
      try {
        const response = await fetch(`${base}/robots.txt`, { signal: AbortSignal.timeout(1500) });
        if (response.ok) { ready = true; break; }
      } catch {}
      await sleep(500);
    }
    assert.ok(ready, `Production server did not become ready${live ? ' (live logs withheld)' : `: ${output}`}`);

    let home = '';
    const routes = [
      ['/', 'AI'], ['/blog', 'AI'], ['/cases', 'AI'],
      ['/check', 'AI 업무 실행 역량 진단'], ['/admin/login', 'CMS LOGIN'],
      ['/guide', '<html'], ['/sitemap.xml', '<urlset']
    ];
    const htmlText = (text) => text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' })[char]);
    if (live) {
      if (fixtures.post) routes.push([`/blog/${encodeURIComponent(fixtures.post.slug)}`, htmlText(fixtures.post.title)]);
      if (fixtures.item) routes.push([`/cases/${encodeURIComponent(fixtures.item.slug)}`, htmlText(fixtures.item.title)]);
      if (fixtures.portfolio) routes.push([`/portfolio/${fixtures.portfolio.id}`, htmlText(fixtures.portfolio.title)]);
    } else {
      routes.push(['/blog/ai-education-method', 'AI 교육'], ['/cases/public-ai-literacy', '공공기관'], ['/portfolio/portfolio-1', 'AI']);
    }
    for (const [route, expected] of routes) {
      const label = live ? route.replace(/^\/(blog|cases|portfolio)\/.+$/, '/$1/[detail]') : route;
      const response = await fetch(`${base}${route}`, { signal: AbortSignal.timeout(30000) });
      assert.equal(response.status, 200, live ? `HTTP check failed: ${label}` : `${route}: ${output}`);
      const body = await response.text();
      assert.ok(body.includes(expected), `${label}: expected page content missing`);
      if (live && route === '/blog' && fixtures.post) assert.ok(body.includes(htmlText(fixtures.post.title)), 'Published DB post missing from blog listing');
      if (live && route === '/cases' && fixtures.item) assert.ok(body.includes(htmlText(fixtures.item.title)), 'Published DB case missing from case listing');
      if (route === '/') home = body;
      console.log(`PASS ${label} 200`);
    }
    for (const route of ['/logo.png', '/icon.png']) {
      const response = await fetch(`${base}${route}`, { signal: AbortSignal.timeout(15000) });
      assert.equal(response.status, 200, route);
      assert.match(response.headers.get('content-type'), /image\/png/);
      assert.ok((await response.arrayBuffer()).byteLength > 0);
      console.log(`PASS ${route} image`);
    }
    const chunk = home.match(/src="([^" ]*\/_next\/static\/[^" ]+\.js[^" ]*)"/)?.[1];
    assert.ok(chunk, 'Home page must reference a production JavaScript chunk');
    assert.equal((await fetch(new URL(chunk.replaceAll('&amp;', '&'), base), { signal: AbortSignal.timeout(15000) })).status, 200);
    console.log('PASS production JavaScript chunk 200');

    const admin = await fetch(`${base}/admin`, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
    assert.ok([307, 308].includes(admin.status));
    assert.equal(new URL(admin.headers.get('location'), base).pathname, '/admin/login');
    const upload = await fetch(`${base}/api/admin/upload`, { method: 'POST', signal: AbortSignal.timeout(15000) });
    assert.equal(upload.status, 401);
    console.log('PASS unauthenticated admin redirect and upload 401');
    if (live) {
      // Use a short-lived signed session only inside this test process. No login,
      // password change, audit insertion, email send, or data mutation is needed.
      const payload = Buffer.from(JSON.stringify({ sub: 'admin', exp: Math.floor(Date.now() / 1000) + 300, ver: fixtures.admin.session_version, nonce: crypto.randomBytes(16).toString('hex') })).toString('base64url');
      const signature = crypto.createHmac('sha256', process.env.ADMIN_SESSION_SECRET).update(payload).digest('base64url');
      for (const route of ['/admin', '/admin/blog', '/admin/cases', '/admin/portfolio', '/admin/inquiries', '/admin/categories', '/admin/settings', '/admin/checks', '/admin/security']) {
        const response = await fetch(`${base}${route}`, { redirect: 'manual', signal: AbortSignal.timeout(30000), headers: { cookie: `admin_session=${payload}.${signature}` } });
        assert.equal(response.status, 200, `Authenticated GET failed: ${route}`);
        const body = await response.text();
        assert.ok(body.includes('cms-wrap'), `Admin layout missing: ${route}`);
        console.log(`PASS authenticated ${route} 200`);
      }
    }
    console.log(live ? 'Live production checks passed. Database reads only; no data changes or email sends.' : 'Production smoke checks passed. No database or email operations were performed.');
  } finally {
    if (server.exitCode === null && !startError) {
      await new Promise((resolve) => {
        const timer = setTimeout(() => { server.kill('SIGKILL'); resolve(); }, 5000);
        server.once('exit', () => { clearTimeout(timer); resolve(); });
        server.kill();
      });
    }
  }
}

main().catch((error) => {
  // Driver errors can contain connection details; only known assertion messages
  // or a sanitized category are suitable for live command output.
  console.error(live && error.code !== 'ERR_ASSERTION' ? `Live checks failed (${String(error.code || error.name || 'unknown').replace(/[^a-zA-Z0-9_]/g, '')})` : error.message);
  process.exitCode = 1;
});
