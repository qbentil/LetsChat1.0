import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { agoraTokenPlugin } from "./plugins/vite-plugin-agora-token";

export default defineConfig({
  plugins: [react(), agoraTokenPlugin()],
});
