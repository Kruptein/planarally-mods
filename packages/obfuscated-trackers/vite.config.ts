import { resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    define: {
        "process.env": {},
    },
    build: {
        minify: true,
        lib: {
            entry: resolve(__dirname, "src/main.ts"),
            name: "ObfuscatedTrackers",
            fileName: "obfuscated-trackers",
            formats: ["es"],
        },
        rollupOptions: {
            external: ["vue"],
            output: {
                globals: { vue: "Vue" },
            },
        },
    },
});
