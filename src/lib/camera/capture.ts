import type { CaptureResult } from "@/types/camera";

interface ImageCaptureConstructor {
  new (track: MediaStreamTrack): {
    takePhoto: () => Promise<Blob>;
  };
}

type WindowWithImageCapture = Window &
  typeof globalThis & {
    ImageCapture?: ImageCaptureConstructor;
  };

export async function captureFromStream(
  stream: MediaStream,
  videoElement: HTMLVideoElement
): Promise<CaptureResult> {
  const imageCaptureResult = await tryImageCapture(stream);

  if (imageCaptureResult) {
    return imageCaptureResult;
  }

  return captureFromCanvas(videoElement);
}

async function tryImageCapture(
  stream: MediaStream
): Promise<CaptureResult | undefined> {
  const ImageCapture = (globalThis as WindowWithImageCapture).ImageCapture;
  const [track] = stream.getVideoTracks();

  if (!ImageCapture || !track) {
    return undefined;
  }

  try {
    const blob = await new ImageCapture(track).takePhoto();

    return {
      blob,
      mimeType: blob.type || "image/jpeg",
      source: "image-capture"
    };
  } catch {
    return undefined;
  }
}

export async function captureFromCanvas(
  videoElement: HTMLVideoElement
): Promise<CaptureResult> {
  const width = videoElement.videoWidth || videoElement.clientWidth;
  const height = videoElement.videoHeight || videoElement.clientHeight;

  if (!width || !height) {
    throw new Error("Video is not ready for capture.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas capture is not available.");
  }

  context.drawImage(videoElement, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.92);
  });

  if (!blob) {
    throw new Error("Unable to create captured image.");
  }

  return {
    blob,
    mimeType: blob.type || "image/jpeg",
    source: "canvas"
  };
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read captured image."));
    });

    reader.addEventListener("error", () => {
      reject(new Error("Unable to read captured image."));
    });

    reader.readAsDataURL(blob);
  });
}
