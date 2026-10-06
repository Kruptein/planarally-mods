import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    define: {
        "process.env": {},
    },
    // This is required if you want to include files (e.g. fonts) in no-inline mode
    base: "./",
    build: {
        minify: false,
        lib: {
            entry: resolve(import.meta.dirname, "src/main.ts"),
            name: "Wildsea",
            fileName: "index",
            formats: ["es"],
        },
        rolldownOptions: {
            external: ["vue"],
            output: {
                globals: { vue: "Vue" },
                assetFileNames: "[name].[ext]",
            },
        },
    },
});
