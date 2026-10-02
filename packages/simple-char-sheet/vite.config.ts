import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    define: {
        "process.env": {},
    },
    build: {
        minify: false,
        lib: {
            entry: resolve(import.meta.dirname, "src/main.ts"),
            name: "SimpleCharSheet",
            fileName: "index",
            formats: ["es"],
        },
        rolldownOptions: {
            // This is important, we want to avoid bundling vue with the mod itself.
            // PA exposes Vue globally so it would just be a waste of space
            // but it also simply wouldn't work as the two Vue instances would be separate.
            external: ["vue"],
            output: {
                globals: { vue: "Vue" },
                assetFileNames: "[name].[ext]",
            },
        },
    },
});
