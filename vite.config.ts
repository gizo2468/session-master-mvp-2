
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
      external: (id) => {
        // Externalize Capacitor modules for web builds
        if (id.includes('@capacitor/')) {
          return false; // Don't externalize, include in bundle
        }
        return false;
      }
    }
  },
  define: {
    // Define global constants for conditional compilation
    __CAPACITOR__: JSON.stringify(process.env.CAPACITOR_PLATFORM || 'web')
  }
}));
