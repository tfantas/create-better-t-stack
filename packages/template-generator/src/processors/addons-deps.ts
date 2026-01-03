import type { ProjectConfig } from "@better-t-stack/types";

import type { VirtualFileSystem } from "../core/virtual-fs";

import { addPackageDependency } from "../utils/add-deps";

type PackageJson = {
  name?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  "lint-staged"?: Record<string, string | string[]>;
  [key: string]: unknown;
};

export function processAddonsDeps(vfs: VirtualFileSystem, config: ProjectConfig): void {
  if (!config.addons || config.addons.length === 0) return;

  const hasViteReactFrontend =
    config.frontend.includes("react-router") || config.frontend.includes("tanstack-router");
  const hasSolidFrontend = config.frontend.includes("solid");
  const hasPwaCompatibleFrontend = hasViteReactFrontend || hasSolidFrontend;

  if (config.addons.includes("turborepo")) {
    addPackageDependency({ vfs, packagePath: "package.json", devDependencies: ["turbo"] });
  }

  if (config.addons.includes("biome")) {
    addPackageDependency({ vfs, packagePath: "package.json", devDependencies: ["@biomejs/biome"] });
    const rootPkg = vfs.readJson<PackageJson>("package.json");
    if (rootPkg) {
      rootPkg.scripts = { ...rootPkg.scripts, check: "biome check --write ." };
      vfs.writeJson("package.json", rootPkg);
    }
  }

  if (config.addons.includes("husky")) {
    addPackageDependency({
      vfs,
      packagePath: "package.json",
      devDependencies: ["husky", "lint-staged"],
    });
    const rootPkg = vfs.readJson<PackageJson>("package.json");
    if (rootPkg) {
      rootPkg.scripts = { ...rootPkg.scripts, prepare: "husky" };
      if (config.addons.includes("oxlint")) {
        rootPkg["lint-staged"] = { "*": ["oxlint", "oxfmt --write"] };
      } else if (config.addons.includes("biome")) {
        rootPkg["lint-staged"] = {
          "*.{js,ts,cjs,mjs,d.cts,d.mts,jsx,tsx,json,jsonc}": ["biome check --write ."],
        };
      } else {
        rootPkg["lint-staged"] = { "**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx,vue,astro,svelte}": "" };
      }
      vfs.writeJson("package.json", rootPkg);
    }
  }

  if (config.addons.includes("oxlint")) {
    addPackageDependency({
      vfs,
      packagePath: "package.json",
      devDependencies: ["oxlint", "oxfmt"],
    });
    const rootPkg = vfs.readJson<PackageJson>("package.json");
    if (rootPkg) {
      rootPkg.scripts = { ...rootPkg.scripts, check: "oxlint && oxfmt --write" };
      vfs.writeJson("package.json", rootPkg);
    }
  }

  if (config.addons.includes("pwa") && hasPwaCompatibleFrontend) {
    const webPkgPath = "apps/web/package.json";
    if (vfs.exists(webPkgPath)) {
      addPackageDependency({
        vfs,
        packagePath: webPkgPath,
        dependencies: ["vite-plugin-pwa"],
        devDependencies: ["@vite-pwa/assets-generator"],
      });
      const webPkg = vfs.readJson<PackageJson>(webPkgPath);
      if (webPkg) {
        webPkg.scripts = { ...webPkg.scripts, "generate-pwa-assets": "pwa-assets-generator" };
        vfs.writeJson(webPkgPath, webPkg);
      }
    }
  }

  if (config.addons.includes("tauri")) {
    const webPkgPath = "apps/web/package.json";
    if (vfs.exists(webPkgPath)) {
      addPackageDependency({ vfs, packagePath: webPkgPath, devDependencies: ["@tauri-apps/cli"] });
      const webPkg = vfs.readJson<PackageJson>(webPkgPath);
      if (webPkg) {
        webPkg.scripts = {
          ...webPkg.scripts,
          tauri: "tauri",
          "desktop:dev": "tauri dev",
          "desktop:build": "tauri build",
        };
        vfs.writeJson(webPkgPath, webPkg);
      }
    }
  }
}
