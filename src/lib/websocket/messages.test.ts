import { describe, expect, it } from "vitest";
import { isClientMessage, parseClientMessage } from "./messages";

describe("isClientMessage", () => {
  it("accepts create-room messages", () => {
    expect(isClientMessage({ type: "create-room", peerId: "camera-1" })).toBe(
      true
    );
  });

  it("accepts join-room monitor messages", () => {
    expect(
      isClientMessage({
        type: "join-room",
        roomId: "A8F2KD",
        peerId: "monitor-1",
        role: "monitor"
      })
    ).toBe(true);
  });

  it("accepts capture result messages", () => {
    expect(
      isClientMessage({
        type: "capture-result",
        roomId: "A8F2KD",
        dataUrl: "data:image/jpeg;base64,abc",
        mimeType: "image/jpeg",
        source: "canvas"
      })
    ).toBe(true);
  });

  it("accepts approve-monitor messages", () => {
    expect(
      isClientMessage({
        type: "approve-monitor",
        roomId: "123456",
        peerId: "camera-1"
      })
    ).toBe(true);
  });

  it("rejects malformed messages", () => {
    expect(isClientMessage({ type: "join-room", roomId: "A8F2KD" })).toBe(
      false
    );
    expect(isClientMessage({ type: "unknown" })).toBe(false);
  });
});

describe("parseClientMessage", () => {
  it("parses valid json messages", () => {
    expect(parseClientMessage('{"type":"capture","roomId":"A8F2KD"}')).toEqual({
      type: "capture",
      roomId: "A8F2KD"
    });
  });

  it("returns undefined for invalid json", () => {
    expect(parseClientMessage("{")).toBeUndefined();
  });
});
