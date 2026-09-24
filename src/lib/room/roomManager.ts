import type { PeerRole, RoomPeer, RoomSnapshot } from "@/types/room";

const ROOM_ID_ALPHABET = "0123456789";
const ROOM_ID_LENGTH = 6;

interface RoomRecord {
  id: string;
  camera?: RoomPeer;
  monitor?: RoomPeer;
  pendingMonitor?: RoomPeer;
}

export class RoomError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RoomError";
  }
}

export class RoomManager {
  private readonly rooms = new Map<string, RoomRecord>();

  createRoom(cameraPeerId: string): RoomSnapshot {
    const id = this.createUniqueRoomId();
    const room: RoomRecord = {
      id,
      camera: {
        id: cameraPeerId,
        role: "camera"
      }
    };

    this.rooms.set(id, room);
    return this.toSnapshot(room);
  }

  joinRoom(roomId: string, role: PeerRole, peerId: string): RoomSnapshot {
    const room = this.rooms.get(roomId);

    if (!room) {
      throw new RoomError("Room not found");
    }

    if (role === "camera") {
      if (room.camera && room.camera.id !== peerId) {
        throw new RoomError("Room already has a camera");
      }

      room.camera = { id: peerId, role };
    }

    if (role === "monitor") {
      if (
        (room.monitor && room.monitor.id !== peerId) ||
        (room.pendingMonitor && room.pendingMonitor.id !== peerId)
      ) {
        throw new RoomError("Room already has a monitor");
      }

      if (!room.monitor) {
        room.pendingMonitor = { id: peerId, role };
      }
    }

    return this.toSnapshot(room);
  }

  approveMonitor(roomId: string, cameraPeerId: string): RoomSnapshot {
    const room = this.rooms.get(roomId);

    if (!room) {
      throw new RoomError("Room not found");
    }

    if (room.camera?.id !== cameraPeerId) {
      throw new RoomError("Only the camera can approve this room");
    }

    if (!room.pendingMonitor) {
      throw new RoomError("No monitor is waiting for approval");
    }

    room.monitor = room.pendingMonitor;
    room.pendingMonitor = undefined;

    return this.toSnapshot(room);
  }

  leaveRoom(roomId: string, peerId: string): RoomSnapshot | undefined {
    const room = this.rooms.get(roomId);

    if (!room) {
      return undefined;
    }

    if (room.camera?.id === peerId) {
      room.camera = undefined;
      return this.toSnapshot(room);
    }

    if (room.monitor?.id === peerId) {
      room.monitor = undefined;
    }

    if (room.pendingMonitor?.id === peerId) {
      room.pendingMonitor = undefined;
    }

    return this.toSnapshot(room);
  }

  getRoom(roomId: string): RoomSnapshot | undefined {
    const room = this.rooms.get(roomId);
    return room ? this.toSnapshot(room) : undefined;
  }

  private createUniqueRoomId(): string {
    let id = generateRoomId();

    while (this.rooms.has(id)) {
      id = generateRoomId();
    }

    return id;
  }

  private toSnapshot(room: RoomRecord): RoomSnapshot {
    const state =
      room.camera && room.monitor
        ? "CONNECTED"
        : room.camera && room.pendingMonitor
          ? "CONNECTING"
        : room.monitor && !room.camera
          ? "DISCONNECTED"
          : "WAITING";

    return {
      id: room.id,
      state,
      camera: room.camera,
      monitor: room.monitor,
      pendingMonitor: room.pendingMonitor
    };
  }
}

export function generateRoomId(): string {
  let roomId = "";

  for (let index = 0; index < ROOM_ID_LENGTH; index += 1) {
    const randomIndex = Math.floor(Math.random() * ROOM_ID_ALPHABET.length);
    roomId += ROOM_ID_ALPHABET[randomIndex];
  }

  return roomId;
}
