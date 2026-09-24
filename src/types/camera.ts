export type CameraFacingMode = "environment" | "user";

export interface StartCameraOptions {
  facingMode?: CameraFacingMode;
}

export interface CaptureResult {
  blob: Blob;
  mimeType: string;
  source: "image-capture" | "canvas";
}

export interface CapturedImagePayload {
  roomId: string;
  dataUrl: string;
  mimeType: string;
  source: CaptureResult["source"];
}
