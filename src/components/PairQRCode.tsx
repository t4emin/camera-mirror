"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import styles from "./PairQRCode.module.css";

const MODAL_ANIMATION_MS = 260;

interface PairQRCodeProps {
  roomId: string;
  open: boolean;
  onClose: () => void;
}

export function PairQRCode({ roomId, open, onClose }: PairQRCodeProps) {
  const [qrUrl, setQrUrl] = useState<string>();
  const [monitorUrl, setMonitorUrl] = useState<string>();
  const [isMounted, setIsMounted] = useState(open);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const nextMonitorUrl = `${window.location.origin}/monitor/${roomId}`;
    setMonitorUrl(nextMonitorUrl);

    void QRCode.toDataURL(nextMonitorUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 240,
      color: {
        dark: "#07110f",
        light: "#f7fafc"
      }
    }).then(setQrUrl);
  }, [roomId]);

  useEffect(() => {
    if (open) {
      setIsMounted(true);
      const frame = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(frame);
    }

    setIsVisible(false);
    const timeout = window.setTimeout(() => {
      setIsMounted(false);
    }, MODAL_ANIMATION_MS);

    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isMounted, onClose]);

  if (!isMounted) {
    return null;
  }

  return (
    <div
      className={`${styles.overlay} ${isVisible ? styles.overlayVisible : ""}`}
      role="presentation"
      onClick={onClose}
    >
      <section
        aria-modal="true"
        className={`${styles.panel} ${isVisible ? styles.panelVisible : ""}`}
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <button className={styles.closeButton} onClick={onClose} type="button">
          Close
        </button>

        <div>
          <p className={styles.label}>Room</p>
          <p className={styles.roomId}>{roomId}</p>
        </div>

        {qrUrl ? (
          <img
            className={styles.qr}
            src={qrUrl}
            alt={`QR code for room ${roomId}`}
          />
        ) : (
          <div className={styles.qrPlaceholder} />
        )}

        {monitorUrl ? <p className={styles.url}>{monitorUrl}</p> : null}
      </section>
    </div>
  );
}
