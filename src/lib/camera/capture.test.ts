import { describe, expect, it, vi } from "vitest";
import { captureFromCanvas } from "./capture";

describe("captureFromCanvas", () => {
  it("captures the current video frame to a jpeg blob", async () => {
    const blob = new Blob(["frame"], { type: "image/jpeg" });
    const drawImage = vi.fn();
    const toBlob = vi.fn((callback: BlobCallback) => callback(blob));

    vi.spyOn(document, "createElement").mockReturnValue({
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage })),
      toBlob
    } as unknown as HTMLCanvasElement);

    const video = {
      videoWidth: 1280,
      videoHeight: 720,
      clientWidth: 640,
      clientHeight: 360
    } as HTMLVideoElement;

    const result = await captureFromCanvas(video);

    expect(drawImage).toHaveBeenCalledWith(video, 0, 0, 1280, 720);
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), "image/jpeg", 0.92);
    expect(result).toEqual({
      blob,
      mimeType: "image/jpeg",
      source: "canvas"
    });
  });
});
