import agoraToken from "agora-token";

const { RtcRole, RtcTokenBuilder, RtmTokenBuilder } = agoraToken as {
  RtcRole: { PUBLISHER: number };
  RtcTokenBuilder: {
    buildTokenWithUid: (
      appId: string,
      appCertificate: string,
      channelName: string,
      uid: string | number,
      role: number,
      tokenExpire: number,
      privilegeExpire: number,
    ) => string;
  };
  RtmTokenBuilder: {
    buildToken: (
      appId: string,
      appCertificate: string,
      userId: string | number,
      expire: number,
    ) => string;
  };
};

const TOKEN_TTL_SECONDS = 60 * 60 * 24;

export type AgoraTokenType = "rtc" | "rtm";

export interface AgoraTokenConfig {
  appId: string;
  appCertificate: string;
}

export function generateAgoraToken(
  config: AgoraTokenConfig,
  channel: string,
  uid: string,
  type: AgoraTokenType,
): string {
  const { appId, appCertificate } = config;

  if (type === "rtm") {
    return RtmTokenBuilder.buildToken(appId, appCertificate, uid, TOKEN_TTL_SECONDS);
  }

  return RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channel,
    uid,
    RtcRole.PUBLISHER,
    TOKEN_TTL_SECONDS,
    TOKEN_TTL_SECONDS,
  );
}
