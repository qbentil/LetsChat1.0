import { useCallback, useEffect, useRef, useState } from "react";
import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";
import { AGORA_APP_ID, createAgoraClient, createLocalTracks } from "../lib/agora";
import { getAgoraJoinErrorMessage } from "../lib/agoraErrors";
import { fetchAgoraToken } from "../lib/fetchAgoraToken";
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
  const audioPublishedRef = useRef(false);

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
      audioPublishedRef.current && (localAudioRef.current?.enabled ?? false),
      localVideoRef.current?.enabled ?? false,
      localVideoRef.current,
      localAudioRef.current,
    );

    const remoteParticipants = client.remoteUsers.map((user) =>
      mapRemoteUser(user, displayNamesRef.current),
    );

    setParticipants([localParticipant, ...remoteParticipants]);
  }, []);

  const subscribeToRemoteUser = useCallback(
    async (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video" | "datachannel") => {
      const client = clientRef.current;
      if (!client || mediaType === "datachannel") return;

      await client.subscribe(user, mediaType);
      if (mediaType === "audio" && user.audioTrack) {
        user.audioTrack.play();
      }
      syncParticipants();
    },
    [syncParticipants],
  );

  const subscribeToExistingUsers = useCallback(
    async (client: IAgoraRTCClient) => {
      for (const user of client.remoteUsers) {
        if (user.hasAudio) {
          await subscribeToRemoteUser(user, "audio");
        }
        if (user.hasVideo) {
          await subscribeToRemoteUser(user, "video");
        }
      }
    },
    [subscribeToRemoteUser],
  );

  const leaveCall = useCallback(async () => {
    joinedRef.current = false;
    joiningRef.current = false;
    audioPublishedRef.current = false;

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
        client.on("user-published", (user, mediaType) => {
          void subscribeToRemoteUser(user, mediaType);
        });
        client.on("user-unpublished", () => syncParticipants());

        const rtcToken = await fetchAgoraToken(roomId, uid, "rtc");
        await client.join(AGORA_APP_ID, roomId, rtcToken, uid);

        await subscribeToExistingUsers(client);

        if (client.remoteUsers.length + 1 > config.maxParticipants) {
          await leaveCall();
          setStatus("room_full");
          return;
        }

        const [audioTrack, videoTrack] = await createLocalTracks();
        localAudioRef.current = audioTrack;
        localVideoRef.current = videoTrack;

        if (micOn) {
          await client.publish([audioTrack, videoTrack]);
          audioPublishedRef.current = true;
        } else {
          await client.publish([videoTrack]);
          audioPublishedRef.current = false;
        }

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
        setError(getAgoraJoinErrorMessage(joinError));
        setStatus("error");
      } finally {
        joiningRef.current = false;
      }
    },
    [chat, leaveCall, subscribeToExistingUsers, subscribeToRemoteUser, syncParticipants],
  );

  const toggleMic = useCallback(async () => {
    const track = localAudioRef.current;
    const client = clientRef.current;
    if (!track || !client) return;

    const next = !isMicOn;

    if (next) {
      await track.setEnabled(true);
      if (!audioPublishedRef.current) {
        await client.publish([track]);
        audioPublishedRef.current = true;
      }
    } else if (audioPublishedRef.current) {
      await track.setEnabled(false);
    }

    setIsMicOn(next);
    syncParticipants();
  }, [isMicOn, syncParticipants]);

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
