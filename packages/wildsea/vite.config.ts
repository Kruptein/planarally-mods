import { resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

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
            entry: resolve(__dirname, "src/main.ts"),
            name: "Wildsea",
            fileName: "index",
            formats: ["es"],
        },
        rollupOptions: {
            external: ["vue"],
            output: {
                globals: { vue: "Vue" },
                assetFileNames: "[name].[ext]",
            },
        },
    },
});
