import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export type InquiryAiProvider = "openrouter" | "codex" | "claude";
export const INQUIRY_CLI_TIMEOUT_MS = 60_000;
const MAX_OUTPUT_BYTES = 256 * 1024;

export function getInquiryAiProvider(): InquiryAiProvider {
  if (process.env.VERCEL === "1" || process.env.VERCEL_ENV) return "openrouter";
  const value = process.env.INQUIRY_AI_PROVIDER?.trim().toLowerCase() || "codex";
  if (value === "codex" || value === "claude") return value;
  throw new Error("Inquiry analysis provider is not configured correctly.");
}

function cliExecutable(provider: "codex" | "claude"): { command: string; prefix: string[] } {
  const roots = (process.env.PATH || "").split(path.delimiter).filter(Boolean);
  if (process.env.APPDATA) roots.unshift(path.join(process.env.APPDATA, "npm"));
  for (const root of roots) {
    if (provider === "codex") {
      const js = path.join(root, "node_modules", "@openai", "codex", "bin", "codex.js");
      if (existsSync(js)) return { command: process.execPath, prefix: [js] };
      const exe = path.join(root, process.platform === "win32" ? "codex.exe" : "codex");
      if (existsSync(exe)) return { command: exe, prefix: [] };
    } else {
      const exe = path.join(root, "node_modules", "@anthropic-ai", "claude-code", "bin", process.platform === "win32" ? "claude.exe" : "claude");
      if (existsSync(exe)) return { command: exe, prefix: [] };
      const js = path.join(root, "node_modules", "@anthropic-ai", "claude-code", "cli.js");
      if (existsSync(js)) return { command: process.execPath, prefix: [js] };
    }
  }
  throw new Error("Inquiry analysis CLI is unavailable.");
}

function childEnvironment(): NodeJS.ProcessEnv {
  // Keep the authenticated CLI's home/config while withholding application credentials.
  const allowed = ["PATH", "PATHEXT", "SystemRoot", "WINDIR", "COMSPEC", "USERPROFILE", "HOME", "HOMEDRIVE", "HOMEPATH", "APPDATA", "LOCALAPPDATA", "TEMP", "TMP", "TMPDIR", "CODEX_HOME", "CLAUDE_CONFIG_DIR", "LANG", "LC_ALL", "TERM", "COLORTERM", "NO_COLOR", "HTTPS_PROXY", "HTTP_PROXY", "NO_PROXY", "NODE_EXTRA_CA_CERTS"];
  const env: NodeJS.ProcessEnv = { NODE_ENV: process.env.NODE_ENV };
  for (const key of allowed) if (process.env[key] !== undefined) env[key] = process.env[key];
  env.NO_COLOR = "1";
  return env;
}

function parseClaudeOutput(stdout: string): unknown {
  let envelope: unknown;
  try { envelope = JSON.parse(stdout); } catch { throw new Error("Inquiry analysis returned an invalid response."); }
  if (!envelope || typeof envelope !== "object") throw new Error("Inquiry analysis returned an invalid response.");
  const record = envelope as Record<string, unknown>;
  if (record.is_error === true || record.type === "error") throw new Error("Inquiry analysis service failed.");
  if (record.structured_output !== undefined) return record.structured_output;
  if (typeof record.result === "string") {
    try { return JSON.parse(record.result); } catch { throw new Error("Inquiry analysis returned an invalid response."); }
  }
  throw new Error("Inquiry analysis returned an invalid response.");
}

export async function runInquiryCli(provider: "codex" | "claude", prompt: string, schema: object): Promise<unknown> {
  const executable = cliExecutable(provider);
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "inquiry-ai-"));
  const schemaFile = path.join(temporaryDirectory, "schema.json");
  const resultFile = path.join(temporaryDirectory, "result.json");
  try {
    await writeFile(schemaFile, JSON.stringify(schema), { encoding: "utf8", mode: 0o600 });
    const args = provider === "codex"
      ? [...executable.prefix, "exec", "-", "--ephemeral", "--skip-git-repo-check", "--sandbox", "read-only", "--output-schema", schemaFile, "--output-last-message", resultFile, "--ignore-user-config", "--disable", "shell_tool", "--disable", "unified_exec", "--disable", "apps", "--disable", "hooks", "--disable", "plugins", "--disable", "multi_agent"]
      : [...executable.prefix, "-p", "--output-format", "json", "--json-schema", JSON.stringify(schema), "--tools", "", "--permission-mode", "dontAsk", "--strict-mcp-config", "--no-session-persistence", "--safe-mode"];
    const stdoutChunks: Buffer[] = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    const code = await new Promise<number>((resolve, reject) => {
      const child = spawn(executable.command, args, { cwd: temporaryDirectory, env: childEnvironment(), shell: false, stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
      let settled = false;
      const killTree = () => {
        if (process.platform === "win32" && child.pid) {
          const killer = spawn("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true, shell: false });
          killer.on("error", () => child.kill());
        } else child.kill();
      };
      const timeout = setTimeout(() => fail(new Error("Inquiry analysis timed out.")), INQUIRY_CLI_TIMEOUT_MS);
      const fail = (error: Error) => { if (settled) return; settled = true; clearTimeout(timeout); killTree(); reject(error); };
      child.stdout.on("data", (chunk: Buffer) => {
        stdoutBytes += chunk.length;
        if (stdoutBytes > MAX_OUTPUT_BYTES) return fail(new Error("Inquiry analysis response is too large."));
        stdoutChunks.push(chunk);
      });
      child.stderr.on("data", (chunk: Buffer) => {
        stderrBytes += chunk.length;
        if (stderrBytes > MAX_OUTPUT_BYTES) fail(new Error("Inquiry analysis response is too large."));
      });
      child.on("error", () => fail(new Error("Inquiry analysis CLI is unavailable.")));
      child.on("close", (exitCode) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve(exitCode ?? 1);
      });
      child.stdin.on("error", () => {});
      child.stdin.end(prompt);
    });
    if (code !== 0) throw new Error("Inquiry analysis service failed.");
    if (provider === "claude") return parseClaudeOutput(Buffer.concat(stdoutChunks).toString("utf8"));
    let output: string;
    try { if ((await stat(resultFile)).size > MAX_OUTPUT_BYTES) throw new Error("Inquiry analysis response is too large."); }
    catch (error) { if (error instanceof Error && error.message === "Inquiry analysis response is too large.") throw error; throw new Error("Inquiry analysis returned an invalid response."); }
    try { output = await readFile(resultFile, "utf8"); } catch { throw new Error("Inquiry analysis returned an invalid response."); }
    if (Buffer.byteLength(output) > MAX_OUTPUT_BYTES) throw new Error("Inquiry analysis response is too large.");
    try { return JSON.parse(output); } catch { throw new Error("Inquiry analysis returned an invalid response."); }
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}
