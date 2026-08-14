import AgoraRTC from "agora-rtc-sdk-ng";

export const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID as string;

export function createAgoraClient() {
  if (!AGORA_APP_ID) {
    throw new Error("Missing VITE_AGORA_APP_ID environment variable.");
  }

  AgoraRTC.setLogLevel(3);
  return AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
}

export async function createLocalTracks() {
  return AgoraRTC.createMicrophoneAndCameraTracks(
    { encoderConfig: "music_standard" },
    { encoderConfig: "720p_1" },
  );
}

export { AgoraRTC };
