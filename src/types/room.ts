export type IdentityMode = "anonymous" | "required";
export type AudioPolicy = "unmuted" | "muted";
export type VideoPolicy = "optional" | "required";

export interface RoomConfig {
  name: string;
  maxParticipants: number;
  identityMode: IdentityMode;
  audioPolicy: AudioPolicy;
  videoPolicy: VideoPolicy;
}

export interface Participant {
  uid: string;
  displayName: string;
  isLocal: boolean;
  hasAudio: boolean;
  hasVideo: boolean;
  videoTrack?: import("agora-rtc-sdk-ng").ICameraVideoTrack | null;
  audioTrack?: import("agora-rtc-sdk-ng").IMicrophoneAudioTrack | null;
}

export type CallStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "room_full"
  | "expired"
  | "error";

export interface JoinOptions {
  roomId: string;
  config: RoomConfig;
  displayName: string;
}
