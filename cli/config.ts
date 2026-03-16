import { homedir } from "os";
import { join } from "path";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { createInterface } from "readline";
import { load, dump } from "js-yaml";

const CONFIG_DIR = join(homedir(), ".wm");
const CONFIG_PATH = join(CONFIG_DIR, "config.yml");

export interface Config {
  api_key?: string;
  base_url?: string;
}

// ── Read / write ─────────────────────────────────────────────────────────────

export function readConfig(): Config {
  if (!existsSync(CONFIG_PATH)) return {};
  return (load(readFileSync(CONFIG_PATH, "utf8")) as Config) ?? {};
}

function writeConfig(cfg: Config) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, dump(cfg), "utf8");
}

// ── Resolved values (env > config file > default) ────────────────────────────

export function resolvedConfig() {
  const file = readConfig();
  return {
    apiKey: process.env.WM_API_KEY ?? file.api_key,
    baseUrl: process.env.WM_BASE_URL ?? file.base_url ?? "http://localhost:3000",
  };
}

// ── Interactive prompt ────────────────────────────────────────────────────────

function prompt(rl: ReturnType<typeof createInterface>, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

export async function configCommand() {
  const current = readConfig();
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log(`Configuring Wealth Manager CLI`);
  console.log(`Config will be saved to: ${CONFIG_PATH}\n`);

  const apiKeyHint = current.api_key
    ? `current: ${current.api_key.slice(0, 6)}... (press Enter to keep)`
    : "generate one in the app under Settings > API Keys";
  const baseUrlHint = current.base_url ?? "http://localhost:3000";

  const apiKeyInput = await prompt(rl, `API key (${apiKeyHint}): `);
  const baseUrlInput = await prompt(rl, `Base URL (${baseUrlHint}): `);

  rl.close();

  const cfg: Config = {
    api_key: apiKeyInput.trim() || current.api_key,
    base_url: baseUrlInput.trim() || current.base_url || "http://localhost:3000",
  };

  if (!cfg.api_key) {
    console.error("API key is required.");
    process.exit(1);
  }

  writeConfig(cfg);
  console.log(`\nSaved to ${CONFIG_PATH}`);
}
