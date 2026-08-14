import agoraToken from "agora-token";

const { RtcRole, RtcTokenBuilder } = agoraToken as {
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
};

const TOKEN_TTL_SECONDS = 60 * 60 * 24;

export interface AgoraTokenConfig {
  appId: string;
  appCertificate: string;
}

export function generateAgoraToken(
  config: AgoraTokenConfig,
  channel: string,
  uid: string,
): string {
  const { appId, appCertificate } = config;

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
