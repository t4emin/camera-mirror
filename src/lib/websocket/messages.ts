import type { ClientMessage } from "@/types/websocket";

const CLIENT_MESSAGE_TYPES = new Set([
  "create-room",
  "join-room",
  "approve-monitor",
  "capture",
  "capture-result",
  "offer",
  "answer",
  "ice-candidate"
]);

export function parseClientMessage(value: string): ClientMessage | undefined {
  try {
    const parsed: unknown = JSON.parse(value);
    return isClientMessage(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function isClientMessage(value: unknown): value is ClientMessage {
  if (!isRecord(value) || typeof value.type !== "string") {
    return false;
  }

  if (!CLIENT_MESSAGE_TYPES.has(value.type)) {
    return false;
  }

  switch (value.type) {
    case "create-room":
      return typeof value.peerId === "string";
    case "join-room":
      return (
        typeof value.peerId === "string" &&
        typeof value.roomId === "string" &&
        (value.role === "camera" || value.role === "monitor")
      );
    case "approve-monitor":
      return typeof value.roomId === "string" && typeof value.peerId === "string";
    case "capture":
      return typeof value.roomId === "string";
    case "capture-result":
      return (
        typeof value.roomId === "string" &&
        typeof value.dataUrl === "string" &&
        typeof value.mimeType === "string" &&
        (value.source === "image-capture" || value.source === "canvas")
      );
    case "offer":
    case "answer":
      return typeof value.roomId === "string" && isRecord(value.sdp);
    case "ice-candidate":
      return typeof value.roomId === "string" && isRecord(value.candidate);
    default:
      return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
