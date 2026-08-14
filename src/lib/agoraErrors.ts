export function getAgoraJoinErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("NotAllowedError") || message.includes("Permission")) {
    return "Camera or microphone access was denied. Allow permissions and try again.";
  }

  if (
    message.includes("CAN_NOT_GET_GATEWAY_SERVER") ||
    message.includes("dynamic use static key")
  ) {
    return [
      "Agora authentication failed. Ensure AGORA_APP_CERTIFICATE is set in .env",
      "and restart the dev server so tokens can be generated.",
    ].join(" ");
  }

  if (message.includes("AGORA_APP_CERTIFICATE") || message.includes("Failed to fetch Agora token")) {
    return message;
  }

  if (message.includes("INVALID_VENDOR_KEY") || message.includes("INVALID_APP_ID")) {
    return "Invalid Agora App ID. Check VITE_AGORA_APP_ID in your .env file.";
  }

  return message || "Failed to join call";
}
