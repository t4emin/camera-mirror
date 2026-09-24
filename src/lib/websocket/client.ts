import type { PeerRole } from "@/types/room";
import type { SignalMessage } from "@/types/signaling";
import type { ClientMessage, ServerMessage } from "@/types/websocket";
import type { CapturedImagePayload } from "@/types/camera";

type MessageHandler = (message: ServerMessage) => void;

export class SignalingClient {
  private socket?: WebSocket;
  private connectPromise?: Promise<void>;
  private readonly handlers = new Set<MessageHandler>();

  connect(): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    const socket = new WebSocket(createWebSocketUrl());
    this.socket = socket;

    socket.addEventListener("message", (event) => {
      const message = parseServerMessage(event.data);

      if (!message) {
        return;
      }

      this.handlers.forEach((handler) => handler(message));
    });

    this.connectPromise = new Promise((resolve, reject) => {
      socket.addEventListener(
        "open",
        () => {
          this.connectPromise = undefined;
          resolve();
        },
        { once: true }
      );
      socket.addEventListener(
        "error",
        () => {
          this.connectPromise = undefined;
          reject(new Error("Unable to connect signaling server."));
        },
        { once: true }
      );
    });

    return this.connectPromise;
  }

  createRoom(peerId: string): void {
    this.send({
      type: "create-room",
      peerId
    });
  }

  joinRoom(roomId: string, role: PeerRole, peerId: string): void {
    this.send({
      type: "join-room",
      roomId,
      role,
      peerId
    });
  }

  approveMonitor(roomId: string, peerId: string): void {
    this.send({
      type: "approve-monitor",
      roomId,
      peerId
    });
  }

  sendSignal(message: SignalMessage): void {
    this.send(message);
  }

  sendCapture(roomId: string): void {
    this.send({
      type: "capture",
      roomId
    });
  }

  sendCaptureResult(payload: CapturedImagePayload): void {
    this.send({
      type: "capture-result",
      ...payload
    });
  }

  onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  close(): void {
    this.socket?.close();
    this.socket = undefined;
    this.connectPromise = undefined;
    this.handlers.clear();
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  private send(message: ClientMessage): void {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      throw new Error("Signaling server is not connected.");
    }

    this.socket.send(JSON.stringify(message));
  }
}

export function createPeerId(prefix: PeerRole): string {
  const randomPart = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `${prefix}-${randomPart}`;
}

function createWebSocketUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/api/ws`;
}

function parseServerMessage(value: unknown): ServerMessage | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "type" in parsed &&
      typeof parsed.type === "string"
    ) {
      return parsed as ServerMessage;
    }
  } catch {
    return undefined;
  }

  return undefined;
}
