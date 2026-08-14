import type { RoomConfig } from "../types/room";

export interface RoomConfigProvider {
  encode(config: RoomConfig): string;
  decode(encoded: string): RoomConfig | null;
  buildJoinUrl(roomId: string, config: RoomConfig): string;
  parseJoinUrl(pathname: string, search: string): {
    roomId: string;
    config: RoomConfig;
  } | null;
}

const DEFAULT_CONFIG: RoomConfig = {
  name: "Meeting",
  maxParticipants: 10,
  identityMode: "anonymous",
  audioPolicy: "unmuted",
  videoPolicy: "optional",
};

function clampParticipants(value: number): number {
  return Math.min(10, Math.max(2, Math.round(value)));
}

function normalizeConfig(raw: Partial<RoomConfig>): RoomConfig {
  return {
    name: raw.name?.trim() || DEFAULT_CONFIG.name,
    maxParticipants: clampParticipants(
      raw.maxParticipants ?? DEFAULT_CONFIG.maxParticipants,
    ),
    identityMode:
      raw.identityMode === "required" ? "required" : "anonymous",
    audioPolicy: raw.audioPolicy === "muted" ? "muted" : "unmuted",
    videoPolicy: raw.videoPolicy === "required" ? "required" : "optional",
  };
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  const base64 = padded + "=".repeat(padLength);
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export class UrlRoomConfigProvider implements RoomConfigProvider {
  encode(config: RoomConfig): string {
    return toBase64Url(JSON.stringify(normalizeConfig(config)));
  }

  decode(encoded: string): RoomConfig | null {
    try {
      const json = fromBase64Url(encoded);
      return normalizeConfig(JSON.parse(json) as Partial<RoomConfig>);
    } catch {
      return null;
    }
  }

  buildJoinUrl(roomId: string, config: RoomConfig): string {
    const cfg = this.encode(config);
    return `${window.location.origin}/join/${roomId}?cfg=${cfg}`;
  }

  parseJoinUrl(pathname: string, search: string): {
    roomId: string;
    config: RoomConfig;
  } | null {
    const match = pathname.match(/\/join\/([^/]+)$/);
    if (!match) return null;

    const params = new URLSearchParams(search);
    const encoded = params.get("cfg");
    if (!encoded) return null;

    const config = this.decode(encoded);
    if (!config) return null;

    return { roomId: match[1], config };
  }
}

export const roomConfigProvider = new UrlRoomConfigProvider();

export function generateRoomId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

export function getAnonymousName(uid: string): string {
  return `Guest ${uid.slice(-4)}`;
}

export function getSessionUid(roomId: string): string {
  const key = `letschat-uid-${roomId}`;
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;

  const uid = String(Math.floor(Math.random() * 900000) + 100000);
  sessionStorage.setItem(key, uid);
  return uid;
}

export function getStoredDisplayName(roomId: string): string | null {
  return sessionStorage.getItem(`letschat-name-${roomId}`);
}

export function storeDisplayName(roomId: string, name: string): void {
  sessionStorage.setItem(`letschat-name-${roomId}`, name);
}
