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
        minify: false,
        lib: {
            entry: resolve(__dirname, "src/main.ts"),
            name: "SimpleCharSheet",
            fileName: "simple-char-sheet",
            formats: ["es"],
        },
        rollupOptions: {
            external: ["vue"],
            output: {
                globals: { vue: "Vue" },
                assetFileNames: "simple-char-sheet.[ext]",
            },
        },
    },
});
