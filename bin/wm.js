#!/usr/bin/env node
"use strict";

const { resolve } = require("path");
const { spawnSync } = require("child_process");
const { realpathSync } = require("fs");

// Resolve symlinks so this works after `pnpm link --global`
const projectDir = resolve(realpathSync(__filename), "../..");
const tsx = resolve(projectDir, "node_modules/.bin/tsx");
const cli = resolve(projectDir, "cli/index.ts");

const result = spawnSync(tsx, [cli, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
