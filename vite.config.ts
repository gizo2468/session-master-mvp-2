
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      // Externalize Capacitor modules for proper bundling
      external: (id) => {
        // Only externalize Capacitor modules when not in a native build
        if (id.includes('@capacitor/') && !process.env.CAPACITOR_PLATFORM) {
          return false; // Include in bundle for web builds
        }
        return false;
      }
    }
  },
  optimizeDeps: {
    include: ['@capacitor/core', '@capacitor/keyboard']
  }
}));
