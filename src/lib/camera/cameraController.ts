import type { StartCameraOptions } from "@/types/camera";

export class CameraController {
  private stream?: MediaStream;

  async start(options: StartCameraOptions = {}): Promise<MediaStream> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera API is not available in this browser.");
    }

    this.stop();

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: {
          ideal: options.facingMode ?? "environment"
        },
        width: {
          ideal: 1920
        },
        height: {
          ideal: 1080
        }
      }
    });

    return this.stream;
  }

  stop(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = undefined;
  }

  getStream(): MediaStream | undefined {
    return this.stream;
  }
}
