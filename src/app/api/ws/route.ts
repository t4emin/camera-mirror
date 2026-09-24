import {
  experimental_upgradeWebSocket,
  type WebSocketData
} from "@vercel/functions";
import {
  handleSignalingMessage,
  registerSignalingSocket,
  unregisterSignalingSocket
} from "@/lib/signaling/hub";
import type { SignalingSocket } from "@/lib/signaling/hub";

export const runtime = "nodejs";
export const maxDuration = 300;

export function GET() {
  return experimental_upgradeWebSocket((socket) => {
    const signalingSocket = socket as unknown as SignalingSocket;

    registerSignalingSocket(signalingSocket);

    socket.on("message", (data: WebSocketData) => {
      handleSignalingMessage(signalingSocket, data.toString());
    });

    socket.on("close", () => {
      unregisterSignalingSocket(signalingSocket);
    });
  });
}
