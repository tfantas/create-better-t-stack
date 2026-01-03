import type { ProjectConfig } from "../../types";

import { setupFumadocs } from "./fumadocs-setup";
import { setupStarlight } from "./starlight-setup";
import { setupTauri } from "./tauri-setup";
import { setupTui } from "./tui-setup";
import { setupWxt } from "./wxt-setup";

export async function setupAddons(config: ProjectConfig) {
  const { addons, frontend } = config;
  const hasReactWebFrontend =
    frontend.includes("react-router") ||
    frontend.includes("tanstack-router") ||
    frontend.includes("next");
  const hasNuxtFrontend = frontend.includes("nuxt");
  const hasSvelteFrontend = frontend.includes("svelte");
  const hasSolidFrontend = frontend.includes("solid");
  const hasNextFrontend = frontend.includes("next");

  if (
    addons.includes("tauri") &&
    (hasReactWebFrontend ||
      hasNuxtFrontend ||
      hasSvelteFrontend ||
      hasSolidFrontend ||
      hasNextFrontend)
  ) {
    await setupTauri(config);
  }

  if (addons.includes("starlight")) {
    await setupStarlight(config);
  }

  if (addons.includes("fumadocs")) {
    await setupFumadocs(config);
  }

  if (addons.includes("opentui")) {
    await setupTui(config);
  }

  if (addons.includes("wxt")) {
    await setupWxt(config);
  }
}
