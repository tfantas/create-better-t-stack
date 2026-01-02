/**
 * Ultracite setup - CLI-only operations
 * NOTE: Dependencies (husky, lint-staged) are handled by template-generator's addons-deps.ts
 * This file handles interactive prompts and external CLI initialization
 */

import { autocompleteMultiselect, group, log, multiselect, select, spinner } from "@clack/prompts";
import { $ } from "execa";
import pc from "picocolors";

import type { ProjectConfig } from "../../types";

import { exitCancelled } from "../../utils/errors";
import { getPackageExecutionArgs } from "../../utils/package-runner";

type UltraciteEditor =
  | "vscode"
  | "cursor"
  | "windsurf"
  | "antigravity"
  | "kiro"
  | "trae"
  | "void"
  | "zed";

type UltraciteAgent =
  | "claude"
  | "codex"
  | "jules"
  | "copilot"
  | "cline"
  | "amp"
  | "aider"
  | "firebase-studio"
  | "open-hands"
  | "gemini"
  | "junie"
  | "augmentcode"
  | "kilo-code"
  | "goose"
  | "roo-code"
  | "warp"
  | "droid"
  | "opencode"
  | "crush"
  | "qwen"
  | "amazon-q-cli"
  | "firebender";

type UltraciteHook = "cursor" | "windsurf";

type UltraciteLinter = "biome" | "eslint" | "oxlint";

const EDITORS = {
  vscode: { label: "VS Code" },
  cursor: { label: "Cursor" },
  windsurf: { label: "Windsurf" },
  antigravity: { label: "Antigravity" },
  kiro: { label: "Kiro" },
  trae: { label: "Trae" },
  void: { label: "Void" },
  zed: { label: "Zed" },
} as const;

const AGENTS = {
  claude: { label: "Claude" },
  codex: { label: "Codex" },
  jules: { label: "Jules" },
  copilot: { label: "GitHub Copilot" },
  cline: { label: "Cline" },
  amp: { label: "Amp" },
  aider: { label: "Aider" },
  "firebase-studio": { label: "Firebase Studio" },
  "open-hands": { label: "Open Hands" },
  gemini: { label: "Gemini" },
  junie: { label: "Junie" },
  augmentcode: { label: "AugmentCode" },
  "kilo-code": { label: "Kilo Code" },
  goose: { label: "Goose" },
  "roo-code": { label: "Roo Code" },
  warp: { label: "Warp" },
  droid: { label: "Droid" },
  opencode: { label: "OpenCode" },
  crush: { label: "Crush" },
  qwen: { label: "Qwen" },
  "amazon-q-cli": { label: "Amazon Q CLI" },
  firebender: { label: "Firebender" },
} as const;

const HOOKS = {
  cursor: { label: "Cursor" },
  windsurf: { label: "Windsurf" },
} as const;

const LINTERS = {
  biome: { label: "Biome (recommended)" },
  oxlint: { label: "OxLint" },
  eslint: { label: "ESLint" },
} as const;

function getFrameworksFromFrontend(frontend: string[]): string[] {
  const frameworkMap: Record<string, string> = {
    "tanstack-router": "react",
    "react-router": "react",
    "tanstack-start": "react",
    next: "next",
    nuxt: "vue",
    "native-bare": "react",
    "native-uniwind": "react",
    "native-unistyles": "react",
    svelte: "svelte",
    solid: "solid",
  };

  const frameworks = new Set<string>();

  for (const f of frontend) {
    if (f !== "none" && frameworkMap[f]) {
      frameworks.add(frameworkMap[f]);
    }
  }

  return Array.from(frameworks);
}

export async function setupUltracite(config: ProjectConfig, hasHusky: boolean) {
  const { packageManager, projectDir, frontend } = config;

  try {
    log.info("Setting up Ultracite...");

    // Dependencies (biome, husky, lint-staged) are added by template-generator
    // This only handles interactive prompts and external CLI init

    const result = await group(
      {
        linter: () =>
          select<UltraciteLinter>({
            message: "Choose linter/formatter",
            options: Object.entries(LINTERS).map(([key, linter]) => ({
              value: key as UltraciteLinter,
              label: linter.label,
            })),
            initialValue: "biome" as UltraciteLinter,
          }),
        editors: () =>
          multiselect<UltraciteEditor>({
            message: "Choose editors",
            options: Object.entries(EDITORS).map(([key, editor]) => ({
              value: key as UltraciteEditor,
              label: editor.label,
            })),
            required: true,
          }),
        agents: () =>
          autocompleteMultiselect<UltraciteAgent>({
            message: "Choose agents",
            options: Object.entries(AGENTS).map(([key, agent]) => ({
              value: key as UltraciteAgent,
              label: agent.label,
            })),
            required: true,
          }),
        hooks: () =>
          autocompleteMultiselect<UltraciteHook>({
            message: "Choose hooks (optional)",
            options: Object.entries(HOOKS).map(([key, hook]) => ({
              value: key as UltraciteHook,
              label: hook.label,
            })),
          }),
      },
      {
        onCancel: () => {
          exitCancelled("Operation cancelled");
        },
      },
    );

    const linter = result.linter as UltraciteLinter;
    const editors = result.editors as UltraciteEditor[];
    const agents = result.agents as UltraciteAgent[];
    const hooks = result.hooks as UltraciteHook[];
    const frameworks = getFrameworksFromFrontend(frontend);

    const ultraciteArgs = ["init", "--pm", packageManager, "--linter", linter];

    if (frameworks.length > 0) {
      ultraciteArgs.push("--frameworks", ...frameworks);
    }

    if (editors.length > 0) {
      ultraciteArgs.push("--editors", ...editors);
    }

    if (agents.length > 0) {
      ultraciteArgs.push("--agents", ...agents);
    }

    if (hooks.length > 0) {
      ultraciteArgs.push("--hooks", ...hooks);
    }

    if (hasHusky) {
      ultraciteArgs.push("--integrations", "husky", "lint-staged");
    }

    const ultraciteArgsString = ultraciteArgs.join(" ");
    const commandWithArgs = `ultracite@latest ${ultraciteArgsString} --skip-install`;
    const args = getPackageExecutionArgs(packageManager, commandWithArgs);

    const s = spinner();
    s.start("Running Ultracite init command...");

    await $({ cwd: projectDir, env: { CI: "true" } })`${args}`;

    // Dependencies are added by template-generator's addons-deps.ts

    s.stop("Ultracite setup successfully!");
  } catch (error) {
    log.error(pc.red("Failed to set up Ultracite"));
    if (error instanceof Error) {
      console.error(pc.red(error.message));
    }
  }
}
