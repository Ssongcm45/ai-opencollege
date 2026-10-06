const fs = require('node:fs');
const fsp = fs.promises;
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { randomUUID } = require('node:crypto');

const root = path.resolve(__dirname, '..');
const nextCli = require.resolve('next/dist/bin/next');
const args = process.argv.slice(2);

function run(cwd, cli, buildArgs) {
  const result = spawnSync(process.execPath, [cli, 'build', ...buildArgs], {
    cwd,
    env: process.env,
    stdio: 'inherit',
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.signal) throw new Error(`Next build ended with signal ${result.signal}`);
  return result.status ?? 1;
}

function isDirectChild(parent, child) {
  return path.dirname(path.resolve(child)).toLowerCase() === path.resolve(parent).toLowerCase();
}

async function renameOutput(source, target) {
  for (let attempt = 0; ; attempt++) {
    try {
      await fsp.rename(source, target);
      return;
    } catch (error) {
      if (attempt >= 4 || !['EPERM', 'EACCES', 'EBUSY'].includes(error.code)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
}

async function removeOwned(parent, child) {
  if (!isDirectChild(parent, child)) throw new Error(`Unsafe cleanup path: ${child}`);
  await fsp.rm(child, { recursive: true, force: true });
}

async function removeStage(stage) {
  if (!stage) return;
  const tmp = await fsp.realpath(os.tmpdir());
  const resolved = await fsp.realpath(stage);
  if (!isDirectChild(tmp, resolved) || !path.basename(resolved).startsWith('opencollege-build-')) {
    throw new Error(`Unsafe staging cleanup path: ${resolved}`);
  }
  console.log(`[build] Removing temporary copy ${resolved}`);
  await fsp.rm(resolved, { recursive: true, force: true });
}

async function readlinkError(file) {
  try {
    await fsp.readlink(file);
    return null;
  } catch (error) {
    return error.code;
  }
}

async function rewriteManifest(output, stage) {
  const file = path.join(output, 'required-server-files.json');
  const manifest = JSON.parse(await fsp.readFile(file, 'utf8'));
  if (path.resolve(manifest.appDir) !== stage) {
    throw new Error(`Unexpected required-server-files appDir: ${manifest.appDir}`);
  }
  manifest.appDir = root;
  if (manifest.config?.outputFileTracingRoot &&
      path.resolve(manifest.config.outputFileTracingRoot) === stage) {
    manifest.config.outputFileTracingRoot = root;
  }
  await fsp.writeFile(file, JSON.stringify(manifest));

  // Next also emits this manifest as a JavaScript assignment for route modules.
  const jsFile = path.join(output, 'required-server-files.js');
  if (fs.existsSync(jsFile)) {
    const body = await fsp.readFile(jsFile, 'utf8');
    const marker = 'self.__SERVER_FILES_MANIFEST=';
    if (!body.startsWith(marker)) throw new Error('Unexpected required-server-files.js format');
    await fsp.writeFile(jsFile, `${marker}${JSON.stringify(manifest)}`);
  }
}

async function publish(stage) {
  const target = path.join(root, '.next');
  const incoming = path.join(root, `.next.incoming-${randomUUID()}`);
  const backup = path.join(root, `.next.backup-${randomUUID()}`);
  let oldMoved = false;
  let installed = false;
  try {
    console.log('[build] Copying production output to the project');
    await fsp.cp(path.join(stage, '.next'), incoming, { recursive: true, dereference: true });
    const old = await fsp.lstat(target).catch((error) => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    if (old && (!old.isDirectory() || old.isSymbolicLink())) {
      throw new Error('Existing .next is not a normal directory');
    }
    if (old && fs.existsSync(path.join(target, 'dev'))) {
      console.log('[build] Preserving .next/dev');
      await fsp.cp(path.join(target, 'dev'), path.join(incoming, 'dev'), {
        recursive: true,
        dereference: true,
      });
    }
    if (old) {
      await renameOutput(target, backup);
      oldMoved = true;
    }
    try {
      await renameOutput(incoming, target);
      installed = true;
    } catch (error) {
      if (oldMoved) await renameOutput(backup, target);
      oldMoved = false;
      throw error;
    }
    if (oldMoved) {
      try { await removeOwned(root, backup); }
      catch (error) { console.warn(`[build] Old output retained at ${backup}: ${error.message}`); }
    }
  } finally {
    if (!installed) await removeOwned(root, incoming);
  }
}

async function build() {
  const rootError = await readlinkError(path.join(root, 'package.json'));
  if (process.platform !== 'win32' || rootError !== 'EISDIR') {
    process.exitCode = run(root, nextCli, args);
    return;
  }
  if (args.some((arg) => arg === '--turbopack' || arg === '--turbo')) {
    throw new Error('Turbopack cannot build this project on exFAT. Use npm run build without --turbopack.');
  }

  let stage;
  let preserveStage = false;
  try {
    stage = await fsp.mkdtemp(path.join(os.tmpdir(), 'opencollege-build-'));
    const probe = path.join(stage, 'readlink-probe');
    await fsp.writeFile(probe, 'probe');
    const stageError = await readlinkError(probe);
    await fsp.unlink(probe);
    if (stageError !== 'EINVAL') {
      throw new Error(`Temporary volume does not support this build (readlink: ${stageError}). Set TEMP/TMP to a native Windows volume.`);
    }

    console.log(`[build] exFAT detected; copying project to ${stage}`);
    const excluded = new Set(['.git', '.next', '.next.build-lock', 'node_modules', '.claude', '.vercel', 'docs']);
    for (const entry of await fsp.readdir(root, { withFileTypes: true })) {
      const name = entry.name;
      if (excluded.has(name) || name.startsWith('.next.') || name.startsWith('.env') || /\.(?:log|pdf|html)$/i.test(name)) continue;
      await fsp.cp(path.join(root, name), path.join(stage, name), {
        recursive: true,
        dereference: true,
      });
    }
    console.log('[build] Copying node_modules with 8 parallel workers');
    const copied = spawnSync('robocopy.exe', [
      path.join(root, 'node_modules'), path.join(stage, 'node_modules'),
      '/E', '/MT:8', '/R:1', '/W:1', '/NFL', '/NDL', '/NJH', '/NJS', '/NP', '/XD', '.cache',
    ], { stdio: 'inherit', windowsHide: true });
    if (copied.error) throw copied.error;
    // Robocopy uses 0..7 for successful copies/differences, and 8+ for failures.
    if (copied.signal || copied.status === null || copied.status >= 8) {
      throw new Error(`Dependency copy failed (robocopy exit ${copied.status})`);
    }
    console.log('[build] Staging complete; loading project environment');
    require('@next/env').loadEnvConfig(root, false);
    const cli = path.join(stage, 'node_modules', 'next', 'dist', 'bin', 'next');
    const status = run(stage, cli, args.includes('--webpack') ? args : ['--webpack', ...args]);
    if (status !== 0) {
      process.exitCode = status;
      return;
    }
    await rewriteManifest(path.join(stage, '.next'), stage);
    try {
      await publish(stage);
    } catch (error) {
      preserveStage = true;
      console.error(`[build] Publication failed; compiled output retained at ${stage}. Stop project servers before retrying publication.`);
      throw error;
    }
    console.log('[build] Production output ready in .next');
  } finally {
    if (stage && !preserveStage) await removeStage(stage);
  }
}

async function main() {
  const lock = path.join(root, '.next.build-lock');
  try {
    await fsp.mkdir(lock);
  } catch (error) {
    if (error.code === 'EEXIST') throw new Error('Another build is already running (.next.build-lock exists)');
    throw error;
  }
  try {
    await build();
  } finally {
    await removeOwned(root, lock);
  }
}

main().catch((error) => {
  console.error(`[build] ${error.stack || error}`);
  process.exitCode = 1;
});
