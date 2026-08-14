declare module "agora-rtm-sdk" {
  interface RtmMessage {
    text: string;
  }

  interface RtmChannel {
    join(): Promise<void>;
    leave(): Promise<void>;
    sendMessage(message: RtmMessage): Promise<void>;
    on(event: "ChannelMessage", listener: (message: RtmMessage, memberId: string) => void): void;
    on(event: "MemberJoined", listener: (memberId: string) => void): void;
  }

  interface RtmClient {
    login(options: { uid: string; token?: string | null }): Promise<void>;
    logout(): Promise<void>;
    createChannel(name: string): RtmChannel;
  }

  const AgoraRTM: {
    createInstance(appId: string): RtmClient;
  };

  export default AgoraRTM;
}
