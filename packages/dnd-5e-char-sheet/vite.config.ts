import { modOptions } from "@planarally/mod-api/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig(({ command }) =>
    modOptions(command, { name: "5e", port: 5273, root: import.meta.dirname, vue }),
);
