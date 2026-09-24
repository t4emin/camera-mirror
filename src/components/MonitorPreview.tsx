"use client";

import { useEffect, useRef } from "react";
import styles from "./MonitorPreview.module.css";

interface MonitorPreviewProps {
  stream?: MediaStream;
}

export function MonitorPreview({ stream }: MonitorPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (!videoElement) {
      return;
    }

    videoElement.srcObject = stream ?? null;
  }, [stream]);

  return (
    <section className={styles.frame}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={styles.video}
        aria-label="Remote camera live stream"
      />
      {!stream ? (
        <div className={styles.empty}>
          <p>Room ready</p>
          <span>Waiting for camera stream</span>
        </div>
      ) : null}
    </section>
  );
}
