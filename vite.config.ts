import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { agoraTokenPlugin } from "./plugins/vite-plugin-agora-token";
import { roomSessionPlugin } from "./plugins/vite-plugin-room-session";

export default defineConfig({
  plugins: [react(), agoraTokenPlugin(), roomSessionPlugin()],
});
