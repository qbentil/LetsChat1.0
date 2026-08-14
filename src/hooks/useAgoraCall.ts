import { useCallback, useEffect, useRef, useState } from "react";
import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";
import { AGORA_APP_ID, createAgoraClient, createLocalTracks } from "../lib/agora";
import { connectRtmService, type RtmService } from "../lib/rtmService";
import { getAnonymousName, getSessionUid } from "../services/roomConfig";
import { useCallChat } from "./useCallChat";
import type { CallStatus, JoinOptions, Participant } from "../types/room";

interface UseAgoraCallResult {
  status: CallStatus;
  error: string | null;
  participants: Participant[];
  isMicOn: boolean;
  isCameraOn: boolean;
  joinCall: (options: JoinOptions) => Promise<void>;
  leaveCall: () => Promise<void>;
  toggleMic: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  canToggleCamera: boolean;
  localUid: string;
  localDisplayName: string;
  messages: ReturnType<typeof useCallChat>["messages"];
  isChatOpen: boolean;
  unreadCount: number;
  chatReady: boolean;
  openChat: () => void;
  closeChat: () => void;
  sendChatMessage: (text: string) => Promise<void>;
}

function buildParticipant(
  uid: string,
  displayName: string,
  isLocal: boolean,
  hasAudio: boolean,
  hasVideo: boolean,
  videoTrack?: ICameraVideoTrack | null,
  audioTrack?: IMicrophoneAudioTrack | null,
): Participant {
  return {
    uid,
    displayName,
    isLocal,
    hasAudio,
    hasVideo,
    videoTrack,
    audioTrack,
  };
}

function mapRemoteUser(
  user: IAgoraRTCRemoteUser,
  displayNames: Map<string, string>,
): Participant {
  const uid = String(user.uid);
  return buildParticipant(
    uid,
    displayNameFor(uid, displayNames),
    false,
    user.hasAudio,
    user.hasVideo,
    user.videoTrack as ICameraVideoTrack | undefined,
    null,
  );
}

function displayNameFor(uid: string, displayNames: Map<string, string>): string {
  return displayNames.get(uid) ?? getAnonymousName(uid);
}

export function useAgoraCall(): UseAgoraCallResult {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoRef = useRef<ICameraVideoTrack | null>(null);
  const joinedRef = useRef(false);
  const joiningRef = useRef(false);
  const displayNamesRef = useRef<Map<string, string>>(new Map());
  const rtmRef = useRef<RtmService | null>(null);

  const [status, setStatus] = useState<CallStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [canToggleCamera, setCanToggleCamera] = useState(true);
  const [localUid, setLocalUid] = useState("");
  const [localDisplayName, setLocalDisplayName] = useState("");

  const chat = useCallChat(localUid, localDisplayName, rtmRef);

  const syncParticipants = useCallback(() => {
    const client = clientRef.current;
    if (!client || !joinedRef.current) return;

    const uid = String(client.uid ?? "");
    const localParticipant = buildParticipant(
      uid,
      displayNameFor(uid, displayNamesRef.current),
      true,
      localAudioRef.current?.enabled ?? false,
      localVideoRef.current?.enabled ?? false,
      localVideoRef.current,
      localAudioRef.current,
    );

    const remoteParticipants = client.remoteUsers.map((user) =>
      mapRemoteUser(user, displayNamesRef.current),
    );

    setParticipants([localParticipant, ...remoteParticipants]);
  }, []);

  const leaveCall = useCallback(async () => {
    joinedRef.current = false;
    joiningRef.current = false;

    localAudioRef.current?.stop();
    localAudioRef.current?.close();
    localVideoRef.current?.stop();
    localVideoRef.current?.close();
    localAudioRef.current = null;
    localVideoRef.current = null;

    if (rtmRef.current) {
      await rtmRef.current.leave().catch(() => undefined);
      rtmRef.current = null;
    }

    const client = clientRef.current;
    if (client) {
      await client.leave().catch(() => undefined);
      client.removeAllListeners();
      clientRef.current = null;
    }

    chat.resetChat();
    setParticipants([]);
    setLocalUid("");
    setLocalDisplayName("");
    setStatus("idle");
  }, [chat]);

  const joinCall = useCallback(
    async (options: JoinOptions) => {
      if (joinedRef.current || joiningRef.current) return;

      joiningRef.current = true;
      setStatus("connecting");
      setError(null);

      const { roomId, config, displayName } = options;
      const uid = getSessionUid(roomId);
      displayNamesRef.current.set(uid, displayName);
      setLocalUid(uid);
      setLocalDisplayName(displayName);

      const micOn = config.audioPolicy === "unmuted";
      const cameraLocked = config.videoPolicy === "required";

      setIsMicOn(micOn);
      setIsCameraOn(true);
      setCanToggleCamera(!cameraLocked);

      try {
        const client = createAgoraClient();
        clientRef.current = client;

        client.on("user-joined", () => syncParticipants());
        client.on("user-left", () => syncParticipants());
        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          syncParticipants();
        });
        client.on("user-unpublished", () => syncParticipants());

        await client.join(AGORA_APP_ID, roomId, null, uid);

        if (client.remoteUsers.length + 1 > config.maxParticipants) {
          await leaveCall();
          setStatus("room_full");
          return;
        }

        const [audioTrack, videoTrack] = await createLocalTracks();
        localAudioRef.current = audioTrack;
        localVideoRef.current = videoTrack;

        if (!micOn) {
          await audioTrack.setEnabled(false);
        }

        await client.publish([audioTrack, videoTrack]);

        joinedRef.current = true;
        setStatus("connected");
        syncParticipants();

        void connectRtmService(
          roomId,
          uid,
          displayName,
          displayNamesRef,
          syncParticipants,
          chat.handleIncomingChat,
        ).then((service) => {
          if (service) {
            rtmRef.current = service;
            chat.markChatReady();
          }
        });
      } catch (joinError) {
        await leaveCall();

        let message =
          joinError instanceof Error ? joinError.message : "Failed to join call";

        if (message.includes("NotAllowedError") || message.includes("Permission")) {
          message =
            "Camera or microphone access was denied. Allow permissions and try again.";
        }

        setError(message);
        setStatus("error");
      } finally {
        joiningRef.current = false;
      }
    },
    [chat, leaveCall, syncParticipants],
  );

  const toggleMic = useCallback(async () => {
    const track = localAudioRef.current;
    if (!track) return;

    const next = !track.enabled;
    await track.setEnabled(next);
    setIsMicOn(next);
    syncParticipants();
  }, [syncParticipants]);

  const toggleCamera = useCallback(async () => {
    if (!canToggleCamera) return;

    const track = localVideoRef.current;
    if (!track) return;

    const next = !track.enabled;
    await track.setEnabled(next);
    setIsCameraOn(next);
    syncParticipants();
  }, [canToggleCamera, syncParticipants]);

  useEffect(() => {
    const handleUnload = () => {
      void leaveCall();
    };

    window.addEventListener("pagehide", handleUnload);
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("pagehide", handleUnload);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [leaveCall]);

  return {
    status,
    error,
    participants,
    isMicOn,
    isCameraOn,
    joinCall,
    leaveCall,
    toggleMic,
    toggleCamera,
    canToggleCamera,
    localUid,
    localDisplayName,
    messages: chat.messages,
    isChatOpen: chat.isChatOpen,
    unreadCount: chat.unreadCount,
    chatReady: chat.chatReady,
    openChat: chat.openChat,
    closeChat: chat.closeChat,
    sendChatMessage: chat.sendMessage,
  };
}
