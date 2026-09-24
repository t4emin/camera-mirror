import { describe, expect, it } from "vitest";
import { generateRoomId, RoomError, RoomManager } from "./roomManager";

describe("generateRoomId", () => {
  it("creates six-character room IDs", () => {
    expect(generateRoomId()).toMatch(/^[0-9]{6}$/);
  });
});

describe("RoomManager", () => {
  it("creates a room with a camera and waiting state", () => {
    const manager = new RoomManager();
    const room = manager.createRoom("camera-1");

    expect(room.camera).toEqual({ id: "camera-1", role: "camera" });
    expect(room.monitor).toBeUndefined();
    expect(room.state).toBe("WAITING");
  });

  it("waits for camera approval after a monitor joins", () => {
    const manager = new RoomManager();
    const room = manager.createRoom("camera-1");
    const joined = manager.joinRoom(room.id, "monitor", "monitor-1");

    expect(joined.state).toBe("CONNECTING");
    expect(joined.monitor).toBeUndefined();
    expect(joined.pendingMonitor).toEqual({ id: "monitor-1", role: "monitor" });
  });

  it("connects after the camera approves a monitor", () => {
    const manager = new RoomManager();
    const room = manager.createRoom("camera-1");

    manager.joinRoom(room.id, "monitor", "monitor-1");

    const approved = manager.approveMonitor(room.id, "camera-1");

    expect(approved.state).toBe("CONNECTED");
    expect(approved.monitor).toEqual({ id: "monitor-1", role: "monitor" });
    expect(approved.pendingMonitor).toBeUndefined();
  });

  it("rejects a second monitor", () => {
    const manager = new RoomManager();
    const room = manager.createRoom("camera-1");

    manager.joinRoom(room.id, "monitor", "monitor-1");
    manager.approveMonitor(room.id, "camera-1");

    expect(() => manager.joinRoom(room.id, "monitor", "monitor-2")).toThrow(
      RoomError
    );
  });

  it("returns to waiting when the monitor leaves", () => {
    const manager = new RoomManager();
    const room = manager.createRoom("camera-1");

    manager.joinRoom(room.id, "monitor", "monitor-1");
    manager.approveMonitor(room.id, "camera-1");

    expect(manager.leaveRoom(room.id, "monitor-1")?.state).toBe("WAITING");
  });

  it("keeps a disconnected room when the camera leaves first", () => {
    const manager = new RoomManager();
    const room = manager.createRoom("camera-1");

    manager.joinRoom(room.id, "monitor", "monitor-1");
    manager.approveMonitor(room.id, "camera-1");

    const disconnected = manager.leaveRoom(room.id, "camera-1");

    expect(disconnected?.state).toBe("DISCONNECTED");
    expect(disconnected?.camera).toBeUndefined();
    expect(disconnected?.monitor).toEqual({ id: "monitor-1", role: "monitor" });
  });
});
