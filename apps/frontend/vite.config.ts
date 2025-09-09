import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    port: 5173,
    host: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  preview: {
    port: 5173,
    host: true,
  },
  build: {
    commonjsOptions: { transformMixedEsModules: true },
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['@react-router/dev'],
        }
      }
    }
  },
  resolve:
    process.env.NODE_ENV === "development"
      ? {}
      : {
          alias: {
            "react-dom/server": "react-dom/server.node",
          },
        },
});
