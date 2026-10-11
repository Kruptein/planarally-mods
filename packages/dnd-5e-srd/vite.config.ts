import { modOptions } from "@planarally/mod-api/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig, type UserConfig } from "vite";

export default defineConfig(
    ({ command }) => modOptions(command, { name: "SRD51", port: 5274, root: import.meta.dirname, vue }) as UserConfig,
);
