"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import styles from "./PairQRCode.module.css";

interface PairQRCodeProps {
  roomId: string;
  open: boolean;
  onClose: () => void;
}

export function PairQRCode({ roomId, open, onClose }: PairQRCodeProps) {
  const [qrUrl, setQrUrl] = useState<string>();
  const [monitorUrl, setMonitorUrl] = useState<string>();

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
    if (!open) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <section
        aria-modal="true"
        className={styles.panel}
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
