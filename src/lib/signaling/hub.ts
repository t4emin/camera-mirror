import { RoomError, RoomManager } from "@/lib/room/roomManager";
import { parseClientMessage } from "@/lib/websocket/messages";
import type { ServerMessage } from "@/types/websocket";

export interface SignalingSocket {
  send(data: string): void;
  readyState: number;
}

const OPEN = 1;

const rooms = new RoomManager();
const peers = new Map<SignalingSocket, { roomId?: string; peerId?: string }>();

export function registerSignalingSocket(socket: SignalingSocket): void {
  peers.set(socket, {});
}

export function handleSignalingMessage(
  socket: SignalingSocket,
  data: string
): void {
  const parsed = parseClientMessage(data);

  if (!parsed) {
    send(socket, { type: "error", message: "Invalid message" });
    return;
  }

  try {
    if (parsed.type === "create-room") {
      const room = rooms.createRoom(parsed.peerId);
      peers.set(socket, { roomId: room.id, peerId: parsed.peerId });
      send(socket, { type: "room-created", roomId: room.id });
      broadcastRoomState(room.id);
      return;
    }

    if (parsed.type === "join-room") {
      const room = rooms.joinRoom(parsed.roomId, parsed.role, parsed.peerId);
      peers.set(socket, {
        roomId: parsed.roomId,
        peerId: parsed.peerId
      });

      if (parsed.role === "monitor" && room.pendingMonitor) {
        broadcastToRoom(parsed.roomId, {
          type: "pair-request",
          roomId: parsed.roomId,
          peerId: parsed.peerId
        });
      }

      broadcastRoomState(room.id);
      return;
    }

    if (parsed.type === "approve-monitor") {
      const room = rooms.approveMonitor(parsed.roomId, parsed.peerId);
      broadcastRoomState(room.id);
      return;
    }

    if (
      parsed.type === "offer" ||
      parsed.type === "answer" ||
      parsed.type === "ice-candidate" ||
      parsed.type === "capture" ||
      parsed.type === "capture-result"
    ) {
      broadcastToRoom(parsed.roomId, parsed, socket);
    }
  } catch (error) {
    send(socket, {
      type: "error",
      message:
        error instanceof RoomError || error instanceof Error
          ? error.message
          : "Room operation failed"
    });
  }
}

export function unregisterSignalingSocket(socket: SignalingSocket): void {
  const peer = peers.get(socket);
  peers.delete(socket);

  if (!peer?.roomId || !peer.peerId) {
    return;
  }

  const room = rooms.leaveRoom(peer.roomId, peer.peerId);

  if (room) {
    broadcastRoomState(room.id);
  }
}

function broadcastRoomState(roomId: string): void {
  const room = rooms.getRoom(roomId);

  if (!room) {
    return;
  }

  broadcastToRoom(roomId, {
    type: "room-state",
    roomId,
    state: room.state
  });
}

function broadcastToRoom(
  roomId: string,
  message: ServerMessage,
  except?: SignalingSocket
): void {
  peers.forEach((peer, socket) => {
    if (socket === except || peer.roomId !== roomId) {
      return;
    }

    send(socket, message);
  });
}

function send(socket: SignalingSocket, message: ServerMessage): void {
  if (socket.readyState === OPEN) {
    socket.send(JSON.stringify(message));
  }
}
