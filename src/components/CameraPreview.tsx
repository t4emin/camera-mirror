"use client";

import { useEffect, useRef } from "react";
import styles from "./CameraPreview.module.css";

interface CameraPreviewProps {
  stream?: MediaStream;
  onVideoReady?: (videoElement: HTMLVideoElement) => void;
}

export function CameraPreview({ stream, onVideoReady }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (!videoElement) {
      return;
    }

    videoElement.srcObject = stream ?? null;

    if (stream) {
      onVideoReady?.(videoElement);
    }
  }, [onVideoReady, stream]);

  return (
    <div className={styles.frame}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={styles.video}
        aria-label="Local camera preview"
      />
      {!stream ? <div className={styles.empty}>Camera preview</div> : null}
    </div>
  );
}
